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

@Controller('material-requests')
export class MaterialRequestsController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.materialRequest.findMany({
      include: {
        items: true,
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
    return this.prisma.materialRequest.create({
      data: {
        requestNumber:
          body.requestNumber,

        projectName:
          body.projectName,

        requestedBy:
          body.requestedBy,

        note:
          body.note,

        items: {
          create:
            body.items || [],
        },
      },

      include: {
        items: true,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.prisma.materialRequest.delete({
      where: {
        id,
      },
    })
  }
}