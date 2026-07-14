import { QcSnapshotReadService } from './qc-snapshot-read.service';

describe('QcSnapshotReadService', () => {
  it('returns repository fallback and requests a background update on miss', async () => {
    const runtime = {
      scopeKey: 'ALL',
      snapshotDate: new Date('2026-07-13T00:00:00.000Z'),
      totalInspections: 0,
      pendingCount: 0,
      inProgressCount: 0,
      passedCount: 0,
      failedCount: 0,
      reworkCount: 0,
      openIssueCount: 0,
      openNcrCount: 0,
      waitingProductionCount: 1,
      passRate: 0,
      payload: { trend: [] },
    };
    const dashboardReader = {
      read: jest.fn(async (request) => ({
        data: await request.readRuntime(),
        source: 'runtime',
        meta: {
          ageSeconds: Number.MAX_SAFE_INTEGER,
          confidence: 0,
          isStale: false,
          snapshotType: request.snapshotType,
          fallbackReason: 'missing',
        },
      })),
    };
    const dispatcher = { requestUpdate: jest.fn().mockResolvedValue({}) };
    const metrics = {
      recordQcReadModelHit: jest.fn(),
      recordQcFallback: jest.fn(),
    };
    const service = new QcSnapshotReadService(
      dashboardReader as never,
      { qcDashboard: jest.fn() } as never,
      { calculateDashboard: jest.fn().mockResolvedValue([runtime]) } as never,
      dispatcher as never,
      metrics as never,
    );

    const result = await service.dashboard(runtime.snapshotDate);

    expect(result.source).toBe('runtime');
    expect(result.data.waitingProductionCount).toBe(1);
    expect(metrics.recordQcFallback).toHaveBeenCalledTimes(1);
    expect(metrics.recordQcReadModelHit).not.toHaveBeenCalled();
    expect(dispatcher.requestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: { module: 'qc', snapshotType: 'QcDashboardSnapshot' },
        reason: 'fallback-miss',
      }),
    );
  });

  it('records a QC read hit when the snapshot strategy succeeds', async () => {
    const snapshot = {
      scopeKey: 'ALL',
      snapshotDate: new Date('2026-07-13T00:00:00.000Z'),
      totalInspections: 1,
      pendingCount: 0,
      inProgressCount: 0,
      passedCount: 1,
      failedCount: 0,
      reworkCount: 0,
      openIssueCount: 0,
      openNcrCount: 0,
      waitingProductionCount: 0,
      passRate: 100,
      payload: null,
    };
    const dashboardReader = {
      read: jest.fn(async (request) => ({
        data: request.readSnapshot(snapshot),
        source: 'snapshot',
        meta: {
          ageSeconds: 1,
          confidence: 100,
          isStale: false,
          snapshotType: request.snapshotType,
        },
      })),
    };
    const metrics = {
      recordQcReadModelHit: jest.fn(),
      recordQcFallback: jest.fn(),
    };
    const service = new QcSnapshotReadService(
      dashboardReader as never,
      {} as never,
      {} as never,
      { requestUpdate: jest.fn() } as never,
      metrics as never,
    );

    const result = await service.dashboard(snapshot.snapshotDate);

    expect(result.source).toBe('snapshot');
    expect(metrics.recordQcReadModelHit).toHaveBeenCalledTimes(1);
    expect(metrics.recordQcFallback).not.toHaveBeenCalled();
  });
});
