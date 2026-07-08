import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { OutboxEventStatus, Prisma } from '@prisma/client';

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
      metadata: data.metadata
        ? this.toJson(data.metadata)
        : undefined,
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
    return this.prisma.$transaction(async (tx) => {
      const events = await tx.outboxEvent.findMany({
        where: {
          status: {
            in: [
              OutboxEventStatus.PENDING,
              OutboxEventStatus.FAILED,
            ],
          },
          nextAttemptAt: {
            lte: new Date(),
          },
        },
        orderBy: [
          {
            nextAttemptAt: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
        take: limit,
      });

      if (events.length === 0) {
        return [];
      }

      await tx.outboxEvent.updateMany({
        where: {
          id: {
            in: events.map((event) => event.id),
          },
        },
        data: {
          status: OutboxEventStatus.DISPATCHING,
          lockedAt: new Date(),
          lockedBy: workerId,
        },
      });

      return events;
    });
  }

  markDispatched(id: string) {
    return this.prisma.outboxEvent.update({
      where: {
        id,
      },
      data: {
        status: OutboxEventStatus.DISPATCHED,
        dispatchedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    });
  }

  markFailed(id: string, error: unknown) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.outboxEvent.findUnique({
        where: {
          id,
        },
      });

      if (!event) {
        return null;
      }

      const retryCount = event.retryCount + 1;
      const deadLetter = retryCount >= event.maxRetries;

      return tx.outboxEvent.update({
        where: {
          id,
        },
        data: {
          status: deadLetter
            ? OutboxEventStatus.DEAD_LETTER
            : OutboxEventStatus.FAILED,
          retryCount,
          nextAttemptAt: this.backoffDate(retryCount),
          lockedAt: null,
          lockedBy: null,
          lastError: error instanceof Error ? error.message : String(error),
          deadLetteredAt: deadLetter ? new Date() : null,
        },
      });
    });
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
