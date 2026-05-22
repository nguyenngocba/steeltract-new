import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('transactions')
export class TransactionsController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.inventoryTransaction.findMany({
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
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
    const transaction =
      await this.prisma.inventoryTransaction.create({
        data: {
          code: body.code,
          type: body.type,
          note: body.note,

          items: {
            create: body.items.map(
              (item: any) => ({
                quantity:
                  item.quantity,

                inventoryItem: {
                  connect: {
                    id: item.inventoryItemId,
                  },
                },
              }),
            ),
          },
        },

        include: {
          items: true,
        },
      })

    for (const item of body.items) {
      const inventory =
        await this.prisma.inventoryItem.findUnique({
          where: {
            id: item.inventoryItemId,
          },
        })

      if (!inventory) continue

      let quantity =
        inventory.quantity

      if (
        body.type === 'IMPORT'
      ) {
        quantity += item.quantity
      }

      if (
        body.type === 'EXPORT'
      ) {
        quantity -= item.quantity
      }

      if (
        body.type === 'RETURN'
      ) {
        quantity += item.quantity
      }

      await this.prisma.inventoryItem.update({
        where: {
          id: inventory.id,
        },

        data: {
          quantity,
        },
      })
    }

    return transaction
  }
}