import { Injectable } from '@nestjs/common';

import { PerformanceMetricsService } from './performance-metrics.service';

@Injectable()
export class RuntimeHealthService {
  constructor(private readonly metrics: PerformanceMetricsService) {}

  snapshot(): Record<string, unknown> {
    return this.metrics.snapshot();
  }
}
