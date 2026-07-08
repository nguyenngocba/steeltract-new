import { Injectable } from '@nestjs/common'

import {
  ProductionOrderStatus,
  ProjectStatus,
  QcInspectionStatus,
} from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'
import { DashboardInventoryReadModelService } from './dashboard-inventory-read-model.service'

type NotificationPriority = 'Critical' | 'Warning' | 'Information'

type ExecutiveNotification = {
  id: string
  priority: NotificationPriority
  module: string
  title: string
  description: string
  entityCode: string | null
  createdAt: string
  actionLabel: string | null
}

function nowIso() {
  return new Date().toISOString()
}

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0)
}

@Injectable()
export class DashboardNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryReadModel: DashboardInventoryReadModelService,
  ) {}

  async getNotifications() {
    const [
      inventoryNotifications,
      productionNotifications,
      yardNotifications,
      qcNotifications,
      projectNotifications,
      purchaseNotifications,
      persistedNotifications,
    ] = await Promise.all([
      this.inventoryRules(),
      this.productionRules(),
      this.yardRules(),
      this.qcRules(),
      this.projectRules(),
      this.purchaseRules(),
      this.persistedRules(),
    ])

    const items = [
      ...inventoryNotifications,
      ...productionNotifications,
      ...yardNotifications,
      ...qcNotifications,
      ...projectNotifications,
      ...purchaseNotifications,
      ...persistedNotifications,
    ].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
      counts: {
        critical: items.filter((item) => item.priority === 'Critical').length,
        warning: items.filter((item) => item.priority === 'Warning').length,
        information: items.filter((item) => item.priority === 'Information').length,
      },
      items,
    }
  }

  private async inventoryRules(): Promise<ExecutiveNotification[]> {
    const snapshot = await this.inventoryReadModel.getSnapshot()
    return snapshot.items
      .map((item): ExecutiveNotification | null => {
        const stock = item.stock
        if (stock <= 0) {
          return {
            id: `inventory-out-${item.id}`,
            priority: 'Critical',
            module: 'Inventory',
            title: 'Hết vật tư',
            description: `${item.code} · ${item.name} đang bằng 0 ${item.unit ?? ''}`.trim(),
            entityCode: item.code,
            createdAt: nowIso(),
            actionLabel: 'Lập kế hoạch nhập',
          }
        }
        if (stock <= toNumber(item.minimumStock)) {
          return {
            id: `inventory-low-${item.id}`,
            priority: 'Warning',
            module: 'Inventory',
            title: 'Vật tư dưới Min Stock',
            description: `${item.code} · tồn ${stock}/${item.minimumStock} ${item.unit ?? ''}`.trim(),
            entityCode: item.code,
            createdAt: nowIso(),
            actionLabel: 'Xem tồn kho',
          }
        }
        return null
      })
      .filter(Boolean) as ExecutiveNotification[]
  }

  private async productionRules(): Promise<ExecutiveNotification[]> {
    const orders = await this.prisma.productionOrder.findMany({
      where: {
        status: {
          in: [
            ProductionOrderStatus.DELAYED,
            ProductionOrderStatus.IN_PROGRESS,
            ProductionOrderStatus.RELEASED,
            ProductionOrderStatus.PLANNED,
          ],
        },
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    })

    const now = Date.now()
    return orders
      .map((order): ExecutiveNotification | null => {
        const isLate = order.status === ProductionOrderStatus.DELAYED ||
          (!!order.plannedEndAt && order.plannedEndAt.getTime() < now && order.status !== ProductionOrderStatus.COMPLETED)

        if (!isLate) return null
        return {
          id: `production-delay-${order.id}`,
          priority: order.status === ProductionOrderStatus.DELAYED ? 'Critical' : 'Warning',
          module: 'Production',
          title: order.status === ProductionOrderStatus.DELAYED ? 'Sản xuất dừng/chậm' : 'Lệnh sản xuất sắp trễ',
          description: `${order.orderNo} · ${order.title}`,
          entityCode: order.orderNo,
          createdAt: order.updatedAt.toISOString(),
          actionLabel: 'Xem lệnh sản xuất',
        }
      })
      .filter(Boolean) as ExecutiveNotification[]
  }

  private async yardRules(): Promise<ExecutiveNotification[]> {
    const [slots, placements] = await Promise.all([
      this.prisma.yardSlot.findMany({ take: 1000 }),
      this.prisma.yardItemPlacement.findMany({
        where: { removedAt: null },
        take: 1000,
      }),
    ])

    if (!slots.length) return []

    const occupancy = (placements.length / slots.length) * 100
    if (occupancy < 90) return []

    return [{
      id: 'yard-occupancy-over-90',
      priority: occupancy >= 100 ? 'Critical' : 'Warning',
      module: 'Yard',
      title: occupancy >= 100 ? 'Bãi quá tải' : 'Sức chứa bãi > 90%',
      description: `Đang sử dụng ${placements.length}/${slots.length} vị trí (${occupancy.toFixed(1)}%)`,
      entityCode: null,
      createdAt: nowIso(),
      actionLabel: 'Xem bãi',
    }]
  }

  private async qcRules(): Promise<ExecutiveNotification[]> {
    const inspections = await this.prisma.qcInspection.findMany({
      where: {
        status: {
          in: [
            QcInspectionStatus.FAILED,
            QcInspectionStatus.REWORK_REQUIRED,
            QcInspectionStatus.REJECTED,
            QcInspectionStatus.IN_PROGRESS,
          ],
        },
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    })

    return inspections.map((inspection) => ({
      id: `qc-${inspection.id}`,
      priority: ['FAILED', 'REWORK_REQUIRED', 'REJECTED'].includes(inspection.status) ? 'Critical' : 'Warning',
      module: 'QC',
      title: ['FAILED', 'REWORK_REQUIRED', 'REJECTED'].includes(inspection.status) ? 'NCR/QC nghiêm trọng' : 'QC chờ xử lý',
      description: `${inspection.inspectionNo} · ${inspection.status}`,
      entityCode: inspection.inspectionNo,
      createdAt: inspection.updatedAt.toISOString(),
      actionLabel: 'Xem QC',
    }))
  }

  private async projectRules(): Promise<ExecutiveNotification[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        status: {
          in: [ProjectStatus.DELAYED, ProjectStatus.ON_HOLD],
        },
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    })

    return projects.map((project) => ({
      id: `project-${project.id}`,
      priority: project.status === ProjectStatus.DELAYED ? 'Warning' : 'Information',
      module: 'Projects',
      title: project.status === ProjectStatus.DELAYED ? 'Công trình chậm tiến độ' : 'Công trình tạm dừng',
      description: `${project.code} · ${project.name}`,
      entityCode: project.code,
      createdAt: project.updatedAt.toISOString(),
      actionLabel: 'Xem công trình',
    }))
  }

  private async purchaseRules(): Promise<ExecutiveNotification[]> {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        status: {
          in: ['DRAFT', 'PENDING', 'APPROVED'],
        },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    })

    return orders.map((order) => ({
      id: `purchase-${order.id}`,
      priority: order.status === 'APPROVED' ? 'Information' : 'Warning',
      module: 'Suppliers',
      title: order.status === 'APPROVED' ? 'Đơn mua mở' : 'Đơn mua chờ xử lý',
      description: `${order.poNumber} · ${order.supplierName}`,
      entityCode: order.poNumber,
      createdAt: order.updatedAt.toISOString(),
      actionLabel: 'Xem đơn mua',
    }))
  }

  private async persistedRules(): Promise<ExecutiveNotification[]> {
    const rows = await this.prisma.notification.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    return rows.map((row) => ({
      id: `notification-${row.id}`,
      priority: normalizeSeverity(row.severity),
      module: row.type ?? 'System',
      title: row.title,
      description: row.message,
      entityCode: null,
      createdAt: row.createdAt.toISOString(),
      actionLabel: row.link ? 'Mở thông báo' : null,
    }))
  }
}

function priorityRank(priority: NotificationPriority) {
  if (priority === 'Critical') return 0
  if (priority === 'Warning') return 1
  return 2
}

function normalizeSeverity(severity: string | null): NotificationPriority {
  const value = (severity ?? '').toUpperCase()
  if (['CRITICAL', 'ERROR', 'HIGH'].includes(value)) return 'Critical'
  if (['WARNING', 'WARN', 'MEDIUM'].includes(value)) return 'Warning'
  return 'Information'
}
