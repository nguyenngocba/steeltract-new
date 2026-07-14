import {
  aggregateInventoryBuckets,
  aggregateInventoryMaterials,
  orderAndValidateTransferLines,
  sharedLineValue,
} from './inventory-transaction-lines';

describe('inventory transaction line foundation', () => {
  it('aggregates duplicate material location buckets before validation', () => {
    const result = aggregateInventoryBuckets([
      {
        inventoryItemId: 'material-1',
        warehouseId: 'warehouse-1',
        zoneId: 'zone-1',
        slotId: 'A01',
        level: 'L2',
        quantity: -10,
      },
      {
        inventoryItemId: 'material-1',
        warehouseId: 'warehouse-1',
        zoneId: 'zone-1',
        slotId: 'A01',
        level: 'L2',
        quantity: -15,
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ inventoryItemId: 'material-1', quantity: -25 }),
    ]);
  });

  it('aggregates compatibility quantity deltas by material', () => {
    expect(
      aggregateInventoryMaterials([
        { inventoryItemId: 'material-1', quantity: -10 },
        { inventoryItemId: 'material-1', quantity: 4 },
        { inventoryItemId: 'material-2', quantity: 3 },
      ]),
    ).toEqual([
      { inventoryItemId: 'material-1', quantity: -6 },
      { inventoryItemId: 'material-2', quantity: 3 },
    ]);
  });

  it('orders each transfer material as source then destination', () => {
    const result = orderAndValidateTransferLines([
      { inventoryItemId: 'material-1', zoneId: 'to-1', quantity: 5 },
      { inventoryItemId: 'material-2', zoneId: 'from-2', quantity: -7 },
      { inventoryItemId: 'material-1', zoneId: 'from-1', quantity: -5 },
      { inventoryItemId: 'material-2', zoneId: 'to-2', quantity: 7 },
    ]);

    expect(result.map((line) => [line.inventoryItemId, line.quantity])).toEqual([
      ['material-1', -5],
      ['material-1', 5],
      ['material-2', -7],
      ['material-2', 7],
    ]);
  });

  it('rejects ambiguous repeated transfer pairs for the same material', () => {
    expect(() =>
      orderAndValidateTransferLines([
        { inventoryItemId: 'material-1', zoneId: 'from-1', quantity: -5 },
        { inventoryItemId: 'material-1', zoneId: 'from-2', quantity: -5 },
        { inventoryItemId: 'material-1', zoneId: 'to-1', quantity: 10 },
      ]),
    ).toThrow('exactly one source and one destination');
  });

  it('returns a shared header location only when every line agrees', () => {
    const same = [
      { inventoryItemId: 'material-1', warehouseId: 'warehouse-1', quantity: 1 },
      { inventoryItemId: 'material-2', warehouseId: 'warehouse-1', quantity: 1 },
    ];
    const mixed = [
      ...same,
      { inventoryItemId: 'material-3', warehouseId: 'warehouse-2', quantity: 1 },
    ];

    expect(sharedLineValue(same, (line) => line.warehouseId)).toBe('warehouse-1');
    expect(sharedLineValue(mixed, (line) => line.warehouseId)).toBeUndefined();
  });
});
