import { Injectable } from '@nestjs/common';

import { PerformanceMetricsService } from '../../../core/performance/performance-metrics.service';
import type { YardWorkspaceReadDto } from '../dto/yard.dto';
import { YardReadModelRepository } from '../repositories/yard-read-model.repository';

@Injectable()
export class YardReadModelService {
  constructor(
    private readonly repository: YardReadModelRepository,
    private readonly metrics: PerformanceMetricsService,
  ) {}

  async workspace(query: YardWorkspaceReadDto) {
    const result = await this.repository.workspace(query);
    this.metrics.recordYardReadModelHit();
    return result;
  }
}
