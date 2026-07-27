import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ComponentBomDefinitionState,
  ComponentLifecycleState,
  ComponentRevisionState,
} from '@prisma/client';

import { BomRepository } from '../repositories/bom.repository';
import { ProductionBomMaterializationService } from './production-bom-materialization.service';

const releasedBasis = {
  id: 'component-1',
  code: 'C-001',
  name: 'Column C-001',
  projectId: 'project-1',
  lifecycleState: ComponentLifecycleState.ACTIVE,
  currentRevisionId: 'revision-1',
  currentRevision: {
    id: 'revision-1',
    revisionNo: 'R1',
    state: ComponentRevisionState.RELEASED,
    contentHash: 'a'.repeat(64),
    bomDefinition: {
      id: 'bom-definition-1',
      state: ComponentBomDefinitionState.RELEASED,
      lines: [
        {
          materialId: 'material-1',
          materialCode: 'H300',
          quantity: 2,
          wastePercent: 5,
          category: 'MAIN_MATERIAL',
          uom: 'pcs',
        },
      ],
      routing: [
        {
          stepNo: 1,
          stepName: 'Cutting',
          workshop: 'W1',
          expectedHours: 2,
          qcRequired: true,
        },
      ],
      contentHash: 'a'.repeat(64),
    },
  },
  releaseEvidence: [{ contentHash: 'a'.repeat(64) }],
};

const input = {
  componentId: 'component-1',
  componentRevisionId: 'revision-1',
  bomDefinitionId: 'bom-definition-1',
  contentHash: 'a'.repeat(64),
  actorId: 'engineer-1',
};

describe('ProductionBomMaterializationService', () => {
  it('materializes a released engineering BOM and preserves quantity/waste', async () => {
    const tx = { marker: 'tx' } as never;
    const created = { id: 'bom-1', ...input };
    const repository = repositoryMock({
      createMaterializedBom: jest.fn().mockResolvedValue(created),
    });
    const service = new ProductionBomMaterializationService(repository);

    const result = await service.materializeReleasedEngineeringBom(input, tx);

    expect(result).toBe(created);
    expect(repository.createMaterializedBom).toHaveBeenCalledWith(
      expect.objectContaining({
        productCode: 'C-001',
        version: 'R1',
        source: 'ENGINEERING',
        engineeringContentHash: input.contentHash,
        items: {
          create: [
            expect.objectContaining({
              quantity: 2,
              wastePercent: 5,
              category: 'MAIN_MATERIAL',
            }),
          ],
        },
      }),
      tx,
    );
  });

  it('reuses an existing materialized BOM idempotently', async () => {
    const tx = { marker: 'tx' } as never;
    const existing = {
      id: 'bom-existing',
      componentId: input.componentId,
      componentRevisionId: input.componentRevisionId,
      bomDefinitionId: input.bomDefinitionId,
      engineeringContentHash: input.contentHash,
    };
    const repository = repositoryMock({
      findMaterializedByBomDefinition: jest.fn().mockResolvedValue(existing),
    });
    const service = new ProductionBomMaterializationService(repository);

    await expect(
      service.materializeReleasedEngineeringBom(input, tx),
    ).resolves.toBe(existing);
    expect(repository.createMaterializedBom).not.toHaveBeenCalled();
  });

  it('rejects unreleased engineering BOM materialization', async () => {
    const tx = { marker: 'tx' } as never;
    const repository = repositoryMock({
      findEngineeringBasisForMaterialization: jest.fn().mockResolvedValue({
        ...releasedBasis,
        currentRevision: {
          ...releasedBasis.currentRevision,
          bomDefinition: {
            ...releasedBasis.currentRevision.bomDefinition,
            state: ComponentBomDefinitionState.VALIDATED,
          },
        },
      }),
    });
    const service = new ProductionBomMaterializationService(repository);

    await expect(
      service.materializeReleasedEngineeringBom(input, tx),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid engineering BOM lines before creating a BOM', async () => {
    const tx = { marker: 'tx' } as never;
    const repository = repositoryMock({
      findEngineeringBasisForMaterialization: jest.fn().mockResolvedValue({
        ...releasedBasis,
        currentRevision: {
          ...releasedBasis.currentRevision,
          bomDefinition: {
            ...releasedBasis.currentRevision.bomDefinition,
            lines: [{ materialId: 'material-1', quantity: 0 }],
          },
        },
      }),
    });
    const service = new ProductionBomMaterializationService(repository);

    await expect(
      service.materializeReleasedEngineeringBom(input, tx),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createMaterializedBom).not.toHaveBeenCalled();
  });

  it('rejects missing material identity resolution', async () => {
    const tx = { marker: 'tx' } as never;
    const repository = repositoryMock({
      findMaterializationMaterials: jest.fn().mockResolvedValue([]),
    });
    const service = new ProductionBomMaterializationService(repository);

    await expect(
      service.materializeReleasedEngineeringBom(input, tx),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects content hash mismatch', async () => {
    const tx = { marker: 'tx' } as never;
    const service = new ProductionBomMaterializationService(repositoryMock());

    await expect(
      service.materializeReleasedEngineeringBom(
        { ...input, contentHash: 'b'.repeat(64) },
        tx,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('recovers from concurrent duplicate materialization using uniqueness', async () => {
    const tx = { marker: 'tx' } as never;
    const replay = {
      id: 'bom-race',
      componentId: input.componentId,
      componentRevisionId: input.componentRevisionId,
      bomDefinitionId: input.bomDefinitionId,
      engineeringContentHash: input.contentHash,
    };
    const repository = repositoryMock({
      findMaterializedByBomDefinition: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(replay),
      createMaterializedBom: jest.fn().mockRejectedValue({ code: 'P2002' }),
    });
    const service = new ProductionBomMaterializationService(repository);

    await expect(
      service.materializeReleasedEngineeringBom(input, tx),
    ).resolves.toBe(replay);
  });

  it('rejects an unknown component', async () => {
    const tx = { marker: 'tx' } as never;
    const repository = repositoryMock({
      findEngineeringBasisForMaterialization: jest.fn().mockResolvedValue(null),
    });
    const service = new ProductionBomMaterializationService(repository);

    await expect(
      service.materializeReleasedEngineeringBom(input, tx),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function repositoryMock(overrides: Partial<Record<keyof BomRepository, jest.Mock>> = {}) {
  return {
    findMaterializedByBomDefinition: jest.fn().mockResolvedValue(null),
    findEngineeringBasisForMaterialization: jest
      .fn()
      .mockResolvedValue(releasedBasis),
    findMaterializationMaterials: jest
      .fn()
      .mockResolvedValue([{ id: 'material-1', code: 'H300', name: 'H300' }]),
    createMaterializedBom: jest.fn().mockResolvedValue({ id: 'bom-1' }),
    findById: jest.fn(),
    nextBomNo: jest.fn().mockResolvedValue('BOM-0001'),
    ...overrides,
  } as unknown as jest.Mocked<BomRepository>;
}
