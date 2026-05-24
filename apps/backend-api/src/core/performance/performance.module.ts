import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache.service';
import { EventThrottleService } from './event-throttle.service';
import { PerformanceController } from './performance.controller';
import { PerformanceMetricsService } from './performance-metrics.service';
import { WebsocketRoomService } from './websocket-room.service';

@Global()
@Module({
  controllers: [PerformanceController],
  providers: [
    CacheService,
    EventThrottleService,
    PerformanceMetricsService,
    WebsocketRoomService,
  ],
  exports: [
    CacheService,
    EventThrottleService,
    PerformanceMetricsService,
    WebsocketRoomService,
  ],
})
export class PerformanceModule {}
