import { BadRequestException, ConflictException } from '@nestjs/common';

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
      findTransactionByIdempotencyKey: jest.fn().mockResolvedValue(null),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
      createTransaction: jest.fn(),
      nextOperationalCode: jest.fn(),
      findWarehousesByIds: jest.fn().mockResolvedValue([
        {
          id: 'warehouse-1',
          code: 'RETURN',
          active: true,
          allowReceipt: true,
          allowIssue: false,
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

  it('rejects receipt posting when the selected warehouse lacks receipt capability', async () => {
    const repository = {
      findInboundCostLines: jest.fn().mockResolvedValue([]),
      findWarehousesByIds: jest.fn().mockResolvedValue([
        {
          id: 'warehouse-no-receipt',
          code: 'NO-RECEIPT',
          active: true,
          allowReceipt: false,
          allowIssue: true,
        },
      ]),
      transaction: jest.fn(),
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
        type: 'IMPORT',
        items: [
          {
            inventoryItemId: 'material-1',
            quantity: 5,
            warehouseId: 'warehouse-no-receipt',
            zoneId: 'zone-1',
            slotId: 'A01',
            level: 'L1',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.transaction).not.toHaveBeenCalled();
    expect(repository.createTransaction).not.toHaveBeenCalled();
  });

  it('supports multiple idempotent PURCHASE_ORDER receipts without duplicating stock', async () => {
    const tx = { transaction: true };
    const receipts = new Map<string, any>();
    let sequence = 0;
    const repository = {
      findInboundCostLines: jest.fn().mockResolvedValue([]),
      findWarehousesByIds: jest.fn().mockResolvedValue([
        {
          id: 'warehouse-main',
          code: 'MAIN',
          active: true,
          allowReceipt: true,
          allowIssue: true,
        },
      ]),
      transaction: jest.fn(async (work: (client: object) => unknown) =>
        work(tx),
      ),
      findTransactionByIdempotencyKey: jest.fn(
        async (key: string) => receipts.get(key) ?? null,
      ),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findTransactionByReference: jest.fn(),
      findItemById: jest.fn().mockResolvedValue({
        id: 'material-1',
        code: 'MAT-1',
        unit: 'kg',
        unitMaster: null,
        quantity: 0,
        updatedAt: new Date('2026-08-11T00:00:00.000Z'),
      }),
      nextOperationalCode: jest.fn(async () => `PN-${++sequence}`),
      createTransaction: jest.fn(async (data: any) => {
        const transaction = {
          id: `receipt-${sequence}`,
          code: data.code,
          transactionNo: data.transactionNo,
          type: data.type,
          direction: data.direction,
          createdAt: new Date('2026-08-11T01:00:00.000Z'),
          transactionDate: data.transactionDate,
          projectId: null,
          referenceModule: data.referenceModule,
          referenceId: data.referenceId,
          warehouseId: null,
          zoneId: null,
          idempotencyKey: data.idempotencyKey,
          commandHash: data.commandHash,
          items: [
            {
              id: `line-${sequence}`,
              inventoryItemId: 'material-1',
              quantity: data.items.create[0].quantity,
              warehouseId: 'warehouse-main',
              zoneId: 'zone-main',
              slotId: 'A01',
              level: 'L1',
            },
          ],
        };
        receipts.set(data.idempotencyKey, transaction);
        return transaction;
      }),
      updateItemQuantitySnapshot: jest.fn().mockResolvedValue({
        quantity: 40,
        updatedAt: new Date('2026-08-11T01:00:00.000Z'),
      }),
      upsertLocationStock: jest.fn().mockResolvedValue({ quantity: 40 }),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
    };
    const inventoryEvents = {
      transactionCreated: jest.fn(),
      stockBucketUpdated: jest.fn(),
      stockPosted: jest.fn(),
    };
    const service = new InventoryService(
      repository as unknown as InventoryRepository,
      {} as never,
      inventoryEvents as never,
      { emit: jest.fn() } as never,
      { append: jest.fn() } as never,
      { track: jest.fn() } as never,
    );
    const command = {
      type: 'IMPORT' as const,
      referenceModule: 'PURCHASE_ORDER',
      referenceId: 'po-1',
      items: [
        {
          inventoryItemId: 'material-1',
          quantity: 40,
          warehouseId: 'warehouse-main',
          zoneId: 'zone-main',
          slotId: 'A01',
          level: 'L1',
        },
      ],
    };

    const first = await service.createTransaction(command, 'po-1-receipt-1');
    const replay = await service.createTransaction(command, 'po-1-receipt-1');
    const second = await service.createTransaction(command, 'po-1-receipt-2');

    expect(replay.id).toBe(first.id);
    expect(second.id).not.toBe(first.id);
    expect(repository.findTransactionByReference).not.toHaveBeenCalled();
    expect(repository.createTransaction).toHaveBeenCalledTimes(2);
    expect(repository.updateItemQuantitySnapshot).toHaveBeenCalledTimes(2);
    expect(repository.upsertLocationStock).toHaveBeenCalledTimes(2);
    expect(repository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceModule: 'PURCHASE_ORDER',
        referenceId: 'po-1',
        idempotencyKey: 'inventory-command:po-1-receipt-1',
        commandHash: expect.any(String),
      }),
      tx,
    );

    await expect(
      service.createTransaction(
        {
          ...command,
          items: [{ ...command.items[0], quantity: 5 }],
        },
        'po-1-receipt-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createTransaction).toHaveBeenCalledTimes(2);
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'INVENTORY_IDEMPOTENCY_CONFLICT' }),
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
      findTransactionByIdempotencyKey: jest.fn().mockResolvedValue(null),
      findTransactionByReference: jest.fn().mockResolvedValue(existing),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createTransaction: jest.fn(),
      findWarehousesByIds: jest.fn().mockResolvedValue([
        {
          id: 'main',
          code: 'MAIN',
          active: true,
          allowReceipt: true,
          allowIssue: true,
        },
        {
          id: 'production',
          code: 'PRODUCTION',
          active: true,
          allowReceipt: true,
          allowIssue: true,
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
      findWarehousesByIds: jest.fn().mockResolvedValue([
        {
          id: 'warehouse-main',
          code: 'MAIN',
          active: true,
          allowReceipt: true,
          allowIssue: true,
        },
        {
          id: 'warehouse-production',
          code: 'PRODUCTION',
          active: true,
          allowReceipt: true,
          allowIssue: true,
        },
      ]),
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
