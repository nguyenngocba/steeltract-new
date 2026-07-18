import { Injectable } from '@nestjs/common';

import { ProjectionEngineService } from './projection-engine.service';
import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionRepository } from './projection.repository';

export type ProjectionReplayOptions = {
  batchSize?: number;
  maxEvents?: number;
  fromBeginning?: boolean;
};

@Injectable()
export class ProjectionReplayService {
  constructor(
    private readonly registry: ProjectionRegistryService,
    private readonly repository: ProjectionRepository,
    private readonly engine: ProjectionEngineService,
  ) {}

  async rebuild(
    projectionName: string,
    options: Omit<ProjectionReplayOptions, 'fromBeginning'> = {},
  ) {
    this.registry.get(projectionName);
    await this.repository.reset(projectionName);
    return this.resume(projectionName, { ...options, fromBeginning: true });
  }

  async resume(
    projectionName: string,
    input: number | ProjectionReplayOptions = {},
  ) {
    const definition = this.registry.get(projectionName);
    const options = typeof input === 'number' ? { batchSize: input } : input;
    const batchSize = this.bound(options.batchSize ?? 250, 10, 2000);
    const maxEvents = this.bound(
      options.maxEvents ?? 100_000,
      batchSize,
      1_000_000,
    );
    let cursor = options.fromBeginning
      ? undefined
      : await this.repository.replayCursor(projectionName);
    let scanned = 0;
    let matched = 0;
    let truncated = false;

    while (scanned < maxEvents) {
      const pageSize = Math.min(batchSize, maxEvents - scanned);
      const events = await this.repository.outboxPage(cursor, pageSize);
      if (events.length === 0) break;
      for (const event of events) {
        scanned += 1;
        const result = await this.engine.processProjection(
          projectionName,
          event,
        );
        if (!('ignored' in result)) matched += 1;
      }
      const last = events[events.length - 1];
      await this.repository.advanceReplayCursor(
        projectionName,
        last,
        definition.schemaVersion,
      );
      cursor = { createdAt: last.createdAt, id: last.id };
      if (events.length < pageSize) break;
      truncated = scanned >= maxEvents;
    }

    return { projectionName, scanned, matched, truncated, cursor };
  }

  private bound(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(Math.floor(value), minimum), maximum);
  }
}
