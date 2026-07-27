import { ConflictException } from '@nestjs/common';
import {
  ComponentBomDefinitionState,
  ComponentLifecycleState,
  ComponentRevisionState,
  ProductionExecutionState,
  ProductionOrderKind,
  ProductionOrderStatus,
  ProductionWorkOrderState,
} from '@prisma/client';

import { InventoryPostingService } from '../../inventory/inventory-posting.service';
import { ProductionOrderRepository } from '../repositories/production-order.repository';
import { ProductionCommandService } from './production-command.service';
import { ProductionBomMaterializationService } from './production-bom-materialization.service';

const releasedEngineeringBasis = {
  id: 'component-1',
  lifecycleState: ComponentLifecycleState.ACTIVE,
  currentRevisionId: 'revision-1',
  currentRevision: {
    id: 'revision-1',
    state: ComponentRevisionState.RELEASED,
    contentHash: 'a'.repeat(64),
    bomDefinition: {
      id: 'bom-definition-1',
      state: ComponentBomDefinitionState.RELEASED,
      contentHash: 'a'.repeat(64),
    },
  },
};

describe('ProductionCommandService', () => {
  it('creates the aggregate, timeline, audit and canonical Outbox atomically', async () => {
    const tx = { marker: 'production-transaction' } as never;
    const order = {
      id: 'po-1',
      orderNo: 'PO-001',
      orderKind: ProductionOrderKind.STANDARD,
      status: ProductionOrderStatus.DRAFT,
      aggregateVersion: 1,
      componentId: 'component-1',
      componentRevisionId: 'revision-1',
      bomDefinitionId: 'bom-definition-1',
    };
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findReleasedEngineeringBasis: jest
        .fn()
        .mockResolvedValue(releasedEngineeringBasis),
      createAggregateOrder: jest.fn().mockResolvedValue(order),
      createProductionLog: jest.fn().mockResolvedValue({ id: 'log-1' }),
      createActivity: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    } as unknown as ProductionOrderRepository;
    const service = new ProductionCommandService(
      repository,
      {} as InventoryPostingService,
      {
        materializeReleasedEngineeringBom: jest.fn().mockResolvedValue({
          id: 'bom-1',
        }),
      } as unknown as ProductionBomMaterializationService,
    );

    await service.createOrder({
      orderNo: 'PO-001',
      title: 'Canonical order',
      quantity: 10,
      unit: 'pcs',
      actorId: 'operator-1',
      idempotencyKey: 'create-po-001',
      engineeringBasis: {
        componentId: 'component-1',
        componentRevisionId: 'revision-1',
        bomDefinitionId: 'bom-definition-1',
        contentHash: 'a'.repeat(64),
        verifiedAt: '2026-07-17T08:00:00.000Z',
      },
    });

    expect(repository.createAggregateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ProductionOrderStatus.DRAFT,
        aggregateVersion: 1,
        bomId: 'bom-1',
        componentRevisionId: 'revision-1',
      }),
      tx,
    );
    expect(repository.createProductionLog).toHaveBeenCalledWith(
      expect.objectContaining({ productionOrderId: 'po-1' }),
      tx,
    );
    expect(repository.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({ module: 'production' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'production.order.created',
        maxRetries: 10,
        metadata: expect.objectContaining({
          eventVersion: 1,
          aggregateVersion: 1,
          orderingKey: 'production-order:po-1',
        }),
      }),
      tx,
    );
  });

  it('replays the durable result without duplicating timeline or Outbox', async () => {
    const tx = { marker: 'production-transaction' } as never;
    const order = {
      id: 'po-2',
      orderNo: 'PO-002',
      orderKind: ProductionOrderKind.STANDARD,
      status: ProductionOrderStatus.DRAFT,
      aggregateVersion: 1,
      componentId: 'component-1',
      componentRevisionId: 'revision-1',
      bomDefinitionId: 'bom-definition-1',
    };
    const outbox = new Map<string, unknown>();
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findOutboxEvent: jest.fn(async (key: string) => outbox.get(key) ?? null),
      findReleasedEngineeringBasis: jest.fn().mockResolvedValue({
        ...releasedEngineeringBasis,
        currentRevision: {
          ...releasedEngineeringBasis.currentRevision,
          contentHash: 'b'.repeat(64),
          bomDefinition: {
            ...releasedEngineeringBasis.currentRevision.bomDefinition,
            contentHash: 'b'.repeat(64),
          },
        },
      }),
      findAggregate: jest.fn().mockResolvedValue(order),
      createAggregateOrder: jest.fn().mockResolvedValue(order),
      createProductionLog: jest.fn().mockResolvedValue({ id: 'log-1' }),
      createActivity: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn(async (data: { idempotencyKey: string }) => {
        outbox.set(data.idempotencyKey, data);
        return data;
      }),
    } as unknown as ProductionOrderRepository;
    const service = new ProductionCommandService(
      repository,
      {} as InventoryPostingService,
      {
        materializeReleasedEngineeringBom: jest.fn().mockResolvedValue({
          id: 'bom-2',
        }),
      } as unknown as ProductionBomMaterializationService,
    );
    const command = {
      orderNo: 'PO-002',
      title: 'Idempotent order',
      quantity: 5,
      unit: 'pcs',
      actorId: 'operator-1',
      idempotencyKey: 'create-po-002',
      engineeringBasis: {
        componentId: 'component-1',
        componentRevisionId: 'revision-1',
        bomDefinitionId: 'bom-definition-1',
        contentHash: 'b'.repeat(64),
        verifiedAt: '2026-07-17T08:00:00.000Z',
      },
    };

    await service.createOrder(command);
    await service.createOrder(command);

    expect(repository.createAggregateOrder).toHaveBeenCalledTimes(1);
    expect(repository.createProductionLog).toHaveBeenCalledTimes(1);
    expect(repository.createActivity).toHaveBeenCalledTimes(1);
    expect(repository.createOutboxEvent).toHaveBeenCalledTimes(2);

    await expect(
      service.createOrder({ ...command, title: 'Different command' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects Production Order creation before Engineering release', async () => {
    const tx = { marker: 'production-transaction' } as never;
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findReleasedEngineeringBasis: jest.fn().mockResolvedValue({
        ...releasedEngineeringBasis,
        lifecycleState: ComponentLifecycleState.DRAFT,
        currentRevisionId: null,
        currentRevision: null,
      }),
      createAggregateOrder: jest.fn(),
      createOutboxEvent: jest.fn(),
    } as unknown as ProductionOrderRepository;
    const service = new ProductionCommandService(
      repository,
      {} as InventoryPostingService,
      {
        materializeReleasedEngineeringBom: jest.fn(),
      } as unknown as ProductionBomMaterializationService,
    );

    await expect(
      service.createOrder({
        orderNo: 'PO-DRAFT',
        title: 'Draft component order',
        quantity: 1,
        unit: 'pcs',
        actorId: 'operator-1',
        idempotencyKey: 'create-po-draft',
        engineeringBasis: {
          componentId: 'component-1',
          componentRevisionId: 'revision-1',
          bomDefinitionId: 'bom-definition-1',
          contentHash: 'a'.repeat(64),
          verifiedAt: '2026-07-17T08:00:00.000Z',
        },
      }),
    ).rejects.toThrow(
      'Component must be released by Engineering before Production Order creation',
    );
    expect(repository.createAggregateOrder).not.toHaveBeenCalled();
    expect(repository.createOutboxEvent).not.toHaveBeenCalled();
  });

  it('returns Conflict and writes no event when expectedVersion is stale', async () => {
    const tx = { marker: 'production-transaction' } as never;
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findAggregate: jest.fn().mockResolvedValue({
        id: 'po-3',
        orderNo: 'PO-003',
        status: ProductionOrderStatus.DRAFT,
        orderKind: ProductionOrderKind.STANDARD,
        aggregateVersion: 4,
        workOrders: [],
        completions: [],
        scraps: [],
        materialIssues: [],
        materialConsumptions: [],
        materialLedgers: [],
      }),
      updateAggregateOrder: jest.fn().mockResolvedValue(null),
      createOutboxEvent: jest.fn(),
    } as unknown as ProductionOrderRepository;
    const service = new ProductionCommandService(
      repository,
      {} as InventoryPostingService,
      {} as ProductionBomMaterializationService,
    );

    await expect(
      service.cancelOrder({
        productionOrderId: 'po-3',
        expectedVersion: 3,
        actorId: 'operator-1',
        idempotencyKey: 'cancel-po-3-v3',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.updateAggregateOrder).toHaveBeenCalledWith(
      'po-3',
      3,
      expect.any(Object),
      tx,
    );
    expect(repository.createOutboxEvent).not.toHaveBeenCalled();
  });

  it('starts an Execution with timeline, audit and canonical Outbox atomically', async () => {
    const tx = { marker: 'production-transaction' } as never;
    const now = new Date('2026-07-17T10:00:00.000Z');
    const execution = {
      id: 'execution-1',
      productionOrderId: 'po-4',
      workOrderId: 'wo-4',
      state: ProductionExecutionState.RUNNING,
      aggregateVersion: 1,
      workCenterId: 'wc-1',
      machineId: null,
      startedAt: now,
      pausedAt: null,
      resumedAt: null,
      completedAt: null,
      abortedAt: null,
      pauseReason: null,
      abortReason: null,
      createdBy: 'operator-1',
      createdAt: now,
      updatedAt: now,
    };
    const outbox = new Map<string, unknown>();
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findOutboxEvent: jest.fn(async (key: string) => outbox.get(key) ?? null),
      findAggregate: jest.fn().mockResolvedValue({
        id: 'po-4',
        status: ProductionOrderStatus.IN_PROGRESS,
      }),
      findWorkOrder: jest.fn().mockResolvedValue({
        id: 'wo-4',
        productionOrderId: 'po-4',
        lifecycleState: ProductionWorkOrderState.IN_PROGRESS,
      }),
      findActiveExecutionForWorkOrder: jest.fn().mockResolvedValue(null),
      findExecution: jest.fn().mockResolvedValue(execution),
      createExecution: jest.fn().mockResolvedValue(execution),
      createProductionLog: jest.fn().mockResolvedValue({ id: 'log-1' }),
      createActivity: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn(async (data: { idempotencyKey: string }) => {
        outbox.set(data.idempotencyKey, data);
        return data;
      }),
    } as unknown as ProductionOrderRepository;
    const service = new ProductionCommandService(
      repository,
      {} as InventoryPostingService,
      {} as ProductionBomMaterializationService,
    );

    const result = await service.startExecution({
      productionOrderId: 'po-4',
      workOrderId: 'wo-4',
      workCenterId: 'wc-1',
      actorId: 'operator-1',
      idempotencyKey: 'start-execution-1',
    });

    expect(result).toBe(execution);
    expect(repository.createExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        productionOrderId: 'po-4',
        workOrderId: 'wo-4',
        state: ProductionExecutionState.RUNNING,
        aggregateVersion: 1,
      }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'production.execution.started',
        metadata: expect.objectContaining({
          eventVersion: 1,
          orderingKey: 'execution:execution-1',
        }),
      }),
      tx,
    );

    const replay = await service.startExecution({
      productionOrderId: 'po-4',
      workOrderId: 'wo-4',
      workCenterId: 'wc-1',
      actorId: 'operator-1',
      idempotencyKey: 'start-execution-1',
    });
    expect(replay).toBe(execution);
    expect(repository.createExecution).toHaveBeenCalledTimes(1);
  });

  it('rejects a stale Execution version without writing timeline or Outbox', async () => {
    const tx = { marker: 'production-transaction' } as never;
    const now = new Date('2026-07-17T10:00:00.000Z');
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findExecution: jest.fn().mockResolvedValue({
        id: 'execution-2',
        productionOrderId: 'po-5',
        workOrderId: 'wo-5',
        state: ProductionExecutionState.RUNNING,
        aggregateVersion: 3,
        startedAt: now,
        updatedAt: now,
      }),
      updateExecution: jest.fn().mockResolvedValue(null),
      createProductionLog: jest.fn(),
      createActivity: jest.fn(),
      createOutboxEvent: jest.fn(),
    } as unknown as ProductionOrderRepository;
    const service = new ProductionCommandService(
      repository,
      {} as InventoryPostingService,
      {} as ProductionBomMaterializationService,
    );

    await expect(
      service.pauseExecution({
        productionOrderId: 'po-5',
        workOrderId: 'wo-5',
        executionRunId: 'execution-2',
        expectedVersion: 2,
        reason: 'Shift handoff',
        actorId: 'operator-1',
        idempotencyKey: 'pause-execution-2-v2',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.createProductionLog).not.toHaveBeenCalled();
    expect(repository.createActivity).not.toHaveBeenCalled();
    expect(repository.createOutboxEvent).not.toHaveBeenCalled();
  });
});
