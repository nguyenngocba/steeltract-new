import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import {
  projectionListQuerySchema,
  ProjectionListQueryDto,
} from './projection-query.dto';
import { ProjectionQueryService } from './projection-query.service';

@UseGuards(JwtAuthGuard)
@Controller('query-api/projections')
export class ProjectionController {
  constructor(private readonly queries: ProjectionQueryService) {}

  @Get()
  catalog() {
    return this.queries.catalog();
  }

  @Get('health')
  health() {
    return this.queries.health();
  }

  @Get(':projectionName')
  list(
    @Param('projectionName') projectionName: string,
    @Query(new ZodValidationPipe(projectionListQuerySchema))
    query: ProjectionListQueryDto,
  ) {
    return this.queries.list(projectionName, query);
  }

  @Get(':projectionName/:entityKey')
  find(
    @Param('projectionName') projectionName: string,
    @Param('entityKey') entityKey: string,
  ) {
    return this.queries.find(projectionName, entityKey);
  }
}
