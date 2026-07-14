import { ComponentStatus } from '@prisma/client';

import { ProductionRepository } from './production.repository';

describe('ProductionRepository staged-to-yard Outbox boundary', () => {
  it('includes the legacy production event in the Production marker transaction', async () => {
    const writes = [{ kind: 'component' }, { kind: 'timeline' }, { kind: 'log' }];
    const outboxWrite = { kind: 'outbox' };
    const prisma = {
      component: { update: jest.fn().mockReturnValue(writes[0]) },
      componentTimeline: { create: jest.fn().mockReturnValue(writes[1]) },
      productionLog: { create: jest.fn().mockReturnValue(writes[2]) },
      outboxEvent: { upsert: jest.fn().mockReturnValue(outboxWrite) },
      $transaction: jest.fn().mockResolvedValue([...writes, outboxWrite]),
    };
    const repository = new ProductionRepository(prisma as never);

    await repository.markComponentStagedFromProduction({
      componentId: 'component-1',
      componentCode: 'C-001',
      orderId: 'order-1',
      orderNo: 'PO-001',
      status: ComponentStatus.STOCK,
      floor: 'L1',
      zoneCode: 'Y-A',
      slotCode: 'S-01',
      x: 0,
      y: 0,
      stackLevel: 1,
      placementId: 'placement-1',
      slotId: 'slot-1',
      actorId: 'operator-1',
    });

    expect(prisma.outboxEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          eventName: 'production.staged.to-yard',
          idempotencyKey: 'production.staged.to-yard:placement-1',
        }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith([...writes, outboxWrite]);
  });
});
