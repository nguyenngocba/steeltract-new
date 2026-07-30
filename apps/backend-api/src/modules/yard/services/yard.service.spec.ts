import { YardService } from './yard.service';

describe('YardService repository and Outbox boundary', () => {
  const zone = {
    id: 'zone-1',
    code: 'Y-A',
    name: 'Yard A',
    slots: [],
    createdAt: new Date('2026-07-17T00:00:00.000Z'),
    updatedAt: new Date('2026-07-17T00:00:00.000Z'),
  };

  function setup(outboxError?: Error) {
    const tx = { transaction: 'yard-tx' };
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      createZone: jest.fn().mockResolvedValue(zone),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: outboxError
        ? jest.fn().mockRejectedValue(outboxError)
        : jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    const service = new YardService(
      repository as never,
      { link: jest.fn() } as never,
      { findEligibleInstance: jest.fn() } as never,
    );

    return { repository, service, tx };
  }

  it('writes business data, ActivityLog and both Outbox rows with one transaction client', async () => {
    const { repository, service, tx } = setup();

    await expect(
      service.createZone(
        {
          code: 'Y-A',
          name: 'Yard A',
          status: 'ACTIVE',
          originX: 0,
          originY: 0,
          width: 0,
          height: 0,
          color: '#06b6d4',
        },
        'user-1',
      ),
    ).resolves.toBe(zone);

    expect(repository.createZone).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'Y-A' }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'YARD_ZONE_CREATED' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ eventName: 'audit.activity.created' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ eventName: 'yard.zone.updated' }),
      tx,
    );
  });

  it('rejects the mutation result when atomic Outbox persistence fails', async () => {
    const error = new Error('outbox unavailable');
    const { service } = setup(error);

    await expect(
      service.createZone({
        code: 'Y-A',
        name: 'Yard A',
        status: 'ACTIVE',
        originX: 0,
        originY: 0,
        width: 0,
        height: 0,
        color: '#06b6d4',
      }),
    ).rejects.toThrow('outbox unavailable');
  });

  it('publishes a lightweight canonical Yard placement fact', async () => {
    const { repository, service, tx } = setup();
    const placedAt = new Date('2026-07-17T03:00:00.000Z');

    await (service as any).createYardOutboxEvent(
      tx,
      'yard.item.placed',
      {
        id: 'placement-1',
        itemId: 'component-1',
        itemType: 'COMPONENT',
        quantity: 2,
        slotId: 'slot-1',
        stackLevel: 2,
        placedAt,
        slot: { zoneId: 'zone-1' },
        movements: [],
      },
      'operator-1',
    );

    expect(repository.createOutboxEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        eventName: 'yard.item.placed',
        payload: expect.objectContaining({
          yardItemId: 'component-1',
          placementId: 'placement-1',
          zoneId: 'zone-1',
          slotId: 'slot-1',
          level: '2',
          movementAt: placedAt.toISOString(),
        }),
        metadata: expect.objectContaining({
          eventVersion: 1,
          producer: 'yard',
          aggregateId: 'placement-1',
        }),
      }),
      tx,
    );
  });

  it('stages finished goods by ComponentInstance identity', async () => {
    const repository = {
      transaction: jest.fn(),
    };
    const finishedGoods = {
      findEligibleInstance: jest.fn().mockResolvedValue({
        id: 'instance-1',
        instanceNo: 'BEAM-A-001',
        componentId: 'component-definition-1',
        projectId: 'project-a',
        requirementId: 'requirement-a',
        productionOrderId: 'po-a',
        component: { code: 'BEAM-A', name: 'Beam A' },
        productionOrder: { orderNo: 'MO-A' },
      }),
    };
    const service = new YardService(
      repository as never,
      { link: jest.fn() } as never,
      finishedGoods as never,
    );
    const placeItem = jest
      .spyOn(service, 'placeItem')
      .mockResolvedValue({ id: 'placement-1' } as never);

    await expect(
      service.stageComponentInstance(
        {
          componentInstanceId: 'instance-1',
          slotId: 'slot-a',
          attachmentIds: [],
        },
        'operator-1',
      ),
    ).resolves.toEqual({ id: 'placement-1' });

    expect(finishedGoods.findEligibleInstance).toHaveBeenCalledWith(
      'instance-1',
    );
    expect(placeItem).toHaveBeenCalledWith(
      expect.objectContaining({
        componentInstanceId: 'instance-1',
        itemId: 'instance-1',
        itemCode: 'BEAM-A-001',
        quantity: 1,
        metadata: expect.objectContaining({
          canonicalSource: 'ComponentInstance',
          componentId: 'component-definition-1',
          projectId: 'project-a',
          requirementId: 'requirement-a',
          productionOrderId: 'po-a',
        }),
      }),
      'operator-1',
    );
  });

  it('rejects unfinished or non-authoritative finished goods candidates', async () => {
    const service = new YardService(
      { transaction: jest.fn() } as never,
      { link: jest.fn() } as never,
      { findEligibleInstance: jest.fn().mockResolvedValue(null) } as never,
    );

    await expect(
      service.stageComponentInstance({
        componentInstanceId: 'unfinished-instance',
        slotId: 'slot-a',
        attachmentIds: [],
      }),
    ).rejects.toThrow('not eligible finished goods');
  });

  it('rejects duplicate active placement for the same ComponentInstance', async () => {
    const tx = {};
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findSlotById: jest.fn().mockResolvedValue({
        id: 'slot-a',
        status: 'AVAILABLE',
        maxStackLevel: 4,
      }),
      findActivePlacementsForSlot: jest.fn().mockResolvedValue([]),
      findActivePlacementForComponentInstance: jest
        .fn()
        .mockResolvedValue({ id: 'existing-placement' }),
    };
    const service = new YardService(
      repository as never,
      { link: jest.fn() } as never,
      { findEligibleInstance: jest.fn() } as never,
    );

    await expect(
      service.placeItem({
        slotId: 'slot-a',
        componentInstanceId: 'instance-1',
        itemType: 'COMPONENT' as never,
        itemId: 'instance-1',
        itemCode: 'BEAM-A-001',
        quantity: 1,
        attachmentIds: [],
      }),
    ).rejects.toThrow('already actively placed');
  });

  it('rejects new component-definition Yard placements without ComponentInstance identity', async () => {
    const tx = {};
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findSlotById: jest.fn().mockResolvedValue({
        id: 'slot-a',
        status: 'AVAILABLE',
        maxStackLevel: 4,
      }),
    };
    const service = new YardService(
      repository as never,
      { link: jest.fn() } as never,
      { findEligibleInstance: jest.fn() } as never,
    );

    await expect(
      service.placeItem({
        slotId: 'slot-a',
        itemType: 'COMPONENT' as never,
        itemId: 'component-definition-1',
        itemCode: 'BEAM-A',
        quantity: 1,
        attachmentIds: [],
      }),
    ).rejects.toThrow('requires componentInstanceId');
  });

  it('preserves ComponentInstance identity during move', async () => {
    const tx = {};
    const existing = {
      id: 'placement-1',
      slotId: 'slot-a',
      itemType: 'COMPONENT',
      itemId: 'instance-1',
      itemCode: 'BEAM-A-001',
      componentInstanceId: 'instance-1',
      removedAt: null,
    };
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findPlacementById: jest
        .fn()
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          slotId: 'slot-b',
          movements: [{ createdAt: new Date('2026-07-29T00:00:00.000Z') }],
        }),
      findSlotById: jest.fn().mockResolvedValue({
        id: 'slot-b',
        status: 'AVAILABLE',
        maxStackLevel: 4,
      }),
      findActivePlacementsForSlot: jest.fn().mockResolvedValue([]),
      updatePlacement: jest.fn().mockResolvedValue({
        ...existing,
        slotId: 'slot-b',
        componentInstanceId: 'instance-1',
      }),
      createMovement: jest.fn().mockResolvedValue({ id: 'move-1' }),
      updateSlot: jest.fn().mockResolvedValue({}),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
    };
    const service = new YardService(
      repository as never,
      { link: jest.fn() } as never,
      { findEligibleInstance: jest.fn() } as never,
    );

    await service.moveItem('placement-1', { toSlotId: 'slot-b' });

    expect(repository.createMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        componentInstance: { connect: { id: 'instance-1' } },
        itemId: 'instance-1',
      }),
      tx,
    );
  });

  it('does not mutate legacy Component status when removing canonical instance placement', async () => {
    const tx = {};
    const existing = {
      id: 'placement-1',
      slotId: 'slot-a',
      itemType: 'COMPONENT',
      itemId: 'instance-1',
      itemCode: 'BEAM-A-001',
      componentInstanceId: 'instance-1',
      removedAt: null,
      placedAt: new Date('2026-07-29T00:00:00.000Z'),
      createdAt: new Date('2026-07-29T00:00:00.000Z'),
      metadata: {},
    };
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findPlacementById: jest
        .fn()
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          removedAt: new Date(),
          movements: [{ createdAt: new Date('2026-07-29T00:00:00.000Z') }],
        }),
      updatePlacement: jest.fn().mockResolvedValue({
        ...existing,
        removedAt: new Date(),
      }),
      createMovement: jest.fn().mockResolvedValue({ id: 'remove-1' }),
      findActivePlacementsForSlot: jest.fn().mockResolvedValue([]),
      updateSlot: jest.fn().mockResolvedValue({}),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
      findComponentForOutbound: jest.fn(),
      markComponentShipped: jest.fn(),
    };
    const service = new YardService(
      repository as never,
      { link: jest.fn() } as never,
      { findEligibleInstance: jest.fn() } as never,
    );

    await service.removeItem('placement-1', {});

    expect(repository.findComponentForOutbound).not.toHaveBeenCalled();
    expect(repository.markComponentShipped).not.toHaveBeenCalled();
    expect(repository.createMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        componentInstance: { connect: { id: 'instance-1' } },
      }),
      tx,
    );
  });
});
