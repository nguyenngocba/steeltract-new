import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { CacheService } from './cache.service';
import { EventThrottleService } from './event-throttle.service';
import { PerformanceController } from './performance.controller';
import { PerformanceMetricsService } from './performance-metrics.service';
import { RuntimeHealthService } from './runtime-health.service';
import { RuntimeAnalyticsService } from './runtime-analytics.service';
import { RuntimeMetricsInterceptor } from './runtime-metrics.interceptor';
import { WebsocketRoomService } from './websocket-room.service';

@Global()
@Module({
  controllers: [PerformanceController],
  providers: [
    CacheService,
    EventThrottleService,
    PerformanceMetricsService,
    RuntimeAnalyticsService,
    RuntimeHealthService,
    WebsocketRoomService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RuntimeMetricsInterceptor,
    },
  ],
  exports: [
    CacheService,
    EventThrottleService,
    PerformanceMetricsService,
    RuntimeAnalyticsService,
    RuntimeHealthService,
    WebsocketRoomService,
  ],
})
export class PerformanceModule {}
