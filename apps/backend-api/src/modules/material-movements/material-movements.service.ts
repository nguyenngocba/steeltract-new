import { Injectable }
  from '@nestjs/common'

import { Prisma, TransactionType }
  from '@prisma/client'

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

    const quantity = Number(payload.quantity ?? 0)
    const unitPrice = await this.resolveInventoryUnitPrice(
      item.id,
    )
    const totalAmount = Math.abs(quantity) * unitPrice

    const type = normalizeInventoryTransactionType(payload.type)
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const generatedNo =
        await nextOperationalCode(
          this.prisma,
          'inventoryTransaction',
          'transactionNo',
          inventoryCodePrefix(type),
        )
      console.log('[inventory.transaction-numbering]', {
        generatedNo,
        finalCode: generatedNo,
        finalTransactionNo: generatedNo,
        transactionType: type,
        attempt,
      })

      try {
        const transaction =
          await this.prisma.inventoryTransaction.create({
            data: {
              code: generatedNo,
              transactionNo: generatedNo,
              type,
              direction:
                type === TransactionType.TRANSFER
                  ? 'INTERNAL'
                  : type === TransactionType.EXPORT
                    ? 'OUT'
                    : 'IN',
              remarks:
                payload.remarks ??
                'Material movement created from runtime page',
              items: {
                create: [
                  {
                    inventoryItemId:
                      item.id,
                    quantity:
                      quantity,
                    unitPrice,
                    totalAmount,
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
      } catch (error) {
        if (isUniqueInventoryNumberError(error) && attempt < 3) {
          console.warn(
            '[inventory.transaction-numbering] duplicate generated number, retrying',
            {
              transactionType: type,
              attempt,
              target: (error as any)?.meta?.target,
            },
          )
          continue
        }
        throw error
      }
    }

    throw new Error('Unable to create material movement number after retries')
  }

  private async resolveInventoryUnitPrice(
    inventoryItemId: string,
  ) {
    const lines =
      await this.prisma.inventoryTransactionItem.findMany({
        where: {
          inventoryItemId,
          quantity: {
            gt: 0,
          },
          OR: [
            {
              unitPrice: {
                gt: 0,
              },
            },
            {
              totalAmount: {
                gt: 0,
              },
            },
          ],
        },
        select: {
          quantity: true,
          unitPrice: true,
          totalAmount: true,
        },
      })

    let quantity = 0
    let value = 0
    for (const line of lines) {
      const lineQuantity = Math.abs(
        Number(line.quantity ?? 0),
      )
      if (lineQuantity <= 0) continue
      const lineValue =
        line.totalAmount != null
          ? Math.abs(Number(line.totalAmount))
          : line.unitPrice != null
            ? Math.abs(Number(line.unitPrice)) *
              lineQuantity
            : 0
      if (lineValue <= 0) continue
      quantity += lineQuantity
      value += lineValue
    }

    return quantity > 0 ? value / quantity : 0
  }
}

function normalizeInventoryTransactionType(value: unknown) {
  const type = String(value ?? 'TRANSFER').toUpperCase()
  if (type === 'INBOUND') return TransactionType.IMPORT
  if (type === 'OUTBOUND') return TransactionType.EXPORT
  if (
    type === TransactionType.IMPORT ||
    type === TransactionType.EXPORT ||
    type === TransactionType.TRANSFER ||
    type === TransactionType.RETURN ||
    type === TransactionType.ADJUSTMENT
  ) {
    return type as TransactionType
  }
  return TransactionType.TRANSFER
}

function inventoryCodePrefix(type: TransactionType) {
  if (type === TransactionType.IMPORT) return 'NK'
  if (type === TransactionType.EXPORT) return 'XK'
  if (type === TransactionType.TRANSFER) return 'DC'
  if (type === TransactionType.ADJUSTMENT) return 'KK'
  return 'INV'
}

function isUniqueInventoryNumberError(error: unknown) {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false
  }
  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.map(String)
    : [String(error.meta?.target ?? '')]
  return target.some((field) => ['code', 'transactionNo'].includes(field))
}
