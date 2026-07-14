import { SnapshotWriterService } from './snapshot-writer.service';

describe('SnapshotWriterService QC routing', () => {
  it('writes dashboard and inspection snapshots in one background transaction', async () => {
    const tx = { id: 'qc-snapshot-tx' };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const metrics = {
      recordSnapshotRebuild: jest.fn(),
      recordSnapshotLag: jest.fn(),
    };
    const qc = {
      calculateDashboard: jest.fn().mockResolvedValue([{ scopeKey: 'ALL' }]),
      calculateInspectionSnapshots: jest
        .fn()
        .mockResolvedValue([{ inspectionId: 'inspection-1' }]),
      upsertDashboard: jest.fn().mockResolvedValue({}),
      upsertInspection: jest.fn().mockResolvedValue({}),
    };
    const service = new SnapshotWriterService(
      prisma as never,
      metrics as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      qc as never,
    );

    const result = await service.rebuild({
      scope: {
        module: 'qc',
        snapshotType: 'QcInspectionSnapshot',
        inspectionId: 'inspection-1',
      },
      reason: 'domain-event',
    });

    expect(qc.calculateInspectionSnapshots).toHaveBeenCalledWith(
      'inspection-1',
    );
    expect(qc.upsertDashboard).toHaveBeenCalledWith({ scopeKey: 'ALL' }, tx);
    expect(qc.upsertInspection).toHaveBeenCalledWith(
      { inspectionId: 'inspection-1' },
      tx,
    );
    expect(result).toEqual(
      expect.objectContaining({
        module: 'qc',
        scopeId: 'inspection-1',
        rowsRead: 2,
        rowsWritten: 2,
      }),
    );
  });
});
