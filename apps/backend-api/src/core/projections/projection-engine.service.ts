import { Injectable } from '@nestjs/common';

import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionRepository } from './projection.repository';
import {
  ProjectionDefinition,
  ProjectionSourceEvent,
} from './projection.types';

@Injectable()
export class ProjectionEngineService {
  constructor(
    private readonly registry: ProjectionRegistryService,
    private readonly repository: ProjectionRepository,
  ) {}

  async process(event: ProjectionSourceEvent) {
    const definitions = this.registry.matching(event.eventName);
    const results = [];
    for (const definition of definitions) {
      results.push(await this.processDefinition(definition, event));
    }
    return results;
  }

  processProjection(projectionName: string, event: ProjectionSourceEvent) {
    const definition = this.registry.get(projectionName);
    if (!definition.matches(event.eventName)) {
      return Promise.resolve({ applied: false, ignored: true });
    }
    return this.processDefinition(definition, event);
  }

  private async processDefinition(
    definition: ProjectionDefinition,
    event: ProjectionSourceEvent,
  ) {
    try {
      return await this.repository.apply(definition, event);
    } catch (error) {
      await this.repository.recordFailure(definition.name, event, error);
      throw error;
    }
  }
}
