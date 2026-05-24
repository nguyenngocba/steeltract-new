import { Module } from '@nestjs/common';

import { EventsModule } from '../../core/events/events.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AnalyticsEngineController } from './analytics-engine.controller';
import { AnalyticsEngineRepository } from './repositories/analytics-engine.repository';
import { AnalyticsEngineService } from './services/analytics-engine.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [AnalyticsEngineController],
  providers: [AnalyticsEngineService, AnalyticsEngineRepository],
  exports: [AnalyticsEngineService],
})
export class AnalyticsEngineModule {}
