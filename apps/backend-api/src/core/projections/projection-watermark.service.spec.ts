import {
  HistoricalDashboardModule,
  OutboxEventStatus,
} from '@prisma/client';

import { ProjectionWatermarkService } from './projection-watermark.service';

describe('ProjectionWatermarkService', () => {
  const repository = {
    latestOutboxEvent: jest.fn(),
    checkpoints: jest.fn(),
    activeFailureCounts: jest.fn(),
    documentCounts: jest.fn(),
    latestCheckpointReceipts: jest.fn(),
  };
  const registry = { names: jest.fn().mockReturnValue(['LocationBalance']) };

  beforeEach(() => jest.clearAllMocks());

  it('uses dispatched business event identity and aggregate version as watermark', async () => {
    repository.latestOutboxEvent.mockResolvedValue({
      id: 'event-10',
      status: OutboxEventStatus.DISPATCHED,
      metadata: { aggregateVersion: 7 },
      payload: {},
      createdAt: new Date('2026-08-11T01:00:00.000Z'),
      dispatchedAt: new Date('2026-08-11T01:00:01.000Z'),
    });
    const service = new ProjectionWatermarkService(
      repository as never,
      registry as never,
    );

    await expect(
      service.forModule(HistoricalDashboardModule.INVENTORY),
    ).resolves.toEqual(
      expect.objectContaining({
        lastEventId: 'event-10',
        lastAggregateVersion: '7',
        status: 'HEALTHY',
        fresh: true,
        lagMs: 1_000,
      }),
    );
  });

  it('marks a snapshot stale when current event watermark advanced', async () => {
    repository.latestOutboxEvent.mockResolvedValue({
      id: 'event-11',
      status: OutboxEventStatus.DISPATCHED,
      metadata: { aggregateVersion: 8 },
      payload: {},
      createdAt: new Date(),
      dispatchedAt: new Date(),
    });
    const service = new ProjectionWatermarkService(
      repository as never,
      registry as never,
    );

    await expect(
      service.evaluateSnapshot({
        module: HistoricalDashboardModule.INVENTORY,
        sourceWatermark: 'event-10',
        generatedAt: new Date(Date.now() - 1_000),
        metadata: {
          projectionWatermark: { lastEventId: 'event-10' },
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        authoritative: false,
        fresh: false,
        stale: true,
        parity: false,
        status: 'LAGGING',
      }),
    );
  });

  it('exposes canonical health fields for every registered projection', async () => {
    repository.checkpoints.mockResolvedValue([
      {
        projectionName: 'LocationBalance',
        schemaVersion: 1,
        lastOutboxEventId: 'event-10',
        processedCount: 2,
        failedCount: 0,
        lagMs: 15,
        status: 'HEALTHY',
        lastProcessedAt: new Date('2026-08-11T01:00:01.000Z'),
        lastError: null,
      },
    ]);
    repository.activeFailureCounts.mockResolvedValue([]);
    repository.documentCounts.mockResolvedValue([
      { projectionName: 'LocationBalance', _count: { _all: 1 } },
    ]);
    repository.latestCheckpointReceipts.mockResolvedValue([
      { projectionName: 'LocationBalance', aggregateVersion: 7n },
    ]);
    const service = new ProjectionWatermarkService(
      repository as never,
      registry as never,
    );

    await expect(service.health()).resolves.toEqual([
      expect.objectContaining({
        projectionName: 'LocationBalance',
        status: 'HEALTHY',
        lastEventId: 'event-10',
        lastAggregateVersion: '7',
        lastProcessedAt: new Date('2026-08-11T01:00:01.000Z'),
      }),
    ]);
  });
});
