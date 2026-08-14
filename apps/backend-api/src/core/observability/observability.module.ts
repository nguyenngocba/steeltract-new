import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { MetricsController } from './metrics.controller';
import { ObservabilityService } from './observability.service';
import { RequestObservabilityMiddleware } from './request-observability.middleware';

@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [ObservabilityService, RequestObservabilityMiddleware],
  exports: [ObservabilityService, RequestObservabilityMiddleware],
})
export class ObservabilityModule {}
