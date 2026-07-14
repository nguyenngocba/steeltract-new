import { Injectable } from '@nestjs/common';
import { PerformanceMetricsService } from '../../../core/performance/performance-metrics.service';

import type {
  ComponentHistoryDto,
  ComponentOverviewDto,
  ComponentWorkspaceListDto,
} from '../dto/components.dto';
import { ComponentsReadModelRepository } from '../repositories/components-read-model.repository';

@Injectable()
export class ComponentsReadModelService {
  constructor(
    private readonly repository: ComponentsReadModelRepository,
    private readonly metrics: PerformanceMetricsService,
  ) {}

  list(query: ComponentWorkspaceListDto) {
    this.metrics.recordComponentReadModelHit();
    return this.repository.list(query);
  }

  overview(query: ComponentOverviewDto) {
    this.metrics.recordComponentReadModelHit();
    return this.repository.overview(query);
  }

  history(query: ComponentHistoryDto) {
    this.metrics.recordComponentReadModelHit();
    return this.repository.history(query);
  }
}
