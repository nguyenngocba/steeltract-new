import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import {
  projectionListQuerySchema,
  ProjectionListQueryDto,
} from './projection-query.dto';
import { EnterpriseQueryService } from './enterprise-query.service';

@UseGuards(JwtAuthGuard)
@Controller('query-api/modules')
export class EnterpriseQueryController {
  constructor(private readonly queries: EnterpriseQueryService) {}

  @Get()
  catalog() {
    return this.queries.catalog();
  }

  @Get(':moduleName')
  module(@Param('moduleName') moduleName: string) {
    return this.queries.module(moduleName);
  }

  @Get(':moduleName/:viewName')
  list(
    @Param('moduleName') moduleName: string,
    @Param('viewName') viewName: string,
    @Query(new ZodValidationPipe(projectionListQuerySchema))
    query: ProjectionListQueryDto,
  ) {
    return this.queries.list(moduleName, viewName, query);
  }

  @Get(':moduleName/:viewName/:entityKey')
  find(
    @Param('moduleName') moduleName: string,
    @Param('viewName') viewName: string,
    @Param('entityKey') entityKey: string,
  ) {
    return this.queries.find(moduleName, viewName, entityKey);
  }
}
