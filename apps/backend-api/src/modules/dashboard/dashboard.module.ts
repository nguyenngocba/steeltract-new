import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SnapshotsModule } from '../../core/snapshots/snapshots.module';
import { InventoryModule } from '../inventory/inventory.module';

import { DashboardController } from './dashboard.controller';
import { DashboardActivityService } from './dashboard-activity.service';
import { DashboardInsightService } from './dashboard-insight.service';
import { DashboardInventoryReadModelService } from './dashboard-inventory-read-model.service';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { DashboardNotificationService } from './dashboard-notification.service';
import { DashboardRecommendationService } from './dashboard-recommendation.service';

@Module({
  imports: [PrismaModule, InventoryModule, SnapshotsModule],
  controllers: [DashboardController],
  providers: [
    DashboardMetricsService,
    DashboardInventoryReadModelService,
    DashboardActivityService,
    DashboardNotificationService,
    DashboardInsightService,
    DashboardRecommendationService,
  ],
})
export class DashboardModule {}
