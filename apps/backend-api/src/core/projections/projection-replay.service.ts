import { Injectable } from '@nestjs/common';

import { ProjectionEngineService } from './projection-engine.service';
import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionRepository } from './projection.repository';

@Injectable()
export class ProjectionReplayService {
  constructor(
    private readonly registry: ProjectionRegistryService,
    private readonly repository: ProjectionRepository,
    private readonly engine: ProjectionEngineService,
  ) {}

  async rebuild(projectionName: string) {
    this.registry.get(projectionName);
    await this.repository.reset(projectionName);
    return this.resume(projectionName);
  }

  async resume(projectionName: string, batchSize = 250) {
    this.registry.get(projectionName);
    let cursor: { createdAt: Date; id: string } | undefined;
    let scanned = 0;
    let matched = 0;

    while (true) {
      const events = await this.repository.outboxPage(cursor, batchSize);
      if (events.length === 0) break;
      for (const event of events) {
        scanned += 1;
        const result = await this.engine.processProjection(
          projectionName,
          event,
        );
        if (!('ignored' in result)) matched += 1;
      }
      const last = events.at(-1)!;
      cursor = { createdAt: last.createdAt, id: last.id };
      if (events.length < batchSize) break;
    }

    return { projectionName, scanned, matched };
  }
}
