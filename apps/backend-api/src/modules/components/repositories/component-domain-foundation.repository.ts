import { Injectable } from '@nestjs/common';
import { ComponentLifecycleState, Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import type {
  CreateComponentDefinitionRequirementDto,
  CreateComponentInstanceDto,
  CreateProjectComponentRequirementDto,
  ListComponentInstancesDto,
  ListProjectComponentRequirementsDto,
} from '../dto/component-domain-foundation.dto';

@Injectable()
export class ComponentDomainFoundationRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  findProject(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.project.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });
  }

  findComponent(id: string) {
    return this.prisma.component.findUnique({
      where: { id },
      select: { id: true, code: true, lifecycleState: true },
    });
  }

  findComponentByCode(code: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.component.findUnique({
      where: { code },
      select: { id: true, code: true },
    });
  }

  findRevision(id: string) {
    return this.prisma.componentRevision.findUnique({
      where: { id },
      select: { id: true, componentId: true, state: true },
    });
  }

  findBomDefinition(id: string) {
    return this.prisma.componentBomDefinition.findUnique({
      where: { id },
      select: { id: true, componentRevisionId: true, state: true },
    });
  }

  findRequirement(id: string) {
    return this.prisma.projectComponentRequirement.findUnique({
      where: { id },
      select: { id: true, componentId: true, componentRevisionId: true },
    });
  }

  findProductionOrder(id: string) {
    return this.prisma.productionOrder.findUnique({
      where: { id },
      select: {
        id: true,
        componentId: true,
        componentRevisionId: true,
        bomDefinitionId: true,
        projectId: true,
        componentRequirementId: true,
      },
    });
  }

  createRequirement(dto: CreateProjectComponentRequirementDto) {
    return this.prisma.projectComponentRequirement.create({
      data: {
        requirementNo: dto.requirementNo,
        project: { connect: { id: dto.projectId } },
        projectTask: dto.projectTaskId
          ? { connect: { id: dto.projectTaskId } }
          : undefined,
        component: { connect: { id: dto.componentId } },
        componentRevision: dto.componentRevisionId
          ? { connect: { id: dto.componentRevisionId } }
          : undefined,
        bomDefinition: dto.bomDefinitionId
          ? { connect: { id: dto.bomDefinitionId } }
          : undefined,
        requiredQuantity: dto.requiredQuantity,
        requiredBy: dto.requiredBy ? new Date(dto.requiredBy) : undefined,
        metadata: this.toJson(dto.metadata),
      },
      include: requirementInclude,
    });
  }

  async createDefinitionRequirement(
    dto: CreateComponentDefinitionRequirementDto,
    identity: { componentCode: string; requirementNo: string },
    tx: Prisma.TransactionClient,
  ) {
    const component = await tx.component.create({
      data: {
        code: identity.componentCode,
        name: dto.name,
        description: dto.description,
        componentType: dto.componentType,
        profile: dto.profile,
        lifecycleState: ComponentLifecycleState.DRAFT,
        aggregateVersion: 1,
        // Compatibility mirror for legacy read paths only. Canonical Project
        // demand ownership is ProjectComponentRequirement.projectId.
        project: { connect: { id: dto.projectId } },
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        componentType: true,
        profile: true,
        projectId: true,
        lifecycleState: true,
        aggregateVersion: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, code: true, name: true } },
      },
    });

    const requirement = await tx.projectComponentRequirement.create({
      data: {
        requirementNo: identity.requirementNo,
        project: { connect: { id: dto.projectId } },
        component: { connect: { id: component.id } },
        requiredQuantity: dto.requiredQuantity,
        requiredBy: dto.requiredBy ? new Date(dto.requiredBy) : undefined,
        metadata: this.toJson({
          canonicalCreate: true,
          note: dto.note,
        }),
      },
      include: requirementInclude,
    });

    return { component, requirement };
  }

  async listRequirements(query: ListProjectComponentRequirementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ProjectComponentRequirementWhereInput = {
      projectId: query.projectId,
      projectTaskId: query.projectTaskId,
      componentId: query.componentId,
      componentRevisionId: query.componentRevisionId,
      status: query.status,
      OR: this.search(query.search ?? query.q),
    };
    const [data, total] = await Promise.all([
      this.prisma.projectComponentRequirement.findMany({
        where,
        include: requirementInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.projectComponentRequirement.count({ where }),
    ]);
    return { data, meta: this.meta(page, limit, total) };
  }

  createInstance(dto: CreateComponentInstanceDto) {
    return this.prisma.componentInstance.create({
      data: {
        instanceNo: dto.instanceNo,
        component: { connect: { id: dto.componentId } },
        componentRevision: { connect: { id: dto.componentRevisionId } },
        bomDefinition: dto.bomDefinitionId
          ? { connect: { id: dto.bomDefinitionId } }
          : undefined,
        productionOrder: dto.productionOrderId
          ? { connect: { id: dto.productionOrderId } }
          : undefined,
        requirement: dto.requirementId
          ? { connect: { id: dto.requirementId } }
          : undefined,
        project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
        projectTask: dto.projectTaskId
          ? { connect: { id: dto.projectTaskId } }
          : undefined,
        serialSequence: dto.serialSequence,
        producedAt: dto.producedAt ? new Date(dto.producedAt) : undefined,
        legacyComponent: dto.legacyComponentId
          ? { connect: { id: dto.legacyComponentId } }
          : undefined,
        metadata: this.toJson(dto.metadata),
      },
      include: instanceInclude,
    });
  }

  async listInstances(query: ListComponentInstancesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ComponentInstanceWhereInput = {
      componentId: query.componentId,
      componentRevisionId: query.componentRevisionId,
      productionOrderId: query.productionOrderId,
      requirementId: query.requirementId,
      projectId: query.projectId,
      projectTaskId: query.projectTaskId,
      state: query.state,
      instanceNo: query.instanceNo
        ? { contains: query.instanceNo, mode: 'insensitive' }
        : undefined,
      OR: this.search(query.search ?? query.q, ['instanceNo']),
    };
    const [data, total] = await Promise.all([
      this.prisma.componentInstance.findMany({
        where,
        include: instanceInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.componentInstance.count({ where }),
    ]);
    return { data, meta: this.meta(page, limit, total) };
  }

  private search(
    value: string | undefined,
    fields: Array<'requirementNo' | 'instanceNo'> = ['requirementNo'],
  ) {
    if (!value) return undefined;
    return fields.map((field) => ({
      [field]: { contains: value, mode: 'insensitive' as const },
    }));
  }

  private meta(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toJson(value: unknown): Prisma.InputJsonValue | undefined {
    return value === undefined ? undefined : (value as Prisma.InputJsonValue);
  }
}

const requirementInclude = {
  project: { select: { id: true, code: true, name: true } },
  projectTask: { select: { id: true, name: true } },
  component: { select: { id: true, code: true, name: true, lifecycleState: true } },
  componentRevision: { select: { id: true, revisionNo: true, state: true } },
  bomDefinition: { select: { id: true, state: true, contentHash: true } },
  productionOrders: {
    select: {
      id: true,
      orderNo: true,
      title: true,
      quantity: true,
      status: true,
      aggregateVersion: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.ProjectComponentRequirementInclude;

const instanceInclude = {
  component: { select: { id: true, code: true, name: true, lifecycleState: true } },
  componentRevision: { select: { id: true, revisionNo: true, state: true } },
  bomDefinition: { select: { id: true, state: true, contentHash: true } },
  productionOrder: { select: { id: true, orderNo: true, title: true, quantity: true, status: true } },
  requirement: { select: { id: true, requirementNo: true, requiredQuantity: true } },
  project: { select: { id: true, code: true, name: true } },
  projectTask: { select: { id: true, name: true } },
  executions: {
    include: {
      workOrder: {
        select: {
          id: true,
          workOrderNo: true,
          productCode: true,
          quantity: true,
          status: true,
          lifecycleState: true,
          sequence: true,
        },
      },
      productionExecution: {
        select: {
          id: true,
          state: true,
          workCenterId: true,
          machineId: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ComponentInstanceInclude;
