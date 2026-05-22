import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('tasks')
export class TasksController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.task.findMany({
      include: {
        component: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: any,
  ) {
    return this.prisma.task.create({
      data: {
        title: body.title,

        description:
          body.description,

        status:
          body.status,

        priority:
          body.priority,

        dueDate:
          body.dueDate,

        componentId:
          body.componentId,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prisma.task.update({
      where: {
        id,
      },

      data: {
        title:
          body.title !== undefined
            ? body.title
            : undefined,

        description:
          body.description !== undefined
            ? body.description
            : undefined,

        status:
          body.status !== undefined
            ? body.status
            : undefined,

        priority:
          body.priority !== undefined
            ? body.priority
            : undefined,

        dueDate:
          body.dueDate !== undefined
            ? body.dueDate
            : undefined,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.prisma.task.delete({
      where: {
        id,
      },
    })
  }
}