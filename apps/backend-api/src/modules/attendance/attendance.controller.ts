import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('attendance')
export class AttendanceController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.attendance.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-in')
  async checkIn(
    @Body() body: any,
  ) {
    return this.prisma.attendance.create({
      data: {
        workerName:
          body.workerName,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/check-out')
  async checkOut(
    @Param('id') id: string,
  ) {
    return this.prisma.attendance.update({
      where: {
        id,
      },

      data: {
        checkOut:
          new Date(),
      },
    })
  }
}