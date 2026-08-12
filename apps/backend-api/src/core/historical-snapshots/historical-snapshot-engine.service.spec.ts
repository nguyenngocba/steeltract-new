import {
  HistoricalDashboardModule,
  SnapshotFrequency,
  SnapshotJobStatus,
  SnapshotJobType,
  SnapshotReadinessStatus,
} from '@prisma/client';

import { HistoricalSnapshotEngineService } from './historical-snapshot-engine.service';

describe('HistoricalSnapshotEngineService', () => {
  const watermarks = () => ({
    forModule: jest.fn().mockResolvedValue({
      lastEventId: 'event-1',
      lastAggregateVersion: '3',
      lastProcessedAt: new Date('2026-07-22T09:59:00.000Z'),
      sourceOccurredAt: new Date('2026-07-22T09:58:00.000Z'),
      status: 'HEALTHY',
      fresh: true,
      lagMs: 60_000,
    }),
  });
  const prisma = () => {
    const client = {
      $executeRaw: jest.fn(),
      snapshotMetadata: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      snapshotJob: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    } as any;
    client.$transaction = jest.fn((callback: (tx: typeof client) => unknown) =>
      callback(client),
    );
    return client;
  };

  it('schedules a daily snapshot from stale SnapshotMetadata', async () => {
    const client = prisma() as any;
    client.snapshotMetadata.findMany.mockResolvedValue([
      {
        module: HistoricalDashboardModule.INVENTORY,
        snapshotType: 'dashboard_daily',
        frequency: SnapshotFrequency.DAILY,
        lastSuccessfulSnapshotDate: new Date('2026-07-20T00:00:00.000Z'),
      },
    ]);
    client.snapshotJob.findMany.mockResolvedValue([]);
    client.snapshotJob.create.mockResolvedValue({ id: 'job-1' });
    const service = new HistoricalSnapshotEngineService(client, watermarks() as any);

    const scheduled = await service.scheduleDueJobs(
      new Date('2026-07-22T10:00:00.000Z'),
    );

    expect(scheduled).toBe(1);
    expect(client.snapshotJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        jobType: SnapshotJobType.DAILY_SNAPSHOT,
        module: HistoricalDashboardModule.INVENTORY,
        scopeKey: 'ALL',
        snapshotDate: new Date('2026-07-22T00:00:00.000Z'),
        metadata: expect.objectContaining({
          identityKey:
            'DAILY_SNAPSHOT|INVENTORY|ALL|dashboard_daily|2026-07-22|||event-1',
          snapshotType: 'dashboard_daily',
          scheduledBy: 'SnapshotMetadata',
        }),
      }),
    });
  });

  it('does not schedule a duplicate active snapshot job', async () => {
    const client = prisma() as any;
    client.snapshotMetadata.findMany.mockResolvedValue([
      {
        module: HistoricalDashboardModule.QC,
        snapshotType: 'dashboard_daily',
        frequency: SnapshotFrequency.DAILY,
        lastSuccessfulSnapshotDate: null,
        readinessStatus: SnapshotReadinessStatus.REBUILD_REQUIRED,
      },
    ]);
    client.snapshotJob.findMany.mockResolvedValue([
      {
      id: 'existing-job',
      status: SnapshotJobStatus.PENDING,
      metadata: { snapshotType: 'dashboard_daily', targetSourceWatermark: 'event-1' },
      },
    ]);
    const service = new HistoricalSnapshotEngineService(client, watermarks() as any);

    const scheduled = await service.scheduleDueJobs(
      new Date('2026-07-22T10:00:00.000Z'),
    );

    expect(scheduled).toBe(0);
    expect(client.snapshotJob.create).not.toHaveBeenCalled();
  });

  it('does not recreate retryable failed jobs for the same snapshot type', async () => {
    const client = prisma() as any;
    client.snapshotMetadata.findMany.mockResolvedValue([
      {
        module: HistoricalDashboardModule.PRODUCTION,
        snapshotType: 'dashboard_daily',
        frequency: SnapshotFrequency.DAILY,
        lastSuccessfulSnapshotDate: null,
      },
    ]);
    client.snapshotJob.findMany.mockResolvedValue([
      {
        id: 'failed-job',
        status: SnapshotJobStatus.FAILED,
        metadata: { snapshotType: 'dashboard_daily', targetSourceWatermark: 'event-1' },
      },
    ]);
    const service = new HistoricalSnapshotEngineService(client, watermarks() as any);

    const scheduled = await service.scheduleDueJobs(
      new Date('2026-07-22T10:00:00.000Z'),
    );

    expect(scheduled).toBe(0);
    expect(client.snapshotJob.create).not.toHaveBeenCalled();
  });

  it('allows different snapshot types for the same module and date', async () => {
    const client = prisma() as any;
    client.snapshotMetadata.findMany.mockResolvedValue([
      {
        module: HistoricalDashboardModule.INVENTORY,
        snapshotType: 'dashboard_daily',
        frequency: SnapshotFrequency.DAILY,
        lastSuccessfulSnapshotDate: null,
      },
      {
        module: HistoricalDashboardModule.INVENTORY,
        snapshotType: 'inventory_balance_daily',
        frequency: SnapshotFrequency.DAILY,
        lastSuccessfulSnapshotDate: null,
      },
    ]);
    client.snapshotJob.findMany.mockResolvedValueOnce([
      {
        id: 'dashboard-job',
        status: SnapshotJobStatus.PENDING,
        metadata: { snapshotType: 'dashboard_daily', targetSourceWatermark: 'event-1' },
      },
    ]);
    client.snapshotJob.findMany.mockResolvedValueOnce([
      {
        id: 'dashboard-job',
        status: SnapshotJobStatus.PENDING,
        metadata: { snapshotType: 'dashboard_daily', targetSourceWatermark: 'event-1' },
      },
    ]);
    client.snapshotJob.create.mockResolvedValue({ id: 'balance-job' });
    const service = new HistoricalSnapshotEngineService(client, watermarks() as any);

    const scheduled = await service.scheduleDueJobs(
      new Date('2026-07-22T10:00:00.000Z'),
    );

    expect(scheduled).toBe(1);
    expect(client.snapshotJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        module: HistoricalDashboardModule.INVENTORY,
        metadata: expect.objectContaining({
          snapshotType: 'inventory_balance_daily',
        }),
      }),
    });
  });
});
