import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectionDefinition,
  ProjectionListQuery,
  ProjectionSourceEvent,
} from './projection.types';

type OutboxCursor = { createdAt: Date; id: string };

@Injectable()
export class ProjectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  apply(definition: ProjectionDefinition, event: ProjectionSourceEvent) {
    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.enterpriseProjectionReceipt.findUnique({
        where: {
          projectionName_outboxEventId: {
            projectionName: definition.name,
            outboxEventId: event.id,
          },
        },
      });
      if (receipt) return { applied: false, replay: true };

      const metadata = this.record(event.metadata);
      const aggregateVersion = this.number(
        metadata.aggregateVersion ??
          this.record(event.payload).aggregateVersion,
      );
      const occurredAt = this.date(metadata.occurredAt, event.createdAt);
      const eventId = this.string(metadata.eventId) ?? event.id;
      const provisional = definition.reduce(null, event);
      const current = provisional
        ? await tx.enterpriseProjectionDocument.findUnique({
            where: {
              projectionName_entityKey: {
                projectionName: definition.name,
                entityKey: provisional.entityKey,
              },
            },
          })
        : null;
      const draft = definition.reduce(current?.data ?? null, event);

      if (draft) {
        await tx.enterpriseProjectionDocument.upsert({
          where: {
            projectionName_entityKey: {
              projectionName: definition.name,
              entityKey: draft.entityKey,
            },
          },
          create: {
            projectionName: definition.name,
            entityKey: draft.entityKey,
            scopeKey: draft.scopeKey,
            schemaVersion: definition.schemaVersion,
            data: draft.data,
            sourceEventId: eventId,
            sourceEventName: event.eventName,
            sourceAggregateVersion: aggregateVersion,
            sourceOccurredAt: occurredAt,
          },
          update: {
            scopeKey: draft.scopeKey,
            schemaVersion: definition.schemaVersion,
            data: draft.data,
            sourceEventId: eventId,
            sourceEventName: event.eventName,
            sourceAggregateVersion: aggregateVersion,
            sourceOccurredAt: occurredAt,
          },
        });
      }

      await tx.enterpriseProjectionReceipt.create({
        data: {
          projectionName: definition.name,
          outboxEventId: event.id,
          eventName: event.eventName,
          aggregateId: this.string(metadata.aggregateId),
          aggregateVersion,
        },
      });

      const lagMs = Math.min(
        2_147_483_647,
        Math.max(0, Date.now() - occurredAt.getTime()),
      );
      await tx.enterpriseProjectionCheckpoint.upsert({
        where: { projectionName: definition.name },
        create: {
          projectionName: definition.name,
          schemaVersion: definition.schemaVersion,
          lastOutboxEventId: event.id,
          lastOccurredAt: occurredAt,
          lastProcessedAt: new Date(),
          processedCount: 1,
          lagMs,
          status: 'HEALTHY',
        },
        update: {
          schemaVersion: definition.schemaVersion,
          lastOutboxEventId: event.id,
          lastOccurredAt: occurredAt,
          lastProcessedAt: new Date(),
          processedCount: { increment: 1 },
          lagMs,
          status: 'HEALTHY',
          lastError: null,
        },
      });
      await tx.enterpriseProjectionFailure.updateMany({
        where: {
          projectionName: definition.name,
          outboxEventId: event.id,
          status: { not: 'RESOLVED' },
        },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });

      return { applied: true, replay: false };
    });
  }

  async recordFailure(
    projectionName: string,
    event: ProjectionSourceEvent,
    error: unknown,
  ) {
    const message = error instanceof Error ? error.message : String(error);
    const deadLetter = event.retryCount + 1 >= event.maxRetries;
    await this.prisma.$transaction([
      this.prisma.enterpriseProjectionFailure.upsert({
        where: {
          projectionName_outboxEventId: {
            projectionName,
            outboxEventId: event.id,
          },
        },
        create: {
          projectionName,
          outboxEventId: event.id,
          eventName: event.eventName,
          payload: event.payload as Prisma.InputJsonValue,
          metadata: event.metadata as Prisma.InputJsonValue | undefined,
          error: message,
          status: deadLetter ? 'DEAD_LETTER' : 'RETRYING',
        },
        update: {
          error: message,
          retryCount: { increment: 1 },
          status: deadLetter ? 'DEAD_LETTER' : 'RETRYING',
          lastAttemptAt: new Date(),
          resolvedAt: null,
        },
      }),
      this.prisma.enterpriseProjectionCheckpoint.upsert({
        where: { projectionName },
        create: {
          projectionName,
          status: 'DEGRADED',
          failedCount: 1,
          lastError: message,
        },
        update: {
          status: 'DEGRADED',
          failedCount: { increment: 1 },
          lastError: message,
        },
      }),
    ]);
  }

  findDocument(projectionName: string, entityKey: string) {
    return this.prisma.enterpriseProjectionDocument.findUnique({
      where: { projectionName_entityKey: { projectionName, entityKey } },
    });
  }

  async listDocuments(projectionName: string, query: ProjectionListQuery) {
    const where: Prisma.EnterpriseProjectionDocumentWhereInput = {
      projectionName,
      scopeKey: query.scopeKey,
      data: query.state ? { path: ['state'], equals: query.state } : undefined,
    };
    const [items, total] = await Promise.all([
      this.prisma.enterpriseProjectionDocument.findMany({
        where,
        orderBy: [{ sourceOccurredAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.enterpriseProjectionDocument.count({ where }),
    ]);
    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  checkpoints() {
    return this.prisma.enterpriseProjectionCheckpoint.findMany({
      orderBy: { projectionName: 'asc' },
    });
  }

  activeFailureCounts() {
    return this.prisma.enterpriseProjectionFailure.groupBy({
      by: ['projectionName'],
      where: { status: { not: 'RESOLVED' } },
      _count: { _all: true },
    });
  }

  documentCounts() {
    return this.prisma.enterpriseProjectionDocument.groupBy({
      by: ['projectionName'],
      _count: { _all: true },
    });
  }

  outboxPage(cursor?: OutboxCursor, limit = 250) {
    return this.prisma.outboxEvent.findMany({
      where: cursor
        ? {
            OR: [
              { createdAt: { gt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { gt: cursor.id } },
            ],
          }
        : undefined,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });
  }

  reset(projectionName: string) {
    return this.prisma.$transaction([
      this.prisma.enterpriseProjectionReceipt.deleteMany({
        where: { projectionName },
      }),
      this.prisma.enterpriseProjectionFailure.deleteMany({
        where: { projectionName },
      }),
      this.prisma.enterpriseProjectionDocument.deleteMany({
        where: { projectionName },
      }),
      this.prisma.enterpriseProjectionCheckpoint.deleteMany({
        where: { projectionName },
      }),
    ]);
  }

  private record(value: Prisma.JsonValue | null): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private string(value: unknown) {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private number(value: unknown) {
    return typeof value === 'number' && Number.isInteger(value)
      ? value
      : undefined;
  }

  private date(value: unknown, fallback: Date) {
    if (typeof value !== 'string') return fallback;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }
}
