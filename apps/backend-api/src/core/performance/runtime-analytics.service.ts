import { Injectable } from '@nestjs/common';

import { PerformanceMetricsService } from './performance-metrics.service';

@Injectable()
export class RuntimeAnalyticsService {
  constructor(private readonly metrics: PerformanceMetricsService) {}

  snapshot(): Record<string, unknown> {
    return this.metrics.analyticsSnapshot();
  }
}
