import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { AnalyticsDomain } from '@prisma/client';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../rbac/types/auth-user';
import {
  createAnalyticsAlertSchema,
  createAnalyticsPredictionSchema,
  generateAnalyticsSnapshotSchema,
  listAnalyticsAlertsSchema,
  listAnalyticsMetricsSchema,
  listAnalyticsSnapshotsSchema,
} from './dto/analytics-engine.dto';
import { AnalyticsEngineService } from './services/analytics-engine.service';

import type {
  CreateAnalyticsAlertDto,
  CreateAnalyticsPredictionDto,
  GenerateAnalyticsSnapshotDto,
  ListAnalyticsAlertsDto,
  ListAnalyticsMetricsDto,
  ListAnalyticsSnapshotsDto,
} from './dto/analytics-engine.dto';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@UseGuards(JwtAuthGuard)
@Controller('analytics-engine')
export class AnalyticsEngineController {
  constructor(private readonly analyticsService: AnalyticsEngineService) {}

  @Get('overview')
  overview() {
    return this.analyticsService.overview();
  }

  @Get('snapshots')
  listSnapshots(
    @Query(new ZodValidationPipe(listAnalyticsSnapshotsSchema))
    query: ListAnalyticsSnapshotsDto,
  ) {
    return this.analyticsService.listSnapshots(query);
  }

  @Post('snapshots')
  generateSnapshot(
    @Body(new ZodValidationPipe(generateAnalyticsSnapshotSchema))
    body: GenerateAnalyticsSnapshotDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.analyticsService.generateSnapshot(body, request.user?.id);
  }

  @Get('metrics')
  listMetrics(
    @Query(new ZodValidationPipe(listAnalyticsMetricsSchema))
    query: ListAnalyticsMetricsDto,
  ) {
    return this.analyticsService.listMetrics(query);
  }

  @Get('alerts')
  listAlerts(
    @Query(new ZodValidationPipe(listAnalyticsAlertsSchema))
    query: ListAnalyticsAlertsDto,
  ) {
    return this.analyticsService.listAlerts(query);
  }

  @Post('alerts')
  createAlert(
    @Body(new ZodValidationPipe(createAnalyticsAlertSchema))
    body: CreateAnalyticsAlertDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.analyticsService.createAlert(body, request.user?.id);
  }

  @Get('predictions')
  listPredictions(@Query('domain') domain?: AnalyticsDomain) {
    return this.analyticsService.listPredictions(domain);
  }

  @Post('predictions')
  createPrediction(
    @Body(new ZodValidationPipe(createAnalyticsPredictionSchema))
    body: CreateAnalyticsPredictionDto,
  ) {
    return this.analyticsService.createPrediction(body);
  }
}
