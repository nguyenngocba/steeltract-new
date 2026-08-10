import { ConflictException } from '@nestjs/common';

import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

describe('InventoryService multi-material foundation', () => {
  it('returns canonical location balances from InventoryLocationStock for inventory items', async () => {
    const repository = {
      findItems: jest.fn().mockResolvedValue([
        {
          id: 'material-location-1',
          code: 'MAT-LOC-1',
          name: 'Thép tấm',
          description: null,
          quantity: 100,
          minimumStock: 0,
          unit: 'kg',
          unitMaster: null,
          categoryId: null,
          category: null,
          materialTypeId: null,
          materialType: null,
          materialUsageType: 'RAW_MATERIAL',
          zoneId: null,
          zone: null,
          locationStocks: [
            {
              inventoryItemId: 'material-location-1',
              warehouseId: 'warehouse-production',
              zoneId: 'zone-production',
              slotId: 'P01',
              level: 'L1',
              quantity: 40,
              zone: {
                id: 'zone-production',
                code: 'PROD-A',
                name: 'Khu sản xuất A',
                row: 'R1',
                column: 'C1',
                warehouseId: 'warehouse-production',
                warehouse: {
                  id: 'warehouse-production',
                  code: 'PRODUCTION',
                  name: 'Kho sản xuất',
                },
              },
            },
            {
              inventoryItemId: 'material-location-1',
              warehouseId: 'warehouse-main',
              zoneId: 'zone-main',
              slotId: 'A01',
              level: 'L1',
              quantity: 60,
              zone: null,
            },
          ],
        },
      ]),
      groupTransactionItemStockByItems: jest
        .fn()
        .mockResolvedValue([
          { inventoryItemId: 'material-location-1', _sum: { quantity: 100 } },
        ]),
      findWarehousesByIds: jest.fn().mockResolvedValue([
        { id: 'warehouse-main', code: 'MAIN', name: 'Kho chính' },
        {
          id: 'warehouse-production',
          code: 'PRODUCTION',
          name: 'Kho sản xuất',
        },
      ]),
    };
    const service = new InventoryService(
      repository as unknown as InventoryRepository,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.getItems();

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'material-location-1',
        quantity: 100,
        locationBalances: expect.arrayContaining([
          expect.objectContaining({
            warehouseId: 'warehouse-production',
            warehouseCode: 'PRODUCTION',
            warehouseName: 'Kho sản xuất',
            zoneId: 'zone-production',
            zoneCode: 'PROD-A',
            slotId: 'P01',
            level: 'L1',
            quantity: 40,
          }),
          expect.objectContaining({
            warehouseId: 'warehouse-main',
            warehouseCode: 'MAIN',
            warehouseName: 'Kho chính',
            zoneId: 'zone-main',
            slotId: 'A01',
            level: 'L1',
            quantity: 60,
          }),
        ]),
      }),
    );
    expect(repository.findWarehousesByIds).toHaveBeenCalledWith([
      'warehouse-production',
      'warehouse-main',
    ]);
  });

  it('returns the existing referenced transaction without a second write', async () => {
    const existing = {
      id: 'transaction-existing',
      code: 'HT-00001',
      transactionNo: 'HT-00001',
      type: 'RETURN',
      direction: 'INBOUND',
      note: null,
      performedBy: null,
      approvedBy: null,
      projectId: null,
      supplierId: null,
      warehouseId: null,
      zoneId: null,
      transactionTypeId: null,
      remarks: null,
      transactionDate: new Date('2026-07-28T00:00:00.000Z'),
      items: [
        {
          id: 'line-existing',
          inventoryItemId: 'material-1',
          quantity: 5,
          unitId: null,
          warehouseId: 'warehouse-1',
          zoneId: 'zone-1',
          slotId: 'A01',
          level: 'L1',
          unitPrice: 0,
          totalAmount: 0,
        },
      ],
    };
    const repository = {
      findInboundCostLines: jest.fn().mockResolvedValue([]),
      transaction: jest.fn(async (work: (tx: object) => unknown) =>
        work({ transaction: true }),
      ),
      findTransactionByReference: jest.fn().mockResolvedValue(existing),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
      createTransaction: jest.fn(),
      nextOperationalCode: jest.fn(),
    };
    const service = new InventoryService(
      repository as unknown as InventoryRepository,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.createTransaction({
      type: 'RETURN',
      referenceModule: 'project-return',
      referenceId: 'return-1',
      items: [
        {
          inventoryItemId: 'material-1',
          quantity: 5,
          warehouseId: 'warehouse-1',
          zoneId: 'zone-1',
          slotId: 'A01',
          level: 'L1',
        },
      ],
    });

    expect(result).toBe(existing);
    expect(repository.findTransactionByReference).toHaveBeenCalledWith(
      {
        type: 'RETURN',
        referenceModule: 'project-return',
        referenceId: 'return-1',
      },
      { transaction: true },
    );
    expect(repository.createTransaction).not.toHaveBeenCalled();
    expect(repository.nextOperationalCode).not.toHaveBeenCalled();
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ commandHash: expect.any(String) }),
      }),
      { transaction: true },
    );
  });

  it('rejects the same durable reference with a different payload and logs it', async () => {
    const existing = {
      id: 'transaction-existing',
      code: 'DC-00001',
      transactionNo: 'DC-00001',
      type: 'TRANSFER',
      direction: 'INTERNAL',
      note: null,
      performedBy: null,
      approvedBy: null,
      projectId: null,
      supplierId: null,
      warehouseId: null,
      zoneId: null,
      transactionTypeId: null,
      remarks: '',
      transactionDate: new Date('2026-08-03T00:00:00.000Z'),
      items: [
        {
          inventoryItemId: 'material-1',
          quantity: -5,
          unitId: null,
          warehouseId: 'main',
          zoneId: 'main-zone',
          slotId: 'A01',
          level: 'L1',
          unitPrice: 0,
          totalAmount: 0,
        },
        {
          inventoryItemId: 'material-1',
          quantity: 5,
          unitId: null,
          warehouseId: 'production',
          zoneId: 'production-zone',
          slotId: 'P01',
          level: 'L1',
          unitPrice: 0,
          totalAmount: 0,
        },
      ],
    };
    const repository = {
      findInboundCostLines: jest.fn().mockResolvedValue([]),
      transaction: jest.fn(async (work: (tx: object) => unknown) =>
        work({ transaction: true }),
      ),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findTransactionByReference: jest.fn().mockResolvedValue(existing),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createTransaction: jest.fn(),
    };
    const service = new InventoryService(
      repository as unknown as InventoryRepository,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.createTransaction({
        type: 'TRANSFER',
        referenceModule: 'SYSTEM-E2E1',
        referenceId: 'reverse-transfer',
        items: [
          {
            inventoryItemId: 'material-1',
            quantity: -1,
            warehouseId: 'main',
            zoneId: 'main-zone',
            slotId: 'A01',
            level: 'L1',
          },
          {
            inventoryItemId: 'material-1',
            quantity: 1,
            warehouseId: 'production',
            zoneId: 'production-zone',
            slotId: 'P01',
            level: 'L1',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.createTransaction).not.toHaveBeenCalled();
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'INVENTORY_IDEMPOTENCY_CONFLICT' }),
    );
  });

  it('conserves quantity and posts both buckets for MAIN to PRODUCTION transfers', async () => {
    const tx = { transaction: true };
    const material = {
      id: 'material-ops3-a',
      code: 'OPS3-MAT-A',
      unit: 'kg',
      unitMaster: null,
      quantity: 100,
      updatedAt: new Date('2026-07-28T00:00:00.000Z'),
    };
    const transaction = {
      id: 'transfer-1',
      code: 'DC-00001',
      transactionNo: 'DC-00001',
      type: 'TRANSFER',
      direction: 'TRANSFER',
      createdAt: new Date('2026-07-28T01:00:00.000Z'),
      transactionDate: new Date('2026-07-28T01:00:00.000Z'),
      projectId: null,
      referenceId: null,
      referenceModule: null,
      warehouseId: 'warehouse-production',
      zoneId: 'zone-main',
      items: [
        {
          id: 'line-source',
          inventoryItemId: material.id,
          quantity: -40,
          warehouseId: 'warehouse-main',
          zoneId: 'zone-main',
          slotId: 'A01',
          level: 'L1',
        },
        {
          id: 'line-destination',
          inventoryItemId: material.id,
          quantity: 40,
          warehouseId: 'warehouse-production',
          zoneId: 'zone-production',
          slotId: 'P01',
          level: 'L1',
        },
      ],
    };
    const repository = {
      findInboundCostLines: jest
        .fn()
        .mockResolvedValue([
          {
            inventoryItemId: material.id,
            quantity: 100,
            unitPrice: 10,
            totalAmount: 1000,
          },
        ]),
      transaction: jest.fn(async (work: (client: object) => unknown) =>
        work(tx),
      ),
      findItemById: jest.fn().mockResolvedValue(material),
      findLocationStockBucket: jest.fn().mockResolvedValue({ quantity: 100 }),
      nextOperationalCode: jest.fn().mockResolvedValue('DC-00001'),
      createTransaction: jest.fn().mockResolvedValue(transaction),
      updateItemQuantitySnapshot: jest.fn(),
      upsertLocationStock: jest
        .fn()
        .mockResolvedValueOnce({ quantity: 60 })
        .mockResolvedValueOnce({ quantity: 40 }),
    };
    const inventoryEvents = {
      transactionCreated: jest.fn(),
      stockBucketUpdated: jest.fn(),
      transferred: jest.fn(),
    };
    const service = new InventoryService(
      repository as unknown as InventoryRepository,
      {} as never,
      inventoryEvents as never,
      { emit: jest.fn() } as never,
      { append: jest.fn() } as never,
      { track: jest.fn() } as never,
    );

    await service.createTransaction({
      type: 'TRANSFER',
      warehouseId: 'warehouse-production',
      items: [
        {
          inventoryItemId: material.id,
          quantity: -40,
          warehouseId: 'warehouse-main',
          zoneId: 'zone-main',
          slotId: 'A01',
          level: 'L1',
        },
        {
          inventoryItemId: material.id,
          quantity: 40,
          warehouseId: 'warehouse-production',
          zoneId: 'zone-production',
          slotId: 'P01',
          level: 'L1',
        },
      ],
    });

    expect(repository.updateItemQuantitySnapshot).not.toHaveBeenCalled();
    expect(repository.upsertLocationStock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        inventoryItemId: material.id,
        warehouseId: 'warehouse-main',
        zoneId: 'zone-main',
        quantity: -40,
      }),
      tx,
    );
    expect(repository.upsertLocationStock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        inventoryItemId: material.id,
        warehouseId: 'warehouse-production',
        zoneId: 'zone-production',
        quantity: 40,
      }),
      tx,
    );
    expect(inventoryEvents.transferred).toHaveBeenCalledWith(
      expect.objectContaining({
        materialId: material.id,
        quantity: 40,
        resultingStock: 100,
        source: expect.objectContaining({ resultingBalance: 60 }),
        destination: expect.objectContaining({ resultingBalance: 40 }),
      }),
      tx,
    );
  });
});
