import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

import type {
  CreateComponentDefinitionRequirementDto,
  CreateComponentInstanceDto,
  CreateProjectComponentRequirementDto,
  ListComponentInstancesDto,
  ListProjectComponentRequirementsDto,
} from '../dto/component-domain-foundation.dto';
import { ComponentDomainFoundationRepository } from '../repositories/component-domain-foundation.repository';

@Injectable()
export class ComponentDomainFoundationService {
  constructor(
    private readonly repository: ComponentDomainFoundationRepository,
  ) {}

  async createDefinitionRequirement(
    dto: CreateComponentDefinitionRequirementDto,
  ) {
    await this.assertProject(dto.projectId);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const identity = this.generateDefinitionIdentity();
      try {
        return await this.repository.transaction(async (tx) => {
          return this.repository.createDefinitionRequirement(dto, identity, tx);
        });
      } catch (error) {
        if (this.isUniqueViolation(error) && attempt < 4) {
          continue;
        }
        this.handlePrismaError(error, 'Component definition requirement');
      }
    }

    throw new ConflictException('Component definition identity already exists');
  }

  async createRequirement(dto: CreateProjectComponentRequirementDto) {
    await this.assertComponent(dto.componentId);
    await this.assertRevisionLineage(dto.componentRevisionId, dto.componentId);
    await this.assertBomLineage(dto.bomDefinitionId, dto.componentRevisionId);

    try {
      return await this.repository.createRequirement(dto);
    } catch (error) {
      this.handlePrismaError(error, 'Project component requirement');
    }
  }

  listRequirements(query: ListProjectComponentRequirementsDto) {
    return this.repository.listRequirements(query);
  }

  async createInstance(dto: CreateComponentInstanceDto) {
    await this.assertComponent(dto.componentId);
    await this.assertRevisionLineage(dto.componentRevisionId, dto.componentId);
    await this.assertBomLineage(dto.bomDefinitionId, dto.componentRevisionId);

    if (dto.requirementId) {
      const requirement = await this.repository.findRequirement(dto.requirementId);
      if (!requirement) {
        throw new NotFoundException('Project component requirement not found');
      }
      if (requirement.componentId !== dto.componentId) {
        throw new BadRequestException(
          'ComponentInstance requirement must reference the same Component definition',
        );
      }
      if (
        requirement.componentRevisionId &&
        requirement.componentRevisionId !== dto.componentRevisionId
      ) {
        throw new BadRequestException(
          'ComponentInstance revision must match the requirement revision',
        );
      }
    }

    if (dto.productionOrderId) {
      const order = await this.repository.findProductionOrder(dto.productionOrderId);
      if (!order) {
        throw new NotFoundException('Production order not found');
      }
      if (order.componentId && order.componentId !== dto.componentId) {
        throw new BadRequestException(
          'ComponentInstance production order must reference the same Component definition',
        );
      }
      if (
        order.componentRevisionId &&
        order.componentRevisionId !== dto.componentRevisionId
      ) {
        throw new BadRequestException(
          'ComponentInstance revision must match the Production Order revision',
        );
      }
      if (
        order.bomDefinitionId &&
        dto.bomDefinitionId &&
        order.bomDefinitionId !== dto.bomDefinitionId
      ) {
        throw new BadRequestException(
          'ComponentInstance BOM definition must match the Production Order BOM lineage',
        );
      }
    }

    try {
      return await this.repository.createInstance(dto);
    } catch (error) {
      this.handlePrismaError(error, 'Component instance');
    }
  }

  listInstances(query: ListComponentInstancesDto) {
    return this.repository.listInstances(query);
  }

  private async assertComponent(componentId: string) {
    const component = await this.repository.findComponent(componentId);
    if (!component) {
      throw new NotFoundException('Component definition not found');
    }
    return component;
  }

  private async assertProject(projectId: string) {
    const project = await this.repository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async assertRevisionLineage(
    componentRevisionId: string | undefined,
    componentId: string,
  ) {
    if (!componentRevisionId) return;
    const revision = await this.repository.findRevision(componentRevisionId);
    if (!revision) {
      throw new NotFoundException('Component revision not found');
    }
    if (revision.componentId !== componentId) {
      throw new BadRequestException(
        'Component revision must belong to the Component definition',
      );
    }
  }

  private async assertBomLineage(
    bomDefinitionId: string | undefined,
    componentRevisionId: string | undefined,
  ) {
    if (!bomDefinitionId) return;
    const bom = await this.repository.findBomDefinition(bomDefinitionId);
    if (!bom) {
      throw new NotFoundException('Component BOM definition not found');
    }
    if (componentRevisionId && bom.componentRevisionId !== componentRevisionId) {
      throw new BadRequestException(
        'Component BOM definition must belong to the Component revision',
      );
    }
  }

  private handlePrismaError(error: unknown, label: string): never {
    if (this.isUniqueViolation(error)) {
      throw new ConflictException(`${label} already exists`);
    }
    throw error;
  }

  private isUniqueViolation(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private generateDefinitionIdentity() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    return {
      componentCode: `CPL-${today}-${suffix}`,
      requirementNo: `PCR-${today}-${suffix}`,
    };
  }
}
