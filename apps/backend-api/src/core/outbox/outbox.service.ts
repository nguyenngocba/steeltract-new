import { Inject, Injectable } from '@nestjs/common';

import { OutboxEvent, OutboxEventStatus, Prisma } from '@prisma/client';

import { safeErrorMessage } from '../../common/utils/safe-error-message';
import { PrismaService } from '../prisma/prisma.service';

interface CreateOutboxEventInput {
  eventName: string;
  payload: unknown;
  metadata?: unknown;
  idempotencyKey?: string;
  delaySeconds?: number;
  maxRetries?: number;
}

@Injectable()
export class OutboxService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create(data: CreateOutboxEventInput) {
    const nextAttemptAt = this.futureDate(data.delaySeconds);
    const create: Prisma.OutboxEventCreateInput = {
      eventName: data.eventName,
      payload: this.toJson(data.payload),
      metadata: data.metadata ? this.toJson(data.metadata) : undefined,
      idempotencyKey: data.idempotencyKey,
      maxRetries: data.maxRetries ?? 5,
      nextAttemptAt,
    };

    if (!data.idempotencyKey) {
      return this.prisma.outboxEvent.create({
        data: create,
      });
    }

    return this.prisma.outboxEvent.upsert({
      where: {
        idempotencyKey: data.idempotencyKey,
      },
      create,
      update: {},
    });
  }

  claimDue(limit = 25, workerId = 'worker') {
    const take = Math.min(Math.max(Math.floor(limit), 1), 500);
    const staleBefore = new Date(Date.now() - this.leaseTimeoutMs());
    return this.prisma.$queryRaw<OutboxEvent[]>`
      WITH candidates AS (
        SELECT id, "nextAttemptAt", "createdAt"
        FROM outbox_events
        WHERE (
            status IN ('PENDING', 'FAILED')
            AND "nextAttemptAt" <= NOW()
          ) OR (
            status = 'DISPATCHING'
            AND "lockedAt" < ${staleBefore}
          )
        ORDER BY "nextAttemptAt" ASC, "createdAt" ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${take}
      ),
      claimed AS (
        UPDATE outbox_events event
        SET status = 'DISPATCHING',
            "lockedAt" = NOW(),
            "lockedBy" = ${workerId},
            "updatedAt" = NOW()
        FROM candidates
        WHERE event.id = candidates.id
        RETURNING event.*
      )
      SELECT claimed.*
      FROM claimed
      JOIN candidates ON candidates.id = claimed.id
      ORDER BY candidates."nextAttemptAt" ASC,
               candidates."createdAt" ASC,
               candidates.id ASC
    `;
  }

  async renewLease(id: string, workerId: string) {
    const result = await this.prisma.outboxEvent.updateMany({
      where: {
        id,
        status: OutboxEventStatus.DISPATCHING,
        lockedBy: workerId,
      },
      data: {
        lockedAt: new Date(),
      },
    });

    return result.count === 1;
  }

  async markDispatched(id: string, workerId: string) {
    const result = await this.prisma.outboxEvent.updateMany({
      where: {
        id,
        status: OutboxEventStatus.DISPATCHING,
        lockedBy: workerId,
      },
      data: {
        status: OutboxEventStatus.DISPATCHED,
        dispatchedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    });

    return result.count === 1;
  }

  markFailed(id: string, error: unknown, workerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.outboxEvent.findFirst({
        where: {
          id,
          status: OutboxEventStatus.DISPATCHING,
          lockedBy: workerId,
        },
      });

      if (!event) {
        return false;
      }

      const retryCount = event.retryCount + 1;
      const deadLetter = retryCount >= event.maxRetries;

      const result = await tx.outboxEvent.updateMany({
        where: {
          id,
          status: OutboxEventStatus.DISPATCHING,
          lockedBy: workerId,
        },
        data: {
          status: deadLetter
            ? OutboxEventStatus.DEAD_LETTER
            : OutboxEventStatus.FAILED,
          retryCount,
          nextAttemptAt: this.backoffDate(retryCount),
          lockedAt: null,
          lockedBy: null,
          lastError: safeErrorMessage(error),
          deadLetteredAt: deadLetter ? new Date() : null,
        },
      });

      return result.count === 1;
    });
  }

  private leaseTimeoutMs() {
    const configured = Number(process.env.BACKGROUND_LOCK_STALE_MS ?? 300_000);
    if (!Number.isFinite(configured)) {
      return 300_000;
    }

    return Math.min(Math.max(Math.floor(configured), 30_000), 3_600_000);
  }

  private futureDate(delaySeconds?: number) {
    if (!delaySeconds) {
      return new Date();
    }

    return new Date(Date.now() + delaySeconds * 1000);
  }

  private backoffDate(retryCount: number) {
    const seconds = Math.min(300, 2 ** retryCount * 5);

    return new Date(Date.now() + seconds * 1000);
  }

  private toJson(value: unknown) {
    return value as Prisma.InputJsonValue;
  }
}
