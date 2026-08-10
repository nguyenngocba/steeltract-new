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
      {
        workspace: jest.fn().mockResolvedValue(live),
        latestDashboardMutationAt: jest.fn().mockResolvedValue(null),
      } as never,
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

  it('rejects a snapshot whose Yard source watermark is newer', async () => {
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
        movementCounts: { place: 1, move: 0, remove: 0, adjust: 0 },
        movementMonth: 1,
        craneAvailableCount: 0,
        zoneUtilization: [],
      },
    };
    const snapshot = {
      scopeKey: 'ALL',
      snapshotDate: new Date('2026-08-10T00:00:00Z'),
      updatedAt: new Date('2026-08-10T01:00:00Z'),
      totalZones: 1,
      totalSlots: 2,
      occupiedSlots: 0,
      availableSlots: 2,
      activePlacementCount: 0,
      totalWeight: 0,
      movementToday: 0,
      movementMonth: 0,
      overloadedZoneCount: 0,
      craneCount: 0,
      availableCraneCount: 0,
      payload: null,
    };
    const dashboardReader = {
      read: jest.fn(async (request) => {
        const envelope = await request.loadSnapshot();
        return envelope
          ? {
              data: request.readSnapshot(envelope.data),
              source: 'snapshot',
              meta: {},
            }
          : {
              data: await request.readRuntime(),
              source: 'runtime',
              meta: { fallbackReason: 'missing' },
            };
      }),
    };
    const dispatcher = { requestUpdate: jest.fn().mockResolvedValue({}) };
    const service = new YardSnapshotReadService(
      dashboardReader as never,
      { yardDashboard: jest.fn().mockResolvedValue(snapshot) } as never,
      {
        workspace: jest.fn().mockResolvedValue(live),
        latestDashboardMutationAt: jest
          .fn()
          .mockResolvedValue(new Date('2026-08-10T01:00:01Z')),
      } as never,
      dispatcher as never,
      {
        recordYardFallback: jest.fn(),
        recordYardReadModelHit: jest.fn(),
      } as never,
    );

    const result = await service.dashboard(new Date('2026-08-10'));

    expect(result.source).toBe('runtime');
    expect(result.data.activePlacementCount).toBe(1);
    expect(dispatcher.requestUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'fallback-miss' }),
    );
  });
});
