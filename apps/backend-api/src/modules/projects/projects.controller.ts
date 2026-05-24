import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import type {
  CreateProjectDto,
  ListProjectsDto,
  UpdateProjectDto,
} from './dto/projects.dto';

import {
  createProjectSchema,
  listProjectsSchema,
  updateProjectSchema,
} from './dto/projects.dto';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ProjectsService } from './services/projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query(new ZodValidationPipe(listProjectsSchema))
    query: ListProjectsDto,
  ) {
    return this.projectsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body(new ZodValidationPipe(createProjectSchema))
    body: CreateProjectDto,
  ) {
    return this.projectsService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProjectSchema))
    body: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/components')
  components(@Param('id') id: string) {
    return this.projectsService.components(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/activity')
  activity(@Param('id') id: string) {
    return this.projectsService.activity(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/progress-chart')
  progressChart(@Param('id') id: string) {
    return this.projectsService.progressChart(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/kpis')
  kpis(@Param('id') id: string) {
    return this.projectsService.kpis(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
