import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { CacheService } from './cache.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { RuntimeHealthService } from './runtime-health.service';

@UseGuards(JwtAuthGuard)
@Controller('performance')
export class PerformanceController {
  constructor(
    private readonly cache: CacheService,
    private readonly metrics: PerformanceMetricsService,
    private readonly runtimeHealth: RuntimeHealthService,
  ) {}

  @Get('health')
  health(): Record<string, unknown> {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      runtime: this.runtimeHealth.snapshot(),
    };
  }

  @Get('metrics')
  getMetrics(): Record<string, unknown> {
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
