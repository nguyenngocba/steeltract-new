import { ProductionReservationRepository } from '../repositories/production-reservation.repository';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';
import { ProductionReservationService } from './production-reservation.service';

describe('ProductionReservationService draft semantics', () => {
  it('creates demand only and does not write ledger or Outbox in Draft', async () => {
    const order = {
      id: 'order-1',
      orderNo: 'PO-001',
      bomId: 'bom-1',
      quantity: 1,
      bom: {
        items: [
          {
            id: 'bom-line-1',
            materialId: 'material-1',
            quantity: 10,
            wastePercent: 0,
            material: { code: 'MAT-1', name: 'Material', unitMaster: null },
          },
        ],
      },
    };
    const repository = {
      findOrderWithBom: jest.fn().mockResolvedValue(order),
      nextReservationNo: jest.fn().mockResolvedValue('RSV-001'),
      create: jest.fn().mockResolvedValue({ id: 'reservation-1' }),
    } as unknown as ProductionReservationRepository;
    const ledger = {
      createReservationEntries: jest.fn(),
      createMaterialEvent: jest.fn(),
    } as unknown as ProductionMaterialLedgerService;
    const service = new ProductionReservationService(
      repository,
      {} as never,
      ledger,
    );

    await service.create('order-1', { autoReserve: false }, 'operator-1');

    expect(repository.create).toHaveBeenCalled();
    expect(ledger.createReservationEntries).not.toHaveBeenCalled();
    expect(ledger.createMaterialEvent).not.toHaveBeenCalled();
  });
});
