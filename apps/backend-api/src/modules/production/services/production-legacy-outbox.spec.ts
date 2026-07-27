import {
  ProductionOrderStatus,
  ProductionStageCode,
  ProductionStageStatus,
} from '@prisma/client';

import { ProductionService } from './production.service';

describe('ProductionService legacy stage Outbox boundary', () => {
  it('writes production.stage.completed inside the stage transaction', async () => {
    const tx = { marker: 'production-stage-tx' };
    const stage = {
      id: 'stage-1',
      productionOrderId: 'order-1',
      sequence: 1,
      code: ProductionStageCode.CUTTING,
    };
    const nextStage = {
      id: 'stage-2',
      productionOrderId: 'order-1',
      sequence: 2,
      code: ProductionStageCode.ASSEMBLY,
      startedAt: null,
    };
    const order = {
      id: 'order-1',
      orderNo: 'PO-001',
      status: ProductionOrderStatus.IN_PROGRESS,
      currentStageCode: ProductionStageCode.CUTTING,
      componentId: null,
      projectId: null,
      updatedAt: new Date('2026-07-13T00:00:00.000Z'),
      stages: [stage, nextStage],
    };
    const updated = {
      ...order,
      currentStageCode: ProductionStageCode.ASSEMBLY,
      updatedAt: new Date('2026-07-13T00:01:00.000Z'),
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findStageById: jest.fn().mockResolvedValue(stage),
      findOrderById: jest.fn().mockResolvedValue(order),
      updateStage: jest.fn().mockResolvedValue({}),
      updateOrder: jest.fn().mockResolvedValue(updated),
      createLog: jest.fn().mockResolvedValue({}),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    const service = new ProductionService(
      repository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.completeStage(stage.id, {
      attachmentIds: [],
      qualityStatus: 'PASS',
    });

    expect(repository.updateStage).toHaveBeenCalledWith(
      stage.id,
      expect.objectContaining({ status: ProductionStageStatus.COMPLETED }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'production.stage.completed' }),
      tx,
    );
  });
});
