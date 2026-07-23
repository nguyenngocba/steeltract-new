import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

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
