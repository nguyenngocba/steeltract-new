import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComponentBomDefinitionState,
  ComponentLifecycleState,
  ComponentRevisionState,
  Prisma,
} from '@prisma/client';

import {
  EngineeringBomLine,
  parseEngineeringBomLines,
  parseEngineeringBomRouting,
} from '../../components/domain/engineering-bom-contract';
import { BomRepository } from '../repositories/bom.repository';

type Tx = Prisma.TransactionClient;

export type MaterializeReleasedEngineeringBomInput = {
  componentId: string;
  componentRevisionId: string;
  bomDefinitionId: string;
  contentHash: string;
  actorId?: string;
};

@Injectable()
export class ProductionBomMaterializationService {
  constructor(private readonly repository: BomRepository) {}

  async materializeCurrentReleasedComponent(
    componentId: string,
    actorId: string | undefined,
    tx: Tx,
  ) {
    const basis = await this.repository.findEngineeringBasisForMaterialization(
      componentId,
      tx,
    );
    if (!basis?.currentRevision?.bomDefinition?.contentHash) {
      throw new BadRequestException(
        'Released Component BOM is required before Production BOM materialization',
      );
    }
    return this.materializeReleasedEngineeringBom(
      {
        componentId,
        componentRevisionId: basis.currentRevision.id,
        bomDefinitionId: basis.currentRevision.bomDefinition.id,
        contentHash: basis.currentRevision.bomDefinition.contentHash,
        actorId,
      },
      tx,
    );
  }

  async materializeReleasedEngineeringBom(
    input: MaterializeReleasedEngineeringBomInput,
    tx: Tx,
  ) {
    const existing = await this.repository.findMaterializedByBomDefinition(
      input.bomDefinitionId,
      tx,
    );
    if (existing) {
      this.assertExistingMatches(existing, input);
      return existing;
    }

    const basis = await this.repository.findEngineeringBasisForMaterialization(
      input.componentId,
      tx,
    );
    if (!basis) {
      throw new NotFoundException('Component not found');
    }
    if (
      basis.lifecycleState !== ComponentLifecycleState.ACTIVE ||
      basis.currentRevisionId !== input.componentRevisionId ||
      !basis.currentRevision
    ) {
      throw new BadRequestException(
        'Component must be released by Engineering before BOM materialization',
      );
    }

    const revision = basis.currentRevision;
    if (revision.state !== ComponentRevisionState.RELEASED) {
      throw new BadRequestException(
        'Component revision must be released before BOM materialization',
      );
    }
    const bomDefinition = revision.bomDefinition;
    if (
      !bomDefinition ||
      bomDefinition.id !== input.bomDefinitionId ||
      bomDefinition.state !== ComponentBomDefinitionState.RELEASED
    ) {
      throw new BadRequestException(
        'Released Component BOM is required before Production BOM materialization',
      );
    }
    const releaseHash = basis.releaseEvidence[0]?.contentHash;
    if (
      revision.contentHash !== input.contentHash ||
      bomDefinition.contentHash !== input.contentHash ||
      (releaseHash && releaseHash !== input.contentHash)
    ) {
      throw new ConflictException(
        'Engineering content hash does not match released Component BOM',
      );
    }

    const lines = parseEngineeringBomLines(bomDefinition.lines);
    const routing = parseEngineeringBomRouting(bomDefinition.routing);
    const materialByLine = await this.resolveMaterials(lines, tx);

    try {
      return await this.repository.createMaterializedBom(
        {
          bomNo: await this.repository.nextBomNo(tx),
          productCode: basis.code,
          productName: basis.name,
          structureType: 'ENGINEERING_COMPONENT',
          projectId: basis.projectId,
          unit: lines[0]?.uom ?? lines[0]?.unit,
          estimatedWeight: 0,
          version: revision.revisionNo,
          status: 'ACTIVE',
          source: 'ENGINEERING',
          engineeringContentHash: input.contentHash,
          materializedAt: new Date(),
          materializedBy: input.actorId,
          component: { connect: { id: basis.id } },
          componentRevision: { connect: { id: revision.id } },
          bomDefinition: { connect: { id: bomDefinition.id } },
          items: {
            create: lines.map((line, index) => ({
              material: { connect: { id: materialByLine[index].id } },
              quantity: line.quantity,
              wastePercent: line.wastePercent,
              category: line.category,
            })),
          },
          routingSteps: {
            create: routing.map((step, index) => ({
              stepNo: step.stepNo ?? index + 1,
              stepName: step.stepName,
              workshop: step.workshop,
              expectedHours: step.expectedHours ?? 0,
              qcRequired: step.qcRequired ?? false,
            })),
          },
        },
        tx,
      );
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const replay = await this.repository.findMaterializedByBomDefinition(
          input.bomDefinitionId,
          tx,
        );
        if (replay) {
          this.assertExistingMatches(replay, input);
          return replay;
        }
      }
      throw error;
    }
  }

  async assertProductionBomMatchesEngineering(
    bomId: string,
    input: MaterializeReleasedEngineeringBomInput,
    tx: Tx,
  ) {
    const bom = await this.repository.findById(bomId, tx);
    if (!bom) {
      throw new NotFoundException('BOM not found');
    }
    if (bom.bomDefinitionId || bom.source === 'ENGINEERING') {
      this.assertExistingMatches(bom, input);
    }
    return bom;
  }

  private async resolveMaterials(lines: EngineeringBomLine[], tx: Tx) {
    const ids = [
      ...new Set(lines.map((line) => line.materialId).filter(Boolean)),
    ] as string[];
    const codes = [
      ...new Set(lines.map((line) => line.materialCode).filter(Boolean)),
    ] as string[];
    const materials = await this.repository.findMaterializationMaterials(
      { ids, codes },
      tx,
    );
    const byId = new Map(materials.map((material) => [material.id, material]));
    const byCode = new Map(
      materials.map((material) => [material.code, material]),
    );

    return lines.map((line, index) => {
      const byMaterialId = line.materialId ? byId.get(line.materialId) : null;
      const byMaterialCode = line.materialCode
        ? byCode.get(line.materialCode)
        : null;
      if (!byMaterialId && !byMaterialCode) {
        throw new BadRequestException(
          `Engineering BOM material does not exist at line ${index + 1}`,
        );
      }
      if (
        byMaterialId &&
        byMaterialCode &&
        byMaterialId.id !== byMaterialCode.id
      ) {
        throw new BadRequestException(
          `Engineering BOM material identity mismatch at line ${index + 1}`,
        );
      }
      return byMaterialId ?? byMaterialCode;
    });
  }

  private assertExistingMatches(
    bom: {
      id: string;
      componentId: string | null;
      componentRevisionId: string | null;
      bomDefinitionId: string | null;
      engineeringContentHash: string | null;
    },
    input: MaterializeReleasedEngineeringBomInput,
  ) {
    if (
      bom.componentId !== input.componentId ||
      bom.componentRevisionId !== input.componentRevisionId ||
      bom.bomDefinitionId !== input.bomDefinitionId ||
      bom.engineeringContentHash !== input.contentHash
    ) {
      throw new ConflictException(
        'Production BOM lineage does not match released Engineering BOM',
      );
    }
  }

  private isUniqueConflict(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
