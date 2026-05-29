import {
  Controller,
  Get,
  Query,
} from '@nestjs/common'

import { ProjectsService }
  from './services/projects.service'

import { ListProjectsDto }
  from './dto/projects.dto'

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService:
      ProjectsService,
  ) {}

  @Get()
  list(
    @Query()
    query: ListProjectsDto,
  ) {
    return this.projectsService
      .findAll(query)
  }

  @Get('runtime')
  runtime() {
    return this.projectsService
      .runtimeDashboard()
  }
}