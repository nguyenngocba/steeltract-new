import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  BackgroundJobStatus,
  OutboxEventStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackgroundRecoveryValidationService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async validate() {
    const [
      snapshotJobs,
      retryJobs,
      deadLetterJobs,
      duplicateJobKeys,
      pendingOutbox,
      failedOutbox,
      deadLetterOutbox,
      duplicateOutboxKeys,
      recentExecutions,
    ] = await Promise.all([
      this.prisma.backgroundJob.count({
        where: {
          name: {
            startsWith: 'snapshot.',
          },
          status: BackgroundJobStatus.COMPLETED,
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          status: BackgroundJobStatus.RETRYING,
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          status: BackgroundJobStatus.DEAD_LETTER,
        },
      }),
      this.duplicateBackgroundJobKeys(),
      this.prisma.outboxEvent.count({
        where: {
          status: OutboxEventStatus.PENDING,
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          status: OutboxEventStatus.FAILED,
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          status: OutboxEventStatus.DEAD_LETTER,
        },
      }),
      this.duplicateOutboxKeys(),
      this.prisma.jobExecution.findMany({
        orderBy: {
          startedAt: 'desc',
        },
        take: 20,
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      snapshotRebuild: {
        completedJobs: snapshotJobs,
        hasEvidence: snapshotJobs > 0,
      },
      backgroundRetry: {
        retryingJobs: retryJobs,
        deadLetterJobs,
      },
      idempotency: {
        duplicateBackgroundJobKeys: duplicateJobKeys,
        duplicateOutboxKeys,
        healthy:
          duplicateJobKeys.length === 0 &&
          duplicateOutboxKeys.length === 0,
      },
      outboxReplay: {
        pendingOutbox,
        failedOutbox,
        deadLetterOutbox,
      },
      recentExecutions: recentExecutions.map((row) => ({
        id: row.id,
        jobId: row.jobId,
        status: row.status,
        durationMs: row.durationMs,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        error: row.error,
      })),
    };
  }

  private duplicateBackgroundJobKeys() {
    return this.prisma.backgroundJob.groupBy({
      by: ['idempotencyKey'],
      where: {
        idempotencyKey: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
    }).then((rows) => rows.filter((row) => row._count._all > 1));
  }

  private duplicateOutboxKeys() {
    return this.prisma.outboxEvent.groupBy({
      by: ['idempotencyKey'],
      where: {
        idempotencyKey: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
    }).then((rows) => rows.filter((row) => row._count._all > 1));
  }
}
