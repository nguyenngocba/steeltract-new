import { Injectable } from '@nestjs/common';

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

  list(projectionName: string, query: ProjectionListQuery) {
    this.registry.get(projectionName);
    return this.repository.listDocuments(projectionName, query);
  }

  find(projectionName: string, entityKey: string) {
    this.registry.get(projectionName);
    return this.repository.findDocument(projectionName, entityKey);
  }
}
