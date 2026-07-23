import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { HistoricalDashboardController } from './historical-dashboard.controller';
import { HistoricalDashboardRepository } from './historical-dashboard.repository';
import { HistoricalDashboardService } from './historical-dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [HistoricalDashboardController],
  providers: [HistoricalDashboardRepository, HistoricalDashboardService],
  exports: [HistoricalDashboardService],
})
export class HistoricalDashboardModule {}
