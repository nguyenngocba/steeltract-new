import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'
import { RuntimeGateway } from '../../core/ws/runtime.gateway'
import { EventStoreService } from '../../core/events/event-store.service'
import { TelemetryService } from '../../core/telemetry/telemetry.service'
import { InventoryRepository } from './inventory.repository'

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
    const items =
      await this.prisma.inventoryItem.findMany({
        take: 100,

        orderBy: {
          createdAt: 'desc',
        },
      })

    return items.map((item) => ({
      id: item.id,

      code: item.code,

      name: item.name,

      warehouse: 'MAIN-WH',

      quantity:
        item.quantity ?? 0,

      unit:
        item.unit ?? 'PCS',

      status:
        (item.quantity ?? 0) <= 5
          ? 'CRITICAL'
          : (item.quantity ?? 0) <= 25
            ? 'LOW_STOCK'
            : 'IN_STOCK',
    }))
  }

  async getItem(id: string) {
    return this.inventoryRepository.findItemById(
      id,
    )
  }

  async createItem(payload: any) {
    if (!payload.categoryId) {
      throw new Error(
        'categoryId is required',
      )
    }

    return this.inventoryRepository.createItem({
      code: payload.code,

      name: payload.name,

      description:
        payload.description,

      quantity:
        payload.quantity ?? 0,

      minimumStock:
        payload.minimumStock ?? 0,

      unit:
        payload.unit ?? 'PCS',

      category: {
        connect: {
          id:
            payload.categoryId,
        },
      },
    })
  }

  async updateItem(
    id: string,
    payload: any,
  ) {
    return this.inventoryRepository.updateItemInfo(
      id,
      {
        code:
          payload.code,

        name:
          payload.name,

        description:
          payload.description,

        quantity:
          payload.quantity,

        minimumStock:
          payload.minimumStock,

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
      },
    )
  }

  async deleteItem(id: string) {
    return this.inventoryRepository.deleteItem(
      id,
    )
  }

  async listTransactions() {
    return this.prisma.inventoryTransaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      take: 50,
    })
  }

  async createTransaction(
    payload: any,
  ) {
    const typeMap: Record<
      string,
      any
    > = {
      INBOUND:
        'IMPORT',

      OUTBOUND:
        'EXPORT',

      IMPORT:
        'IMPORT',

      EXPORT:
        'EXPORT',

      TRANSFER:
        'TRANSFER',

      RETURN:
        'RETURN',

      ADJUSTMENT:
        'ADJUSTMENT',
    }

    const transaction =
      await this.prisma.inventoryTransaction.create({
        data: {
          code:
            'TX-' +
            Date.now(),

          transactionNo:
            'INV-' +
            Date.now(),

          type:
            typeMap[
              payload.type
            ] ?? 'IMPORT',

          remarks:
            payload.material ??
            '',

          direction:
            payload.type ===
              'OUTBOUND' ||
            payload.type ===
              'EXPORT'
              ? 'OUT'
              : 'IN',
        },
      })

    const realtimeEvent = {
      id:
        transaction.id,

      type:
        transaction.type,

      remarks:
        transaction.remarks,

      createdAt:
        transaction.createdAt.toISOString(),
    }

    this.eventStore.append({
      id:
        Date.now().toString(),

      type:
        'inventory.transaction.created',

      payload:
        realtimeEvent,

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
  }

  async importStock(
    payload: any,
  ) {
    return this.createTransaction({
      type:
        'IMPORT',

      material:
        payload.material ??
        'IMPORT',
    })
  }
}