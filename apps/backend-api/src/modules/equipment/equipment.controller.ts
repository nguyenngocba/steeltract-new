import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('equipment')
export class EquipmentController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.equipmentBooking.findMany({
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
    return this.prisma.equipmentBooking.create({
      data: {
        equipmentName:
          body.equipmentName,

        projectName:
          body.projectName,

        assignedTo:
          body.assignedTo,

        startDate:
          body.startDate,

        endDate:
          body.endDate,
      },
    })
  }
}