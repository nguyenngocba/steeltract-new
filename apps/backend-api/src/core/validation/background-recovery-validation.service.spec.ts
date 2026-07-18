import { BackgroundJobStatus, OutboxEventStatus } from '@prisma/client';

import { BackgroundRecoveryValidationService } from './background-recovery-validation.service';

describe('BackgroundRecoveryValidationService', () => {
  it('reports stale worker and Outbox locks without mutating them', async () => {
    const backgroundJob = {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    };
    const outboxEvent = {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    };
    const service = new BackgroundRecoveryValidationService({
      backgroundJob,
      outboxEvent,
      jobExecution: { findMany: jest.fn().mockResolvedValue([]) },
    } as never);

    await expect(service.validate()).resolves.toEqual(
      expect.objectContaining({
        staleLocks: {
          thresholdMs: 300_000,
          backgroundJobs: 0,
          outboxEvents: 0,
          healthy: true,
        },
      }),
    );

    expect(backgroundJob.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: BackgroundJobStatus.RUNNING,
        OR: expect.any(Array),
      }),
    });
    expect(outboxEvent.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: OutboxEventStatus.DISPATCHING,
        lockedAt: { lt: expect.any(Date) },
      }),
    });
  });
});
