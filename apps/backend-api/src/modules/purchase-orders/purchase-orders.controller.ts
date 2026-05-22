import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.purchaseOrder.findMany({
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
    const totalAmount =
      (body.items || []).reduce(
        (
          sum: number,
          item: any,
        ) =>
          sum +
          Number(
            item.totalPrice || 0,
          ),
        0,
      )

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber:
          body.poNumber,

        supplierName:
          body.supplierName,

        projectName:
          body.projectName,

        requestedBy:
          body.requestedBy,

        note:
          body.note,

        totalAmount,

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
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prisma.purchaseOrder.update({
      where: {
        id,
      },

      data: {
        status:
          body.status,
      },
    })
  }
}