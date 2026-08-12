import { BadRequestException, Injectable } from '@nestjs/common';

import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionRepository } from './projection.repository';
import { ProjectionListQuery } from './projection.types';
import { ProjectionWatermarkService } from './projection-watermark.service';

@Injectable()
export class ProjectionQueryService {
  constructor(
    private readonly registry: ProjectionRegistryService,
    private readonly repository: ProjectionRepository,
    private readonly watermarks: ProjectionWatermarkService,
  ) {}

  catalog() {
    return this.registry.all().map((definition) => ({
      name: definition.name,
      schemaVersion: definition.schemaVersion,
      mode: definition.mode,
    }));
  }

  async health() {
    return this.watermarks.health();
  }

  async list(projectionName: string, query: ProjectionListQuery) {
    this.registry.get(projectionName);
    const result = await this.repository.listDocuments(projectionName, {
      ...query,
      cursor: query.cursor ? this.decodeCursor(query.cursor) : undefined,
    });
    return {
      items: result.items.map((item) => this.serializeDocument(item)),
      meta: {
        ...result.meta,
        nextCursor: result.nextCursor
          ? this.encodeCursor(result.nextCursor)
          : null,
      },
    };
  }

  async find(projectionName: string, entityKey: string) {
    this.registry.get(projectionName);
    const document = await this.repository.findDocument(
      projectionName,
      entityKey,
    );
    return document ? this.serializeDocument(document) : null;
  }

  private serializeDocument<
    T extends { sourceAggregateVersion?: bigint | number | null },
  >(document: T) {
    return {
      ...document,
      sourceAggregateVersion:
        typeof document.sourceAggregateVersion === 'bigint'
          ? Number(document.sourceAggregateVersion)
          : (document.sourceAggregateVersion ?? null),
    };
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
