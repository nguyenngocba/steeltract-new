import { createHash, randomUUID } from 'node:crypto';

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
  ProductionCompletionState,
  ProductionMaterialLedgerEventType,
  ProductionOrderKind,
  ProductionOrderStatus,
  ProductionReworkState,
  ProductionScrapState,
  ProductionWorkOrderState,
} from '@prisma/client';

import { InventoryPostingService } from '../../inventory/inventory-posting.service';
import {
  AcceptProductionReworkCommand,
  CancelProductionScrapCommand,
  CloseProductionOrderCommand,
  CompleteProductionReworkCommand,
  CreateProductionOrderCommand,
  CreateProductionScrapCommand,
  PostProductionScrapCommand,
  ProductionCommandContext,
  ReadyProductionOrderCommand,
  RecordProductionCompletionCommand,
  ReverseProductionCompletionCommand,
  RejectProductionReworkCommand,
  ReleaseProductionOrderCommand,
  ReverseProductionScrapCommand,
  StartProductionOrderCommand,
  StartProductionExecutionCommand,
  VersionedProductionExecutionCommand,
  VersionedProductionOrderCommand,
  VersionedWorkOrderCommand,
} from '../domain/production.commands';
import {
  ProductionCompletionAggregate,
  ProductionDomainError,
  ProductionExecutionAggregate,
  ProductionExecutionCommand,
  ProductionOrderAggregate,
  ProductionScrapAggregate,
  WorkOrderAggregate,
  WorkOrderCommand,
} from '../domain/production.aggregate';
import { ProductionOrderRepository } from '../repositories/production-order.repository';

type Tx = Prisma.TransactionClient;
type OrderEvent =
  | 'production.order.created'
  | 'production.order.released'
  | 'production.order.ready'
  | 'production.order.started'
  | 'production.order.paused'
  | 'production.order.resumed'
  | 'production.order.completed'
  | 'production.order.closed'
  | 'production.order.cancelled';
type WorkOrderEvent =
  | 'production.work-order.created'
  | 'production.work-order.ready'
  | 'production.work-order.started'
  | 'production.work-order.paused'
  | 'production.work-order.resumed'
  | 'production.work-order.blocked'
  | 'production.work-order.completed'
  | 'production.work-order.cancelled';
type ExecutionEvent =
  | 'production.execution.started'
  | 'production.execution.paused'
  | 'production.execution.resumed'
  | 'production.execution.completed'
  | 'production.execution.aborted';

@Injectable()
export class ProductionCommandService {
  constructor(
    private readonly repository: ProductionOrderRepository,
    private readonly inventoryPosting: InventoryPostingService,
  ) {}

  createOrder(command: CreateProductionOrderCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedOrder(
        command,
        'production.order.created',
        tx,
      );
      if (replay) return replay;
      this.assertEngineeringBasis(command.engineeringBasis);
      if (!Number.isFinite(command.quantity) || command.quantity <= 0) {
        throw new BadRequestException(
          'Production Order quantity must be positive',
        );
      }
      await this.assertReleasedEngineeringBasis(command, tx);
      const order = await this.repository.createAggregateOrder(
        {
          orderNo: command.orderNo,
          title: command.title,
          description: command.description,
          projectId: command.projectId,
          componentId: command.engineeringBasis.componentId,
          componentRevisionId: command.engineeringBasis.componentRevisionId,
          bomDefinitionId: command.engineeringBasis.bomDefinitionId,
          reworkOfProductionOrderId: command.reworkOfProductionOrderId,
          quantity: command.quantity,
          orderKind: command.orderKind ?? ProductionOrderKind.STANDARD,
          status: ProductionOrderStatus.DRAFT,
          aggregateVersion: 1,
          metadata: this.json({
            unit: command.unit,
            engineeringContentHash: command.engineeringBasis.contentHash,
            engineeringVerifiedAt: command.engineeringBasis.verifiedAt,
          }),
        },
        tx,
      );
      await this.recordOrderEvent(
        'production.order.created',
        order,
        command,
        tx,
      );
      return order;
    });
  }

  private async assertReleasedEngineeringBasis(
    command: CreateProductionOrderCommand,
    tx: Tx,
  ) {
    const basis = await this.repository.findReleasedEngineeringBasis(
      command.engineeringBasis.componentId,
      tx,
    );
    if (!basis) {
      throw new NotFoundException('Component not found');
    }
    if (
      basis.lifecycleState !== ComponentLifecycleState.ACTIVE ||
      !basis.currentRevision ||
      basis.currentRevisionId !== command.engineeringBasis.componentRevisionId
    ) {
      throw new BadRequestException(
        'Component must be released by Engineering before Production Order creation',
      );
    }
    if (basis.currentRevision.state !== ComponentRevisionState.RELEASED) {
      throw new BadRequestException(
        'Component revision must be released before Production Order creation',
      );
    }
    const bom = basis.currentRevision.bomDefinition;
    if (
      !bom ||
      bom.id !== command.engineeringBasis.bomDefinitionId ||
      bom.state !== ComponentBomDefinitionState.RELEASED
    ) {
      throw new BadRequestException(
        'Released Component BOM is required before Production Order creation',
      );
    }
    if (
      basis.currentRevision.contentHash !== command.engineeringBasis.contentHash ||
      bom.contentHash !== command.engineeringBasis.contentHash
    ) {
      throw new ConflictException(
        'Engineering basis content hash does not match released Component revision',
      );
    }
  }

  releaseOrder(command: ReleaseProductionOrderCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedOrder(
        command,
        'production.order.released',
        tx,
      );
      if (replay) return replay;
      const order = await this.order(command.productionOrderId, tx);
      const status = this.domain(() =>
        this.orderAggregate(order).transition('release'),
      );
      if (!command.workOrders.length) {
        throw new BadRequestException(
          'Release requires at least one Work Order',
        );
      }
      const sequences = new Set<number>();
      for (const input of command.workOrders) {
        if (sequences.has(input.sequence) || input.sequence <= 0) {
          throw new BadRequestException(
            'Work Order sequence must be positive and unique',
          );
        }
        sequences.add(input.sequence);
      }
      const updated = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        { status, releasedAt: new Date() },
        tx,
      );
      this.assertVersion(updated, 'ProductionOrder');
      for (const input of [...command.workOrders].sort(
        (left, right) => left.sequence - right.sequence,
      )) {
        const workOrder = await this.repository.createWorkOrder(
          {
            workOrderNo: `${order.orderNo}-WO-${String(input.sequence).padStart(3, '0')}`,
            productCode: input.productCode,
            quantity: input.quantity,
            plannedStart: input.plannedStart
              ? new Date(input.plannedStart)
              : undefined,
            plannedEnd: input.plannedEnd
              ? new Date(input.plannedEnd)
              : undefined,
            status: ProductionWorkOrderState.PLANNED,
            productionOrderId: order.id,
            routingOperationId: input.routingOperationId,
            sequence: input.sequence,
            lifecycleState: ProductionWorkOrderState.PLANNED,
            aggregateVersion: 1,
          },
          tx,
        );
        await this.recordWorkOrderEvent(
          'production.work-order.created',
          workOrder,
          {
            ...command,
            idempotencyKey: `${command.idempotencyKey}:wo:${workOrder.id}`,
          },
          tx,
        );
      }
      await this.recordOrderEvent(
        'production.order.released',
        updated!,
        command,
        tx,
      );
      return updated;
    });
  }

  readyOrder(command: ReadyProductionOrderCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedOrder(
        command,
        'production.order.ready',
        tx,
      );
      if (replay) return replay;
      if (
        !command.routingGatePassed ||
        !command.materialGatePassed ||
        !command.blockingGatePassed
      ) {
        throw new BadRequestException(
          'Production Order admission gates failed',
        );
      }
      const order = await this.order(command.productionOrderId, tx);
      const status = this.domain(() =>
        this.orderAggregate(order).transition('ready'),
      );
      const first = order.workOrders.find(
        (workOrder) =>
          workOrder.lifecycleState === ProductionWorkOrderState.PLANNED,
      );
      if (!first)
        throw new BadRequestException('No planned Work Order available');
      const readyWorkOrder = await this.transitionWorkOrderRecord(
        first,
        'ready',
        command,
        tx,
      );
      await this.recordWorkOrderEvent(
        'production.work-order.ready',
        readyWorkOrder,
        {
          ...command,
          idempotencyKey: `${command.idempotencyKey}:wo:${first.id}`,
        },
        tx,
      );
      const updated = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        { status, readyAt: new Date() },
        tx,
      );
      this.assertVersion(updated, 'ProductionOrder');
      await this.recordOrderEvent(
        'production.order.ready',
        updated!,
        command,
        tx,
      );
      return updated;
    });
  }

  startOrder(command: StartProductionOrderCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedOrder(
        command,
        'production.order.started',
        tx,
      );
      if (replay) return replay;
      if (!command.volatileGatesPassed) {
        throw new BadRequestException('Start-time production gates failed');
      }
      const order = await this.order(command.productionOrderId, tx);
      const status = this.domain(() =>
        this.orderAggregate(order).transition('start'),
      );
      const ready = order.workOrders.find(
        (workOrder) =>
          workOrder.lifecycleState === ProductionWorkOrderState.READY,
      );
      if (!ready)
        throw new BadRequestException('No ready Work Order available');
      const startedWorkOrder = await this.transitionWorkOrderRecord(
        ready,
        'start',
        command,
        tx,
      );
      await this.recordWorkOrderEvent(
        'production.work-order.started',
        startedWorkOrder,
        {
          ...command,
          idempotencyKey: `${command.idempotencyKey}:wo:${ready.id}`,
        },
        tx,
      );
      await this.createStartedExecution(
        order.id,
        startedWorkOrder,
        {
          ...command,
          idempotencyKey: `${command.idempotencyKey}:execution:${startedWorkOrder.id}`,
        },
        tx,
      );
      const updated = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        { status, startedAt: order.startedAt ?? new Date() },
        tx,
      );
      this.assertVersion(updated, 'ProductionOrder');
      await this.recordOrderEvent(
        'production.order.started',
        updated!,
        command,
        tx,
      );
      return updated;
    });
  }

  pauseOrder(command: VersionedProductionOrderCommand) {
    return this.changeOrderAndWorkOrders(command, 'pause');
  }

  resumeOrder(command: VersionedProductionOrderCommand) {
    return this.changeOrderAndWorkOrders(command, 'resume');
  }

  completeOrder(command: VersionedProductionOrderCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedOrder(
        command,
        'production.order.completed',
        tx,
      );
      if (replay) return replay;
      const order = await this.order(command.productionOrderId, tx);
      const status = this.domain(() =>
        this.orderAggregate(order).transition('complete'),
      );
      if (
        !order.workOrders.length ||
        order.workOrders.some(
          (workOrder) =>
            workOrder.lifecycleState !== ProductionWorkOrderState.COMPLETED,
        )
      ) {
        throw new BadRequestException(
          'All mandatory Work Orders must be completed',
        );
      }
      for (const workOrder of order.workOrders) {
        const active = await this.repository.findActiveExecutionForWorkOrder(
          workOrder.id,
          tx,
        );
        if (active) {
          throw new BadRequestException(
            'Production Order has an active execution run',
          );
        }
      }
      const completedQty = this.sum(
        order.completions.map((record) => record.completedQty),
      );
      if (completedQty + 0.000001 < order.quantity) {
        throw new BadRequestException(
          'Recorded completed quantity is below order quantity',
        );
      }
      if (this.materialRemaining(order) > 0.000001) {
        throw new BadRequestException('Production material is not reconciled');
      }
      const updated = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        { status, completedAt: new Date(), currentStageCode: null },
        tx,
      );
      this.assertVersion(updated, 'ProductionOrder');
      await this.recordOrderEvent(
        'production.order.completed',
        updated!,
        command,
        tx,
      );
      await this.recordEvent(
        'production.completion.finalized',
        order.id,
        command.expectedVersion + 1,
        this.completionPayload(
          updated!,
          order.completions.at(-1) ?? null,
          order.completions,
        ),
        command,
        tx,
        'ProductionCompletion',
        `production-order:${order.id}`,
      );
      return updated;
    });
  }

  closeOrder(command: CloseProductionOrderCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedOrder(
        command,
        'production.order.closed',
        tx,
      );
      if (replay) return replay;
      if (
        !command.qcDispositionCleared ||
        !command.reworkCleared ||
        !command.materialReconciled
      ) {
        throw new BadRequestException('Production close gates failed');
      }
      const order = await this.order(command.productionOrderId, tx);
      const status = this.domain(() =>
        this.orderAggregate(order).transition('close'),
      );
      const updated = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        { status, closedAt: new Date() },
        tx,
      );
      this.assertVersion(updated, 'ProductionOrder');
      await this.recordOrderEvent(
        'production.order.closed',
        updated!,
        command,
        tx,
      );
      return updated;
    });
  }

  cancelOrder(command: VersionedProductionOrderCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedOrder(
        command,
        'production.order.cancelled',
        tx,
      );
      if (replay) return replay;
      const order = await this.order(command.productionOrderId, tx);
      const status = this.domain(() =>
        this.orderAggregate(order).transition('cancel'),
      );
      const updated = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        { status, cancelledAt: new Date() },
        tx,
      );
      this.assertVersion(updated, 'ProductionOrder');
      await this.recordOrderEvent(
        'production.order.cancelled',
        updated!,
        command,
        tx,
      );
      return updated;
    });
  }

  readyWorkOrder(command: VersionedWorkOrderCommand) {
    return this.transitionWorkOrder(command, 'ready');
  }

  startWorkOrder(command: VersionedWorkOrderCommand) {
    return this.transitionWorkOrder(command, 'start');
  }

  pauseWorkOrder(command: VersionedWorkOrderCommand) {
    return this.transitionWorkOrder(command, 'pause');
  }

  resumeWorkOrder(command: VersionedWorkOrderCommand) {
    return this.transitionWorkOrder(command, 'resume');
  }

  blockWorkOrder(command: VersionedWorkOrderCommand) {
    if (!command.reason)
      throw new BadRequestException('Block reason is required');
    return this.transitionWorkOrder(command, 'block');
  }

  completeWorkOrder(command: VersionedWorkOrderCommand) {
    return this.transitionWorkOrder(command, 'complete');
  }

  cancelWorkOrder(command: VersionedWorkOrderCommand) {
    return this.transitionWorkOrder(command, 'cancel');
  }

  startExecution(command: StartProductionExecutionCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedExecution(
        command,
        'production.execution.started',
        tx,
      );
      if (replay) return replay;
      const order = await this.order(command.productionOrderId, tx);
      const workOrder = await this.workOrder(command.workOrderId, tx);
      if (workOrder.productionOrderId !== order.id) {
        throw new BadRequestException(
          'Work Order does not belong to Production Order',
        );
      }
      if (
        order.status !== ProductionOrderStatus.IN_PROGRESS ||
        workOrder.lifecycleState !== ProductionWorkOrderState.IN_PROGRESS
      ) {
        throw new BadRequestException(
          'Execution requires an in-progress Order and Work Order',
        );
      }
      return this.createStartedExecution(order.id, workOrder, command, tx);
    });
  }

  pauseExecution(command: VersionedProductionExecutionCommand) {
    if (!command.reason) {
      throw new BadRequestException('Execution pause reason is required');
    }
    return this.transitionExecution(command, 'pause');
  }

  resumeExecution(command: VersionedProductionExecutionCommand) {
    return this.transitionExecution(command, 'resume');
  }

  completeExecution(command: VersionedProductionExecutionCommand) {
    return this.transitionExecution(command, 'complete');
  }

  abortExecution(command: VersionedProductionExecutionCommand) {
    if (!command.reason) {
      throw new BadRequestException('Execution abort reason is required');
    }
    return this.transitionExecution(command, 'abort');
  }

  recordCompletion(command: RecordProductionCompletionCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRecord(
        command,
        'production.completion.recorded',
        'completionId',
        tx,
      );
      if (replay) return replay;
      const order = await this.order(command.productionOrderId, tx);
      if (order.status !== ProductionOrderStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Completion requires an in-progress order',
        );
      }
      this.domain(() => ProductionCompletionAggregate.record(command));
      if (command.workOrderId) {
        const workOrder = await this.workOrder(command.workOrderId, tx);
        if (workOrder.productionOrderId !== order.id) {
          throw new BadRequestException(
            'Work Order does not belong to Production Order',
          );
        }
      }
      if (command.executionRunId) {
        const execution = await this.execution(command.executionRunId, tx);
        if (
          execution.productionOrderId !== order.id ||
          (command.workOrderId && execution.workOrderId !== command.workOrderId)
        ) {
          throw new BadRequestException(
            'Execution Run does not belong to the completion scope',
          );
        }
      }
      const priorCompleted = this.sum(
        order.completions.map((record) => record.completedQty),
      );
      if (priorCompleted + command.completedQty > order.quantity + 0.000001) {
        throw new BadRequestException(
          'Completion exceeds Production Order quantity',
        );
      }
      const versionedOrder = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        {},
        tx,
      );
      this.assertVersion(versionedOrder, 'ProductionOrder');
      const completion = await this.repository.createCompletion(
        {
          productionOrderId: order.id,
          workOrderId: command.workOrderId,
          executionRunId: command.executionRunId,
          quantity: command.quantity,
          unit: command.unit,
          completedQty: command.completedQty,
          rejectedQty: command.rejectedQty,
          scrapQty: command.scrapQty,
          remainingQty: command.remainingQty,
          evidence: this.json(command.evidence ?? {}),
          recordedBy: command.actorId,
        },
        tx,
      );
      await this.recordEvent(
        'production.completion.recorded',
        completion.id,
        completion.aggregateVersion,
        this.completionPayload(order, completion, [
          ...order.completions,
          completion,
        ]),
        command,
        tx,
        'ProductionCompletion',
        `production-order:${order.id}`,
      );
      return completion;
    });
  }

  reverseCompletion(command: ReverseProductionCompletionCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRecord(
        command,
        'production.completion.reversed',
        'completionId',
        tx,
      );
      if (replay) return replay;
      const original = await this.repository.findCompletion(
        command.completionId,
        tx,
      );
      if (!original)
        throw new NotFoundException('Production Completion not found');
      if (original.aggregateVersion !== command.expectedVersion) {
        throw new ConflictException('ProductionCompletion version conflict');
      }
      if (original.state !== ProductionCompletionState.RECORDED) {
        throw new BadRequestException(
          'Only a recorded Completion can be reversed',
        );
      }
      if (!command.reason.trim()) {
        throw new BadRequestException('Completion reversal reason is required');
      }
      const order = await this.order(original.productionOrderId, tx);
      if (order.status !== ProductionOrderStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Completion reversal requires an in-progress Production Order',
        );
      }
      if (
        order.completions.some(
          (record) => record.reversalOfCompletionId === original.id,
        )
      ) {
        throw new BadRequestException(
          'Production Completion is already reversed',
        );
      }
      const reversal = await this.repository.createCompletion(
        {
          productionOrderId: original.productionOrderId,
          workOrderId: original.workOrderId,
          executionRunId: original.executionRunId,
          state: ProductionCompletionState.REVERSED,
          quantity: -original.quantity,
          unit: original.unit,
          completedQty: -original.completedQty,
          rejectedQty: -original.rejectedQty,
          scrapQty: -original.scrapQty,
          remainingQty: -original.remainingQty,
          reversalOfCompletionId: original.id,
          evidence: this.json({ reason: command.reason }),
          recordedBy: command.actorId,
        },
        tx,
      );
      await this.recordEvent(
        'production.completion.reversed',
        reversal.id,
        reversal.aggregateVersion,
        this.completionPayload(order, reversal, [
          ...order.completions,
          reversal,
        ]),
        command,
        tx,
        'ProductionCompletion',
        `production-order:${order.id}`,
      );
      return reversal;
    });
  }

  createScrap(command: CreateProductionScrapCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.repository.findScrapByCommandKey(
        command.idempotencyKey,
        tx,
      );
      if (replay) {
        if (replay.commandHash !== this.stableHash(command)) {
          throw new ConflictException(
            'Idempotency key was already used by another Production command',
          );
        }
        return replay;
      }
      const order = await this.order(command.productionOrderId, tx);
      if (
        order.status !== ProductionOrderStatus.IN_PROGRESS &&
        order.status !== ProductionOrderStatus.PAUSED
      ) {
        throw new BadRequestException('Scrap draft requires active production');
      }
      if (!Number.isFinite(command.quantity) || command.quantity <= 0) {
        throw new BadRequestException('Scrap quantity must be positive');
      }
      if (command.workOrderId) {
        const workOrder = await this.workOrder(command.workOrderId, tx);
        if (workOrder.productionOrderId !== order.id) {
          throw new BadRequestException(
            'Work Order does not belong to Production Order',
          );
        }
      }
      if (command.executionRunId) {
        const execution = await this.execution(command.executionRunId, tx);
        if (
          execution.productionOrderId !== order.id ||
          (command.workOrderId && execution.workOrderId !== command.workOrderId)
        ) {
          throw new BadRequestException(
            'Execution Run does not belong to the scrap scope',
          );
        }
      }
      const versionedOrder = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        {},
        tx,
      );
      this.assertVersion(versionedOrder, 'ProductionOrder');
      const scrap = await this.repository.createScrap(
        {
          productionOrderId: order.id,
          workOrderId: command.workOrderId,
          executionRunId: command.executionRunId,
          inventoryItemId: command.inventoryItemId,
          quantity: command.quantity,
          unit: command.unit,
          reasonCode: command.reasonCode,
          disposition: command.disposition,
          recoverable: command.recoverable ?? false,
          commandIdempotencyKey: command.idempotencyKey,
          commandHash: this.stableHash(command),
          createdBy: command.actorId,
        },
        tx,
      );
      await this.recordTimeline(
        order.id,
        'PRODUCTION_SCRAP_DRAFT_CREATED',
        scrap.id,
        command,
        tx,
      );
      await this.recordAudit(
        'PRODUCTION_SCRAP_DRAFT_CREATED',
        order.id,
        scrap.id,
        command,
        tx,
      );
      return scrap;
    });
  }

  cancelScrap(command: CancelProductionScrapCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.repository.findOutboxEvent(
        `${command.idempotencyKey}:audit:PRODUCTION_SCRAP_DRAFT_CANCELLED`,
        tx,
      );
      if (replay) {
        const metadata = replay.metadata as { commandHash?: string } | null;
        if (metadata?.commandHash !== this.stableHash(command)) {
          throw new ConflictException(
            'Idempotency key was already used by another Production command',
          );
        }
        return this.scrap(command.scrapId, tx);
      }
      const scrap = await this.scrap(command.scrapId, tx);
      const state = this.domain(() =>
        ProductionScrapAggregate.cancel(scrap.state),
      );
      const updated = await this.repository.updateScrap(
        scrap.id,
        command.expectedVersion,
        { state, disposition: command.reason },
        tx,
      );
      this.assertVersion(updated, 'ProductionScrap');
      await this.recordTimeline(
        scrap.productionOrderId,
        'PRODUCTION_SCRAP_DRAFT_CANCELLED',
        scrap.id,
        command,
        tx,
      );
      await this.recordAudit(
        'PRODUCTION_SCRAP_DRAFT_CANCELLED',
        scrap.productionOrderId,
        scrap.id,
        command,
        tx,
      );
      return updated;
    });
  }

  postScrap(command: PostProductionScrapCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRecord(
        command,
        'production.scrap.posted',
        'scrapId',
        tx,
      );
      if (replay) return replay;
      const scrap = await this.scrap(command.scrapId, tx);
      const order = await this.order(scrap.productionOrderId, tx);
      const state = this.domain(() =>
        ProductionScrapAggregate.post(scrap.state),
      );
      let inventoryTransactionId: string | undefined;
      if (scrap.recoverable) {
        if (!command.recoverableReceipt || !scrap.inventoryItemId) {
          throw new BadRequestException(
            'Recoverable Scrap requires an Inventory receipt destination',
          );
        }
        if (
          command.recoverableReceipt.inventoryItemId !== scrap.inventoryItemId
        ) {
          throw new BadRequestException('Recoverable Scrap material mismatch');
        }
        const receipt = await this.inventoryPosting.returnMaterial(
          {
            referenceModule: 'production_scrap',
            referenceId: scrap.id,
            performedBy: command.actorId,
            remarks: `Recoverable production scrap ${scrap.reasonCode}`,
            lines: [
              { ...command.recoverableReceipt, quantity: scrap.quantity },
            ],
          },
          tx,
        );
        inventoryTransactionId = receipt.id;
      }
      if (scrap.inventoryItemId) {
        const available = this.materialAvailableForScrap(
          order,
          scrap.inventoryItemId,
        );
        if (scrap.quantity > available + 0.000001) {
          throw new BadRequestException(
            'Scrap exceeds issued material balance',
          );
        }
        await this.repository.createMaterialLedger(
          {
            productionOrderId: order.id,
            inventoryItemId: scrap.inventoryItemId,
            quantity: scrap.quantity,
            eventType: ProductionMaterialLedgerEventType.SCRAP,
            remark: `${scrap.reasonCode}: ${scrap.disposition}`,
            createdBy: command.actorId,
          },
          tx,
        );
      }
      const updated = await this.repository.updateScrap(
        scrap.id,
        command.expectedVersion,
        {
          state,
          postedBy: command.actorId,
          postedAt: new Date(),
          inventoryTransactionId,
        },
        tx,
      );
      this.assertVersion(updated, 'ProductionScrap');
      await this.recordEvent(
        'production.scrap.posted',
        scrap.id,
        command.expectedVersion + 1,
        this.scrapPayload(updated!),
        command,
        tx,
        'ProductionScrap',
        `production-order:${order.id}:scrap:${scrap.id}`,
      );
      return updated;
    });
  }

  reverseScrap(command: ReverseProductionScrapCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRecord(
        command,
        'production.scrap.reversed',
        'scrapId',
        tx,
      );
      if (replay) return replay;
      const scrap = await this.scrap(command.scrapId, tx);
      this.domain(() => ProductionScrapAggregate.reverse(scrap.state));
      if (scrap.inventoryTransactionId) {
        throw new BadRequestException(
          'Recoverable Scrap reversal requires a separately approved Inventory reversal command',
        );
      }
      const reversal = await this.repository.createScrap(
        {
          productionOrderId: scrap.productionOrderId,
          workOrderId: scrap.workOrderId,
          executionRunId: scrap.executionRunId,
          inventoryItemId: scrap.inventoryItemId,
          state: ProductionScrapState.REVERSED,
          quantity: scrap.quantity,
          unit: scrap.unit,
          reasonCode: scrap.reasonCode,
          disposition: command.reason,
          recoverable: scrap.recoverable,
          reversalOfScrapId: scrap.id,
          createdBy: command.actorId,
          postedBy: command.actorId,
          reversedAt: new Date(),
        },
        tx,
      );
      const updated = await this.repository.updateScrap(
        scrap.id,
        command.expectedVersion,
        { state: ProductionScrapState.REVERSED, reversedAt: new Date() },
        tx,
      );
      this.assertVersion(updated, 'ProductionScrap');
      if (scrap.inventoryItemId) {
        await this.repository.createMaterialLedger(
          {
            productionOrderId: scrap.productionOrderId,
            inventoryItemId: scrap.inventoryItemId,
            quantity: -scrap.quantity,
            eventType: ProductionMaterialLedgerEventType.SCRAP_REVERSAL,
            remark: command.reason,
            createdBy: command.actorId,
          },
          tx,
        );
      }
      await this.recordEvent(
        'production.scrap.reversed',
        reversal.id,
        reversal.aggregateVersion,
        { ...this.scrapPayload(reversal), reversalOfScrapId: scrap.id },
        command,
        tx,
        'ProductionScrap',
        `production-order:${scrap.productionOrderId}:scrap:${scrap.id}`,
      );
      return reversal;
    });
  }

  acceptRework(command: AcceptProductionReworkCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRework(
        command,
        'production.rework.accepted',
        tx,
      );
      if (replay) return replay;
      const existing = await this.repository.findReworkByRequest(
        command.reworkRequestId,
        tx,
      );
      if (existing) {
        throw new ConflictException(
          'Production Rework request already decided',
        );
      }
      this.assertEngineeringBasis(command.engineeringBasis);
      const originalOrder = await this.order(
        command.originalProductionOrderId,
        tx,
      );
      const versionedOriginal = await this.repository.updateAggregateOrder(
        originalOrder.id,
        command.expectedVersion,
        {},
        tx,
      );
      this.assertVersion(versionedOriginal, 'ProductionOrder');
      const reworkOrder = await this.repository.createAggregateOrder(
        {
          orderNo: command.orderNo,
          title: command.title,
          description: command.reason,
          componentId: command.engineeringBasis.componentId,
          componentRevisionId: command.engineeringBasis.componentRevisionId,
          bomDefinitionId: command.engineeringBasis.bomDefinitionId,
          reworkOfProductionOrderId: command.originalProductionOrderId,
          orderKind: ProductionOrderKind.REWORK,
          status: ProductionOrderStatus.DRAFT,
          aggregateVersion: 1,
          metadata: this.json({
            engineeringContentHash: command.engineeringBasis.contentHash,
            qcNcrId: command.qcNcrId,
            routingScope: command.routingScope ?? null,
          }),
        },
        tx,
      );
      const rework = await this.repository.createRework(
        {
          reworkRequestId: command.reworkRequestId,
          qcNcrId: command.qcNcrId,
          originalProductionOrderId: command.originalProductionOrderId,
          reworkProductionOrderId: reworkOrder.id,
          state: ProductionReworkState.ACCEPTED,
          routingScope: this.json(command.routingScope ?? {}),
          reason: command.reason,
          decidedBy: command.actorId,
        },
        tx,
      );
      await this.recordOrderEvent(
        'production.order.created',
        reworkOrder,
        { ...command, idempotencyKey: `${command.idempotencyKey}:order` },
        tx,
      );
      await this.recordReworkEvent(
        'production.rework.accepted',
        rework,
        command,
        tx,
      );
      return rework;
    });
  }

  rejectRework(command: RejectProductionReworkCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRework(
        command,
        'production.rework.rejected',
        tx,
      );
      if (replay) return replay;
      const existing = await this.repository.findReworkByRequest(
        command.reworkRequestId,
        tx,
      );
      if (existing) {
        throw new ConflictException(
          'Production Rework request already decided',
        );
      }
      const originalOrder = await this.order(
        command.originalProductionOrderId,
        tx,
      );
      const versionedOriginal = await this.repository.updateAggregateOrder(
        originalOrder.id,
        command.expectedVersion,
        {},
        tx,
      );
      this.assertVersion(versionedOriginal, 'ProductionOrder');
      const rework = await this.repository.createRework(
        {
          reworkRequestId: command.reworkRequestId,
          qcNcrId: command.qcNcrId,
          originalProductionOrderId: command.originalProductionOrderId,
          state: ProductionReworkState.REJECTED,
          reason: command.reason,
          decidedBy: command.actorId,
        },
        tx,
      );
      await this.recordReworkEvent(
        'production.rework.rejected',
        rework,
        command,
        tx,
      );
      return rework;
    });
  }

  completeRework(command: CompleteProductionReworkCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRework(
        command,
        'production.rework.completed',
        tx,
      );
      if (replay) return replay;
      const rework = await this.repository.findReworkByRequest(
        command.reworkRequestId,
        tx,
      );
      if (!rework) throw new NotFoundException('Production rework not found');
      if (
        rework.state !== ProductionReworkState.ACCEPTED ||
        !rework.reworkProductionOrderId
      ) {
        throw new BadRequestException('Only accepted Rework can complete');
      }
      const order = await this.order(rework.reworkProductionOrderId, tx);
      if (order.status !== ProductionOrderStatus.CLOSED) {
        throw new BadRequestException('Rework Production Order must be closed');
      }
      const updated = await this.repository.updateRework(
        rework.id,
        command.expectedVersion,
        { state: ProductionReworkState.COMPLETED, completedAt: new Date() },
        tx,
      );
      this.assertVersion(updated, 'ProductionRework');
      await this.recordReworkEvent(
        'production.rework.completed',
        updated!,
        command,
        tx,
      );
      return updated;
    });
  }

  private changeOrderAndWorkOrders(
    command: VersionedProductionOrderCommand,
    operation: 'pause' | 'resume',
  ) {
    const eventName: OrderEvent = `production.order.${
      operation === 'pause' ? 'paused' : 'resumed'
    }`;
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedOrder(command, eventName, tx);
      if (replay) return replay;
      if (operation === 'pause' && !command.reason) {
        throw new BadRequestException('Pause reason is required');
      }
      const order = await this.order(command.productionOrderId, tx);
      const status = this.domain(() =>
        this.orderAggregate(order).transition(operation),
      );
      const sourceState =
        operation === 'pause'
          ? ProductionWorkOrderState.IN_PROGRESS
          : ProductionWorkOrderState.PAUSED;
      const targets = order.workOrders.filter(
        (workOrder) => workOrder.lifecycleState === sourceState,
      );
      if (!targets.length) {
        throw new BadRequestException(`No Work Order can ${operation}`);
      }
      for (const workOrder of targets) {
        const transitioned = await this.transitionWorkOrderRecord(
          workOrder,
          operation,
          command,
          tx,
        );
        await this.recordWorkOrderEvent(
          operation === 'pause'
            ? 'production.work-order.paused'
            : 'production.work-order.resumed',
          transitioned,
          {
            ...command,
            idempotencyKey: `${command.idempotencyKey}:wo:${workOrder.id}`,
          },
          tx,
        );
        const execution = await this.repository.findActiveExecutionForWorkOrder(
          workOrder.id,
          tx,
        );
        if (execution) {
          await this.transitionExecutionRecord(
            execution,
            operation,
            {
              ...command,
              workOrderId: workOrder.id,
              executionRunId: execution.id,
              expectedVersion: execution.aggregateVersion,
              idempotencyKey: `${command.idempotencyKey}:execution:${execution.id}`,
            },
            tx,
          );
        }
      }
      const updated = await this.repository.updateAggregateOrder(
        order.id,
        command.expectedVersion,
        {
          status,
          pausedAt: operation === 'pause' ? new Date() : null,
        },
        tx,
      );
      this.assertVersion(updated, 'ProductionOrder');
      await this.recordOrderEvent(eventName, updated!, command, tx);
      return updated;
    });
  }

  private transitionWorkOrder(
    command: VersionedWorkOrderCommand,
    operation: WorkOrderCommand,
  ) {
    const eventByCommand: Record<WorkOrderCommand, WorkOrderEvent> = {
      ready: 'production.work-order.ready',
      start: 'production.work-order.started',
      pause: 'production.work-order.paused',
      resume: 'production.work-order.resumed',
      block: 'production.work-order.blocked',
      complete: 'production.work-order.completed',
      cancel: 'production.work-order.cancelled',
    };
    return this.repository.transaction(async (tx) => {
      const eventName = eventByCommand[operation];
      const replay = await this.replayedWorkOrder(command, eventName, tx);
      if (replay) return replay;
      const order = await this.order(command.productionOrderId, tx);
      const workOrder = await this.workOrder(command.workOrderId, tx);
      if (workOrder.productionOrderId !== order.id) {
        throw new BadRequestException(
          'Work Order does not belong to Production Order',
        );
      }
      if (
        operation === 'start' &&
        order.status !== ProductionOrderStatus.IN_PROGRESS
      ) {
        throw new BadRequestException(
          'Parent Production Order is not in progress',
        );
      }
      if (operation === 'complete') {
        const active = await this.repository.findActiveExecutionForWorkOrder(
          workOrder.id,
          tx,
        );
        if (active) {
          throw new BadRequestException(
            'Work Order has an active execution run',
          );
        }
      }
      const updated = await this.transitionWorkOrderRecord(
        workOrder,
        operation,
        command,
        tx,
      );
      await this.recordWorkOrderEvent(eventName, updated, command, tx);
      return updated;
    });
  }

  private async transitionWorkOrderRecord(
    workOrder: WorkOrderRecord,
    operation: WorkOrderCommand,
    command: ProductionCommandContext,
    tx: Tx,
  ) {
    const state = this.domain(() =>
      WorkOrderAggregate.hydrate(workOrder).transition(operation),
    );
    const updated = await this.repository.updateWorkOrder(
      workOrder.id,
      workOrder.aggregateVersion,
      {
        lifecycleState: state,
        status: state,
        startedAt:
          operation === 'start'
            ? (workOrder.startedAt ?? new Date())
            : undefined,
        pausedAt:
          operation === 'pause'
            ? new Date()
            : operation === 'resume'
              ? null
              : undefined,
        completedAt: operation === 'complete' ? new Date() : undefined,
        blockedReason:
          operation === 'block'
            ? 'reason' in command
              ? command.reason
              : null
            : undefined,
      },
      tx,
    );
    this.assertVersion(updated, 'WorkOrder');
    return updated!;
  }

  private async createStartedExecution(
    productionOrderId: string,
    workOrder: WorkOrderRecord,
    command: ProductionCommandContext &
      Pick<StartProductionExecutionCommand, 'workCenterId' | 'machineId'>,
    tx: Tx,
  ) {
    const active = await this.repository.findActiveExecutionForWorkOrder(
      workOrder.id,
      tx,
    );
    if (active) {
      throw new ConflictException(
        'Work Order already has an active Production Execution',
      );
    }
    const executionRunId = randomUUID();
    const state = this.domain(() =>
      ProductionExecutionAggregate.create(executionRunId).transition('start'),
    );
    let execution: ExecutionRecord;
    try {
      execution = await this.repository.createExecution(
        {
          id: executionRunId,
          productionOrderId,
          workOrderId: workOrder.id,
          state,
          aggregateVersion: 1,
          workCenterId: command.workCenterId,
          machineId: command.machineId,
          startedAt: new Date(),
          createdBy: command.actorId,
        },
        tx,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Work Order already has an active Production Execution',
        );
      }
      throw error;
    }
    await this.recordExecutionEvent(
      'production.execution.started',
      execution,
      command,
      tx,
    );
    return execution;
  }

  private transitionExecution(
    command: VersionedProductionExecutionCommand,
    operation: Exclude<ProductionExecutionCommand, 'start'>,
  ) {
    const eventByCommand: Record<
      Exclude<ProductionExecutionCommand, 'start'>,
      ExecutionEvent
    > = {
      pause: 'production.execution.paused',
      resume: 'production.execution.resumed',
      complete: 'production.execution.completed',
      abort: 'production.execution.aborted',
    };
    return this.repository.transaction(async (tx) => {
      const eventName = eventByCommand[operation];
      const replay = await this.replayedExecution(command, eventName, tx);
      if (replay) return replay;
      const execution = await this.execution(command.executionRunId, tx);
      if (
        execution.productionOrderId !== command.productionOrderId ||
        execution.workOrderId !== command.workOrderId
      ) {
        throw new BadRequestException(
          'Production Execution does not belong to the supplied Order and Work Order',
        );
      }
      return this.transitionExecutionRecord(execution, operation, command, tx);
    });
  }

  private async transitionExecutionRecord(
    execution: ExecutionRecord,
    operation: Exclude<ProductionExecutionCommand, 'start'>,
    command: VersionedProductionExecutionCommand,
    tx: Tx,
  ) {
    const state = this.domain(() =>
      ProductionExecutionAggregate.hydrate(execution).transition(operation),
    );
    const now = new Date();
    const updated = await this.repository.updateExecution(
      execution.id,
      command.expectedVersion,
      {
        state,
        pausedAt: operation === 'pause' ? now : undefined,
        resumedAt: operation === 'resume' ? now : undefined,
        completedAt: operation === 'complete' ? now : undefined,
        abortedAt: operation === 'abort' ? now : undefined,
        pauseReason: operation === 'pause' ? command.reason : undefined,
        abortReason: operation === 'abort' ? command.reason : undefined,
      },
      tx,
    );
    this.assertVersion(updated, 'ProductionExecution');
    const eventByCommand: Record<
      Exclude<ProductionExecutionCommand, 'start'>,
      ExecutionEvent
    > = {
      pause: 'production.execution.paused',
      resume: 'production.execution.resumed',
      complete: 'production.execution.completed',
      abort: 'production.execution.aborted',
    };
    await this.recordExecutionEvent(
      eventByCommand[operation],
      updated!,
      command,
      tx,
    );
    return updated!;
  }

  private recordOrderEvent(
    eventName: OrderEvent,
    order: OrderLike,
    command: ProductionCommandContext,
    tx: Tx,
  ) {
    return this.recordEvent(
      eventName,
      order.id,
      order.aggregateVersion,
      {
        productionOrderId: order.id,
        orderNo: order.orderNo,
        title: order.title,
        projectId: order.projectId,
        orderKind: order.orderKind,
        state: order.status,
        quantity: order.quantity,
        unit: this.orderUnit(order),
        componentId: order.componentId,
        componentRevisionId: order.componentRevisionId,
        bomDefinitionId: order.bomDefinitionId,
        lifecycleAt: new Date().toISOString(),
      },
      command,
      tx,
      'ProductionOrder',
      `production-order:${order.id}`,
    );
  }

  private recordWorkOrderEvent(
    eventName: WorkOrderEvent,
    workOrder: WorkOrderRecord,
    command: ProductionCommandContext,
    tx: Tx,
  ) {
    return this.recordEvent(
      eventName,
      workOrder.id,
      workOrder.aggregateVersion,
      {
        productionOrderId: workOrder.productionOrderId,
        workOrderId: workOrder.id,
        workOrderNo: workOrder.workOrderNo,
        productCode: workOrder.productCode,
        quantity: workOrder.quantity,
        routingOperationId: workOrder.routingOperationId,
        sequence: workOrder.sequence,
        state: workOrder.lifecycleState,
        lifecycleAt: new Date().toISOString(),
      },
      command,
      tx,
      'WorkOrder',
      `work-order:${workOrder.id}`,
    );
  }

  private recordExecutionEvent(
    eventName: ExecutionEvent,
    execution: ExecutionRecord,
    command: ProductionCommandContext,
    tx: Tx,
  ) {
    return this.recordEvent(
      eventName,
      execution.id,
      execution.aggregateVersion,
      {
        productionOrderId: execution.productionOrderId,
        workOrderId: execution.workOrderId,
        executionRunId: execution.id,
        state: execution.state,
        workCenterId: execution.workCenterId,
        machineId: execution.machineId,
        startedAt: execution.startedAt?.toISOString() ?? null,
        pausedAt: execution.pausedAt?.toISOString() ?? null,
        resumedAt: execution.resumedAt?.toISOString() ?? null,
        completedAt: execution.completedAt?.toISOString() ?? null,
        abortedAt: execution.abortedAt?.toISOString() ?? null,
        pauseReason: execution.pauseReason,
        abortReason: execution.abortReason,
        lifecycleAt: (
          execution.abortedAt ??
          execution.completedAt ??
          execution.resumedAt ??
          execution.pausedAt ??
          execution.startedAt ??
          execution.updatedAt
        ).toISOString(),
      },
      command,
      tx,
      'ProductionExecution',
      `execution:${execution.id}`,
    );
  }

  private recordReworkEvent(
    eventName:
      | 'production.rework.accepted'
      | 'production.rework.rejected'
      | 'production.rework.completed',
    rework: ReworkRecord,
    command: ProductionCommandContext,
    tx: Tx,
  ) {
    return this.recordEvent(
      eventName,
      rework.id,
      rework.aggregateVersion,
      {
        reworkRequestId: rework.reworkRequestId,
        qcNcrId: rework.qcNcrId,
        originalProductionOrderId: rework.originalProductionOrderId,
        reworkProductionOrderId: rework.reworkProductionOrderId,
        decision:
          eventName === 'production.rework.accepted'
            ? 'ACCEPTED'
            : eventName === 'production.rework.rejected'
              ? 'REJECTED'
              : 'COMPLETED',
        reason: rework.reason,
        state: rework.state,
        lifecycleAt: (rework.completedAt ?? rework.decidedAt).toISOString(),
      },
      command,
      tx,
      'ProductionRework',
      `rework-request:${rework.reworkRequestId}`,
    );
  }

  private async recordEvent(
    eventName: string,
    aggregateId: string,
    aggregateVersion: number,
    payload: Record<string, unknown>,
    context: ProductionCommandContext,
    tx: Tx,
    aggregateType: string,
    orderingKey: string,
  ) {
    const eventId = randomUUID();
    const occurredAt = new Date();
    const idempotencyKey = `${context.idempotencyKey}:${eventName}`;
    const productionOrderId = this.productionOrderId(payload, aggregateId);
    await this.repository.createProductionLog(
      {
        productionOrderId,
        type: 'NOTE',
        message: eventName,
        workerId: context.actorId,
        metadata: this.json({ aggregateType, aggregateId, aggregateVersion }),
      },
      tx,
    );
    await this.recordAudit(
      eventName,
      productionOrderId,
      aggregateId,
      context,
      tx,
    );
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: this.json({ ...payload, aggregateVersion }),
        metadata: this.json({
          eventId,
          eventName,
          eventVersion: 1,
          occurredAt: occurredAt.toISOString(),
          producer: 'production',
          aggregateType,
          aggregateId,
          aggregateVersion,
          correlationId: context.correlationId ?? context.idempotencyKey,
          causationId: context.causationId ?? null,
          idempotencyKey,
          commandHash: this.stableHash(context),
          actorId: context.actorId,
          tenantId: null,
          orderingKey,
          persistToOutbox: true,
        }),
        idempotencyKey,
        maxRetries: 10,
      },
      tx,
    );
  }

  private async recordAudit(
    action: string,
    productionOrderId: string,
    entityId: string,
    context: ProductionCommandContext,
    tx: Tx,
  ) {
    await this.repository.createActivity(
      {
        action,
        entity: 'Production',
        entityId,
        module: 'production',
        userId: context.actorId,
        metadata: this.json({ productionOrderId }),
      },
      tx,
    );
    const key = `${context.idempotencyKey}:audit:${action}`;
    return this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: this.json({ action, entityId, module: 'production' }),
        metadata: this.json({
          module: 'production',
          persistToOutbox: true,
          idempotencyKey: key,
          commandHash: this.stableHash(context),
        }),
        idempotencyKey: key,
        maxRetries: 10,
      },
      tx,
    );
  }

  private recordTimeline(
    productionOrderId: string,
    message: string,
    entityId: string,
    context: ProductionCommandContext,
    tx: Tx,
  ) {
    return this.repository.createProductionLog(
      {
        productionOrderId,
        type: 'NOTE',
        message,
        workerId: context.actorId,
        metadata: this.json({ entityId }),
      },
      tx,
    );
  }

  private async replayedOrder(
    context: ProductionCommandContext,
    eventName: string,
    tx: Tx,
  ) {
    const event = await this.replayedEvent(context, eventName, tx);
    if (!event) return null;
    const payload = event.payload as { productionOrderId?: string };
    return payload.productionOrderId
      ? this.repository.findAggregate(payload.productionOrderId, tx)
      : null;
  }

  private async replayedWorkOrder(
    context: ProductionCommandContext,
    eventName: string,
    tx: Tx,
  ) {
    const event = await this.replayedEvent(context, eventName, tx);
    if (!event) return null;
    const payload = event.payload as { workOrderId?: string };
    return payload.workOrderId
      ? this.repository.findWorkOrder(payload.workOrderId, tx)
      : null;
  }

  private async replayedExecution(
    context: ProductionCommandContext,
    eventName: ExecutionEvent,
    tx: Tx,
  ) {
    const event = await this.replayedEvent(context, eventName, tx);
    if (!event) return null;
    const payload = event.payload as { executionRunId?: string };
    return payload.executionRunId
      ? this.repository.findExecution(payload.executionRunId, tx)
      : null;
  }

  private async replayedRework(
    context: ProductionCommandContext,
    eventName: string,
    tx: Tx,
  ) {
    const event = await this.replayedEvent(context, eventName, tx);
    if (!event) return null;
    const payload = event.payload as { reworkRequestId?: string };
    return payload.reworkRequestId
      ? this.repository.findReworkByRequest(payload.reworkRequestId, tx)
      : null;
  }

  private async replayedRecord(
    context: ProductionCommandContext,
    eventName: string,
    idField: 'completionId' | 'scrapId',
    tx: Tx,
  ) {
    const event = await this.replayedEvent(context, eventName, tx);
    if (!event) return null;
    const payload = event.payload as Record<string, string | undefined>;
    const id = payload[idField];
    if (!id) return null;
    return idField === 'scrapId'
      ? this.repository.findScrap(id, tx)
      : this.repository.findCompletion(id, tx);
  }

  private async replayedEvent(
    context: ProductionCommandContext,
    eventName: string,
    tx: Tx,
  ) {
    const event = await this.repository.findOutboxEvent(
      `${context.idempotencyKey}:${eventName}`,
      tx,
    );
    if (!event) return null;
    const metadata = event.metadata as { commandHash?: string } | null;
    if (metadata?.commandHash !== this.stableHash(context)) {
      throw new ConflictException(
        'Idempotency key was already used by another Production command',
      );
    }
    return event;
  }

  private async order(id: string, tx: Tx) {
    const order = await this.repository.findAggregate(id, tx);
    if (!order) throw new NotFoundException('Production Order not found');
    return order;
  }

  private async workOrder(id: string, tx: Tx) {
    const workOrder = await this.repository.findWorkOrder(id, tx);
    if (!workOrder) throw new NotFoundException('Work Order not found');
    return workOrder;
  }

  private async scrap(id: string, tx: Tx) {
    const scrap = await this.repository.findScrap(id, tx);
    if (!scrap) throw new NotFoundException('Production Scrap not found');
    return scrap;
  }

  private async execution(id: string, tx: Tx) {
    const execution = await this.repository.findExecution(id, tx);
    if (!execution)
      throw new NotFoundException('Production Execution not found');
    return execution;
  }

  private orderAggregate(order: OrderRecord) {
    return this.domain(() => ProductionOrderAggregate.hydrate(order));
  }

  private assertEngineeringBasis(basis: {
    componentId: string;
    componentRevisionId: string;
    bomDefinitionId: string;
    contentHash: string;
    verifiedAt: string;
  }) {
    if (
      !basis.componentId ||
      !basis.componentRevisionId ||
      !basis.bomDefinitionId ||
      !/^[a-f0-9]{64}$/i.test(basis.contentHash) ||
      Number.isNaN(Date.parse(basis.verifiedAt))
    ) {
      throw new BadRequestException('Released engineering basis is invalid');
    }
  }

  private materialRemaining(order: OrderRecord) {
    const issued = this.sum(order.materialIssues.map((row) => row.issuedQty));
    const returned = this.sum(
      order.materialIssues.map((row) => row.returnedQty),
    );
    const consumed = this.sum(
      order.materialConsumptions.map((row) => row.consumedQty),
    );
    const legacyScrap = this.sum(
      order.materialConsumptions.map((row) => row.scrapQty),
    );
    const canonicalScrap = this.sum(
      order.scraps
        .filter(
          (row) =>
            Boolean(row.inventoryItemId) &&
            row.state === ProductionScrapState.POSTED &&
            !row.reversalOfScrapId,
        )
        .map((row) => row.quantity),
    );
    return Math.max(
      issued - returned - consumed - legacyScrap - canonicalScrap,
      0,
    );
  }

  private materialAvailableForScrap(
    order: OrderRecord,
    inventoryItemId: string,
  ) {
    const issued = this.sum(
      order.materialIssues
        .filter((row) => row.inventoryItemId === inventoryItemId)
        .map((row) => row.issuedQty - row.returnedQty),
    );
    const consumed = this.sum(
      order.materialConsumptions
        .filter((row) => row.inventoryItemId === inventoryItemId)
        .map((row) => row.consumedQty + row.scrapQty),
    );
    const scrap = this.sum(
      order.scraps
        .filter(
          (row) =>
            row.inventoryItemId === inventoryItemId &&
            row.state === ProductionScrapState.POSTED &&
            !row.reversalOfScrapId,
        )
        .map((row) => row.quantity),
    );
    return Math.max(issued - consumed - scrap, 0);
  }

  private completionPayload(
    order: OrderLike,
    completion: CompletionRecord | null,
    records: CompletionRecord[],
  ) {
    const active = records.filter(
      (record) => record.state === ProductionCompletionState.RECORDED,
    );
    const reversals = records.filter(
      (record) => record.state === ProductionCompletionState.REVERSED,
    );
    const cumulative = (field: 'completedQty' | 'scrapQty' | 'remainingQty') =>
      this.sum(active.map((record) => record[field])) +
      this.sum(reversals.map((record) => record[field]));
    return {
      completionId: completion?.id,
      productionOrderId: order.id,
      workOrderId: completion?.workOrderId ?? null,
      executionRunId: completion?.executionRunId ?? null,
      quantity: completion?.quantity ?? order.quantity,
      unit: completion?.unit ?? this.orderUnit(order),
      completedQty: cumulative('completedQty'),
      rejectedQty: completion?.rejectedQty ?? 0,
      scrapQty: cumulative('scrapQty'),
      remainingQty: cumulative('remainingQty'),
      reversalOfCompletionId: completion?.reversalOfCompletionId ?? null,
      state: completion?.state ?? ProductionCompletionState.RECORDED,
      recordedAt: completion?.recordedAt?.toISOString() ?? null,
    };
  }

  private scrapPayload(scrap: ScrapRecord) {
    return {
      scrapId: scrap.id,
      productionOrderId: scrap.productionOrderId,
      workOrderId: scrap.workOrderId,
      executionRunId: scrap.executionRunId,
      inventoryItemId: scrap.inventoryItemId,
      materialId: scrap.inventoryItemId,
      quantity: scrap.quantity,
      unit: scrap.unit,
      reasonCode: scrap.reasonCode,
      disposition: scrap.disposition,
      inventoryPostingReceiptId: scrap.inventoryTransactionId,
      reversalOfScrapId: scrap.reversalOfScrapId,
      state: scrap.state,
      lifecycleAt: (
        scrap.postedAt ??
        scrap.reversedAt ??
        scrap.createdAt
      ).toISOString(),
    };
  }

  private productionOrderId(
    payload: Record<string, unknown>,
    fallback: string,
  ) {
    return typeof payload.productionOrderId === 'string'
      ? payload.productionOrderId
      : fallback;
  }

  private orderUnit(order: OrderLike) {
    const metadata = order.metadata as { unit?: string } | null;
    return metadata?.unit ?? 'unit';
  }

  private assertVersion(value: unknown, aggregate: string): asserts value {
    if (!value) throw new ConflictException(`${aggregate} version conflict`);
  }

  private domain<T>(callback: () => T): T {
    try {
      return callback();
    } catch (error) {
      if (error instanceof ProductionDomainError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private sum(values: number[]) {
    return values.reduce(
      (total, value) => total + (Number.isFinite(value) ? Number(value) : 0),
      0,
    );
  }

  private stableHash(value: unknown) {
    const canonicalize = (input: unknown): unknown => {
      if (Array.isArray(input)) return input.map(canonicalize);
      if (input && typeof input === 'object') {
        return Object.fromEntries(
          Object.entries(input as Record<string, unknown>)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => [key, canonicalize(item)]),
        );
      }
      return input;
    };
    return createHash('sha256')
      .update(JSON.stringify(canonicalize(value)))
      .digest('hex');
  }

  private json(value: unknown) {
    return value as Prisma.InputJsonValue;
  }
}

type OrderRecord = NonNullable<
  Awaited<ReturnType<ProductionOrderRepository['findAggregate']>>
>;
type WorkOrderRecord = NonNullable<
  Awaited<ReturnType<ProductionOrderRepository['findWorkOrder']>>
>;
type ExecutionRecord = NonNullable<
  Awaited<ReturnType<ProductionOrderRepository['findExecution']>>
>;
type ScrapRecord = NonNullable<
  Awaited<ReturnType<ProductionOrderRepository['findScrap']>>
>;
type ReworkRecord = NonNullable<
  Awaited<ReturnType<ProductionOrderRepository['findReworkByRequest']>>
>;
type CompletionRecord = OrderRecord['completions'][number];
type OrderLike = Pick<
  OrderRecord,
  | 'id'
  | 'orderNo'
  | 'title'
  | 'projectId'
  | 'orderKind'
  | 'status'
  | 'aggregateVersion'
  | 'componentId'
  | 'componentRevisionId'
  | 'bomDefinitionId'
  | 'quantity'
  | 'metadata'
>;
