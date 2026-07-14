import { MaterialIssueRepository } from '../repositories/material-issue.repository';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';
import { MaterialIssueService } from './material-issue.service';

describe('MaterialIssueService atomic material flow', () => {
  it('posts Inventory, writes Production ledger, and writes Outbox in one transaction', async () => {
    const tx = { marker: 'shared-transaction' } as never;
    const issue = {
      id: 'issue-1',
      issueNo: 'ISS-001',
      productionOrderId: 'order-1',
      reservationId: 'reservation-1',
      reservationLineId: 'line-1',
      inventoryItemId: 'material-1',
      warehouseId: 'warehouse-production',
      zoneId: 'zone-1',
      slotId: 'A01',
      level: 'L1',
      issuedQty: 10,
      issuedBy: 'operator-1',
      issuedDate: new Date('2026-07-11T01:00:00.000Z'),
      status: 'ISSUED',
      remarks: 'Issue material',
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      nextIssueNo: jest.fn().mockResolvedValue('ISS-001'),
      createIssueInTransaction: jest.fn().mockResolvedValue(issue),
    } as unknown as MaterialIssueRepository;
    const inventoryPosting = {
      issueMaterial: jest.fn().mockResolvedValue({ id: 'inventory-tx-1' }),
    };
    const ledger = {
      createReservationEntries: jest.fn().mockResolvedValue({ count: 1 }),
      createMaterialEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    } as unknown as ProductionMaterialLedgerService;
    const service = new MaterialIssueService(
      repository,
      inventoryPosting as never,
      {} as never,
      ledger,
    );

    await service.create(
      {
        productionOrderId: 'order-1',
        reservationId: 'reservation-1',
        reservationLineId: 'line-1',
        inventoryItemId: 'material-1',
        warehouseId: 'warehouse-production',
        zoneId: 'zone-1',
        slotId: 'A01',
        level: 'L1',
        issuedQty: 10,
        issuedDate: issue.issuedDate,
        status: 'ISSUED',
        remarks: 'Issue material',
      },
      'operator-1',
    );

    expect(inventoryPosting.issueMaterial).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: 'issue-1' }),
      tx,
    );
    expect(ledger.createReservationEntries).toHaveBeenCalledWith(
      expect.objectContaining({ productionOrderId: 'order-1' }),
      tx,
    );
    expect(ledger.createMaterialEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'production.material.issued',
        materialIssueId: 'issue-1',
      }),
      tx,
    );
  });
});
