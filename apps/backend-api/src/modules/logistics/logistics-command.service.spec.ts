import { BadRequestException, ConflictException } from '@nestjs/common';
import { DispatchItemType, DispatchOrderStatus } from '@prisma/client';

import { ShipmentAggregate } from './domain/shipment.aggregate';
import { LogisticsCommandService } from './logistics-command.service';

describe('Logistics canonical domain', () => {
  const baseTime = new Date('2026-07-17T00:00:00.000Z');

  function shipment(status: DispatchOrderStatus = DispatchOrderStatus.LOADING) {
    return {
      id: 'shipment-1',
      code: 'DX-260717-00001',
      projectId: 'project-1',
      projectTaskId: null,
      status,
      plannedAt: null,
      departedAt: null,
      arrivedAt: null,
      receivedAt: null,
      vehicle: 'vehicle-1',
      driver: 'driver-1',
      notes: null,
      loadingChecklist: {
        domain: {
          yardReleaseReferences: {
            'COMPONENT:component-1': 'yard-release-1',
          },
        },
      },
      createdAt: baseTime,
      updatedAt: baseTime,
      project: { id: 'project-1' },
      projectTask: null,
      items: [
        {
          id: 'line-1',
          type: DispatchItemType.COMPONENT,
          inventoryItemId: null,
          componentId: 'component-1',
          quantity: 1,
          inventoryItem: null,
          component: { id: 'component-1' },
        },
      ],
      events: [],
      dashboardSnapshot: null,
    };
  }

  function setup(initialShipment: Record<string, any> | null = null) {
    const tx = { id: 'logistics-tx' };
    const outbox = new Map<string, any>();
    let current = initialShipment;
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      nextShipmentCode: jest.fn().mockResolvedValue('DX-260717-00001'),
      findOutboxEvent: jest.fn(async (key) => outbox.get(key) ?? null),
      createOutboxEvent: jest.fn(async (data) => {
        const existing = outbox.get(data.idempotencyKey);
        if (existing) return existing;
        const created = { id: `event-${outbox.size + 1}`, ...data };
        outbox.set(data.idempotencyKey, created);
        return created;
      }),
      createDispatchOrder: jest.fn(async (data) => {
        current = {
          ...shipment(DispatchOrderStatus.DRAFT),
          code: data.code,
          status: data.status,
          vehicle: null,
          driver: null,
          loadingChecklist: data.loadingChecklist,
          items: data.items.create.map((line, index) => ({
            id: `line-${index + 1}`,
            type: line.type,
            inventoryItemId: line.inventoryItem?.connect.id ?? null,
            componentId: line.component?.connect.id ?? null,
            quantity: line.quantity,
            inventoryItem: null,
            component: null,
          })),
        };
        return current;
      }),
      findDispatchOrder: jest.fn(async () => current),
      updateDispatchOrderVersioned: jest.fn(
        async (_id, _expectedUpdatedAt, data) => {
          current = { ...current, ...data };
          return current;
        },
      ),
      createDispatchEvent: jest.fn().mockResolvedValue({ id: 'timeline-1' }),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
    };
    return {
      repository,
      service: new LogisticsCommandService(repository as never),
      tx,
    };
  }

  it('creates shipment header/lines only from Yard release references', async () => {
    const { repository, service, tx } = setup();
    const result = await service.create({
      idempotencyKey: 'shipment-create-1',
      expectedVersion: 0,
      projectId: 'project-1',
      lines: [
        {
          type: DispatchItemType.COMPONENT,
          componentId: 'component-1',
          quantity: 1,
          yardReleaseReference: 'yard-release-1',
        },
      ],
    });

    expect(result.status).toBe(DispatchOrderStatus.DRAFT);
    expect(repository.createDispatchOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        items: { create: [expect.objectContaining({ quantity: 1 })] },
      }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'logistics.shipment.created' }),
      tx,
    );
  });

  it('rejects lines that do not prove Yard release', async () => {
    const { repository, service } = setup();
    await expect(
      service.create({
        idempotencyKey: 'shipment-create-invalid',
        expectedVersion: 0,
        projectId: 'project-1',
        lines: [
          {
            type: DispatchItemType.COMPONENT,
            componentId: 'component-1',
            quantity: 1,
            yardReleaseReference: '',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createDispatchOrder).not.toHaveBeenCalled();
  });

  it('enforces assignment, loading, dispatch, delivery and completion order', () => {
    const draft = ShipmentAggregate.hydrate({
      id: 'shipment-1',
      status: DispatchOrderStatus.DRAFT,
      version: 1,
      vehicle: null,
      driver: null,
      lines: [
        {
          type: DispatchItemType.COMPONENT,
          componentId: 'component-1',
          quantity: 1,
          yardReleaseReference: 'yard-release-1',
        },
      ],
    });
    expect(draft.assignVehicle('vehicle-1')).toBe(DispatchOrderStatus.DRAFT);
    expect(() => draft.dispatch()).toThrow('cannot dispatch');

    const planned = ShipmentAggregate.hydrate({
      id: 'shipment-1',
      status: DispatchOrderStatus.PLANNED,
      version: 2,
      vehicle: 'vehicle-1',
      driver: 'driver-1',
      lines: [
        {
          type: DispatchItemType.COMPONENT,
          componentId: 'component-1',
          quantity: 1,
          yardReleaseReference: 'yard-release-1',
        },
      ],
    });
    expect(planned.confirmLoading()).toBe(DispatchOrderStatus.LOADING);
  });

  it('replays dispatch idempotently without duplicate timeline or Outbox', async () => {
    const { repository, service } = setup(shipment());
    const command = {
      idempotencyKey: 'shipment-dispatch-1',
      expectedVersion: baseTime.getTime(),
      shipmentId: 'shipment-1',
    };

    await service.dispatch(command);
    await service.dispatch(command);

    expect(repository.updateDispatchOrderVersioned).toHaveBeenCalledTimes(1);
    expect(repository.createDispatchEvent).toHaveBeenCalledTimes(1);
    expect(
      repository.createOutboxEvent.mock.calls.filter(
        ([data]) => data.eventName === 'logistics.shipment.dispatched',
      ),
    ).toHaveLength(1);
  });

  it('rejects reuse of an idempotency key with different command content', async () => {
    const { repository, service } = setup(shipment());
    await service.dispatch({
      idempotencyKey: 'shipment-dispatch-key',
      expectedVersion: baseTime.getTime(),
      shipmentId: 'shipment-1',
    });

    await expect(
      service.dispatch({
        idempotencyKey: 'shipment-dispatch-key',
        expectedVersion: baseTime.getTime() + 1,
        shipmentId: 'shipment-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.updateDispatchOrderVersioned).toHaveBeenCalledTimes(1);
  });

  it('prevents a second dispatch and a second delivery by lifecycle state', async () => {
    const dispatched = shipment(DispatchOrderStatus.IN_TRANSIT);
    const { service } = setup(dispatched);

    await expect(
      service.dispatch({
        idempotencyKey: 'shipment-dispatch-again',
        expectedVersion: dispatched.updatedAt.getTime(),
        shipmentId: dispatched.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const delivered = shipment(DispatchOrderStatus.RECEIVED);
    const deliverySetup = setup(delivered);
    await expect(
      deliverySetup.service.confirmDelivery({
        idempotencyKey: 'shipment-delivery-again',
        expectedVersion: delivered.updatedAt.getTime(),
        shipmentId: delivered.id,
        deliveryProofReference: 'proof-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns conflict when optimistic compare-and-swap loses the race', async () => {
    const current = shipment();
    const { repository, service } = setup(current);
    repository.updateDispatchOrderVersioned.mockResolvedValue(null);

    await expect(
      service.dispatch({
        idempotencyKey: 'shipment-dispatch-stale',
        expectedVersion: current.updatedAt.getTime(),
        shipmentId: current.id,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createDispatchEvent).not.toHaveBeenCalled();
  });

  it('publishes delivered fact with proof and no cross-module mutation', async () => {
    const current = shipment(DispatchOrderStatus.IN_TRANSIT);
    const { repository, service, tx } = setup(current);
    await service.confirmDelivery({
      idempotencyKey: 'shipment-delivery-1',
      expectedVersion: current.updatedAt.getTime(),
      shipmentId: current.id,
      deliveryProofReference: 'proof-1',
    });

    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'logistics.shipment.delivered',
        payload: expect.objectContaining({
          shipmentId: current.id,
          deliveryProofReference: 'proof-1',
        }),
      }),
      tx,
    );
  });
});
