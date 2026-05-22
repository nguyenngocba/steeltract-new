import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('supplier-score')
export class SupplierScoreController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.supplierScore.findMany({
      orderBy: {
        overall: 'desc',
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: any,
  ) {
    const overall =
      (
        body.quality +
        body.delivery +
        body.pricing
      ) / 3

    return this.prisma.supplierScore.create({
      data: {
        supplierName:
          body.supplierName,

        quality:
          Number(
            body.quality,
          ),

        delivery:
          Number(
            body.delivery,
          ),

        pricing:
          Number(
            body.pricing,
          ),

        overall,
      },
    })
  }
}