import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('workers')
export class WorkersController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.worker.findMany({
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
    return this.prisma.worker.create({
      data: {
        employeeCode:
          body.employeeCode,

        fullName:
          body.fullName,

        position:
          body.position,

        team:
          body.team,

        phone:
          body.phone,

        skill:
          body.skill,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.prisma.worker.delete({
      where: {
        id,
      },
    })
  }
}