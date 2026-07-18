import { BackgroundJobStatus, OutboxEventStatus } from '@prisma/client';

import { OperationsCenterRepository } from './operations-center.repository';

describe('OperationsCenterRepository database telemetry', () => {
  it('aggregates status counts with one grouped query per queue', async () => {
    const prisma = {
      backgroundJob: {
        groupBy: jest.fn().mockResolvedValue([
          {
            status: BackgroundJobStatus.RUNNING,
            _count: { _all: 2 },
          },
        ]),
      },
      outboxEvent: {
        groupBy: jest.fn().mockResolvedValue([
          {
            status: OutboxEventStatus.PENDING,
            _count: { _all: 3 },
          },
        ]),
      },
    };
    const repository = new OperationsCenterRepository(prisma as never);

    const [jobs, outbox] = await Promise.all([
      repository.countBackgroundJobsByStatus(),
      repository.countOutboxEventsByStatus(),
    ]);

    expect(prisma.backgroundJob.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.outboxEvent.groupBy).toHaveBeenCalledTimes(1);
    expect(jobs).toContainEqual({
      status: BackgroundJobStatus.RUNNING,
      count: 2,
    });
    expect(jobs).toContainEqual({
      status: BackgroundJobStatus.QUEUED,
      count: 0,
    });
    expect(outbox).toContainEqual({
      status: OutboxEventStatus.PENDING,
      count: 3,
    });
  });

  it('uses catalog estimates instead of exact counts for large table telemetry', async () => {
    const queryRaw = jest.fn().mockResolvedValue([
      { tableName: 'inventory_transactions', estimatedRows: 104n },
      { tableName: 'outbox_events', estimatedRows: 90n },
    ]);
    const repository = new OperationsCenterRepository({
      $queryRaw: queryRaw,
    } as never);

    const counts = await repository.databaseTableCounts();

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(counts).toHaveLength(12);
    expect(counts[0]).toBe(104);
    expect(counts[10]).toBe(90);
  });
});
