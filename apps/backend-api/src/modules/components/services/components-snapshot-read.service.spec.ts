import { ComponentsSnapshotReadService } from './components-snapshot-read.service';

describe('ComponentsSnapshotReadService', () => {
  it('returns the live repository fallback and enqueues a background update', async () => {
    const runtime = {
      scopeKey: 'ALL',
      snapshotDate: new Date('2026-07-12T00:00:00.000Z'),
      totalComponents: 2,
      stockCount: 1,
      producingCount: 0,
      readyCount: 1,
      shippedCount: 0,
      deliveredCount: 0,
      installedCount: 0,
      totalEstimatedCost: 20,
      totalActualCost: 18,
      payload: null,
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
    const snapshotReader = { componentsDashboard: jest.fn() };
    const snapshots = {
      calculateDashboard: jest.fn().mockResolvedValue([runtime]),
    };
    const dispatcher = { requestUpdate: jest.fn().mockResolvedValue({}) };
    const metrics = {
      recordComponentReadModelHit: jest.fn(),
      recordComponentFallback: jest.fn(),
    };
    const service = new ComponentsSnapshotReadService(
      dashboardReader as never,
      snapshotReader as never,
      snapshots as never,
      dispatcher as never,
      metrics as never,
    );

    const result = await service.dashboard(runtime.snapshotDate);

    expect(result.source).toBe('runtime');
    expect(result.data.totalComponents).toBe(2);
    expect(metrics.recordComponentFallback).toHaveBeenCalledTimes(1);
    expect(metrics.recordComponentReadModelHit).not.toHaveBeenCalled();
    expect(dispatcher.requestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: {
          module: 'components',
          snapshotType: 'ComponentDashboardSnapshot',
        },
        reason: 'fallback-miss',
      }),
    );
  });

  it('records a component read hit when the snapshot strategy succeeds', async () => {
    const snapshot = {
      scopeKey: 'ALL',
      snapshotDate: new Date('2026-07-12T00:00:00.000Z'),
      totalComponents: 1,
      stockCount: 1,
      producingCount: 0,
      readyCount: 0,
      shippedCount: 0,
      deliveredCount: 0,
      installedCount: 0,
      totalEstimatedCost: 10,
      totalActualCost: 8,
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
      recordComponentReadModelHit: jest.fn(),
      recordComponentFallback: jest.fn(),
    };
    const service = new ComponentsSnapshotReadService(
      dashboardReader as never,
      {} as never,
      {} as never,
      { requestUpdate: jest.fn() } as never,
      metrics as never,
    );

    const result = await service.dashboard(snapshot.snapshotDate);

    expect(result.source).toBe('snapshot');
    expect(metrics.recordComponentReadModelHit).toHaveBeenCalledTimes(1);
    expect(metrics.recordComponentFallback).not.toHaveBeenCalled();
  });
});
