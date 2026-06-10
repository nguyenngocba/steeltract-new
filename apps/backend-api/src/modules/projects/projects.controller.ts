import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common'

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { ProjectsService }
  from './services/projects.service'

import { createProjectSchema, ListProjectsDto, type CreateProjectDto }
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

  @Post()
  create(
    @Body(new ZodValidationPipe(createProjectSchema))
    body: CreateProjectDto,
  ) {
    return this.projectsService
      .create(body)
  }
}
