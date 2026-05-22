import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('dashboard')
export class DashboardController {
  constructor(
    private prisma: PrismaService,
  ) {}

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