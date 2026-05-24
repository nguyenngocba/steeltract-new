import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { RequirePermissions } from '../../modules/rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../../modules/rbac/guards/permissions.guard';
import { listJobsSchema, scheduleJobSchema } from './dto/jobs.dto';
import { JobSchedulerService } from './job-scheduler.service';
import { JobWorkerService } from './job-worker.service';

import type { ListJobsDto, ScheduleJobDto } from './dto/jobs.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly scheduler: JobSchedulerService,
    private readonly worker: JobWorkerService,
  ) {}

  @RequirePermissions('jobs.read')
  @Get()
  async list(
    @Query(new ZodValidationPipe(listJobsSchema))
    query: ListJobsDto,
  ) {
    const hasPagination = query.page !== undefined || query.limit !== undefined;

    if (!hasPagination) {
      return this.scheduler.list({
        queue: query.queue,
        name: query.name,
        status: query.status,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.scheduler.list({
        queue: query.queue,
        name: query.name,
        status: query.status,
        skip,
        take: limit,
      }),
      this.scheduler.count({
        queue: query.queue,
        name: query.name,
        status: query.status,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @RequirePermissions('jobs.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduler.findById(id);
  }

  @RequirePermissions('jobs.write')
  @Post()
  schedule(
    @Body(new ZodValidationPipe(scheduleJobSchema))
    body: ScheduleJobDto,
  ) {
    return this.scheduler.schedule(body);
  }

  @RequirePermissions('jobs.write')
  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.scheduler.retry(id);
  }

  @RequirePermissions('jobs.write')
  @Post('worker/tick')
  tick() {
    return this.worker.tick();
  }
}
