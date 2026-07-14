import { BadRequestException } from '@nestjs/common';

import { InventoryPostingService } from './inventory-posting.service';
import { InventoryRepository } from './inventory.repository';

describe('InventoryPostingService', () => {
  const tx = { transaction: true };

  function setup(stock = 10) {
    const repository = {
      findInboundCostLines: jest.fn().mockResolvedValue([
        {
          inventoryItemId: 'material-1',
          quantity: 10,
          unitPrice: 20,
          totalAmount: 200,
        },
      ]),
      findItemById: jest.fn().mockResolvedValue({ id: 'material-1', code: 'M1' }),
      findLocationStockBucket: jest.fn().mockResolvedValue({ quantity: stock }),
      nextOperationalCode: jest.fn().mockResolvedValue('XK-00001'),
      createTransaction: jest.fn().mockResolvedValue({
        id: 'transaction-1',
        code: 'XK-00001',
        transactionNo: 'XK-00001',
        type: 'EXPORT',
        referenceId: 'issue-1',
        items: [{ id: 'line-1' }],
      }),
      updateItemQuantitySnapshot: jest.fn().mockResolvedValue(undefined),
      upsertLocationStock: jest.fn().mockResolvedValue(undefined),
      createOutboxEvent: jest.fn().mockResolvedValue(undefined),
    };

    return {
      repository,
      service: new InventoryPostingService(
        repository as unknown as InventoryRepository,
      ),
    };
  }

  it('posts issue stock, transaction and outbox through the supplied transaction', async () => {
    const { repository, service } = setup();

    await service.issueMaterial(
      {
        referenceModule: 'production_material_issue',
        referenceId: 'issue-1',
        lines: [
          {
            inventoryItemId: 'material-1',
            quantity: 4,
            warehouseId: 'warehouse-1',
            zoneId: 'zone-1',
            slotId: 'A01',
            level: 'L1',
          },
        ],
      },
      tx as never,
    );

    expect(repository.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'EXPORT', direction: 'OUT' }),
      tx,
    );
    expect(repository.updateItemQuantitySnapshot).toHaveBeenCalledWith(
      'material-1',
      -4,
      tx,
    );
    expect(repository.upsertLocationStock).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: -4 }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledTimes(2);
  });

  it('rejects issue before any write when the exact location is insufficient', async () => {
    const { repository, service } = setup(2);

    await expect(
      service.issueMaterial(
        {
          referenceModule: 'production_material_issue',
          referenceId: 'issue-1',
          lines: [
            {
              inventoryItemId: 'material-1',
              quantity: 4,
              warehouseId: 'warehouse-1',
              zoneId: 'zone-1',
              slotId: 'A01',
              level: 'L1',
            },
          ],
        },
        tx as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.createTransaction).not.toHaveBeenCalled();
    expect(repository.createOutboxEvent).not.toHaveBeenCalled();
  });

  it('validates duplicate issue lines against their aggregate bucket quantity', async () => {
    const { repository, service } = setup(10);

    await expect(
      service.issueMaterial(
        {
          referenceModule: 'production_material_issue',
          referenceId: 'issue-1',
          lines: [
            {
              inventoryItemId: 'material-1',
              quantity: 6,
              warehouseId: 'warehouse-1',
              zoneId: 'zone-1',
              slotId: 'A01',
              level: 'L1',
            },
            {
              inventoryItemId: 'material-1',
              quantity: 6,
              warehouseId: 'warehouse-1',
              zoneId: 'zone-1',
              slotId: 'A01',
              level: 'L1',
            },
          ],
        },
        tx as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.findLocationStockBucket).toHaveBeenCalledTimes(1);
    expect(repository.createTransaction).not.toHaveBeenCalled();
  });

  it('coalesces duplicate bucket and material updates after persisting every line', async () => {
    const { repository, service } = setup(20);

    await service.issueMaterial(
      {
        referenceModule: 'production_material_issue',
        referenceId: 'issue-1',
        lines: [
          {
            inventoryItemId: 'material-1',
            quantity: 6,
            warehouseId: 'warehouse-1',
            zoneId: 'zone-1',
            slotId: 'A01',
            level: 'L1',
          },
          {
            inventoryItemId: 'material-1',
            quantity: 4,
            warehouseId: 'warehouse-1',
            zoneId: 'zone-1',
            slotId: 'A01',
            level: 'L1',
          },
        ],
      },
      tx as never,
    );

    expect(repository.updateItemQuantitySnapshot).toHaveBeenCalledTimes(1);
    expect(repository.updateItemQuantitySnapshot).toHaveBeenCalledWith(
      'material-1',
      -10,
      tx,
    );
    expect(repository.upsertLocationStock).toHaveBeenCalledTimes(1);
    expect(repository.upsertLocationStock).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: -10 }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledTimes(2);
  });
});
