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

import { createActivityLog } from '../../common/utils/activity-log'

import { sendTelegram } from '../../core/telegram/telegram.service'

@Controller('inventory')
export class InventoryController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.inventoryItem.findMany({
      include: {
        category: true,
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
    const item =
      await this.prisma.inventoryItem.create({
        data: {
          code: body.code,
          name: body.name,

          quantity:
            Number(body.quantity),

          minimumStock:
            Number(
              body.minimumStock || 0,
            ),

          categoryId:
            body.categoryId,
        },

        include: {
          category: true,
        },
      })

    await createActivityLog(
      this.prisma,
      {
        action: 'CREATE',

        entity: 'InventoryItem',

        entityId: item.id,

        metadata: {
          name: item.name,
          code: item.code,
        },
      },
    )
      if (
        item.quantity <=
        item.minimumStock
      ) {
        sendTelegram(
          `LOW STOCK ALERT:
      ${item.name}
      Qty: ${item.quantity}`,
        )
      }
    return item
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prisma.inventoryItem.update({
      where: {
        id,
      },

      data: {
        name: body.name,
        code: body.code,

        quantity:
          Number(body.quantity),
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.prisma.inventoryItem.delete({
      where: {
        id,
      },
    })
  }
}