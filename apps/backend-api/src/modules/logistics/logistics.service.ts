import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  DispatchEventType,
  DispatchItemType,
  DispatchOrderStatus,
  Prisma,
} from '@prisma/client'

import { nextOperationalCode } from '../../common/utils/code-generator'
import { PrismaService } from '../../core/prisma/prisma.service'
import { DashboardReaderService } from '../../core/snapshots/dashboard-reader.service'
import { SnapshotReaderService } from '../../core/snapshots/snapshot-reader.service'
import { InventoryService } from '../inventory/inventory.service'
import { dispatchInclude, LogisticsRepository } from './logistics.repository'

const activeDispatchStatuses: DispatchOrderStatus[] = [
  'DRAFT',
  'PLANNED',
  'LOADING',
  'IN_TRANSIT',
  'ARRIVED',
  'RECEIVED',
]

@Injectable()
export class LogisticsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(LogisticsRepository)
    private readonly logisticsRepository: LogisticsRepository,
    @Inject(InventoryService)
    private readonly inventoryService: InventoryService,
    @Inject(DashboardReaderService)
    private readonly dashboardReader: DashboardReaderService,
    @Inject(SnapshotReaderService)
    private readonly snapshotReader: SnapshotReaderService,
  ) {}

  async listDispatchOrders() {
    return this.logisticsRepository.findDispatchOrders()
  }

  async getDispatchOrder(id: string) {
    const order = await this.logisticsRepository.findDispatchOrder(id)

    if (!order) {
      throw new NotFoundException('Dispatch order not found')
    }

    return order
  }

  async dashboard() {
    const result = await this.dashboardReader.read({
      module: 'logistics',
      snapshotType: 'DispatchDashboardSnapshot',
      loadSnapshot: async () => {
        const rows = await this.snapshotReader.dispatchDashboard()
        if (rows.length === 0) {
          return null
        }
        return {
          data: rows,
          updatedAt: rows.reduce((oldest, row) =>
            row.updatedAt.getTime() < oldest.getTime() ? row.updatedAt : oldest,
          rows[0].updatedAt),
          rowCount: rows.length,
        }
      },
      readSnapshot: async (rows) =>
        this.applyDispatchDashboardSnapshots(
          await this.dashboardRuntime(),
          rows,
        ),
      readRuntime: () => this.dashboardRuntime(),
      compare: (snapshot, runtime) =>
        this.compareRuntimeNumbers(snapshot.kpis, runtime.kpis, [
          'inTransit',
          'delivered',
          'completed',
        ]),
    })

    return result.data
  }

  private async dashboardRuntime() {
    const orders = await this.listDispatchOrders()
    const todayKey = this.dateKey(new Date())
    const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1
      return acc
    }, {})

    const trend = Object.values(
      orders.reduce<Record<string, { date: string; total: number; completed: number }>>((acc, order) => {
        const key = this.dateKey(order.plannedAt ?? order.createdAt)
        acc[key] ??= {
          date: key,
          total: 0,
          completed: 0,
        }
        acc[key].total += 1
        if (order.status === 'COMPLETED') {
          acc[key].completed += 1
        }
        return acc
      }, {}),
    ).sort((a, b) => a.date.localeCompare(b.date))

    const vehicleUtilization = Object.values(
      orders.reduce<Record<string, { vehicle: string; total: number; active: number }>>((acc, order) => {
        const vehicle = order.vehicle || 'Chưa gán xe'
        acc[vehicle] ??= {
          vehicle,
          total: 0,
          active: 0,
        }
        acc[vehicle].total += 1
        if (['LOADING', 'IN_TRANSIT', 'ARRIVED'].includes(order.status)) {
          acc[vehicle].active += 1
        }
        return acc
      }, {}),
    )

    return {
      kpis: {
        waiting: orders.filter((order) =>
          ['DRAFT', 'PLANNED', 'LOADING'].includes(order.status),
        ).length,
        inTransit: orders.filter((order) => order.status === 'IN_TRANSIT').length,
        delivered: orders.filter((order) =>
          ['ARRIVED', 'RECEIVED'].includes(order.status),
        ).length,
        completed: orders.filter((order) => order.status === 'COMPLETED').length,
        movementsToday: orders.filter((order) =>
          this.dateKey(order.createdAt) === todayKey,
        ).length,
      },
      statusCounts,
      trend,
      vehicleUtilization,
      recent: orders.slice(0, 12),
    }
  }

  private applyDispatchDashboardSnapshots(runtime: any, snapshots: any[]) {
    const snapshotTotals = snapshots.reduce(
      (totals, row) => {
        totals.inTransit += Number(row.inTransitCount ?? 0)
        totals.delivered += Number(row.arrivedCount ?? 0)
        totals.completed += Number(row.completedCount ?? 0)
        totals.delayed += Number(row.delayCount ?? 0)
        return totals
      },
      {
        inTransit: 0,
        delivered: 0,
        completed: 0,
        delayed: 0,
      },
    )

    return {
      ...runtime,
      kpis: {
        ...runtime.kpis,
        inTransit: snapshotTotals.inTransit,
        delivered: snapshotTotals.delivered,
        completed: snapshotTotals.completed,
      },
      statusCounts: {
        ...runtime.statusCounts,
        IN_TRANSIT: snapshotTotals.inTransit,
        ARRIVED: snapshotTotals.delivered,
        COMPLETED: snapshotTotals.completed,
      },
    }
  }

  private compareRuntimeNumbers(
    snapshot: Record<string, unknown>,
    runtime: Record<string, unknown>,
    fields: string[],
  ) {
    return fields.flatMap((field) => {
      const snapshotValue = Number(snapshot[field] ?? 0)
      const runtimeValue = Number(runtime[field] ?? 0)
      if (Math.abs(snapshotValue - runtimeValue) <= 0.0001) {
        return []
      }
      return [{
        field,
        snapshotValue,
        runtimeValue,
        reason: 'VALUE_MISMATCH' as const,
      }]
    })
  }

  async suggestDispatchItems(body: any) {
    const projectId = String(body?.projectId ?? '')
    if (!projectId) {
      throw new BadRequestException('projectId is required')
    }

    const taskWhere: {
      projectId: string
      projectTaskId?: string
    } = {
      projectId,
    }
    if (body?.projectTaskId) {
      taskWhere.projectTaskId = String(body.projectTaskId)
    }

    const tasks =
      await this.logisticsRepository.findProjectTasksForDispatchSuggestion(
        taskWhere,
      )

    const items = tasks.flatMap((task) => {
      const materialItems = task.materialAllocations
        .map((allocation) => {
          const missingQty = Math.max(
            0,
            Number(allocation.plannedQty ?? 0) -
              Number(allocation.issuedQty ?? 0),
          )
          if (missingQty <= 0) {
            return null
          }
          return {
            type: 'MATERIAL' as DispatchItemType,
            projectTaskId: task.id,
            projectTaskName: task.name,
            inventoryItemId: allocation.inventoryItemId,
            materialCode: allocation.inventoryItem.code,
            materialName: allocation.inventoryItem.name,
            quantity: missingQty,
            unit: allocation.inventoryItem.unit,
            reason: 'Thiếu vật tư theo kế hoạch task',
          }
        })
        .filter(Boolean)

      const componentItems = task.componentAllocations
        .filter((allocation) =>
          !['HANDED_OVER', 'RETURNED'].includes(allocation.status),
        )
        .map((allocation) => ({
          type: 'COMPONENT' as DispatchItemType,
          projectTaskId: task.id,
          projectTaskName: task.name,
          componentId: allocation.componentId,
          componentCode: allocation.component.code,
          componentName: allocation.component.name,
          quantity: 1,
          reason: 'Cấu kiện đã gán cho task',
        }))

      return [
        ...materialItems,
        ...componentItems,
      ]
    })

    return {
      projectId,
      tasks: tasks.map((task) => ({
        id: task.id,
        name: task.name,
        plannedStartAt: task.plannedStartAt,
        scheduledStartAt: task.scheduledStartAt,
      })),
      items,
    }
  }

  async createDispatchOrder(body: any) {
    const projectId = String(body?.projectId ?? '')
    if (!projectId) {
      throw new BadRequestException('projectId is required')
    }

    const items = this.normalizeItems(body?.items)
    await this.assertNoActiveComponentDispatch(items)

    const code = await nextOperationalCode(
      this.prisma,
      'dispatchOrder',
      'code',
      'DX',
    )

    const order = await this.logisticsRepository.createDispatchOrder({
        code,
        project: {
          connect: {
            id: projectId,
          },
        },
        ...(body?.projectTaskId && {
          projectTask: {
            connect: {
              id: String(body.projectTaskId),
            },
          },
        }),
        status: 'PLANNED',
        plannedAt: body?.plannedAt ? new Date(body.plannedAt) : null,
        vehicle: body?.vehicle ?? null,
        driver: body?.driver ?? null,
        notes: body?.notes ?? null,
        items: {
          create: items,
        },
        events: {
          create: {
            type: 'CREATED',
            message: 'Tạo lệnh điều xe.',
            createdBy: body?.createdBy ?? null,
          },
        },
      })

    await this.logActivity('PROJECT_DISPATCH_CREATED', 'DispatchOrder', order.id, {
      dispatchCode: order.code,
      projectId,
    })

    return order
  }

  async markLoading(id: string, body: any) {
    await this.assertStatus(id, ['DRAFT', 'PLANNED'])
    return this.updateStatus(
      id,
      'LOADING',
      'LOADING',
      'Đang bốc xếp hàng hóa.',
      {
        loadingChecklist: body?.checklist ?? {},
      },
      body?.createdBy,
    )
  }

  async depart(id: string, body: any) {
    await this.assertStatus(id, ['LOADING'])
    return this.updateStatus(
      id,
      'IN_TRANSIT',
      'DEPARTED',
      'Xe đã rời bãi.',
      {
        departedAt: new Date(),
      },
      body?.createdBy,
    )
  }

  async arrive(id: string, body: any) {
    await this.assertStatus(id, ['IN_TRANSIT'])
    return this.updateStatus(
      id,
      'ARRIVED',
      'ARRIVED',
      'Xe đã đến công trình.',
      {
        arrivedAt: new Date(),
      },
      body?.createdBy,
    )
  }

  async receive(id: string, body: any) {
    await this.assertStatus(id, ['ARRIVED'])
    const order = await this.getDispatchOrder(id)

    const materialItems = order.items.filter((item) =>
      item.type === 'MATERIAL' && item.inventoryItemId,
    )
    if (materialItems.length) {
      await this.inventoryService.createTransaction({
        type: 'EXPORT',
        projectId: order.projectId,
        referenceModule: 'logistics-dispatch',
        referenceId: order.id,
        performedBy: body?.receivedBy ?? body?.createdBy ?? null,
        note: JSON.stringify({
          source: 'PROJECT_DISPATCH',
          dispatchOrderId: order.id,
          dispatchCode: order.code,
          projectId: order.projectId,
          projectCode: order.project?.code,
          projectName: order.project?.name,
        }),
        remarks: `Công trường đã nhận điều xe ${order.code}`,
        items: materialItems.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: -Math.abs(Number(item.quantity ?? 0)),
        })),
      })
    }

    await this.reconcileProjectAllocations(order)

    const updated = await this.updateStatus(
      id,
      'RECEIVED',
      'RECEIVED',
      'Công trình đã nhận hàng.',
      {
        receivedAt: new Date(),
      },
      body?.createdBy,
    )

    await this.logActivity('PROJECT_DISPATCH_RECEIVED', 'DispatchOrder', id, {
      dispatchCode: order.code,
      projectId: order.projectId,
      projectCode: order.project?.code,
      projectName: order.project?.name,
      items: order.items.map((item) => ({
        type: item.type,
        inventoryItemId: item.inventoryItemId,
        componentId: item.componentId,
        quantity: item.quantity,
      })),
    })

    return updated
  }

  async complete(id: string, body: any) {
    await this.assertStatus(id, ['RECEIVED'])
    return this.updateStatus(
      id,
      'COMPLETED',
      'COMPLETED',
      'Hoàn thành giao nhận.',
      {},
      body?.createdBy,
    )
  }

  async cancel(id: string, body: any) {
    await this.assertStatus(id, [
      'DRAFT',
      'PLANNED',
      'LOADING',
      'IN_TRANSIT',
      'ARRIVED',
    ])
    return this.updateStatus(
      id,
      'CANCELLED',
      'CANCELLED',
      body?.message ?? 'Hủy lệnh điều xe.',
      {},
      body?.createdBy,
    )
  }

  private normalizeItems(items: any[]): Prisma.DispatchItemCreateWithoutDispatchOrderInput[] {
    if (!Array.isArray(items) || !items.length) {
      throw new BadRequestException('Dispatch order requires at least one item')
    }

    return items.map((item) => {
      const type = String(item?.type ?? '').toUpperCase()
      const quantity = Number(item?.quantity ?? 0)
      if (!['MATERIAL', 'COMPONENT'].includes(type)) {
        throw new BadRequestException('Dispatch item type must be MATERIAL or COMPONENT')
      }
      if (quantity <= 0) {
        throw new BadRequestException('Dispatch item quantity must be greater than 0')
      }
      if (type === 'MATERIAL' && !item?.inventoryItemId) {
        throw new BadRequestException('Material dispatch item requires inventoryItemId')
      }
      if (type === 'COMPONENT' && !item?.componentId) {
        throw new BadRequestException('Component dispatch item requires componentId')
      }

      return {
        type: type as DispatchItemType,
        quantity,
        ...(item?.inventoryItemId && {
          inventoryItem: {
            connect: {
              id: String(item.inventoryItemId),
            },
          },
        }),
        ...(item?.componentId && {
          component: {
            connect: {
              id: String(item.componentId),
            },
          },
        }),
      }
    })
  }

  private async assertNoActiveComponentDispatch(
    items: Prisma.DispatchItemCreateWithoutDispatchOrderInput[],
  ) {
    const componentIds = items
      .map((item: any) => item.component?.connect?.id)
      .filter(Boolean)

    if (!componentIds.length) {
      return
    }

    const activeItem = await this.logisticsRepository.findActiveComponentDispatch(
      componentIds,
      activeDispatchStatuses,
    )

    if (activeItem) {
      throw new BadRequestException(
        `Cấu kiện ${activeItem.component?.code ?? activeItem.componentId} đang nằm trong lệnh điều xe ${activeItem.dispatchOrder.code}`,
      )
    }
  }

  private async reconcileProjectAllocations(
    order: Prisma.DispatchOrderGetPayload<{ include: typeof dispatchInclude }>,
  ) {
    if (!order.projectTaskId) {
      return
    }

    for (const item of order.items) {
      if (item.type === 'MATERIAL' && item.inventoryItemId) {
        const allocation =
          await this.logisticsRepository.findProjectTaskMaterialAllocation(
            order.projectTaskId,
            item.inventoryItemId,
          )
        const quantity = Number(item.quantity ?? 0)
        if (allocation) {
          const issuedQty = Number(allocation.issuedQty ?? 0) + quantity
          await this.logisticsRepository.updateProjectTaskMaterialAllocation(
            allocation.id,
            {
              issuedQty,
              remainingQty: Math.max(0, Number(allocation.plannedQty ?? 0) - issuedQty),
              totalCost: issuedQty * Number(allocation.unitCost ?? 0),
            },
          )
        } else {
          await this.logisticsRepository.createProjectTaskMaterialAllocation({
              projectTask: { connect: { id: order.projectTaskId } },
              inventoryItem: { connect: { id: item.inventoryItemId } },
              plannedQty: quantity,
              issuedQty: quantity,
              remainingQty: 0,
          })
        }
      }

      if (item.type === 'COMPONENT' && item.componentId) {
        const allocation =
          await this.logisticsRepository.findProjectTaskComponentAllocation(
            order.projectTaskId,
            item.componentId,
          )
        if (allocation) {
          await this.logisticsRepository.updateProjectTaskComponentAllocation(
            allocation.id,
            {
              status: 'HANDED_OVER',
            },
          )
        } else {
          await this.logisticsRepository.createProjectTaskComponentAllocation({
              projectTask: { connect: { id: order.projectTaskId } },
              component: { connect: { id: item.componentId } },
              assignedAt: new Date(),
              status: 'HANDED_OVER',
          })
        }
        await this.logisticsRepository.updateComponent(
          item.componentId,
          {
            project: {
              connect: {
                id: order.projectId,
              },
            },
            status: 'DELIVERED',
          },
        )
      }
    }
  }

  private async assertStatus(id: string, statuses: DispatchOrderStatus[]) {
    const order = await this.logisticsRepository.findDispatchOrderStatus(id)

    if (!order) {
      throw new NotFoundException('Dispatch order not found')
    }

    if (!statuses.includes(order.status)) {
      throw new BadRequestException(`Dispatch order cannot move from ${order.status}`)
    }
  }

  private async updateStatus(
    id: string,
    status: DispatchOrderStatus,
    eventType: DispatchEventType,
    message: string,
    data: Prisma.DispatchOrderUpdateInput,
    createdBy?: string,
  ) {
    return this.logisticsRepository.updateDispatchOrder(id, {
        ...data,
        status,
        events: {
          create: {
            type: eventType,
            message,
            createdBy: createdBy ?? null,
          },
        },
    })
  }

  private logActivity(
    action: string,
    entity: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    return this.logisticsRepository.createActivityLog({
        action,
        entity,
        entityId,
        module: 'logistics',
        metadata,
    })
  }

  private dateKey(value: Date) {
    return value.toISOString().slice(0, 10)
  }
}
