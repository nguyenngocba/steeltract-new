import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('vehicles')
export class VehiclesController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.vehicle.findMany({
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
    return this.prisma.vehicle.create({
      data: {
        plateNumber:
          body.plateNumber,

        name:
          body.name,

        type:
          body.type,

        driverName:
          body.driverName,

        fuelType:
          body.fuelType,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.prisma.vehicle.delete({
      where: {
        id,
      },
    })
  }
}