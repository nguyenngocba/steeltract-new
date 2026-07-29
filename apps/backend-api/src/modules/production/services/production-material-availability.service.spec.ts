import { ProductionService } from './production.service';

describe('ProductionService production material availability', () => {
  it('reads production readiness from PRODUCTION InventoryLocationStock and active reservations', async () => {
    const order = {
      id: 'po-ops3',
      orderNo: 'PO-OPS3',
      quantity: 1,
      bom: {
        items: [
          {
            materialId: 'material-a',
            quantity: 30,
            wastePercent: 0,
            material: {
              code: 'OPS3-A',
              name: 'Material A',
              unit: 'kg',
              unitMaster: null,
            },
          },
          {
            materialId: 'material-c',
            quantity: 10,
            wastePercent: 0,
            material: {
              code: 'OPS3-C',
              name: 'Material C',
              unit: 'kg',
              unitMaster: null,
            },
          },
        ],
      },
      materialIssues: [
        { inventoryItemId: 'material-a', issuedQty: 15 },
      ],
    };
    const repository = {
      findOrderById: jest.fn().mockResolvedValue(order),
      findActiveReservationLines: jest.fn().mockResolvedValue([
        {
          inventoryItemId: 'material-a',
          reservedQty: 12,
          issuedQty: 5,
          returnedQty: 2,
        },
      ]),
      findIssuedMaterialIssues: jest.fn().mockResolvedValue([
        {
          inventoryItemId: 'material-a',
          warehouseId: 'warehouse-production',
          zoneId: 'zone-production',
          slotId: 'P01',
          level: 'L1',
          issuedQty: 15,
        },
      ]),
    };
    const inventoryRepository = {
      findWarehouseByCode: jest.fn().mockResolvedValue({
        id: 'warehouse-production',
        code: 'PRODUCTION',
        name: 'Kho sản xuất',
      }),
      findPositiveLocationStocks: jest.fn().mockResolvedValue([
        {
          inventoryItemId: 'material-a',
          warehouseId: 'warehouse-production',
          zoneId: 'zone-production',
          slotId: 'P01',
          level: 'L1',
          quantity: 40,
          zone: {
            warehouseId: 'warehouse-production',
            warehouse: { code: 'PRODUCTION', name: 'Kho sản xuất' },
          },
        },
      ]),
    };
    const service = new ProductionService(
      repository as never,
      {} as never,
      inventoryRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.materialRequirements('po-ops3');

    expect(inventoryRepository.findWarehouseByCode).toHaveBeenCalledWith('PRODUCTION');
    expect(inventoryRepository.findPositiveLocationStocks).toHaveBeenCalledWith(
      ['material-a', 'material-c'],
      'warehouse-production',
      'PRODUCTION',
    );
    expect(result).toEqual([
      expect.objectContaining({
        materialId: 'material-a',
        requiredQty: 30,
        onHandQty: 40,
        reservedQty: 5,
        availableQty: 35,
        reservableQty: 15,
        issuedQty: 15,
        shortageQty: 0,
      }),
      expect.objectContaining({
        materialId: 'material-c',
        requiredQty: 10,
        onHandQty: 0,
        reservedQty: 0,
        availableQty: 0,
        reservableQty: 0,
        issuedQty: 0,
        shortageQty: 10,
      }),
    ]);
  });
});
