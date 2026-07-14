import { productionMaterialEvents } from '../domain/production-material-contracts';
import { ProductionMaterialLedgerRepository } from '../repositories/production-material-ledger.repository';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';

describe('ProductionMaterialLedgerService material events', () => {
  it('writes the canonical event through the supplied transaction client', async () => {
    const repository = {
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
        quantity: 12,
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
          'production.material.issued:issue-1:2026-07-11T01:00:00.000Z',
        payload: expect.objectContaining({
          productionOrderId: 'order-1',
          materialIssueId: 'issue-1',
          inventoryItemId: 'material-1',
          quantity: 12,
        }),
      }),
      tx,
    );
  });
});
