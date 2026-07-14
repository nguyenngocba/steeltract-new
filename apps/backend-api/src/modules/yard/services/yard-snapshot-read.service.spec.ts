import { YardSnapshotReadService } from './yard-snapshot-read.service';

describe('YardSnapshotReadService', () => {
  it('falls back to the live repository model and enqueues a background update', async () => {
    const live = {
      zones: [],
      slots: [],
      movements: [],
      cranes: [],
      qcQueue: [],
      meta: {},
      summary: {
        zones: 1,
        totalSlots: 2,
        occupiedSlots: 1,
        availableSlots: 1,
        placements: 1,
        totalWeight: 2.5,
        movementsToday: 1,
        overloadedZones: 0,
      },
      analytics: {
        movementCounts: { place: 1, move: 1, remove: 1, adjust: 0 },
        movementMonth: 3,
        craneAvailableCount: 0,
        zoneUtilization: [],
      },
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
      recordYardFallback: jest.fn(),
      recordYardReadModelHit: jest.fn(),
    };
    const service = new YardSnapshotReadService(
      dashboardReader as never,
      { yardDashboard: jest.fn() } as never,
      { workspace: jest.fn().mockResolvedValue(live) } as never,
      dispatcher as never,
      metrics as never,
    );

    const result = await service.dashboard(new Date('2026-07-13'));

    expect(result.source).toBe('runtime');
    expect(result.data.totalSlots).toBe(2);
    expect(dispatcher.requestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: expect.objectContaining({ module: 'yard' }),
        reason: 'fallback-miss',
      }),
    );
    expect(metrics.recordYardFallback).toHaveBeenCalledTimes(1);
  });
});
