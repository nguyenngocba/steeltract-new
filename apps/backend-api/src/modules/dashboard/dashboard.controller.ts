import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common'

import {
  ComponentStatus,
  ProductionOrderStatus,
  ProjectStatus,
  QcInspectionStatus,
  TransactionType,
} from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('dashboard')
export class DashboardController {
  constructor(
    private prisma: PrismaService,
  ) {}

 @UseGuards(JwtAuthGuard)
  @Get('cockpit')
  async cockpit() {
    const since = new Date()
    since.setDate(since.getDate() - 6)
    since.setHours(0, 0, 0, 0)

    const [
      projects,
      activeProjects,
      productionOrders,
      productionActive,
      productionCompleted,
      components,
      completedComponents,
      inventoryItems,
      inventoryTransactions,
      inboundTransactions,
      outboundTransactions,
      logisticsActive,
      qcOpen,
      yardActive,
      recentActivities,
      recentNotifications,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({
        where: { status: { in: [ProjectStatus.ACTIVE, ProjectStatus.DELAYED] } },
      }),
      this.prisma.productionOrder.count(),
      this.prisma.productionOrder.count({
        where: {
          status: {
            in: [
              ProductionOrderStatus.RELEASED,
              ProductionOrderStatus.IN_PROGRESS,
              ProductionOrderStatus.DELAYED,
            ],
          },
        },
      }),
      this.prisma.productionOrder.count({
        where: { status: ProductionOrderStatus.COMPLETED },
      }),
      this.prisma.component.count(),
      this.prisma.component.count({
        where: {
          status: {
            in: [
              ComponentStatus.READY,
              ComponentStatus.SHIPPED,
              ComponentStatus.DELIVERED,
              ComponentStatus.INSTALLED,
            ],
          },
        },
      }),
      this.prisma.inventoryItem.findMany({
        include: { category: true },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: { transactionDate: { gte: since } },
        include: { items: true },
        orderBy: { transactionDate: 'asc' },
      }),
      this.prisma.inventoryTransaction.count({
        where: { type: TransactionType.IMPORT },
      }),
      this.prisma.inventoryTransaction.count({
        where: { type: TransactionType.EXPORT },
      }),
      this.prisma.yardMovement.count({
        where: { type: { in: ['PLACE', 'MOVE'] } },
      }),
      this.prisma.qcInspection.count({
        where: {
          status: {
            in: [
              QcInspectionStatus.DRAFT,
              QcInspectionStatus.READY,
              QcInspectionStatus.IN_PROGRESS,
              QcInspectionStatus.FAILED,
              QcInspectionStatus.REWORK_REQUIRED,
              QcInspectionStatus.REJECTED,
            ],
          },
        },
      }),
      this.prisma.yardItemPlacement.count({
        where: { removedAt: null },
      }),
      this.prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const inventoryTotal = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
    const inventoryByCategory = new Map<string, number>()
    for (const item of inventoryItems) {
      const label = item.category?.name ?? 'Khác'
      inventoryByCategory.set(label, (inventoryByCategory.get(label) ?? 0) + item.quantity)
    }

    const productionStatus = await this.prisma.productionOrder.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const projectRows = await this.prisma.project.findMany({
      take: 6,
      orderBy: { updatedAt: 'desc' },
      include: { components: true },
    })
    const completedComponentStatuses: ComponentStatus[] = [
      ComponentStatus.READY,
      ComponentStatus.SHIPPED,
      ComponentStatus.DELIVERED,
      ComponentStatus.INSTALLED,
    ]
    const trend = new Map<string, number>()
    for (let index = 0; index < 7; index += 1) {
      const day = new Date(since)
      day.setDate(since.getDate() + index)
      trend.set(day.toISOString().slice(5, 10), 0)
    }
    for (const transaction of inventoryTransactions) {
      const key = transaction.transactionDate.toISOString().slice(5, 10)
      const volume = transaction.items.reduce((sum, item) => sum + Math.abs(item.quantity), 0)
      trend.set(key, (trend.get(key) ?? 0) + volume)
    }

    return {
      generatedAt: new Date().toISOString(),
      kpis: {
        projects,
        activeProjects,
        productionOrders,
        productionActive,
        components,
        completedComponents,
        componentCompletionRate: components > 0 ? Math.round((completedComponents / components) * 100) : 0,
        logisticsActive,
        inventoryTotal,
        inboundTransactions,
        outboundTransactions,
        qcOpen,
        yardActive,
      },
      productionStatus: productionStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
      inventoryDistribution: Array.from(inventoryByCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value]) => ({ label, value })),
      movementTrend: Array.from(trend.entries()).map(([label, value]) => ({
        label,
        value,
      })),
      projects: projectRows.map((project) => {
        const total = project.components.length
        const done = project.components.filter((component) =>
          completedComponentStatuses.includes(component.status),
        ).length
        return {
          id: project.id,
          code: project.code,
          name: project.name,
          status: project.status,
          progress: total > 0 ? Math.round((done / total) * 100) : project.status === ProjectStatus.COMPLETED ? 100 : 0,
        }
      }),
      productionSummary: {
        active: productionActive,
        waiting: Math.max(0, productionOrders - productionActive - productionCompleted),
        completed: productionCompleted,
        delayed: productionStatus.find((row) => row.status === ProductionOrderStatus.DELAYED)?._count._all ?? 0,
      },
      alerts: [
        {
          code: 'LOW_STOCK',
          title: 'Vật tư dưới tồn tối thiểu',
          count: inventoryItems.filter((item) => item.quantity <= item.minimumStock).length,
        },
        {
          code: 'PRODUCTION_DELAYED',
          title: 'Lệnh sản xuất trễ tiến độ',
          count: productionStatus.find((row) => row.status === ProductionOrderStatus.DELAYED)?._count._all ?? 0,
        },
        {
          code: 'QC_OPEN',
          title: 'Phiếu QC cần xử lý',
          count: qcOpen,
        },
      ],
      recentActivities,
      recentNotifications,
    }
  }

 @UseGuards(JwtAuthGuard)
  @Get('stats')
  async stats() {
    const [
      inventoryCount,
      projectCount,
      componentCount,
      transactionCount,

      lowStockItems,
    ] = await Promise.all([
      this.prisma.inventoryItem.count(),

      this.prisma.project.count(),

      this.prisma.component.count(),

      this.prisma.inventoryTransaction.count(),

      this.prisma.inventoryItem.findMany(),
    ])

    const lowStockCount =
      lowStockItems.filter(
        (item) =>
          item.quantity <=
          item.minimumStock,
      ).length

    return {
      inventoryCount,
      projectCount,
      componentCount,
      transactionCount,

      lowStockCount,
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('recent-transactions')
  async recentTransactions() {
    return this.prisma.inventoryTransaction.findMany({
      take: 5,

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
  @Get('low-stock')
  async lowStock() {
    const items =
      await this.prisma.inventoryItem.findMany({
        include: {
          category: true,
        },
      })

    return items.filter(
      (item) =>
        item.quantity <=
        item.minimumStock,
    )
  }
  @UseGuards(JwtAuthGuard)
  @Get('construction-progress')
  async constructionProgress() {
    const total =
      await this.prisma.component.count()

    const installed =
      await this.prisma.component.count({
        where: {
          status: 'INSTALLED',
        },
      })

    const delivered =
      await this.prisma.component.count({
        where: {
          status: 'DELIVERED',
        },
      })

    const stock =
      await this.prisma.component.count({
        where: {
          status: 'STOCK',
        },
      })

    const progress =
      total > 0
        ? Math.round(
            (installed / total) *
              100,
          )
        : 0

    return {
      total,
      installed,
      delivered,
      stock,
      progress,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics')
  async analytics() {
    const components =
      await this.prisma.component.findMany()

    const installed =
      components.filter(
        (c) =>
          c.status ===
          'INSTALLED',
      ).length

    const delivered =
      components.filter(
        (c) =>
          c.status ===
          'DELIVERED',
      ).length

    const stock =
      components.filter(
        (c) =>
          c.status ===
          'STOCK',
      ).length

    const total =
      components.length

    const progress =
      total
        ? Math.round(
            (installed /
              total) *
              100,
          )
        : 0

    return {
      total,
      installed,
      delivered,
      stock,
      progress,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('forecast')
  async forecast() {
    const installed =
      await this.prisma.component.count({
        where: {
          status:
            'INSTALLED',
        },
      })

    const total =
      await this.prisma.component.count()

    const remaining =
      total - installed

    const dailyRate = 10

    const estimatedDays =
      Math.ceil(
        remaining /
          dailyRate,
      )

    return {
      installed,
      total,
      remaining,
      estimatedDays,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('costs')
  async costs() {
    const components =
      await this.prisma.component.findMany()

    const estimated =
      components.reduce(
        (
          acc,
          item,
        ) =>
          acc +
          (
            item.estimatedCost ||
            0
          ),
        0,
      )

    const actual =
      components.reduce(
        (
          acc,
          item,
        ) =>
          acc +
          (
            item.actualCost ||
            0
          ),
        0,
      )

    return {
      estimated,
      actual,
      variance:
        actual -
        estimated,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('procurement')
  async procurement() {
    const items =
      await this.prisma.inventoryItem.findMany()

    const suggestions =
      items
        .filter(
          (item) =>
            item.quantity <=
            item.minimumStock,
        )
        .map((item) => ({
          id: item.id,

          code: item.code,

          name: item.name,

          quantity:
            item.quantity,

          minimumStock:
            item.minimumStock,

          suggestedOrder:
            (
              item.minimumStock *
              2
            ) -
            item.quantity,
        }))

    return suggestions
  }

  @UseGuards(JwtAuthGuard)
  @Get('anomalies')
  async anomalies() {
    const items =
      await this.prisma.inventoryItem.findMany()

    const anomalies =
      items.filter(
        (item) =>
          item.quantity <
          item.minimumStock / 2,
      )

    return anomalies
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('activities')
  async activities() {
    return this.prisma.activityLog.findMany({
      take: 10,

      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}
