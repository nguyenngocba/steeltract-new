import { Injectable } from '@nestjs/common'

import {
  ProductionOrderStatus,
  TransactionType,
} from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'

type ForecastSeverity = 'critical' | 'warning' | 'information'
type InventoryTrend = 'UP' | 'STABLE' | 'DOWN_STRONG'

type MaterialUsageWindow = {
  current30d: number
  previous30d: number
  total90d: number
}

const dayMs = 24 * 60 * 60 * 1000

function daysAgo(days: number) {
  const value = new Date()
  value.setDate(value.getDate() - days)
  value.setHours(0, 0, 0, 0)
  return value
}

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0)
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return 0
  return (numerator / denominator) * 100
}

function severityFor(daysUntilStockout: number | null, currentStock: number, minimumStock: number): ForecastSeverity {
  if (currentStock <= 0 || (daysUntilStockout !== null && daysUntilStockout <= 7)) return 'critical'
  if (currentStock <= minimumStock || (daysUntilStockout !== null && daysUntilStockout <= 30)) return 'warning'
  return 'information'
}

@Injectable()
export class DashboardMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPredictiveTrends() {
    const [forecast, productionStopRisks] = await Promise.all([
      this.getMaterialForecast(),
      this.getProductionStopRisks(),
    ])

    return {
      materialShortageForecast: forecast.materialShortageForecast,
      productionStopRisks,
      consumptionTrends: forecast.consumptionTrends,
      inventoryForecast: forecast.inventoryForecast,
      recommendations: forecast.recommendations,
    }
  }

  private async getMaterialForecast() {
    const now = new Date()
    const since30 = daysAgo(30)
    const since60 = daysAgo(60)
    const since90 = daysAgo(90)

    const [items, locationStocks, transactions] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where: { deletedAt: null },
        include: { category: true, unitMaster: true },
        take: 1000,
      }),
      this.prisma.inventoryLocationStock.findMany({
        where: { quantity: { gt: 0 } },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: { transactionDate: { gte: since90 } },
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
        orderBy: { transactionDate: 'asc' },
      }),
    ])

    const stockByItem = new Map<string, number>()
    for (const stock of locationStocks) {
      stockByItem.set(
        stock.inventoryItemId,
        (stockByItem.get(stock.inventoryItemId) ?? 0) + toNumber(stock.quantity),
      )
    }

    const usageByItem = new Map<string, MaterialUsageWindow>()
    let inbound30 = 0
    let outbound30 = 0
    let outbound90 = 0

    for (const transaction of transactions) {
      const isCurrent30 = transaction.transactionDate >= since30
      const isPrevious30 = transaction.transactionDate >= since60 && transaction.transactionDate < since30
      const isOutbound = transaction.type === TransactionType.EXPORT
      const isInbound = transaction.type === TransactionType.IMPORT || transaction.type === TransactionType.RETURN

      for (const line of transaction.items) {
        const qty = Math.abs(toNumber(line.quantity))
        if (isCurrent30 && isInbound) inbound30 += qty
        if (isCurrent30 && isOutbound) outbound30 += qty
        if (isOutbound) outbound90 += qty

        if (!isOutbound) continue

        const current = usageByItem.get(line.inventoryItemId) ?? {
          current30d: 0,
          previous30d: 0,
          total90d: 0,
        }

        if (isCurrent30) current.current30d += qty
        if (isPrevious30) current.previous30d += qty
        current.total90d += qty
        usageByItem.set(line.inventoryItemId, current)
      }
    }

    const materialShortageForecast = items
      .map((item) => {
        const usage = usageByItem.get(item.id) ?? { current30d: 0, previous30d: 0, total90d: 0 }
        const currentStock = stockByItem.has(item.id) ? stockByItem.get(item.id)! : toNumber(item.quantity)
        const averageDailyUsage = usage.current30d > 0
          ? usage.current30d / 30
          : usage.total90d / 90
        const daysUntilStockout = averageDailyUsage > 0
          ? Math.floor(currentStock / averageDailyUsage)
          : null
        const recommendedFromMin = Math.max(0, (toNumber(item.minimumStock) * 2) - currentStock)
        const recommendedFromUsage = Math.max(0, (averageDailyUsage * 30) - currentStock)
        const recommendedReorderQty = Math.ceil(Math.max(recommendedFromMin, recommendedFromUsage))

        return {
          inventoryItemId: item.id,
          materialCode: item.code,
          materialName: item.name,
          unit: item.unit ?? item.unitMaster?.symbol ?? '',
          categoryName: item.category?.name ?? 'Khác',
          currentStock,
          minimumStock: toNumber(item.minimumStock),
          consumption30d: usage.current30d,
          consumption90d: usage.total90d,
          averageDailyUsage,
          daysUntilStockout,
          recommendedReorderQty,
          severity: severityFor(daysUntilStockout, currentStock, toNumber(item.minimumStock)),
        }
      })
      .filter((row) =>
        row.recommendedReorderQty > 0 ||
        row.currentStock <= row.minimumStock ||
        (row.daysUntilStockout !== null && row.daysUntilStockout <= 30),
      )
      .sort((a, b) => {
        const aDays = a.daysUntilStockout ?? Number.MAX_SAFE_INTEGER
        const bDays = b.daysUntilStockout ?? Number.MAX_SAFE_INTEGER
        return aDays - bDays || b.recommendedReorderQty - a.recommendedReorderQty
      })
      .slice(0, 12)

    const consumptionTrendRows = items.map((item) => {
      const usage = usageByItem.get(item.id) ?? { current30d: 0, previous30d: 0, total90d: 0 }
      const changeQty = usage.current30d - usage.previous30d
      const changePercent = usage.previous30d > 0 ? ratio(changeQty, usage.previous30d) : (usage.current30d > 0 ? 100 : 0)
      return {
        materialId: item.id,
        materialCode: item.code,
        materialName: item.name,
        unit: item.unit ?? item.unitMaster?.symbol ?? '',
        current30d: usage.current30d,
        previous30d: usage.previous30d,
        changeQty,
        changePercent,
      }
    })

    const totalCurrentStock = Array.from(stockByItem.values()).reduce((sum, qty) => sum + qty, 0)
    const dailyInbound = inbound30 / 30
    const dailyOutbound = outbound30 / 30
    const averageDailyNet = dailyInbound - dailyOutbound
    const averageDailyConsumption = outbound90 / 90
    const trend = averageDailyNet < -Math.max(1, totalCurrentStock * 0.02) ? 'DOWN_STRONG' : averageDailyNet > 0 ? 'UP' : 'STABLE'

    const buildHorizon = (days: number) =>
      Array.from({ length: Math.min(days, 30) }, (_, index) => {
        const date = new Date(now.getTime() + (index + 1) * dayMs)
        return {
          label: date.toISOString().slice(5, 10),
          day: index + 1,
          projectedStock: Math.max(0, totalCurrentStock + averageDailyNet * (index + 1)),
        }
      })

    return {
      materialShortageForecast,
      consumptionTrends: {
        increasing: consumptionTrendRows
          .filter((row) => row.changeQty > 0)
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 8),
        decreasing: consumptionTrendRows
          .filter((row) => row.changeQty < 0)
          .sort((a, b) => a.changePercent - b.changePercent)
          .slice(0, 8),
        abnormal: consumptionTrendRows
          .filter((row) => row.current30d > 0 && row.current30d > Math.max(row.previous30d * 1.5, row.current30d + row.previous30d > 0 ? 0 : 1))
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 8),
      },
      inventoryForecast: {
        currentStock: totalCurrentStock,
        dailyInbound,
        dailyOutbound,
        averageDailyNet,
        averageDailyConsumption,
        trend: trend as InventoryTrend,
        horizon7d: buildHorizon(7),
        horizon30d: buildHorizon(30),
        horizon90d: buildHorizon(90),
      },
      recommendations: materialShortageForecast
        .filter((row) => row.recommendedReorderQty > 0)
        .slice(0, 8)
        .map((row) => ({
          materialId: row.inventoryItemId,
          materialCode: row.materialCode,
          materialName: row.materialName,
          unit: row.unit,
          recommendedQty: row.recommendedReorderQty,
          reason: row.daysUntilStockout !== null
            ? `Dự kiến hết sau ${row.daysUntilStockout} ngày`
            : 'Tồn kho dưới định mức',
          priority: row.severity,
        })),
    }
  }

  private async getProductionStopRisks() {
    const activeOrders = await this.prisma.productionOrder.findMany({
      where: {
        status: {
          in: [
            ProductionOrderStatus.PLANNED,
            ProductionOrderStatus.RELEASED,
            ProductionOrderStatus.IN_PROGRESS,
            ProductionOrderStatus.DELAYED,
          ],
        },
      },
      include: {
        component: true,
        bom: {
          include: {
            items: {
              include: { material: true },
            },
          },
        },
        materialIssues: true,
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    })

    const materialIds = Array.from(new Set(activeOrders.flatMap((order) => order.bom?.items.map((item) => item.materialId) ?? [])))
    const locationStocks = materialIds.length
      ? await this.prisma.inventoryLocationStock.findMany({
        where: {
          inventoryItemId: { in: materialIds },
          quantity: { gt: 0 },
        },
      })
      : []

    const stockByItem = new Map<string, number>()
    for (const stock of locationStocks) {
      stockByItem.set(stock.inventoryItemId, (stockByItem.get(stock.inventoryItemId) ?? 0) + toNumber(stock.quantity))
    }

    return activeOrders
      .map((order) => {
        const issuedByItem = new Map<string, number>()
        for (const issue of order.materialIssues) {
          issuedByItem.set(
            issue.inventoryItemId,
            (issuedByItem.get(issue.inventoryItemId) ?? 0) + Math.max(0, toNumber(issue.issuedQty) - toNumber(issue.returnedQty)),
          )
        }

        const missingMaterials = (order.bom?.items ?? [])
          .map((bomItem) => {
            const requiredQty = toNumber(bomItem.quantity) * (1 + toNumber(bomItem.wastePercent) / 100) * Math.max(1, toNumber(order.quantity))
            const issuedQty = issuedByItem.get(bomItem.materialId) ?? 0
            const availableQty = stockByItem.get(bomItem.materialId) ?? 0
            const shortageQty = Math.max(0, requiredQty - issuedQty - availableQty)
            return {
              materialId: bomItem.materialId,
              materialCode: bomItem.material.code,
              materialName: bomItem.material.name,
              unit: bomItem.material.unit ?? '',
              requiredQty,
              issuedQty,
              availableQty,
              shortageQty,
            }
          })
          .filter((row) => row.shortageQty > 0)

        const delayRiskDays = order.plannedEndAt && missingMaterials.length
          ? Math.max(1, Math.ceil((order.plannedEndAt.getTime() - Date.now()) / dayMs) * -1 || 1)
          : 0

        return {
          productionOrderId: order.id,
          productionOrderNo: order.orderNo,
          title: order.title,
          componentCode: order.component?.code ?? null,
          componentName: order.component?.name ?? null,
          plannedEndAt: order.plannedEndAt?.toISOString() ?? null,
          missingMaterials,
          delayRiskDays,
          severity: missingMaterials.length > 0 ? 'critical' : 'information',
        }
      })
      .filter((row) => row.missingMaterials.length > 0)
      .sort((a, b) => b.missingMaterials.length - a.missingMaterials.length)
      .slice(0, 10)
  }
}
