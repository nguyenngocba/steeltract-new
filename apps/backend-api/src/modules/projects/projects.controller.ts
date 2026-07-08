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
} from '@nestjs/common'

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RequirePermissions } from '../rbac/decorators/permissions.decorator'
import { PermissionsGuard } from '../rbac/guards/permissions.guard'
import { ProjectsService }
  from './services/projects.service'

import {
  createProjectTemplateSchema,
  createProjectSchema,
  createProjectWbsTaskSchema,
  bulkProjectWbsSchema,
  generateProjectWbsSchema,
  importProjectTemplateSchema,
  ListProjectsDto,
  moveProjectWbsTaskSchema,
  returnProjectComponentSchema,
  siteProjectUpdateSchema,
  type BulkProjectWbsDto,
  type CreateProjectDto,
  type CreateProjectTemplateDto,
  type CreateProjectWbsTaskDto,
  type GenerateProjectWbsDto,
  type ImportProjectTemplateDto,
  type MoveProjectWbsTaskDto,
  type ReturnProjectComponentDto,
  type SiteProjectUpdateDto,
  type UpdateProjectTemplateDto,
  type UpdateProjectDto,
  type UpdateProjectWbsTaskDto,
  updateProjectTemplateSchema,
  updateProjectSchema,
  updateProjectWbsTaskSchema,
}
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

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.read')
  @Get('templates')
  templates() {
    return this.projectsService
      .listTemplates()
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.write')
  @Post('templates')
  createTemplate(
    @Body(new ZodValidationPipe(createProjectTemplateSchema))
    body: CreateProjectTemplateDto,
  ) {
    return this.projectsService
      .createTemplate(body)
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.write')
  @Patch('templates/:templateId')
  updateTemplate(
    @Param('templateId') templateId: string,
    @Body(new ZodValidationPipe(updateProjectTemplateSchema))
    body: UpdateProjectTemplateDto,
  ) {
    return this.projectsService
      .updateTemplate(templateId, body)
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.write')
  @Post('templates/:templateId/duplicate')
  duplicateTemplate(@Param('templateId') templateId: string) {
    return this.projectsService
      .duplicateTemplate(templateId)
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.write')
  @Post('templates/:templateId/publish')
  publishTemplate(@Param('templateId') templateId: string) {
    return this.projectsService
      .publishTemplate(templateId)
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.write')
  @Post('templates/:templateId/deactivate')
  deactivateTemplate(@Param('templateId') templateId: string) {
    return this.projectsService
      .deactivateTemplate(templateId)
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.write')
  @Post('templates/:templateId/default')
  setDefaultTemplate(@Param('templateId') templateId: string) {
    return this.projectsService
      .setDefaultTemplate(templateId)
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.read')
  @Get('templates/:templateId/export')
  exportTemplate(@Param('templateId') templateId: string) {
    return this.projectsService
      .exportTemplate(templateId)
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('projects.write')
  @Post('templates/import')
  importTemplates(
    @Body(new ZodValidationPipe(importProjectTemplateSchema))
    body: ImportProjectTemplateDto,
  ) {
    return this.projectsService
      .importTemplates(body)
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createProjectSchema))
    body: CreateProjectDto,
  ) {
    return this.projectsService
      .create(body)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProjectSchema))
    body: UpdateProjectDto,
  ) {
    return this.projectsService
      .update(id, body)
  }

  @Post(':id/components/:componentId/return')
  returnComponent(
    @Param('id') id: string,
    @Param('componentId') componentId: string,
    @Body(new ZodValidationPipe(returnProjectComponentSchema))
    body: ReturnProjectComponentDto,
  ) {
    return this.projectsService
      .returnProjectComponent(id, componentId, body)
  }

  @Get(':id/detail/:tab')
  detailTab(
    @Param('id') id: string,
    @Param('tab') tab: string,
  ) {
    return this.projectsService
      .detailTab(id, tab)
  }

  @Get(':id/wbs')
  wbs(@Param('id') id: string) {
    return this.projectsService
      .wbs(id)
  }

  @Post(':id/wbs')
  createWbsTask(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProjectWbsTaskSchema))
    body: CreateProjectWbsTaskDto,
  ) {
    return this.projectsService
      .createWbsTask(id, body)
  }

  @Post(':id/wbs/generate')
  generateWbs(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(generateProjectWbsSchema))
    body: GenerateProjectWbsDto,
  ) {
    return this.projectsService
      .generateWbs(id, body)
  }

  @Patch(':id/wbs/bulk')
  bulkUpdateWbs(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(bulkProjectWbsSchema))
    body: BulkProjectWbsDto,
  ) {
    return this.projectsService
      .bulkUpdateWbs(id, body)
  }

  @Post(':id/site-update')
  siteUpdate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(siteProjectUpdateSchema))
    body: SiteProjectUpdateDto,
  ) {
    return this.projectsService
      .siteUpdate(id, body)
  }

  @Patch(':id/wbs/:taskId')
  updateWbsTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(updateProjectWbsTaskSchema))
    body: UpdateProjectWbsTaskDto,
  ) {
    return this.projectsService
      .updateWbsTask(id, taskId, body)
  }

  @Patch(':id/wbs/:taskId/move')
  moveWbsTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(moveProjectWbsTaskSchema))
    body: MoveProjectWbsTaskDto,
  ) {
    return this.projectsService
      .moveWbsTask(id, taskId, body)
  }

  @Delete(':id/wbs/:taskId')
  deleteWbsTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
  ) {
    return this.projectsService
      .deleteWbsTask(id, taskId)
  }
}
