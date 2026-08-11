import { BadRequestException, ConflictException } from '@nestjs/common';

import { DictionariesService } from './dictionaries.service';

function countDelegate(value = 0) {
  return { count: jest.fn().mockResolvedValue(value) };
}

describe('DictionariesService Warehouse Master', () => {
  const eventBus = {
    emit: jest.fn().mockResolvedValue(undefined),
    emitAudit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates a warehouse with a canonical type and capability fields', async () => {
    const created = {
      id: 'warehouse-1',
      code: 'WH-01',
      name: 'Warehouse 01',
      allowReceipt: true,
    };
    const prisma = {
      masterWarehouseType: {
        findFirst: jest.fn().mockResolvedValue({ id: 'type-main' }),
      },
      masterWarehouse: {
        create: jest.fn().mockResolvedValue(created),
      },
    };
    const service = new DictionariesService(prisma as never, eventBus as never);

    await expect(
      service.create('warehouses', {
        code: 'WH-01',
        name: 'Warehouse 01',
        warehouseTypeId: 'type-main',
        allowReceipt: true,
        active: true,
      }),
    ).resolves.toEqual(created);

    expect(prisma.masterWarehouse.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: 'WH-01',
          allowReceipt: true,
          warehouseType: { connect: { id: 'type-main' } },
        }),
      }),
    );
  });

  it('rejects warehouse creation without an active warehouse type', async () => {
    const prisma = {
      masterWarehouseType: { findFirst: jest.fn() },
      masterWarehouse: { create: jest.fn() },
    };
    const service = new DictionariesService(prisma as never, eventBus as never);

    await expect(
      service.create('warehouses', {
        code: 'WH-01',
        name: 'Warehouse 01',
        active: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.masterWarehouse.create).not.toHaveBeenCalled();
  });

  it('blocks deactivation when canonical dependencies remain', async () => {
    const prisma = {
      masterWarehouse: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'warehouse-1',
          code: 'WH-01',
          name: 'Warehouse 01',
        }),
        update: jest.fn(),
      },
      warehouseZone: countDelegate(1),
      inventoryLocationStock: countDelegate(),
      productionMaterialReservationLine: countDelegate(),
      productionMaterialLedger: countDelegate(),
      productionMaterialIssue: countDelegate(),
      inventoryTransaction: countDelegate(),
      inventoryDashboardSnapshot: countDelegate(),
      inventoryMaterialSnapshot: countDelegate(),
      inventoryLocationSnapshot: countDelegate(),
    };
    const service = new DictionariesService(prisma as never, eventBus as never);

    await expect(
      service.update('warehouses', 'warehouse-1', { active: false }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.masterWarehouse.update).not.toHaveBeenCalled();
  });
});
