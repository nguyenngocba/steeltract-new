import { QcInspectionStatus } from '@prisma/client';

import { QcService } from './qc.service';

describe('QcService repository and Outbox boundary', () => {
  it('writes inspection transition, audit and domain Outbox through one tx', async () => {
    const tx = { marker: 'qc-tx' };
    const existing = {
      id: 'inspection-1',
      inspectionNo: 'QC-001',
      status: QcInspectionStatus.READY,
      startedAt: null,
      inspectorId: null,
      metadata: null,
    };
    const updated = {
      ...existing,
      status: QcInspectionStatus.IN_PROGRESS,
      startedAt: new Date('2026-07-13T00:00:00.000Z'),
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findInspectionById: jest.fn().mockResolvedValue(existing),
      updateInspection: jest.fn().mockResolvedValue(updated),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn().mockResolvedValue({}),
    };
    const service = new QcService(
      repository as never,
      {} as never,
      { link: jest.fn() } as never,
      {} as never,
    );

    const result = await service.startInspection(
      existing.id,
      {},
      'operator-1',
    );

    expect(result).toBe(updated);
    expect(repository.updateInspection).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({ status: QcInspectionStatus.IN_PROGRESS }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'QC_INSPECTION_STARTED' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledTimes(2);
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'audit.activity.created' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'qc.inspection.started' }),
      tx,
    );
  });

  it('publishes the canonical inspection fact and AD-019 envelope', async () => {
    const tx = { marker: 'qc-tx' };
    const repository = {
      createOutboxEvent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    const service = new QcService(
      repository as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const completedAt = new Date('2026-07-17T02:00:00.000Z');

    await (service as any).createQcOutboxEvent(
      tx,
      'qc.inspection.completed',
      {
        id: 'inspection-1',
        productionOrderId: 'order-1',
        componentId: null,
        projectId: null,
        status: QcInspectionStatus.PASSED,
        inspectorId: 'inspector-1',
        completedAt,
        updatedAt: completedAt,
      },
      'operator-1',
    );

    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'qc.inspection.completed',
        payload: expect.objectContaining({
          inspectionId: 'inspection-1',
          subjectType: 'PRODUCTION_ORDER',
          subjectId: 'order-1',
          result: QcInspectionStatus.PASSED,
          completedAt: completedAt.toISOString(),
        }),
        metadata: expect.objectContaining({
          eventVersion: 1,
          producer: 'qc',
          aggregateId: 'inspection-1',
          orderingKey: 'qc-inspection:inspection-1',
        }),
      }),
      tx,
    );
  });
});
