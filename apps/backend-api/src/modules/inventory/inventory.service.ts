import { Injectable }
  from '@nestjs/common'

import { PrismaService }
  from '../../core/prisma/prisma.service'

import { RuntimeGateway }
  from '../../core/ws/runtime.gateway'

import { EventStoreService }
  from '../../core/events/event-store.service'


import { TelemetryService }
  from '../../core/telemetry/telemetry.service'

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma:
      PrismaService,

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
            payload.type ??
            'IMPORT',

          remarks:
            payload.material ??
            '',

          direction:
            payload.type === 'OUTBOUND'
              ? 'OUT'
              : 'IN',
        },
      })

    const realtimeEvent = {
      id:
        Date.now().toString(),

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
      type: 'IMPORT',

      material:
        payload.material ??
        'IMPORT',
    })
  }
}