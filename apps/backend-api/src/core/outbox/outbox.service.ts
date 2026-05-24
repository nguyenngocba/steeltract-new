import { Injectable } from '@nestjs/common';

import { OutboxEventStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface CreateOutboxEventInput {
  eventName: string;
  payload: unknown;
  metadata?: unknown;
  idempotencyKey?: string;
  maxRetries?: number;
  delaySeconds?: number;
}

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateOutboxEventInput) {
    const data: Prisma.OutboxEventCreateInput = {
      eventName: input.eventName,
      payload: this.toJson(input.payload),
      metadata: this.toJson(input.metadata),
      idempotencyKey: input.idempotencyKey,
      maxRetries: input.maxRetries ?? 5,
      nextAttemptAt: this.futureDate(input.delaySeconds),
    };

    if (!input.idempotencyKey) {
      return this.prisma.outboxEvent.create({
        data,
      });
    }

    return this.prisma.outboxEvent.upsert({
      where: {
        idempotencyKey: input.idempotencyKey,
      },
      create: data,
      update: {},
    });
  }

  list(params: {
    status?: OutboxEventStatus;
    eventName?: string;
    limit?: number;
  }) {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: params.status,
        eventName: params.eventName,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params.limit ?? 50,
    });
  }

  claimDue(limit = 25, workerId = 'local-worker') {
    return this.prisma.$transaction(async (tx) => {
      const events = await tx.outboxEvent.findMany({
        where: {
          status: {
            in: [OutboxEventStatus.PENDING, OutboxEventStatus.FAILED],
          },
          nextAttemptAt: {
            lte: new Date(),
          },
          retryCount: {
            lt: 5,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
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
      },
    });
  }

  markFailed(id: string, error: unknown) {
    return this.prisma.outboxEvent
      .findUniqueOrThrow({
        where: {
          id,
        },
      })
      .then((event) => {
        const retryCount = event.retryCount + 1;
        const deadLetter = retryCount >= event.maxRetries;

        return this.prisma.outboxEvent.update({
          where: {
            id,
          },
          data: {
            status: deadLetter
              ? OutboxEventStatus.DEAD_LETTER
              : OutboxEventStatus.FAILED,
            retryCount,
            nextAttemptAt: this.backoffDate(retryCount),
            lastError: error instanceof Error ? error.message : String(error),
            lockedAt: null,
            lockedBy: null,
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

    return this.futureDate(seconds);
  }

  private toJson(value: unknown) {
    return value as Prisma.InputJsonValue;
  }
}
