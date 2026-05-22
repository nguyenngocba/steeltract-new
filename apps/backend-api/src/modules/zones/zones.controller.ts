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

@Controller('zones')
export class ZonesController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.warehouseZone.findMany({
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
    return this.prisma.warehouseZone.create({
      data: {
        code: body.code,

        name: body.name,

        description:
          body.description,

        color:
          body.color,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.prisma.warehouseZone.delete({
      where: {
        id,
      },
    })
  }
}