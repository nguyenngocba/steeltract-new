import { ProductionConsumptionRepository } from '../repositories/production-consumption.repository';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';
import { ProductionConsumptionService } from './production-consumption.service';

describe('ProductionConsumptionService material flow', () => {
  it('writes consumed-only ledger and canonical event in one transaction', async () => {
    const tx = { marker: 'shared-transaction' } as never;
    const createdAt = new Date('2026-07-11T02:00:00.000Z');
    const repository = {
      findOrderForConsumption: jest.fn().mockResolvedValue({
        id: 'order-1',
        orderNo: 'PO-001',
        status: 'IN_PROGRESS',
      }),
      findIssuesForConsumption: jest.fn().mockResolvedValue([
        {
          inventoryItemId: 'material-1',
          warehouseId: 'warehouse-production',
          zoneId: 'zone-1',
          slotId: 'A01',
          level: 'L1',
          issuedQty: 10,
          returnedQty: 0,
        },
      ]),
      findConsumptionsForMaterial: jest.fn().mockResolvedValue([]),
      transaction: jest.fn((callback) => callback(tx)),
      create: jest.fn().mockResolvedValue({
        id: 'consumption-1',
        productionOrderId: 'order-1',
        inventoryItemId: 'material-1',
        consumedQty: 6,
        scrapQty: 2,
        createdAt,
      }),
    } as unknown as ProductionConsumptionRepository;
    const ledger = {
      createReservationEntries: jest.fn().mockResolvedValue({ count: 1 }),
      createMaterialEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    } as unknown as ProductionMaterialLedgerService;
    const service = new ProductionConsumptionService(
      repository,
      {
        findItemById: jest
          .fn()
          .mockResolvedValue({ code: 'MAT-1', unit: 'kg', unitMaster: null }),
      } as never,
      ledger,
    );

    await service.consume(
      'order-1',
      {
        inventoryItemId: 'material-1',
        consumedQty: 6,
        scrapQty: 2,
      },
      'operator-1',
    );

    expect(ledger.createReservationEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: [expect.objectContaining({ quantity: 6 })],
      }),
      tx,
    );
    expect(ledger.createMaterialEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'production.material.consumed',
        quantity: 6,
        unit: 'kg',
        consumptionId: 'consumption-1',
      }),
      tx,
    );
  });
});
