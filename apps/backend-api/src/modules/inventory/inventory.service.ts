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
      await this.inventoryRepository.findItems({
        take: 100,
      })

    return items.map((item) => ({

      id: item.id,

      code: item.code,

      name: item.name,

      description:
        item.description,

      quantity:
        item.quantity ?? 0,

      minimumStock:
        item.minimumStock ?? 0,

      unit:
        item.unit ??
        item.unitMaster?.code ??
        'PCS',

      categoryId:
        item.categoryId,

      category:
        item.category?.name ?? '',

      materialTypeId:
        item.materialTypeId,

      materialType:
        item.materialType?.name ?? '',

      zoneId:
        item.zoneId,

      zone:
        item.zone?.name ?? '',

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
    code:
      payload.code,

    name:
      payload.name,

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
          payload.categoryId ??
          defaultCategory.id,
      },
    },
    ...(payload.zoneId && {
        zone: {
          connect: {
            id:
              payload.zoneId,
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

      ...(payload.zoneId && {
        zone: {
          connect: {
            id:
              payload.zoneId,
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

  const quantity =
  Number(
    payload.quantity ?? 0,
  )

let materialName = ''

if (
  payload.materialId
) {

  const item =
    await this.inventoryRepository
      .findItemById(
        payload.materialId,
      )

  if (!item) {

    throw new Error(
      'Material not found',
    )
  }

  materialName =
    item.name

  if (
    (
      payload.type ===
        'OUTBOUND' ||
      payload.type ===
        'EXPORT'
    ) &&
    (
      item.quantity ?? 0
    ) < quantity
  ) {

    throw new Error(
      'Insufficient stock',
    )
  }
}

  if (
    payload.materialId &&
    (
      payload.type ===
        'OUTBOUND' ||
      payload.type ===
        'EXPORT'
    )
  ) {

    const item =
      await this.inventoryRepository
        .findItemById(
          payload.materialId,
        )

    if (!item) {

      throw new Error(
        'Material not found',
      )
    }

    if (
      (item.quantity ?? 0) <
      quantity
    ) {

      throw new Error(
        'Insufficient stock',
      )
    }
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
        materialName ||
        payload.material ||
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

  if (
    payload.materialId &&
    quantity > 0
  ) {

    if (
      payload.type ===
        'INBOUND' ||
      payload.type ===
        'IMPORT'
    ) {

      await this.inventoryRepository
        .updateItemQuantitySnapshot(
          payload.materialId,
          quantity,
        )
    }

    if (
      payload.type ===
        'OUTBOUND' ||
      payload.type ===
        'EXPORT'
    ) {

      await this.inventoryRepository
        .updateItemQuantitySnapshot(
          payload.materialId,
          -quantity,
        )
    }
  }

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