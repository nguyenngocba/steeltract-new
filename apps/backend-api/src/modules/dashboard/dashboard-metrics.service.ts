import { Injectable } from '@nestjs/common'

import { ProductionOrderStatus } from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'
import { DashboardInventoryReadModelService } from './dashboard-inventory-read-model.service'

type ForecastSeverity = 'critical' | 'warning' | 'information'
type InventoryTrend = 'UP' | 'STABLE' | 'DOWN_STRONG'

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryReadModel: DashboardInventoryReadModelService,
  ) {}

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
    const {
      items,
      stockByItem,
      usageByItem,
      inbound30,
      outbound30,
      outbound90,
    } = await this.inventoryReadModel.getForecastReadModel()

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
          unit: item.unit,
          categoryName: item.categoryName,
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
        unit: item.unit,
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

    const { stockByItem } =
      await this.inventoryReadModel.getSnapshot()

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
