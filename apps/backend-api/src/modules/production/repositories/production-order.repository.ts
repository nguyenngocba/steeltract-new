import { Injectable } from '@nestjs/common';

import { ComponentInstanceState, Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { ProductionRepository } from './production.repository';

@Injectable()
export class ProductionOrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productionRepository: ProductionRepository,
  ) {}

  findMany(params: Parameters<ProductionRepository['findOrders']>[0]) {
    return this.productionRepository.findOrders(params);
  }

  count(params: Parameters<ProductionRepository['countOrders']>[0]) {
    return this.productionRepository.countOrders(params);
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    return this.productionRepository.findOrderById(id, tx);
  }

  findAggregate(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.productionOrder.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { sequence: 'asc' } },
        workOrders: { orderBy: { sequence: 'asc' } },
        completions: { orderBy: { recordedAt: 'asc' } },
        scraps: { orderBy: { createdAt: 'asc' } },
        materialIssues: true,
        materialConsumptions: true,
        materialLedgers: true,
      },
    });
  }

  findWorkOrder(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.workOrder.findUnique({ where: { id } });
  }

  findExecution(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.productionExecution.findUnique({ where: { id } });
  }

  findExecutionLineage(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.productionExecution.findUnique({
      where: { id },
      include: { workOrder: true },
    });
  }

  findComponentInstancesByIds(
    ids: string[],
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.componentInstance.findMany({
      where: { id: { in: ids } },
      orderBy: [{ serialSequence: 'asc' }, { instanceNo: 'asc' }],
    });
  }

  findEligibleComponentInstanceIdsForProductionOrder(
    ids: string[],
    productionOrderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.componentInstance.findMany({
      where: {
        id: { in: ids },
        OR: [
          { productionOrderId },
          {
            productionReworks: {
              some: {
                reworkProductionOrderId: productionOrderId,
                state: 'ACCEPTED',
              },
            },
          },
        ],
      },
      select: { id: true },
    });
  }

  findComponentInstanceExecutionsByRun(
    productionExecutionId: string,
    componentInstanceIds: string[],
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.componentInstanceExecution.findMany({
      where: {
        productionExecutionId,
        componentInstanceId: { in: componentInstanceIds },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  createComponentInstanceExecutions(
    data: Prisma.ComponentInstanceExecutionCreateManyInput[],
    tx: Prisma.TransactionClient,
  ) {
    return tx.componentInstanceExecution.createMany({ data });
  }

  findComponentInstanceExecution(
    id: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.componentInstanceExecution.findUnique({
      where: { id },
      include: {
        componentInstance: true,
        workOrder: true,
        productionExecution: true,
      },
    });
  }

  updateComponentInstanceExecution(
    id: string,
    data: Prisma.ComponentInstanceExecutionUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.componentInstanceExecution.update({
      where: { id },
      data,
      include: {
        componentInstance: true,
        workOrder: true,
        productionExecution: true,
      },
    });
  }

  listComponentInstanceExecutionHistory(
    componentInstanceId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.componentInstanceExecution.findMany({
      where: { componentInstanceId },
      include: {
        workOrder: true,
        productionExecution: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findComponentInstanceLifecycle(
    id: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.componentInstance.findUnique({
      where: { id },
      select: {
        id: true,
        instanceNo: true,
        state: true,
        productionOrderId: true,
        producedAt: true,
      },
    });
  }

  async updateComponentInstanceState(
    id: string,
    data: Prisma.ComponentInstanceUpdateManyMutationInput,
    tx: Prisma.TransactionClient,
    allowedStates?: ComponentInstanceState[],
  ) {
    const result = await tx.componentInstance.updateMany({
      where: {
        id,
        state: allowedStates?.length ? { in: allowedStates } : undefined,
      },
      data,
    });
    return result.count === 1
      ? this.findComponentInstanceLifecycle(id, tx)
      : null;
  }

  findMandatoryWorkOrdersForProductionOrder(
    productionOrderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.workOrder.findMany({
      where: { productionOrderId },
      select: { id: true, sequence: true, routingOperationId: true },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findCompletedWorkOrderIdsForInstance(
    componentInstanceId: string,
    productionOrderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.componentInstanceExecution.findMany({
      where: {
        componentInstanceId,
        status: 'COMPLETED',
        workOrder: { productionOrderId },
      },
      select: { workOrderId: true },
      distinct: ['workOrderId'],
    });
  }

  async createComponentInstanceTimelineIfMissing(
    data: Prisma.ComponentInstanceTimelineCreateManyInput,
    tx: Prisma.TransactionClient,
  ) {
    const existing = await tx.componentInstanceTimeline.findFirst({
      where: {
        componentInstanceId: data.componentInstanceId,
        eventType: data.eventType,
        sourceModule: data.sourceModule,
        sourceId: data.sourceId,
      },
      select: { id: true },
    });
    if (existing) return existing;
    return tx.componentInstanceTimeline.create({ data });
  }

  findActiveExecutionForWorkOrder(
    workOrderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.productionExecution.findFirst({
      where: {
        workOrderId,
        state: { in: ['CREATED', 'RUNNING', 'PAUSED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findCompletion(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.productionCompletion.findUnique({ where: { id } });
  }

  findScrap(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.productionScrap.findUnique({ where: { id } });
  }

  findScrapByCommandKey(
    commandIdempotencyKey: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.productionScrap.findUnique({ where: { commandIdempotencyKey } });
  }

  findOutboxEvent(
    idempotencyKey: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.outboxEvent.findUnique({ where: { idempotencyKey } });
  }

  findReleasedEngineeringBasis(
    componentId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.component.findUnique({
      where: { id: componentId },
      select: {
        id: true,
        lifecycleState: true,
        currentRevisionId: true,
        currentRevision: {
          select: {
            id: true,
            state: true,
            contentHash: true,
            bomDefinition: {
              select: {
                id: true,
                state: true,
                contentHash: true,
              },
            },
          },
        },
      },
    });
  }

  findRequirementForProduction(
    id: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.projectComponentRequirement.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        component: { select: { id: true, code: true, lifecycleState: true } },
        componentRevision: {
          select: { id: true, state: true, contentHash: true },
        },
        bomDefinition: { select: { id: true, state: true, contentHash: true } },
      },
    });
  }

  sumProductionQuantityForRequirement(
    requirementId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.productionOrder.aggregate({
      where: {
        componentRequirementId: requirementId,
        status: { not: 'CANCELLED' },
      },
      _sum: { quantity: true },
    });
  }

  findReleaseLineage(
    productionOrderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        component: { select: { id: true, code: true, lifecycleState: true } },
        componentRequirement: true,
        bom: {
          select: {
            id: true,
            componentId: true,
            componentRevisionId: true,
            bomDefinitionId: true,
            engineeringContentHash: true,
            source: true,
          },
        },
        componentInstances: {
          select: { id: true, serialSequence: true, instanceNo: true },
          orderBy: { serialSequence: 'asc' },
        },
      },
    });
  }

  create(
    data: Prisma.ProductionOrderCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return this.productionRepository.createOrder(data, tx);
  }

  createAggregateOrder(
    data: Prisma.ProductionOrderUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionOrder.create({ data });
  }

  async updateAggregateOrder(
    id: string,
    expectedVersion: number,
    data: Prisma.ProductionOrderUpdateManyMutationInput,
    tx: Prisma.TransactionClient,
  ) {
    const result = await tx.productionOrder.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    return this.findAggregate(id, tx);
  }

  createWorkOrder(
    data: Prisma.WorkOrderUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.workOrder.create({ data });
  }

  createComponentInstances(
    data: Prisma.ComponentInstanceCreateManyInput[],
    tx: Prisma.TransactionClient,
  ) {
    if (!data.length) return Promise.resolve({ count: 0 });
    return tx.componentInstance.createMany({ data, skipDuplicates: true });
  }

  createComponentInstanceTimelines(
    data: Prisma.ComponentInstanceTimelineCreateManyInput[],
    tx: Prisma.TransactionClient,
  ) {
    if (!data.length) return Promise.resolve({ count: 0 });
    return tx.componentInstanceTimeline.createMany({ data });
  }

  async updateWorkOrder(
    id: string,
    expectedVersion: number,
    data: Prisma.WorkOrderUpdateManyMutationInput,
    tx: Prisma.TransactionClient,
  ) {
    const result = await tx.workOrder.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    return this.findWorkOrder(id, tx);
  }

  createExecution(
    data: Prisma.ProductionExecutionUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionExecution.create({ data });
  }

  async updateExecution(
    id: string,
    expectedVersion: number,
    data: Prisma.ProductionExecutionUpdateManyMutationInput,
    tx: Prisma.TransactionClient,
  ) {
    const result = await tx.productionExecution.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    return this.findExecution(id, tx);
  }

  updateWorkOrders(
    productionOrderId: string,
    states: Prisma.EnumProductionWorkOrderStateNullableFilter['in'],
    data: Prisma.WorkOrderUpdateManyMutationInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.workOrder.updateMany({
      where: { productionOrderId, lifecycleState: { in: states } },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
  }

  createCompletion(
    data: Prisma.ProductionCompletionUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionCompletion.create({ data });
  }

  createScrap(
    data: Prisma.ProductionScrapUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionScrap.create({ data });
  }

  async updateScrap(
    id: string,
    expectedVersion: number,
    data: Prisma.ProductionScrapUpdateManyMutationInput,
    tx: Prisma.TransactionClient,
  ) {
    const result = await tx.productionScrap.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    return this.findScrap(id, tx);
  }

  createRework(
    data: Prisma.ProductionReworkUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionRework.create({ data });
  }

  findReworkByRequest(
    reworkRequestId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.productionRework.findUnique({ where: { reworkRequestId } });
  }

  findQcNcrForRework(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.nonConformanceReport.findUnique({
      where: { id },
      select: {
        id: true,
        componentInstanceId: true,
        productionOrderId: true,
      },
    });
  }

  async updateRework(
    id: string,
    expectedVersion: number,
    data: Prisma.ProductionReworkUpdateManyMutationInput,
    tx: Prisma.TransactionClient,
  ) {
    const result = await tx.productionRework.updateMany({
      where: { id, aggregateVersion: expectedVersion },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    return tx.productionRework.findUnique({ where: { id } });
  }

  createMaterialLedger(
    data: Prisma.ProductionMaterialLedgerUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionMaterialLedger.create({ data });
  }

  createProductionLog(
    data: Prisma.ProductionLogUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionLog.create({ data });
  }

  update(
    id: string,
    data: Prisma.ProductionOrderUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.productionRepository.updateOrder(id, data, tx);
  }

  createActivity(
    data: Prisma.ActivityLogCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return this.productionRepository.createActivityLog(data, tx);
  }

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
      maxRetries?: number;
    },
    tx: Prisma.TransactionClient,
  ) {
    return tx.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: {
        eventName: data.eventName,
        payload: data.payload,
        metadata: data.metadata,
        idempotencyKey: data.idempotencyKey,
        maxRetries: data.maxRetries,
      },
      update: {},
    });
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
