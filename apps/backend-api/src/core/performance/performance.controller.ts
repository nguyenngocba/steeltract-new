import { Controller, Get } from '@nestjs/common';

import { CacheService } from './cache.service';
import { PerformanceMetricsService } from './performance-metrics.service';

@Controller('performance')
export class PerformanceController {
  constructor(
    private readonly cache: CacheService,
    private readonly metrics: PerformanceMetricsService,
  ) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  getMetrics() {
    return {
      ...this.metrics.snapshot(),
      cache: this.cache.stats(),
      jobs: {
        adapter: 'database',
        metrics: 'prepared',
      },
    };
  }
}
