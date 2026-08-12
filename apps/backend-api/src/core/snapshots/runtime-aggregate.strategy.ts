import { Inject, Injectable } from '@nestjs/common';

import { PerformanceMetricsService } from '../performance/performance-metrics.service';

@Injectable()
export class RuntimeAggregateStrategy {
  constructor(
    @Inject(PerformanceMetricsService)
    private readonly metrics: PerformanceMetricsService,
  ) {}

  async read<TResult>(reader: () => Promise<TResult>) {
    this.metrics.recordSnapshotFallback();
    this.metrics.recordReadModelFallback();
    return reader();
  }
}
