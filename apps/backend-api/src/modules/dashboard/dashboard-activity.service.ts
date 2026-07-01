import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

type ActivityModule = 'Inventory' | 'Production' | 'Yard' | 'QC' | 'Purchasing' | 'Projects'

type ExecutiveActivity = {
  id: string
  module: ActivityModule
  type: string
  title: string
  description: string
  entityCode: string | null
  occurredAt: string
  relativeTime: string
  severity: 'info' | 'warning' | 'critical'
}

function relativeTime(value: Date) {
  const diffMs = Date.now() - value.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffHours < 48) return 'Hôm qua'
  return value.toLocaleDateString('vi-VN')
}

@Injectable()
export class DashboardActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecentActivities(): Promise<{
    filters: ActivityModule[]
    items: ExecutiveActivity[]
  }> {
    const [
      inventoryTransactions,
      productionLogs,
      yardMovements,
      qcInspections,
      purchaseOrders,
      projects,
    ] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        take: 20,
        include: {
          items: {
            include: { inventoryItem: true },
          },
        },
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.productionLog.findMany({
        take: 20,
        include: { productionOrder: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.yardMovement.findMany({
        take: 20,
        include: {
          fromSlot: true,
          toSlot: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.qcInspection.findMany({
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.purchaseOrder.findMany({
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.project.findMany({
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    const inventoryItems: ExecutiveActivity[] = inventoryTransactions.map((transaction) => {
      const totalQty = transaction.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0)
      const firstMaterial = transaction.items[0]?.inventoryItem
      const sign = transaction.type === 'IMPORT' || transaction.type === 'RETURN' ? '+' : transaction.type === 'EXPORT' ? '-' : ''
      return {
        id: `inventory-${transaction.id}`,
        module: 'Inventory',
        type: transaction.type,
        title: this.inventoryTitle(transaction.type),
        description: `${firstMaterial?.name ?? transaction.transactionNo ?? transaction.code}${totalQty ? ` · ${sign}${totalQty}` : ''}`,
        entityCode: transaction.transactionNo ?? transaction.code,
        occurredAt: transaction.transactionDate.toISOString(),
        relativeTime: relativeTime(transaction.transactionDate),
        severity: transaction.type === 'ADJUSTMENT' ? 'warning' : 'info',
      }
    })

    const productionItems: ExecutiveActivity[] = productionLogs.map((log) => ({
      id: `production-${log.id}`,
      module: 'Production',
      type: log.type,
      title: 'Nhật ký sản xuất',
      description: `${log.productionOrder.orderNo}: ${log.message}`,
      entityCode: log.productionOrder.orderNo,
      occurredAt: log.createdAt.toISOString(),
      relativeTime: relativeTime(log.createdAt),
      severity: log.type === 'DELAY' || log.type === 'MATERIAL' ? 'warning' : 'info',
    }))

    const yardItems: ExecutiveActivity[] = yardMovements.map((movement) => ({
      id: `yard-${movement.id}`,
      module: 'Yard',
      type: movement.type,
      title: 'Di chuyển bãi',
      description: `${movement.itemCode}${movement.fromSlot || movement.toSlot ? `: ${movement.fromSlot?.code ?? '-'} → ${movement.toSlot?.code ?? '-'}` : ''}`,
      entityCode: movement.itemCode,
      occurredAt: movement.createdAt.toISOString(),
      relativeTime: relativeTime(movement.createdAt),
      severity: 'info',
    }))

    const qcItems: ExecutiveActivity[] = qcInspections.map((inspection) => ({
      id: `qc-${inspection.id}`,
      module: 'QC',
      type: inspection.status,
      title: 'QC',
      description: `${inspection.inspectionNo} · ${inspection.status}`,
      entityCode: inspection.inspectionNo,
      occurredAt: inspection.updatedAt.toISOString(),
      relativeTime: relativeTime(inspection.updatedAt),
      severity: ['FAILED', 'REWORK_REQUIRED', 'REJECTED'].includes(inspection.status) ? 'critical' : 'info',
    }))

    const purchasingItems: ExecutiveActivity[] = purchaseOrders.map((order) => ({
      id: `purchase-${order.id}`,
      module: 'Purchasing',
      type: order.status,
      title: 'Đơn mua',
      description: `${order.poNumber} · ${order.supplierName}`,
      entityCode: order.poNumber,
      occurredAt: order.updatedAt.toISOString(),
      relativeTime: relativeTime(order.updatedAt),
      severity: order.status === 'CANCELLED' ? 'warning' : 'info',
    }))

    const projectItems: ExecutiveActivity[] = projects.map((project) => ({
      id: `project-${project.id}`,
      module: 'Projects',
      type: project.status,
      title: 'Công trình',
      description: `${project.code} · ${project.name}`,
      entityCode: project.code,
      occurredAt: project.updatedAt.toISOString(),
      relativeTime: relativeTime(project.updatedAt),
      severity: project.status === 'DELAYED' ? 'warning' : 'info',
    }))

    return {
      filters: ['Inventory', 'Production', 'Yard', 'QC', 'Purchasing', 'Projects'],
      items: [
        ...inventoryItems,
        ...productionItems,
        ...yardItems,
        ...qcItems,
        ...purchasingItems,
        ...projectItems,
      ]
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 60),
    }
  }

  private inventoryTitle(type: string) {
    switch (type) {
      case 'IMPORT':
        return 'Nhập kho'
      case 'EXPORT':
        return 'Xuất kho'
      case 'TRANSFER':
        return 'Điều chuyển'
      case 'RETURN':
        return 'Trả hàng'
      case 'ADJUSTMENT':
        return 'Điều chỉnh tồn'
      default:
        return 'Giao dịch kho'
    }
  }
}
