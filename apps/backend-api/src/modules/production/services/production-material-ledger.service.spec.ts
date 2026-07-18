import { productionMaterialEvents } from '../domain/production-material-contracts';
import { ProductionMaterialLedgerRepository } from '../repositories/production-material-ledger.repository';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';

describe('ProductionMaterialLedgerService material events', () => {
  it('writes the canonical event through the supplied transaction client', async () => {
    const repository = {
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      createProductionLog: jest.fn().mockResolvedValue({ id: 'log-1' }),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    } as unknown as ProductionMaterialLedgerRepository;
    const service = new ProductionMaterialLedgerService(repository);
    const tx = { marker: 'shared-transaction' } as never;

    await service.createMaterialEvent(
      {
        eventName: productionMaterialEvents.issued,
        productionOrderId: 'order-1',
        reservationId: 'reservation-1',
        materialIssueId: 'issue-1',
        inventoryItemId: 'material-1',
        inventoryTransactionId: 'inventory-transaction-1',
        quantity: 12,
        unit: 'kg',
        actorId: 'operator-1',
        occurredAt: new Date('2026-07-11T01:00:00.000Z'),
        sourceVersion: '2026-07-11T01:00:00.000Z',
      },
      tx,
    );

    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: productionMaterialEvents.issued,
        idempotencyKey:
          'production.material.issued:issue-1:material-1:2026-07-11T01:00:00.000Z',
        maxRetries: 10,
        payload: expect.objectContaining({
          productionOrderId: 'order-1',
          materialIssueId: 'issue-1',
          inventoryItemId: 'material-1',
          quantity: 12,
          unit: 'kg',
          inventoryTransactionId: 'inventory-transaction-1',
          state: 'ISSUED',
          aggregateVersion: new Date('2026-07-11T01:00:00.000Z').getTime(),
        }),
        metadata: expect.objectContaining({
          eventVersion: 1,
          producer: 'production',
          aggregateVersion: new Date('2026-07-11T01:00:00.000Z').getTime(),
          orderingKey: 'production-order:order-1:material:material-1',
        }),
      }),
      tx,
    );
    expect(repository.createProductionLog).toHaveBeenCalledWith(
      expect.objectContaining({
        productionOrderId: 'order-1',
        message: productionMaterialEvents.issued,
      }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: productionMaterialEvents.issued,
        module: 'production',
      }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledTimes(2);
  });

  it('replays an existing canonical event without duplicating timeline or audit', async () => {
    const existing = { id: 'outbox-existing' };
    const repository = {
      findOutboxEvent: jest.fn().mockResolvedValue(existing),
      createProductionLog: jest.fn(),
      createActivityLog: jest.fn(),
      createOutboxEvent: jest.fn(),
    } as unknown as ProductionMaterialLedgerRepository;
    const service = new ProductionMaterialLedgerService(repository);

    const result = await service.createMaterialEvent(
      {
        eventName: productionMaterialEvents.consumed,
        productionOrderId: 'order-1',
        consumptionId: 'consumption-1',
        inventoryItemId: 'material-1',
        quantity: 4,
        unit: 'kg',
        sourceVersion: 'v1',
      },
      { marker: 'shared-transaction' } as never,
    );

    expect(result).toBe(existing);
    expect(repository.createProductionLog).not.toHaveBeenCalled();
    expect(repository.createActivityLog).not.toHaveBeenCalled();
    expect(repository.createOutboxEvent).not.toHaveBeenCalled();
  });
});
