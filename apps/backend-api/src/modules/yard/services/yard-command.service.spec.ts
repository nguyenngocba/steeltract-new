import { ConflictException } from '@nestjs/common';
import { YardItemType, YardSlotStatus } from '@prisma/client';

import { YardCommandService } from './yard-command.service';

describe('YardCommandService', () => {
  const slot = {
    id: 'slot-a',
    zoneId: 'zone-1',
    status: YardSlotStatus.AVAILABLE,
    maxStackLevel: 3,
    currentStackLevel: 0,
  };

  function setup(initialPlacement?: Record<string, any>) {
    const tx = { id: 'yard-tx' };
    const outbox = new Map<string, any>();
    let placement = initialPlacement ?? null;
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findOutboxEvent: jest.fn(async (key) => outbox.get(key) ?? null),
      createOutboxEvent: jest.fn(async (data) => {
        const existing = outbox.get(data.idempotencyKey);
        if (existing) return existing;
        const created = { id: `event-${outbox.size + 1}`, ...data };
        outbox.set(data.idempotencyKey, created);
        return created;
      }),
      findActivePlacementForItem: jest.fn().mockResolvedValue(null),
      findSlotById: jest.fn().mockResolvedValue(slot),
      findActivePlacementsForSlot: jest.fn().mockResolvedValue([]),
      createPlacement: jest.fn(async (data) => {
        placement = {
          id: 'placement-1',
          slotId: slot.id,
          itemType: data.itemType,
          itemId: data.itemId,
          itemCode: data.itemCode,
          itemName: data.itemName ?? null,
          quantity: data.quantity,
          stackLevel: data.stackLevel,
          removedAt: null,
          updatedAt: new Date('2026-07-17T00:00:00.000Z'),
          metadata: data.metadata,
          slot: { ...slot, zone: { id: 'zone-1' } },
          movements: [],
        };
        return placement;
      }),
      findPlacementById: jest.fn(async () => placement),
      updatePlacementVersioned: jest.fn(async (_id, _updatedAt, data) => {
        placement = { ...placement, ...data, updatedAt: new Date(), slot };
        return placement;
      }),
      createMovement: jest.fn().mockResolvedValue({ id: 'movement-1' }),
      updateSlot: jest.fn().mockResolvedValue(slot),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
    };
    return {
      repository,
      service: new YardCommandService(repository as never),
      outbox,
      tx,
    };
  }

  it('places one item and atomically records canonical event and command receipt', async () => {
    const { repository, service, tx } = setup();
    const result = await service.place({
      idempotencyKey: 'yard-place-1',
      expectedVersion: 0,
      slotId: slot.id,
      itemType: YardItemType.COMPONENT,
      itemId: 'component-1',
      itemCode: 'C-001',
      quantity: 1,
      actorId: 'operator-1',
    });

    expect(result.id).toBe('placement-1');
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'YardItem' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'yard.item.placed',
        payload: expect.objectContaining({
          yardItemId: 'component-1',
          placementId: 'placement-1',
        }),
      }),
      tx,
    );
  });

  it('rejects duplicate active placement before persistence', async () => {
    const { repository, service } = setup();
    repository.findActivePlacementForItem.mockResolvedValue({
      id: 'existing-placement',
    });

    await expect(
      service.place({
        idempotencyKey: 'yard-place-duplicate',
        expectedVersion: 0,
        slotId: slot.id,
        itemType: YardItemType.COMPONENT,
        itemId: 'component-1',
        itemCode: 'C-001',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createPlacement).not.toHaveBeenCalled();
  });

  it('replays a completed command without repeating the mutation', async () => {
    const { repository, service } = setup();
    const command = {
      idempotencyKey: 'yard-place-replay',
      expectedVersion: 0,
      slotId: slot.id,
      itemType: YardItemType.COMPONENT,
      itemId: 'component-1',
      itemCode: 'C-001',
      quantity: 1,
    };

    await service.place(command);
    await service.place(command);

    expect(repository.createPlacement).toHaveBeenCalledTimes(1);
    expect(repository.createMovement).toHaveBeenCalledTimes(1);
  });

  it('publishes the approved loading-completed fact on Logistics release', async () => {
    const placement = {
      id: 'placement-1',
      slotId: slot.id,
      itemType: YardItemType.COMPONENT,
      itemId: 'component-1',
      itemCode: 'C-001',
      quantity: 1,
      stackLevel: 1,
      removedAt: null,
      updatedAt: new Date('2026-07-17T00:00:00.000Z'),
      metadata: {
        aggregateVersion: 3,
        yardState: 'LOADING_READY',
        loadingTaskId: 'load-1',
        shipmentId: 'shipment-1',
      },
      slot: { ...slot, zone: { id: 'zone-1' } },
      movements: [],
    };
    const { repository, service, tx } = setup(placement);

    await service.releaseForLogistics({
      idempotencyKey: 'yard-release-1',
      expectedVersion: 3,
      placementId: placement.id,
      loadingTaskId: 'load-1',
      loadingPlanReference: 'plan-1',
      actorId: 'operator-1',
    });

    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'yard.loading.completed',
        payload: expect.objectContaining({
          loadingTaskId: 'load-1',
          loadedItemIds: ['component-1'],
        }),
      }),
      tx,
    );
  });

  it('returns conflict when compare-and-swap loses the race', async () => {
    const placement = {
      id: 'placement-1',
      slotId: slot.id,
      itemType: YardItemType.COMPONENT,
      itemId: 'component-1',
      itemCode: 'C-001',
      quantity: 1,
      stackLevel: 1,
      removedAt: null,
      updatedAt: new Date('2026-07-17T00:00:00.000Z'),
      metadata: { aggregateVersion: 1, yardState: 'PLACED' },
      slot: { ...slot, zone: { id: 'zone-1' } },
      movements: [],
    };
    const { repository, service } = setup(placement);
    repository.updatePlacementVersioned.mockResolvedValue(null);

    await expect(
      service.hold({
        idempotencyKey: 'yard-hold-stale',
        expectedVersion: 1,
        placementId: placement.id,
        reason: 'QC hold',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
