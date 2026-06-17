import { Injectable }
  from '@nestjs/common'

import { PrismaService }
  from '../../core/prisma/prisma.service'
import { nextOperationalCode }
  from '../../common/utils/code-generator'

@Injectable()
export class MaterialMovementsService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async list() {
    const rows =
      await this.prisma.inventoryTransactionItem.findMany({
        take: 50,
        include: {
          inventoryItem: true,
          transaction: {
            include: {
              zone: true,
              warehouse: true,
            },
          },
          zone: true,
          warehouse: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

    return rows.map((row) => ({
      id: row.id,
      type:
        row.transaction.direction ??
        row.transaction.type,
      material:
        row.inventoryItem.code,
      materialName:
        row.inventoryItem.name,
      quantity:
        row.quantity,
      warehouse:
        row.warehouse?.name ??
        row.transaction.warehouse?.name ??
        row.zone?.name ??
        row.transaction.zone?.name ??
        'Unassigned',
      createdAt:
        row.createdAt.toISOString(),
    }))
  }

  async create(
    payload: any,
  ) {
    const item =
      await this.prisma.inventoryItem.findFirst({
        where: {
          OR: [
            { id: payload.inventoryItemId },
            { code: payload.material },
          ],
        },
      })

    if (!item) {
      throw new Error('Inventory item not found')
    }

    const transaction =
      await this.prisma.inventoryTransaction.create({
        data: {
          code:
            await nextOperationalCode(this.prisma, 'inventoryTransaction', 'code', 'MOV'),
          transactionNo:
            await nextOperationalCode(this.prisma, 'inventoryTransaction', 'transactionNo', 'MOV'),
          type:
            payload.type ?? 'TRANSFER',
          direction:
            payload.type ?? 'INTERNAL',
          remarks:
            payload.remarks ??
            'Material movement created from runtime page',
          items: {
            create: [
              {
                inventoryItemId:
                  item.id,
                quantity:
                  Number(payload.quantity ?? 0),
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      })

    return transaction.items[0]
  }
}
