import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComponentInstanceExecutionStatus,
  ComponentInstanceState,
  Prisma,
} from '@prisma/client';

import { ProductionOrderRepository } from '../repositories/production-order.repository';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ProductionInstanceExecutionService {
  constructor(private readonly repository: ProductionOrderRepository) {}

  async assignInstancesToExecution(input: {
    productionExecutionId: string;
    componentInstanceIds: string[];
  }) {
    const componentInstanceIds = this.uniqueIds(input.componentInstanceIds);
    return this.repository.transaction(async (tx) => {
      const execution = await this.executionLineage(
        input.productionExecutionId,
        tx,
      );
      const instances = await this.repository.findComponentInstancesByIds(
        componentInstanceIds,
        tx,
      );
      if (instances.length !== componentInstanceIds.length) {
        throw new NotFoundException('One or more ComponentInstances not found');
      }
      const eligible =
        await this.repository.findEligibleComponentInstanceIdsForProductionOrder(
          componentInstanceIds,
          execution.productionOrderId,
          tx,
        );
      const eligibleIds = new Set(eligible.map((instance) => instance.id));
      const wrongOrder = instances.find(
        (instance) => !eligibleIds.has(instance.id),
      );
      if (wrongOrder) {
        throw new BadRequestException(
          'ComponentInstance does not belong to the Production Order represented by this execution',
        );
      }
      const existing =
        await this.repository.findComponentInstanceExecutionsByRun(
          execution.id,
          componentInstanceIds,
          tx,
        );
      if (existing.length) {
        throw new ConflictException(
          'ComponentInstance is already assigned to this ProductionExecution',
        );
      }
      await this.repository.createComponentInstanceExecutions(
        componentInstanceIds.map((componentInstanceId) => ({
          componentInstanceId,
          workOrderId: execution.workOrderId,
          productionExecutionId: execution.id,
          status: ComponentInstanceExecutionStatus.ASSIGNED,
        })),
        tx,
      );
      return this.repository.findComponentInstanceExecutionsByRun(
        execution.id,
        componentInstanceIds,
        tx,
      );
    });
  }

  startInstanceExecution(id: string) {
    return this.transition(id, ComponentInstanceExecutionStatus.RUNNING);
  }

  completeInstanceExecution(id: string) {
    return this.transition(id, ComponentInstanceExecutionStatus.COMPLETED);
  }

  cancelInstanceExecution(id: string) {
    return this.transition(id, ComponentInstanceExecutionStatus.CANCELLED);
  }

  getInstanceExecutionHistory(componentInstanceId: string) {
    return this.repository.listComponentInstanceExecutionHistory(
      componentInstanceId,
    );
  }

  private async transition(
    id: string,
    target: ComponentInstanceExecutionStatus,
  ) {
    return this.repository.transaction(async (tx) => {
      const record = await this.repository.findComponentInstanceExecution(
        id,
        tx,
      );
      if (!record) {
        throw new NotFoundException('ComponentInstanceExecution not found');
      }
      if (record.status === target) {
        await this.applyPhysicalLifecycle(record, target, tx);
        return this.repository.findComponentInstanceExecution(id, tx);
      }
      this.assertTransition(record.status, target);
      const now = new Date();
      const updated = await this.repository.updateComponentInstanceExecution(
        id,
        {
          status: target,
          startedAt:
            target === ComponentInstanceExecutionStatus.RUNNING
              ? (record.startedAt ?? now)
              : undefined,
          completedAt:
            target === ComponentInstanceExecutionStatus.COMPLETED
              ? now
              : undefined,
          cancelledAt:
            target === ComponentInstanceExecutionStatus.CANCELLED
              ? now
              : undefined,
        },
        tx,
      );
      await this.applyPhysicalLifecycle(updated, target, tx);
      return this.repository.findComponentInstanceExecution(id, tx);
    });
  }

  private async applyPhysicalLifecycle(
    record: Awaited<
      ReturnType<ProductionOrderRepository['findComponentInstanceExecution']>
    >,
    target: ComponentInstanceExecutionStatus,
    tx: Tx,
  ) {
    if (!record) return;
    if (target === ComponentInstanceExecutionStatus.RUNNING) {
      await this.markInstanceInProduction(record, tx);
      return;
    }
    if (target === ComponentInstanceExecutionStatus.COMPLETED) {
      await this.markInstanceOperationComplete(record, tx);
    }
  }

  private async markInstanceInProduction(
    record: NonNullable<
      Awaited<
        ReturnType<ProductionOrderRepository['findComponentInstanceExecution']>
      >
    >,
    tx: Tx,
  ) {
    await this.repository.updateComponentInstanceState(
      record.componentInstanceId,
      { state: ComponentInstanceState.IN_PRODUCTION },
      tx,
      [ComponentInstanceState.PLANNED, ComponentInstanceState.REWORK],
    );
    await this.repository.createComponentInstanceTimelineIfMissing(
      {
        componentInstanceId: record.componentInstanceId,
        eventType: 'PRODUCTION_STARTED',
        sourceModule: 'PRODUCTION',
        sourceId: record.id,
        occurredAt: record.startedAt ?? new Date(),
        metadata: {
          productionExecutionId: record.productionExecutionId,
          workOrderId: record.workOrderId,
        } as Prisma.InputJsonObject,
      },
      tx,
    );
  }

  private async markInstanceOperationComplete(
    record: NonNullable<
      Awaited<
        ReturnType<ProductionOrderRepository['findComponentInstanceExecution']>
      >
    >,
    tx: Tx,
  ) {
    await this.repository.createComponentInstanceTimelineIfMissing(
      {
        componentInstanceId: record.componentInstanceId,
        eventType: 'PRODUCTION_OPERATION_COMPLETED',
        sourceModule: 'PRODUCTION',
        sourceId: record.id,
        occurredAt: record.completedAt ?? new Date(),
        metadata: {
          productionExecutionId: record.productionExecutionId,
          workOrderId: record.workOrderId,
        } as Prisma.InputJsonObject,
      },
      tx,
    );

    const productionOrderId = record.workOrder.productionOrderId;
    const mandatoryWorkOrders =
      await this.repository.findMandatoryWorkOrdersForProductionOrder(
        productionOrderId,
        tx,
      );
    if (!mandatoryWorkOrders.length) {
      throw new BadRequestException(
        'Production Order has no mandatory Work Orders for ComponentInstance lifecycle evaluation',
      );
    }
    const completed =
      await this.repository.findCompletedWorkOrderIdsForInstance(
        record.componentInstanceId,
        productionOrderId,
        tx,
      );
    const completedIds = new Set(completed.map((item) => item.workOrderId));
    const allMandatoryComplete = mandatoryWorkOrders.every((workOrder) =>
      completedIds.has(workOrder.id),
    );
    if (!allMandatoryComplete) return;

    const producedAt =
      record.completedAt ??
      (
        await this.repository.findComponentInstanceLifecycle(
          record.componentInstanceId,
          tx,
        )
      )?.producedAt ??
      new Date();
    const updated = await this.repository.updateComponentInstanceState(
      record.componentInstanceId,
      {
        state: ComponentInstanceState.PRODUCED_WAITING_QC,
        producedAt,
      },
      tx,
      [ComponentInstanceState.IN_PRODUCTION],
    );
    if (!updated) return;
    await this.repository.createComponentInstanceTimelineIfMissing(
      {
        componentInstanceId: record.componentInstanceId,
        eventType: 'PRODUCTION_COMPLETED_WAITING_QC',
        sourceModule: 'PRODUCTION',
        sourceId: productionOrderId,
        occurredAt: producedAt,
        metadata: {
          productionOrderId,
          completedWorkOrderCount: completedIds.size,
          mandatoryWorkOrderCount: mandatoryWorkOrders.length,
        } as Prisma.InputJsonObject,
      },
      tx,
    );
  }

  private async executionLineage(productionExecutionId: string, tx: Tx) {
    const execution = await this.repository.findExecutionLineage(
      productionExecutionId,
      tx,
    );
    if (!execution) {
      throw new NotFoundException('ProductionExecution not found');
    }
    if (!execution.workOrder) {
      throw new BadRequestException('ProductionExecution is missing WorkOrder');
    }
    if (execution.workOrderId !== execution.workOrder.id) {
      throw new BadRequestException('ProductionExecution WorkOrder mismatch');
    }
    if (execution.workOrder.productionOrderId !== execution.productionOrderId) {
      throw new BadRequestException(
        'ProductionExecution and WorkOrder belong to different Production Orders',
      );
    }
    return execution;
  }

  private uniqueIds(ids: string[]) {
    const normalized = ids.map((id) => id.trim()).filter(Boolean);
    if (!normalized.length) {
      throw new BadRequestException(
        'At least one ComponentInstance is required',
      );
    }
    if (new Set(normalized).size !== normalized.length) {
      throw new BadRequestException(
        'Duplicate ComponentInstances in the same assignment are not allowed',
      );
    }
    return normalized;
  }

  private assertTransition(
    current: ComponentInstanceExecutionStatus,
    target: ComponentInstanceExecutionStatus,
  ) {
    const allowed = new Map<
      ComponentInstanceExecutionStatus,
      ReadonlySet<ComponentInstanceExecutionStatus>
    >([
      [
        ComponentInstanceExecutionStatus.ASSIGNED,
        new Set([
          ComponentInstanceExecutionStatus.RUNNING,
          ComponentInstanceExecutionStatus.CANCELLED,
        ]),
      ],
      [
        ComponentInstanceExecutionStatus.RUNNING,
        new Set([
          ComponentInstanceExecutionStatus.COMPLETED,
          ComponentInstanceExecutionStatus.CANCELLED,
        ]),
      ],
      [ComponentInstanceExecutionStatus.COMPLETED, new Set()],
      [ComponentInstanceExecutionStatus.CANCELLED, new Set()],
    ]);
    if (!allowed.get(current)?.has(target)) {
      throw new BadRequestException(
        `ComponentInstanceExecution cannot transition from ${current} to ${target}`,
      );
    }
  }
}
