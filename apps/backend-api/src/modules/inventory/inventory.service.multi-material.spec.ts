import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

describe('InventoryService multi-material foundation', () => {
  it('returns the existing referenced transaction without a second write', async () => {
    const existing = {
      id: 'transaction-existing',
      code: 'HT-00001',
      transactionNo: 'HT-00001',
      type: 'RETURN',
      items: [{ id: 'line-existing', inventoryItemId: 'material-1' }],
    };
    const repository = {
      findInboundCostLines: jest.fn().mockResolvedValue([]),
      transaction: jest.fn(async (work: (tx: object) => unknown) =>
        work({ transaction: true }),
      ),
      findTransactionByReference: jest.fn().mockResolvedValue(existing),
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
  });
});
