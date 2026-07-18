import { BadRequestException, Injectable } from '@nestjs/common';

import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionRepository } from './projection.repository';
import { ProjectionListQuery } from './projection.types';

@Injectable()
export class ProjectionQueryService {
  constructor(
    private readonly registry: ProjectionRegistryService,
    private readonly repository: ProjectionRepository,
  ) {}

  catalog() {
    return this.registry.all().map((definition) => ({
      name: definition.name,
      schemaVersion: definition.schemaVersion,
      mode: definition.mode,
    }));
  }

  async health() {
    const [checkpoints, failures, documents] = await Promise.all([
      this.repository.checkpoints(),
      this.repository.activeFailureCounts(),
      this.repository.documentCounts(),
    ]);
    const checkpointMap = new Map(
      checkpoints.map((item) => [item.projectionName, item]),
    );
    const failureMap = new Map(
      failures.map((item) => [item.projectionName, item._count._all]),
    );
    const documentMap = new Map(
      documents.map((item) => [item.projectionName, item._count._all]),
    );

    return this.registry.names().map((name) => {
      const checkpoint = checkpointMap.get(name);
      const activeFailures = failureMap.get(name) ?? 0;
      return {
        projectionName: name,
        status:
          activeFailures > 0
            ? 'DEGRADED'
            : (checkpoint?.status ?? 'NOT_INITIALIZED'),
        schemaVersion: checkpoint?.schemaVersion ?? 1,
        documents: documentMap.get(name) ?? 0,
        processedCount: checkpoint?.processedCount ?? 0,
        failedCount: checkpoint?.failedCount ?? 0,
        activeFailures,
        lagMs: checkpoint?.lagMs ?? null,
        lastProcessedAt: checkpoint?.lastProcessedAt ?? null,
        lastError: checkpoint?.lastError ?? null,
      };
    });
  }

  async list(projectionName: string, query: ProjectionListQuery) {
    this.registry.get(projectionName);
    const result = await this.repository.listDocuments(projectionName, {
      ...query,
      cursor: query.cursor ? this.decodeCursor(query.cursor) : undefined,
    });
    return {
      items: result.items,
      meta: {
        ...result.meta,
        nextCursor: result.nextCursor
          ? this.encodeCursor(result.nextCursor)
          : null,
      },
    };
  }

  find(projectionName: string, entityKey: string) {
    this.registry.get(projectionName);
    return this.repository.findDocument(projectionName, entityKey);
  }

  private encodeCursor(cursor: { sourceOccurredAt: Date; id: string }) {
    return Buffer.from(
      JSON.stringify({
        sourceOccurredAt: cursor.sourceOccurredAt.toISOString(),
        id: cursor.id,
      }),
    ).toString('base64url');
  }

  private decodeCursor(value: string) {
    try {
      const decoded = JSON.parse(
        Buffer.from(value, 'base64url').toString('utf8'),
      ) as { sourceOccurredAt?: unknown; id?: unknown };
      if (
        typeof decoded.sourceOccurredAt !== 'string' ||
        typeof decoded.id !== 'string' ||
        !decoded.id
      ) {
        throw new Error('invalid cursor');
      }
      const date = new Date(decoded.sourceOccurredAt);
      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString() !== decoded.sourceOccurredAt
      ) {
        throw new Error('invalid cursor');
      }
      return { sourceOccurredAt: date, id: decoded.id };
    } catch {
      throw new BadRequestException('Invalid projection cursor');
    }
  }
}
