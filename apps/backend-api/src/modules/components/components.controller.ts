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
import { extname } from 'path';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import type {
  CreateComponentDto,
  InstallComponentDto,
  ListComponentsDto,
  UpdateComponentDto,
} from './dto/components.dto';

import {
  createComponentSchema,
  installComponentSchema,
  listComponentsSchema,
  updateComponentSchema,
} from './dto/components.dto';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ComponentCostingService } from './services/component-costing.service';
import { ComponentsService } from './services/components.service';

@Controller('components')
export class ComponentsController {
  constructor(
    private readonly componentsService: ComponentsService,
    private readonly componentCostingService: ComponentCostingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query(new ZodValidationPipe(listComponentsSchema))
    query: ListComponentsDto,
  ) {
    return this.componentsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/costing')
  costing(@Param('id') id: string) {
    return this.componentCostingService.findByComponent(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/costing/recalculate')
  recalculateCosting(@Param('id') id: string) {
    return this.componentCostingService.recalculate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.componentsService.deliver(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/install')
  install(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(installComponentSchema))
    body: InstallComponentDto,
  ) {
    return this.componentsService.install(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
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
  timeline(@Param('id') id: string) {
    return this.componentsService.timeline(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/components',

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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/timeline',

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
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateComponentSchema))
    body: UpdateComponentDto,
  ) {
    return this.componentsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.componentsService.remove(id);
  }
}
