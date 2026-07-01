import { Module } from '@nestjs/common'

import { PrismaModule } from '../../core/prisma/prisma.module'

import { DashboardController } from './dashboard.controller'
import { DashboardActivityService } from './dashboard-activity.service'
import { DashboardInsightService } from './dashboard-insight.service'
import { DashboardMetricsService } from './dashboard-metrics.service'
import { DashboardNotificationService } from './dashboard-notification.service'
import { DashboardRecommendationService } from './dashboard-recommendation.service'

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [
    DashboardMetricsService,
    DashboardActivityService,
    DashboardNotificationService,
    DashboardInsightService,
    DashboardRecommendationService,
  ],
})
export class DashboardModule {}
