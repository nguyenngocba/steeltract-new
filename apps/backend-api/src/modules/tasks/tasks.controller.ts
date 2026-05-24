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
  CreateTaskDto,
  ListTasksDto,
  UpdateTaskDto,
} from './dto/tasks.dto';

import {
  createTaskSchema,
  listTasksSchema,
  updateTaskSchema,
} from './dto/tasks.dto';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TasksService } from './services/tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query(new ZodValidationPipe(listTasksSchema))
    query: ListTasksDto,
  ) {
    return this.tasksService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body(new ZodValidationPipe(createTaskSchema))
    body: CreateTaskDto,
  ) {
    return this.tasksService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTaskSchema))
    body: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
