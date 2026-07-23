import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import {
  dashboardMonthlyQuerySchema,
  dashboardSnapshotQuerySchema,
  inventoryMonthlyQuerySchema,
  inventorySnapshotQuerySchema,
  latestDashboardSnapshotQuerySchema,
  snapshotJobsQuerySchema,
} from './historical-dashboard.dto';
import { HistoricalDashboardService } from './historical-dashboard.service';

import type {
  DashboardMonthlyQueryDto,
  DashboardSnapshotQueryDto,
  InventoryMonthlyQueryDto,
  InventorySnapshotQueryDto,
  LatestDashboardSnapshotQueryDto,
  SnapshotJobsQueryDto,
} from './historical-dashboard.dto';

@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoricalDashboardController {
  constructor(private readonly service: HistoricalDashboardService) {}

  @Get('dashboard')
  dashboard(
    @Query(new ZodValidationPipe(dashboardSnapshotQuerySchema))
    query: DashboardSnapshotQueryDto,
  ) {
    return this.service.dashboard(query);
  }

  @Get('dashboard/latest')
  latestDashboard(
    @Query(new ZodValidationPipe(latestDashboardSnapshotQuerySchema))
    query: LatestDashboardSnapshotQueryDto,
  ) {
    return this.service.latestDashboard(query);
  }

  @Get('dashboard/monthly')
  dashboardMonthly(
    @Query(new ZodValidationPipe(dashboardMonthlyQuerySchema))
    query: DashboardMonthlyQueryDto,
  ) {
    return this.service.dashboardMonthly(query);
  }

  @Get('inventory')
  inventory(
    @Query(new ZodValidationPipe(inventorySnapshotQuerySchema))
    query: InventorySnapshotQueryDto,
  ) {
    return this.service.inventory(query);
  }

  @Get('inventory/monthly')
  inventoryMonthly(
    @Query(new ZodValidationPipe(inventoryMonthlyQuerySchema))
    query: InventoryMonthlyQueryDto,
  ) {
    return this.service.inventoryMonthly(query);
  }

  @Get('jobs')
  jobs(
    @Query(new ZodValidationPipe(snapshotJobsQuerySchema))
    query: SnapshotJobsQueryDto,
  ) {
    return this.service.jobs(query);
  }
}
