import { InventoryEventService } from './inventory-event.service';

describe('InventoryEventService canonical payload', () => {
  it('writes a complete stock fact and AD-019 envelope in the caller transaction', async () => {
    const repository = {
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    const service = new InventoryEventService(repository as never);
    const tx = { marker: 'inventory-tx' } as never;

    await service.stockPosted(
      'inventory.issued',
      {
        inventoryTransactionId: 'transaction-1',
        transactionCode: 'XK-0001',
        materialId: 'material-1',
        quantity: 10,
        unit: 'kg',
        warehouseId: 'warehouse-1',
        zoneId: 'zone-1',
        slotId: 'A01',
        level: 'L2',
        referenceModule: 'production_material_issue',
        referenceId: 'issue-1',
        postingKind: 'ISSUE',
        postedAt: '2026-07-17T04:00:00.000Z',
        resultingStock: 90,
        resultingLocationBalance: 40,
        aggregateVersion: 42,
      },
      tx,
    );

    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'inventory.issued',
        idempotencyKey:
          'inventory.issued:transaction-1:material-1:warehouse-1:zone-1:A01:L2',
        payload: expect.objectContaining({
          materialId: 'material-1',
          quantity: 10,
          unit: 'kg',
          warehouseId: 'warehouse-1',
          slotId: 'A01',
          level: 'L2',
          resultingStock: 90,
          resultingLocationBalance: 40,
        }),
        metadata: expect.objectContaining({
          eventName: 'inventory.issued',
          eventVersion: 1,
          producer: 'inventory',
          aggregateId: 'material-1',
          aggregateVersion: 42,
          orderingKey: 'inventory-item:material-1',
        }),
      }),
      tx,
    );
  });
});
