import { Injectable } from '@nestjs/common'
import { Prisma, TransactionType } from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'
import { RuntimeGateway } from '../../core/ws/runtime.gateway'
import { EventStoreService } from '../../core/events/event-store.service'
import { TelemetryService } from '../../core/telemetry/telemetry.service'
import { InventoryRepository } from './inventory.repository'

type NormalizedInventoryLine = {
  inventoryItemId: string
  quantity: number
  unitId?: string
  warehouseId?: string
  zoneId?: string
  slotId?: string
  level?: string
  unitPrice: number | null
  totalAmount: number | null
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly inventoryRepository:
      InventoryRepository,

    private readonly gateway:
      RuntimeGateway,

    private readonly eventStore:
      EventStoreService,

    private readonly telemetry:
      TelemetryService,
  ) {}

  async getItems() {
    const items = await this.inventoryRepository.findItems({
      take: 100,
    })
    const stockByItemId = await this.getStockMap(
      items.map((item) => item.id),
    )

    return items.map((item) => {
      const quantity =
        stockByItemId[item.id] ?? item.quantity ?? 0

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        quantity,
        minimumStock: item.minimumStock ?? 0,
        unit:
          item.unit ?? item.unitMaster?.code ?? 'PCS',
        categoryId: item.categoryId,
        category: item.category?.name ?? '',
        materialTypeId: item.materialTypeId,
        materialType:
          item.materialType?.name ?? '',
        materialUsageType: item.materialUsageType,
        zoneId: item.zoneId,
        zone: item.zone
          ? `${item.zone.code} - ${item.zone.name}`
          : '',
        zoneCode: item.zone?.code ?? '',
        zoneName: item.zone?.name ?? '',
        status:
          quantity <= 5
            ? 'CRITICAL'
            : quantity <= 25
              ? 'LOW_STOCK'
              : 'IN_STOCK',
      }
    })
  }

  async getItem(id: string) {
    return this.inventoryRepository.findItemById(
      id,
    )
  }

  async getItemDetail(id: string) {
    const item =
      await this.inventoryRepository.findItemById(
        id,
      )
    if (!item) {
      throw new Error('Material not found')
    }
    const locationStocks =
      await this.prisma.inventoryLocationStock.findMany({
        where: {
          inventoryItemId: id,
          quantity: {
            gt: 0,
          },
        },
        include: {
          zone: {
            include: {
              warehouse: true,
            },
          },
        },
      })

    const transactions =
      await this.prisma.inventoryTransaction.findMany({
        where: {
          items: {
            some: {
              inventoryItemId: id,
            },
          },
        },
        orderBy: {
          transactionDate: 'desc',
        },
        include: {
          project: true,
          zone: {
            include: {
              warehouse: true,
            },
          },
          items: {
            where: {
              inventoryItemId: id,
            },
            include: {
              unit: true,
              warehouse: true,
              zone: {
                include: {
                  warehouse: true,
                },
              },
            },
          },
        },
      })

    const supplierIds = Array.from(
      new Set(
        transactions
          .map((tx) => tx.supplierId)
          .filter(Boolean),
      ),
    ) as string[]

    const suppliers = supplierIds.length
      ? await this.prisma.supplier.findMany({
          where: {
            id: {
              in: supplierIds,
            },
          },
        })
      : []
    const supplierMap = new Map(
      suppliers.map((supplier) => [
        supplier.id,
        supplier,
      ]),
    )

    const currentStock = transactions.reduce(
      (acc, tx) =>
        acc +
        tx.items.reduce(
          (lineAcc, line) =>
            lineAcc + Number(line.quantity ?? 0),
          0,
        ),
      0,
    )

    const inboundLines = transactions.flatMap((tx) =>
      tx.items
        .filter((line) => Number(line.quantity) > 0)
        .map((line) => ({
          transactionId: tx.id,
          type: this.toBusinessType(tx.type),
          transactionNo:
            tx.transactionNo ?? tx.code,
          transactionDate: tx.transactionDate,
          quantity: Number(line.quantity),
          unitPrice:
            line.unitPrice != null
              ? Number(line.unitPrice)
              : null,
          totalAmount:
            line.totalAmount != null
              ? Number(line.totalAmount)
              : null,
          signedQuantity: Number(line.quantity),
          unit:
            line.unit?.code ??
            item.unit ??
            item.unitMaster?.code ??
            'PCS',
          supplierId: tx.supplierId,
          supplierName: tx.supplierId
            ? supplierMap.get(tx.supplierId)?.name ??
              tx.supplierId
            : null,
          zoneId:
            line.zoneId ?? tx.zoneId ?? item.zoneId ?? null,
          zoneCode:
            line.zone?.code ??
            tx.zone?.code ??
            item.zone?.code ??
            null,
          zoneName:
            line.zone
              ? `${line.zone.code} - ${line.zone.name}`
              : tx.zone
                ? `${tx.zone.code} - ${tx.zone.name}`
                : item.zone
                  ? `${item.zone.code} - ${item.zone.name}`
                  : null,
          zoneRawName:
            line.zone?.name ??
            tx.zone?.name ??
            item.zone?.name ??
            null,
          attachmentName: null,
          remarks: tx.remarks,
        })),
    )

    const outboundLines = transactions.flatMap((tx) =>
      tx.items
        .filter((line) => Number(line.quantity) < 0)
        .map((line) => ({
          transactionId: tx.id,
          type: this.toBusinessType(tx.type),
          transactionNo:
            tx.transactionNo ?? tx.code,
          transactionDate: tx.transactionDate,
          quantity: Math.abs(Number(line.quantity)),
          signedQuantity: Number(line.quantity),
          unitPrice:
            line.unitPrice != null
              ? Number(line.unitPrice)
              : null,
          totalAmount:
            line.totalAmount != null
              ? Math.abs(Number(line.totalAmount))
              : null,
          unit:
            line.unit?.code ??
            item.unit ??
            item.unitMaster?.code ??
            'PCS',
          projectId: tx.projectId,
          projectName: tx.project?.name ?? null,
          zoneId:
            line.zoneId ?? tx.zoneId ?? item.zoneId ?? null,
          zoneCode:
            line.zone?.code ??
            tx.zone?.code ??
            item.zone?.code ??
            null,
          zoneName:
            line.zone
              ? `${line.zone.code} - ${line.zone.name}`
              : tx.zone
                ? `${tx.zone.code} - ${tx.zone.name}`
                : item.zone
                  ? `${item.zone.code} - ${item.zone.name}`
                  : null,
          zoneRawName:
            line.zone?.name ??
            tx.zone?.name ??
            item.zone?.name ??
            null,
          attachmentName: null,
          remarks: tx.remarks,
        })),
    )

    const locationBalances = locationStocks.map(
      (row) => ({
        zoneId: row.zoneId,
        zoneCode: row.zone?.code ?? null,
        zoneName: row.zone
          ? `${row.zone.code} - ${row.zone.name}`
          : null,

        slotId: row.slotId,
        level: row.level,

        row: row.zone?.row ?? null,
        column: row.zone?.column ?? null,

        warehouseName:
          row.zone?.warehouse?.name ?? null,

        warehouseCode:
          row.zone?.warehouse?.code ?? null,

        quantity: Number(row.quantity),
      }),
    )
      .sort((a, b) => b.quantity - a.quantity)

    const inboundQuantity = inboundLines.reduce(
      (acc, line) => acc + line.quantity,
      0,
    )
    const inboundCost = inboundLines.reduce(
      (acc, line) =>
        acc +
        Number(
          line.totalAmount ??
            (line.unitPrice != null
              ? line.unitPrice * line.quantity
              : 0),
        ),
      0,
    )
    const averageCost =
      inboundQuantity > 0
        ? inboundCost / inboundQuantity
        : 0

    return {
      item: {
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        category: item.category?.name ?? '',
        categoryId: item.categoryId,
        materialTypeId: item.materialTypeId,
        materialType: item.materialType?.name ?? '',
        materialUsageType: item.materialUsageType,
        zoneId: item.zoneId,
        slotId: item.slotId,
        level: item.level,
        zoneCode: item.zone?.code ?? '',
        zoneName: item.zone
          ? `${item.zone.code} - ${item.zone.name}`
          : '',
        minimumStock: item.minimumStock ?? 0,
        unit: item.unit ?? item.unitMaster?.code ?? 'PCS',
      },

      currentStock,
      averageCost,

      inboundHistory: inboundLines,
      outboundHistory: outboundLines,

      supplierHistory: inboundLines,
      projectConsumptionHistory: outboundLines,

      locationBalances,
    }
  }

  async getInventoryAudit() {
    const items = await this.inventoryRepository.findItems({
      take: 1000,
    })

    if (items.length === 0) {
      return []
    }

    const itemIds = items.map((item) => item.id)

    const transactionLines =
      await this.prisma.inventoryTransactionItem.findMany({
        where: {
          inventoryItemId: {
            in: itemIds,
          },
        },
        include: {
          transaction: {
            select: {
              transactionDate: true,
              zoneId: true,
              zone: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  row: true,
                  column: true,
                  level: true,
                  warehouse: {
                    select: {
                      code: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          zone: {
            select: {
              id: true,
              code: true,
              name: true,
              row: true,
              column: true,
              level: true,
              warehouse: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      })

    const metricsByItem = new Map<
      string,
      {
        stock: number
        inboundQty: number
        inboundValue: number
        lastMovementDate: Date | null
      }
    >()
    const locationBalancesByItem = new Map<
      string,
      Map<
        string,
        {
          zoneId: string | null
          zoneCode: string | null
          zoneName: string

          warehouseCode: string | null
          warehouseName: string | null

          row: string | null
          column: string | null

          slotId: string | null
          level: string | null

          quantity: number
        }
      >
    >()

    for (const line of transactionLines) {
      const state =
        metricsByItem.get(line.inventoryItemId) ?? {
          stock: 0,
          inboundQty: 0,
          inboundValue: 0,
          lastMovementDate: null,
        }

      const qty = Number(line.quantity ?? 0)
      state.stock += qty

      if (qty > 0) {
        state.inboundQty += qty
        const amount =
          line.totalAmount != null
            ? Number(line.totalAmount)
            : line.unitPrice != null
              ? Number(line.unitPrice) * qty
              : 0
        state.inboundValue += amount
      }

      const movementDate =
        line.transaction?.transactionDate ?? null
      if (
        movementDate &&
        (!state.lastMovementDate ||
          movementDate > state.lastMovementDate)
      ) {
        state.lastMovementDate = movementDate
      }

      metricsByItem.set(line.inventoryItemId, state)

      const zone =
        line.zone ??
        line.transaction?.zone ??
        null
      const zoneId =
        line.zoneId ??
        line.transaction?.zoneId ??
        null
      const fallbackKey = [
        zoneId ?? 'UNASSIGNED',
        line.slotId ?? 'NOSLOT',
        line.level ?? 'L1',
      ].join('|')
      const byLocation =
        locationBalancesByItem.get(line.inventoryItemId) ??
        new Map()
      const current =
        byLocation.get(fallbackKey) ?? {
          zoneId,
          zoneCode: zone?.code ?? null,
          zoneName: zone
            ? `${zone.code} - ${zone.name}`
            : 'KHU MẶC ĐỊNH',

          warehouseCode: zone?.warehouse?.code ?? null,
          warehouseName: zone?.warehouse?.name ?? null,

          row: zone?.row ?? null,
          column: zone?.column ?? null,

          slotId: line.slotId ?? null,
          level: line.level ?? null,

          quantity: 0,
        }
      current.quantity += qty
      byLocation.set(fallbackKey, current)
      locationBalancesByItem.set(
        line.inventoryItemId,
        byLocation,
      )
    }

    return items.map((item) => {
      const metrics = metricsByItem.get(item.id)
      const currentStock = Number(
        metrics?.stock ?? item.quantity ?? 0,
      )
      const averageCost =
        (metrics?.inboundQty ?? 0) > 0
          ? Number(metrics?.inboundValue ?? 0) /
            Number(metrics?.inboundQty ?? 1)
          : 0
      const inventoryValue = currentStock * averageCost
      const locationBalances = Array.from(
        locationBalancesByItem.get(item.id)?.values() ?? [],
      )
        .filter((location) => location.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
      const fallbackLocation = item.zone
        ? {
            zoneId: item.zoneId,
            zoneCode: item.zone.code,
            zoneName: `${item.zone.code} - ${item.zone.name}`,
            warehouseCode: item.zone.warehouse?.code ?? null,
            warehouseName: item.zone.warehouse?.name ?? null,
            row: item.zone.row ?? null,
            column: item.zone.column ?? null,
            level: item.zone.level ?? null,
            quantity: currentStock,
          }
        : null
      const displayLocations =
        locationBalances.length > 0
          ? locationBalances
          : fallbackLocation
            ? [fallbackLocation]
            : []

      return {
        materialId: item.id,
        materialCode: item.code,
        materialName: item.name,
        categoryId: item.categoryId,
        category: item.category?.name ?? '',
        materialTypeId: item.materialTypeId,
        materialType:
          item.materialType?.name ?? '',
        materialUsageType: item.materialUsageType,
        minimumStock: item.minimumStock ?? 0,
        unit:
          item.unit ?? item.unitMaster?.code ?? 'PCS',
        zoneId: item.zoneId,
        slotId: item.slotId,
        level: item.level,
        zoneCode: item.zone?.code ?? '',
        zoneName: item.zone?.name ?? '',
        zone: item.zone
          ? `${item.zone.code} - ${item.zone.name}`
          : '',
        position: item.zone
          ? `${item.zone.code} - ${item.zone.name}`
          : '',
        locationBalances: displayLocations,
        currentStock,
        averageCost,
        inventoryValue,
        lastMovementDate:
          metrics?.lastMovementDate?.toISOString() ??
          null,
      }
    })
  }

  async createItem(payload: any) {
    const defaultCategory =
      await this.prisma.inventoryCategory.findFirst({
        orderBy: {
          createdAt: 'asc',
        },
      })

    if (!defaultCategory) {
      throw new Error(
        'No inventory category found',
      )
    }

    return this.inventoryRepository.createItem({
      code: payload.code,
      name: payload.name,
      description: payload.description,
      minimumStock:
        payload.minimumStock ?? 0,
      materialUsageType:
        payload.materialUsageType ?? 'PRIMARY',
      unit: payload.unit ?? 'PCS',
      category: {
        connect: {
          id:
            payload.categoryId ??
            defaultCategory.id,
        },
      },
      ...(payload.zoneId && {
        zone: {
          connect: {
            id: payload.zoneId,
          },
        },
      }),
      slotId: payload.slotId ?? null,
      level: payload.level ?? null,
      ...(payload.materialTypeId && {
        materialType: {
          connect: {
            id: payload.materialTypeId,
          },
        },
      }),
    })
  }
  async updateItem(
    id: string,
    payload: any,
  ) {
    const data: Prisma.InventoryItemUpdateInput = {
      code:
        payload.code,

      name:
        payload.name,

      description:
        payload.description,

      minimumStock:
        payload.minimumStock,

      materialUsageType:
        payload.materialUsageType,

      unit:
        payload.unit,

      ...(payload.categoryId && {
        category: {
          connect: {
            id:
              payload.categoryId,
          },
        },
      }),

      ...(payload.materialTypeId && {
        materialType: {
          connect: {
            id:
              payload.materialTypeId,
          },
        },
      }),
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'zoneId')) {
      data.zone = payload.zoneId
        ? {
            connect: {
              id:
                payload.zoneId,
            },
          }
        : {
            disconnect: true,
          }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'slotId')) {
      data.slotId = payload.slotId ?? null
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'level')) {
      data.level = payload.level ?? null
    }

    return this.inventoryRepository.updateItemInfo(
      id,
      data,
    )
  }

  async deleteItem(id: string) {
    return this.inventoryRepository.deleteItem(
      id,
    )
  }

  async listTransactions(filters?: {
    fromDate?: string
    toDate?: string
    supplierId?: string
    projectId?: string
    type?: string
  }) {
    const dbTypes = this.mapBusinessTypeToDbTypes(
      filters?.type,
    )
    const toDate =
      filters?.toDate != null
        ? new Date(filters.toDate)
        : undefined
    if (toDate) {
      toDate.setHours(23, 59, 59, 999)
    }
    const rows = await this.inventoryRepository.listTransactions({
      take: 200,
      ...(filters?.fromDate && {
        fromDate: new Date(filters.fromDate),
      }),
      ...(toDate && {
        toDate,
      }),
      supplierId: filters?.supplierId,
      projectId: filters?.projectId,
      ...(dbTypes.length && {
        transactionTypes: dbTypes,
      }),
    })

    const supplierIds = Array.from(
      new Set(
        rows
          .map((row) => row.supplierId)
          .filter(Boolean),
      ),
    ) as string[]
    const suppliers = supplierIds.length
      ? await this.prisma.supplier.findMany({
          where: {
            id: {
              in: supplierIds,
            },
          },
        })
      : []
    const supplierMap = new Map(
      suppliers.map((supplier) => [
        supplier.id,
        supplier.name,
      ]),
    )

    return rows.map((row) => {
      const businessType =
        this.toBusinessType(row.type)
      return {
        ...row,
        rawType: row.type,
        type: businessType,
        businessType,
        direction:
          this.toBusinessDirection(
            businessType,
            row.direction,
          ),
        supplierName: row.supplierId
          ? supplierMap.get(row.supplierId) ??
            row.supplierId
          : null,
        projectName: row.project?.name ?? null,
      }
    })
  }

  async getTransactionDetail(id: string) {
    const transaction =
      await this.prisma.inventoryTransaction.findUnique({
        where: { id },
        include: {
          transactionType: true,
          project: true,
          warehouse: true,
          zone: true,
          items: {
            include: {
              inventoryItem: true,
              unit: true,
              warehouse: true,
              zone: true,
            },
          },
        },
      })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    const supplier = transaction.supplierId
      ? await this.prisma.supplier.findUnique({
          where: { id: transaction.supplierId },
        })
      : null

    const businessType =
      this.toBusinessType(transaction.type)

    return {
      ...transaction,
      rawType: transaction.type,
      type: businessType,
      businessType,
      direction: this.toBusinessDirection(
        businessType,
        transaction.direction,
      ),
      supplier,
      supplierName: supplier?.name ?? null,
      projectName: transaction.project?.name ?? null,
    }
  }

  async createTransaction(
    payload: any,
  ) {
    const typeMap: Record<string, TransactionType> =
      {
        INBOUND: 'IMPORT',
        OUTBOUND: 'EXPORT',
        IMPORT: 'IMPORT',
        EXPORT: 'EXPORT',
        TRANSFER: 'TRANSFER',
        RETURN: 'RETURN',
        ADJUSTMENT: 'ADJUSTMENT',
      }

    const type =
      typeMap[String(payload.type ?? '').toUpperCase()] ??
      'IMPORT'
    const businessType =
      this.toBusinessType(type)
    const direction =
      this.toBusinessDirection(businessType)

    const baseItems =
      await this.resolveLineWarehouses(
        this.normalizeItems(
          payload,
          type,
        ),
      )
    if (!baseItems.length) {
      throw new Error(
        'Transaction requires at least one item',
      )
    }

    return this.inventoryRepository.transaction(
      async (tx) => {
        for (const line of baseItems) {
          const item =
            await this.inventoryRepository.findItemById(
              line.inventoryItemId,
              tx,
            )
          if (!item) {
            throw new Error(
              `Material not found: ${line.inventoryItemId}`,
            )
          }

          if (line.quantity < 0) {
            const hasLocation =
              Boolean(line.warehouseId) ||
              Boolean(line.zoneId) ||
              Boolean(line.slotId) ||
              Boolean(line.level)
            const locationLookup = hasLocation
              ? await this.getLocationStockLookup(line, tx)
              : null
            const currentStock = locationLookup
              ? locationLookup.quantity
              : await this.getCurrentStock(line.inventoryItemId, tx)
            if (currentStock + line.quantity < 0) {
              console.warn(
                '[inventory.stock-check] insufficient stock',
                {
                  requestPayload: payload,
                  normalizedLine: line,
                  bucketQuery: locationLookup?.where ?? null,
                  bucketFound: locationLookup?.stock ?? null,
                  currentStock,
                  requestedDelta: line.quantity,
                },
              )
              throw new Error(
                hasLocation
                  ? `Insufficient stock for ${item.code} at selected location`
                  : `Insufficient stock for ${item.code}`,
              )
            }
          }
        }

        const timestamp = Date.now()
        const transaction =
          await this.inventoryRepository.createTransaction(
            {
              code:
                payload.code ??
                `TX-${timestamp}`,
              transactionNo:
                payload.transactionNo ??
                `INV-${timestamp}`,
              type,
              direction,
              note: payload.note,
              performedBy:
                payload.performedBy,
              approvedBy:
                payload.approvedBy,
              referenceModule:
                payload.referenceModule,
              referenceId:
                payload.referenceId,
              supplierId:
                payload.supplierId,
              remarks:
                payload.remarks ??
                payload.invoiceNo ??
                '',
              transactionDate:
                payload.transactionDate
                  ? new Date(
                      payload.transactionDate,
                    )
                  : new Date(),
              ...(payload.transactionTypeId && {
                transactionType: {
                  connect: {
                    id: payload.transactionTypeId,
                  },
                },
              }),
              ...(payload.projectId && {
                project: {
                  connect: {
                    id: payload.projectId,
                  },
                },
              }),
              ...(payload.warehouseId && {
                warehouse: {
                  connect: {
                    id: payload.warehouseId,
                  },
                },
              }),
              ...(payload.zoneId && {
                zone: {
                  connect: {
                    id: payload.zoneId,
                  },
                },
              }),
              items: {
                create: baseItems.map((line) => ({
                  inventoryItem: {
                    connect: {
                      id: line.inventoryItemId,
                    },
                  },
                  quantity: line.quantity,
                  unitPrice:
                    line.unitPrice ?? null,
                  totalAmount:
                    line.totalAmount ?? null,
                  ...(line.unitId && {
                    unit: {
                      connect: {
                        id: line.unitId,
                      },
                    },
                  }),
                  ...(line.warehouseId && {
                    warehouse: {
                      connect: {
                        id: line.warehouseId,
                      },
                    },
                  }),
                  ...(line.zoneId && {
                    zone: {
                      connect: {
                        id: line.zoneId,
                      },
                    },
                  }),
                  slotId: line.slotId,
                  level: line.level ?? null,
                })),
              },
            },
            tx,
          )

        // Keep backward compatibility for modules still reading snapshot quantity.
        for (const line of baseItems) {
          await this.inventoryRepository.updateItemQuantitySnapshot(
            line.inventoryItemId,
            line.quantity,
            tx,
          )

          if (
            line.warehouseId ||
            line.zoneId ||
            line.slotId ||
            line.level
          ) {
            await this.inventoryRepository.upsertLocationStock(
              {
                inventoryItemId: line.inventoryItemId,
                warehouseId: line.warehouseId,
                zoneId: line.zoneId,
                slotId: line.slotId,
                level: line.level,
                quantity: line.quantity,
              },
              tx,
            )
          }
        }

        const realtimeEvent = {
          id: transaction.id,
          type:
            this.toBusinessType(
              transaction.type,
            ),
          rawType:
            transaction.type,
          direction: transaction.direction,
          transactionNo:
            transaction.transactionNo ??
            transaction.code,
          createdAt:
            transaction.createdAt.toISOString(),
        }

        this.eventStore.append({
          id: `${timestamp}`,
          type:
            'inventory.transaction.created',
          payload: realtimeEvent,
          createdAt:
            new Date().toISOString(),
        })

        this.gateway.emit(
          'inventory.transaction.created',
          realtimeEvent,
        )
        this.telemetry.track(
          'inventory.transactions',
          1,
        )

        return transaction
      },
    )
  }

  async importStock(
    payload: any,
  ) {
    return this.createTransaction({
      type:
        'INBOUND',
      materialId:
        payload.materialId,
      quantity:
        payload.quantity ?? 0,
      supplierId:
        payload.supplierId,
      invoiceNo:
        payload.invoiceNo,
      unitPrice:
        payload.unitPrice,
    })
  }

  private normalizeItems(
    payload: any,
    type: TransactionType,
  ): NormalizedInventoryLine[] {
    const rawItems: Array<any> =
      Array.isArray(payload.items) &&
      payload.items.length > 0
        ? payload.items
        : payload.materialId
          ? [
              {
                inventoryItemId:
                  payload.materialId,
                quantity: payload.quantity,
                unitId: payload.unitId,
                warehouseId:
                  payload.warehouseId,
                zoneId: payload.zoneId,
                slotId: payload.slotId,
                level: payload.level,
                unitPrice:
                  payload.unitPrice,
                totalAmount:
                  payload.totalAmount,
              },
            ]
          : []

    return rawItems.map((item) => {
      const parsedQuantity = Number(
        item.quantity ?? 0,
      )
      if (
        !item.inventoryItemId ||
        !Number.isFinite(parsedQuantity) ||
        parsedQuantity === 0
      ) {
        throw new Error('Invalid transaction item')
      }

      const signedQuantity =
        type === 'EXPORT'
          ? -Math.abs(parsedQuantity)
          : type === 'IMPORT'
            ? Math.abs(parsedQuantity)
            : parsedQuantity

      const parsedUnitPrice =
        item.unitPrice != null
          ? Number(item.unitPrice)
          : payload.unitPrice != null
            ? Number(payload.unitPrice)
            : null
      const safeUnitPrice =
        parsedUnitPrice != null &&
        Number.isFinite(parsedUnitPrice)
          ? parsedUnitPrice
          : null
      const parsedTotalAmount =
        item.totalAmount != null
          ? Number(item.totalAmount)
          : payload.totalAmount != null
            ? Number(payload.totalAmount)
            : null
      const totalAmount =
        parsedTotalAmount != null &&
        Number.isFinite(parsedTotalAmount)
          ? parsedTotalAmount
          : safeUnitPrice != null
            ? safeUnitPrice * signedQuantity
            : null

      return {
        inventoryItemId: item.inventoryItemId,
        quantity: signedQuantity,
        unitId:
          item.unitId ?? payload.unitId ?? undefined,
        warehouseId:
          item.warehouseId ??
          (item.zoneId ? undefined : payload.warehouseId) ??
          undefined,
        zoneId:
          item.zoneId ?? payload.zoneId ?? undefined,
        slotId:
          item.slotId ?? payload.slotId ?? undefined,
        level:
          item.level ?? payload.level ?? undefined,  
        unitPrice: safeUnitPrice,
        totalAmount,
      }
    })
  }

  private async resolveLineWarehouses(
    lines: NormalizedInventoryLine[],
  ): Promise<NormalizedInventoryLine[]> {
    const zoneIds = Array.from(
      new Set(
        lines
          .filter((line) => !line.warehouseId && line.zoneId)
          .map((line) => line.zoneId as string),
      ),
    )

    if (!zoneIds.length) {
      return lines
    }

    const zones = await this.prisma.warehouseZone.findMany({
      where: {
        id: {
          in: zoneIds,
        },
      },
      select: {
        id: true,
        warehouseId: true,
      },
    })
    const warehouseByZoneId = new Map(
      zones.map((zone) => [zone.id, zone.warehouseId]),
    )

    return lines.map((line) => ({
      ...line,
      warehouseId:
        line.warehouseId ??
        (line.zoneId
          ? warehouseByZoneId.get(line.zoneId) ?? undefined
          : undefined),
    }))
  }

  private async getCurrentStock(
    inventoryItemId: string,
    tx: any = this.prisma,
  ) {
    const aggregate =
      await tx.inventoryTransactionItem.aggregate({
        where: { inventoryItemId },
        _sum: { quantity: true },
      })

    if (aggregate._sum.quantity != null) {
      return Number(aggregate._sum.quantity)
    }

    const item =
      await this.inventoryRepository.findItemById(
        inventoryItemId,
        tx,
      )
    return Number(item?.quantity ?? 0)
  }

  private async getLocationStockLookup(
    line: {
      inventoryItemId: string
      warehouseId?: string | null
      zoneId?: string | null
      slotId?: string | null
      level?: string | null
    },
    tx: any = this.prisma,
  ) {
    const where = {
      inventoryItemId: line.inventoryItemId,
      warehouseId: line.warehouseId ?? null,
      zoneId: line.zoneId ?? null,
      slotId: line.slotId ?? null,
      level: line.level ?? null,
    }
    const stock = await tx.inventoryLocationStock.findFirst({
      where,
    })

    return {
      where,
      stock,
      quantity: Number(stock?.quantity ?? 0),
    }
  }

  private async getStockMap(itemIds: string[]) {
    if (itemIds.length === 0) {
      return {}
    }

    const grouped =
      await this.prisma.inventoryTransactionItem.groupBy({
        by: ['inventoryItemId'],
        where: {
          inventoryItemId: {
            in: itemIds,
          },
        },
        _sum: {
          quantity: true,
        },
      })

    return grouped.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.inventoryItemId] = Number(
          row._sum.quantity ?? 0,
        )
        return acc
      },
      {},
    )
  }

  private toBusinessType(
    value:
      | TransactionType
      | string
      | null
      | undefined,
  ) {
    const upper = String(value ?? '')
      .trim()
      .toUpperCase()
    if (upper === 'IMPORT' || upper === 'INBOUND') {
      return 'INBOUND'
    }
    if (upper === 'EXPORT' || upper === 'OUTBOUND') {
      return 'OUTBOUND'
    }
    if (upper === 'TRANSFER') {
      return 'TRANSFER'
    }
    if (upper === 'RETURN') {
      return 'RETURN'
    }
    if (upper === 'ADJUSTMENT') {
      return 'ADJUSTMENT'
    }
    return 'INBOUND'
  }

  private toBusinessDirection(
    businessType: string,
    legacyDirection?: string | null,
  ) {
    if (businessType === 'OUTBOUND') {
      return 'OUTBOUND'
    }
    if (businessType === 'TRANSFER') {
      return 'INTERNAL'
    }
    if (businessType === 'RETURN') {
      return 'INBOUND'
    }
    if (businessType === 'ADJUSTMENT') {
      const legacy = String(
        legacyDirection ?? '',
      )
        .trim()
        .toUpperCase()
      return legacy === 'OUT' ||
        legacy === 'OUTBOUND'
        ? 'OUTBOUND'
        : 'INBOUND'
    }
    return 'INBOUND'
  }

  private mapBusinessTypeToDbTypes(
    type?: string,
  ): Array<
    | 'IMPORT'
    | 'EXPORT'
    | 'TRANSFER'
    | 'RETURN'
    | 'ADJUSTMENT'
  > {
    const upper = String(type ?? '')
      .trim()
      .toUpperCase()
    if (!upper) {
      return [] as Array<
        | 'IMPORT'
        | 'EXPORT'
        | 'TRANSFER'
        | 'RETURN'
        | 'ADJUSTMENT'
      >
    }
    if (upper === 'INBOUND') {
      return ['IMPORT']
    }
    if (upper === 'OUTBOUND') {
      return ['EXPORT']
    }
    if (
      upper === 'TRANSFER' ||
      upper === 'RETURN' ||
      upper === 'ADJUSTMENT'
    ) {
      return [
        upper as
          | 'TRANSFER'
          | 'RETURN'
          | 'ADJUSTMENT',
      ]
    }
    if (upper === 'IMPORT' || upper === 'EXPORT') {
      return [upper]
    }
    return [] as Array<
      | 'IMPORT'
      | 'EXPORT'
      | 'TRANSFER'
      | 'RETURN'
      | 'ADJUSTMENT'
    >
  }
}
