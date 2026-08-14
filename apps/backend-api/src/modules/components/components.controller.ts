import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

import type {
  CreateComponentDto,
  ComponentHistoryDto,
  ComponentOverviewDto,
  ComponentWorkspaceListDto,
  ComponentTimelineDto,
  InstallComponentDto,
  ListComponentsDto,
  UpdateComponentDto,
} from './dto/components.dto';

import {
  createComponentSchema,
  componentHistorySchema,
  componentOverviewSchema,
  componentWorkspaceListSchema,
  componentTimelineSchema,
  installComponentSchema,
  listComponentsSchema,
  updateComponentSchema,
} from './dto/components.dto';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ComponentCostingService } from './services/component-costing.service';
import { ComponentsService } from './services/components.service';
import { ComponentsReadModelService } from './services/components-read-model.service';
import { ComponentsSnapshotReadService } from './services/components-snapshot-read.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('components.view')
@Controller('components')
export class ComponentsController {
  constructor(
    private readonly componentsService: ComponentsService,
    private readonly componentCostingService: ComponentCostingService,
    private readonly componentsReadModelService: ComponentsReadModelService,
    private readonly componentsSnapshotReadService: ComponentsSnapshotReadService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  dashboard() {
    return this.componentsSnapshotReadService.dashboard();
  }

  @UseGuards(JwtAuthGuard)
  @Get('read-model/list')
  workspaceList(
    @Query(new ZodValidationPipe(componentWorkspaceListSchema))
    query: ComponentWorkspaceListDto,
  ) {
    return this.componentsReadModelService.list(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('read-model/overview')
  overview(
    @Query(new ZodValidationPipe(componentOverviewSchema))
    query: ComponentOverviewDto,
  ) {
    return this.componentsReadModelService.overview(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('read-model/history')
  history(
    @Query(new ZodValidationPipe(componentHistorySchema))
    query: ComponentHistoryDto,
  ) {
    return this.componentsReadModelService.history(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query(new ZodValidationPipe(listComponentsSchema))
    query: ListComponentsDto,
  ) {
    return this.componentsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/costing/breakdown')
  costingBreakdown(@Param('id') id: string) {
    return this.componentCostingService.breakdown(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/costing')
  costing(@Param('id') id: string) {
    return this.componentCostingService.findByComponent(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/costing/recalculate')
  @RequirePermissions('components.edit')
  recalculateCosting(@Param('id') id: string) {
    return this.componentCostingService.recalculate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/deliver')
  @RequirePermissions('components.edit')
  deliver(@Param('id') id: string) {
    return this.componentsService.deliver(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/install')
  @RequirePermissions('components.edit')
  install(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(installComponentSchema))
    body: InstallComponentDto,
  ) {
    return this.componentsService.install(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @RequirePermissions('components.create')
  create(
    @Body(new ZodValidationPipe(createComponentSchema))
    body: CreateComponentDto,
  ) {
    return this.componentsService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.componentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/timeline')
  timeline(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(componentTimelineSchema))
    query: ComponentTimelineDto,
  ) {
    return this.componentsService.timeline(id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @RequirePermissions('components.create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(storageRoot(), 'components'),

        filename: (req, file, callback) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);

          callback(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.componentsService.getComponentUploadResponse(file);
  }

  @UseGuards(JwtAuthGuard)
  @Post('timeline-upload')
  @RequirePermissions('components.create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(storageRoot(), 'timeline'),

        filename: (req, file, callback) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);

          callback(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  uploadTimelineFile(@UploadedFile() file: Express.Multer.File) {
    return this.componentsService.getTimelineUploadResponse(file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @RequirePermissions('components.edit')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateComponentSchema))
    body: UpdateComponentDto,
  ) {
    return this.componentsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @RequirePermissions('components.delete')
  remove(@Param('id') id: string) {
    return this.componentsService.remove(id);
  }
}

function storageRoot() {
  return process.env.STORAGE_ROOT || './uploads';
}
