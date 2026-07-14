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
});
