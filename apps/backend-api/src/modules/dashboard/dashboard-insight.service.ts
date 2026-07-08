import { Injectable } from '@nestjs/common'

import {
  ProductionOrderStatus,
  ProjectStatus,
  QcInspectionStatus,
} from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'
import { DashboardInventoryReadModelService } from './dashboard-inventory-read-model.service'

type HealthStatus = 'normal' | 'warning' | 'critical'

type HealthModule = {
  module: 'Inventory' | 'Production' | 'Yard' | 'QC' | 'Suppliers' | 'Projects'
  label: string
  status: HealthStatus
  score: number
  summary: string
  metrics: Record<string, number>
}

type ExecutiveSummaryItem = {
  id: string
  priority: 'critical' | 'warning' | 'information'
  module: string
  title: string
  description: string
  value: number
  unit?: string
}

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0)
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function statusFromScore(score: number): HealthStatus {
  if (score < 65) return 'critical'
  if (score < 85) return 'warning'
  return 'normal'
}

@Injectable()
export class DashboardInsightService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryReadModel: DashboardInventoryReadModelService,
  ) {}

  async getControlTowerInsights(trends: any, notifications: any) {
    const [health, executiveSummary] = await Promise.all([
      this.getHealth(notifications),
      this.getExecutiveSummary(trends),
    ])

    return {
      health,
      executiveSummary,
    }
  }

  private async getHealth(notifications: any) {
    const [
      inventory,
      production,
      yard,
      qc,
      suppliers,
      projects,
    ] = await Promise.all([
      this.inventoryHealth(),
      this.productionHealth(),
      this.yardHealth(),
      this.qcHealth(),
      this.supplierHealth(),
      this.projectHealth(),
    ])

    const modules = [inventory, production, yard, qc, suppliers, projects]
    const score = clampScore(modules.reduce((sum, module) => sum + module.score, 0) / Math.max(1, modules.length))

    return {
      title: 'Tình trạng vận hành hôm nay',
      score,
      status: statusFromScore(score),
      modules,
      counters: notifications?.counts ?? {
        critical: 0,
        warning: 0,
        information: 0,
      },
    }
  }

  private async inventoryHealth(): Promise<HealthModule> {
    const snapshot = await this.inventoryReadModel.getSnapshot()
    let outOfStock = 0
    let lowStock = 0
    for (const item of snapshot.items) {
      const stock = item.stock
      if (stock <= 0) outOfStock += 1
      else if (stock <= toNumber(item.minimumStock)) lowStock += 1
    }

    const score = clampScore(100 - outOfStock * 18 - lowStock * 7)
    return {
      module: 'Inventory',
      label: 'Kho',
      status: statusFromScore(score),
      score,
      summary: outOfStock > 0 ? `${outOfStock} vật tư hết hàng` : lowStock > 0 ? `${lowStock} vật tư sắp hết` : 'Bình thường',
      metrics: { outOfStock, lowStock },
    }
  }

  private async productionHealth(): Promise<HealthModule> {
    const [delayedOrders, waitingLines] = await Promise.all([
      this.prisma.productionOrder.count({
        where: { status: ProductionOrderStatus.DELAYED },
      }),
      this.prisma.productionMaterialReservationLine.count({
        where: {
          status: 'SHORTAGE',
        },
      }).catch(() => 0),
    ])

    const score = clampScore(100 - delayedOrders * 15 - waitingLines * 5)
    return {
      module: 'Production',
      label: 'Sản xuất',
      status: statusFromScore(score),
      score,
      summary: delayedOrders > 0 ? `${delayedOrders} lệnh chậm` : waitingLines > 0 ? 'Có nguy cơ thiếu vật tư' : 'Bình thường',
      metrics: { delayedOrders, waitingMaterials: waitingLines },
    }
  }

  private async yardHealth(): Promise<HealthModule> {
    const [slots, placements] = await Promise.all([
      this.prisma.yardSlot.count(),
      this.prisma.yardItemPlacement.count({ where: { removedAt: null } }),
    ])
    const occupancy = slots > 0 ? (placements / slots) * 100 : 0
    const overloadedZones = occupancy >= 90 ? 1 : 0
    const score = clampScore(100 - Math.max(0, occupancy - 75) * 1.5 - overloadedZones * 10)
    return {
      module: 'Yard',
      label: 'Bãi tập kết',
      status: statusFromScore(score),
      score,
      summary: occupancy >= 90 ? `Sức chứa ${occupancy.toFixed(1)}%` : 'Bình thường',
      metrics: { occupancy, overloadedZones },
    }
  }

  private async qcHealth(): Promise<HealthModule> {
    const [openNcr, failedInspections] = await Promise.all([
      this.prisma.nonConformanceReport.count({
        where: { status: { not: 'CLOSED' } },
      }).catch(() => 0),
      this.prisma.qcInspection.count({
        where: {
          status: {
            in: [
              QcInspectionStatus.FAILED,
              QcInspectionStatus.REWORK_REQUIRED,
              QcInspectionStatus.REJECTED,
            ],
          },
        },
      }),
    ])

    const score = clampScore(100 - openNcr * 18 - failedInspections * 10)
    return {
      module: 'QC',
      label: 'QC',
      status: statusFromScore(score),
      score,
      summary: openNcr > 0 ? `${openNcr} NCR mở` : failedInspections > 0 ? `${failedInspections} phiếu lỗi` : 'Bình thường',
      metrics: { openNcr, failedInspections },
    }
  }

  private async supplierHealth(): Promise<HealthModule> {
    const openOrders = await this.prisma.purchaseOrder.count({
      where: { status: { in: ['DRAFT', 'PENDING', 'APPROVED'] } },
    })
    const score = clampScore(100 - openOrders * 3)
    return {
      module: 'Suppliers',
      label: 'Mua hàng',
      status: statusFromScore(score),
      score,
      summary: openOrders > 0 ? `${openOrders} đơn mua mở` : 'Bình thường',
      metrics: { openOrders, lateDeliveries: 0 },
    }
  }

  private async projectHealth(): Promise<HealthModule> {
    const delayedProjects = await this.prisma.project.count({
      where: { status: ProjectStatus.DELAYED },
    })
    const score = clampScore(100 - delayedProjects * 14)
    return {
      module: 'Projects',
      label: 'Công trình',
      status: statusFromScore(score),
      score,
      summary: delayedProjects > 0 ? `${delayedProjects} công trình chậm` : 'Bình thường',
      metrics: { delayedProjects },
    }
  }

  private async getExecutiveSummary(trends: any) {
    const [yard, projects, qc, purchaseOrders] = await Promise.all([
      this.yardSummary(),
      this.prisma.project.count({ where: { status: ProjectStatus.DELAYED } }),
      this.prisma.nonConformanceReport.count({ where: { status: { not: 'CLOSED' } } }).catch(() => 0),
      this.prisma.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'PENDING', 'APPROVED'] } } }),
    ])

    const shortageCount = (trends?.materialShortageForecast ?? []).filter((row: any) => row.daysUntilStockout !== null && row.daysUntilStockout <= 7).length
    const productionRiskCount = trends?.productionStopRisks?.length ?? 0

    const items: ExecutiveSummaryItem[] = []

    if (shortageCount > 0) {
      items.push({
        id: 'summary-material-shortage',
        priority: 'critical',
        module: 'Inventory',
        title: `${shortageCount} vật tư có nguy cơ hết`,
        description: 'Dựa trên tồn hiện tại và tốc độ tiêu thụ trung bình.',
        value: shortageCount,
      })
    }

    if (productionRiskCount > 0) {
      items.push({
        id: 'summary-production-risk',
        priority: 'warning',
        module: 'Production',
        title: `${productionRiskCount} lệnh sản xuất có nguy cơ chậm`,
        description: 'Thiếu vật tư theo BOM hoặc tồn khả dụng không đủ.',
        value: productionRiskCount,
      })
    }

    if (yard.occupancy >= 90) {
      items.push({
        id: 'summary-yard-capacity',
        priority: yard.occupancy >= 100 ? 'critical' : 'warning',
        module: 'Yard',
        title: `Bãi đạt ${yard.occupancy.toFixed(1)}% sức chứa`,
        description: 'Cần điều phối bãi hoặc xuất bãi để giảm tải.',
        value: yard.occupancy,
        unit: '%',
      })
    }

    if (qc > 0) {
      items.push({
        id: 'summary-qc-ncr',
        priority: 'critical',
        module: 'QC',
        title: `${qc} NCR đang mở`,
        description: 'Cần xử lý NCR để tránh nghẽn giao hàng/sản xuất.',
        value: qc,
      })
    }

    if (projects > 0) {
      items.push({
        id: 'summary-project-delay',
        priority: 'warning',
        module: 'Projects',
        title: `${projects} công trình chậm tiến độ`,
        description: 'Cần rà soát kế hoạch và năng lực thực hiện.',
        value: projects,
      })
    }

    if (purchaseOrders > 0) {
      items.push({
        id: 'summary-purchase-orders',
        priority: 'information',
        module: 'Suppliers',
        title: `${purchaseOrders} đơn mua đang mở`,
        description: 'Theo dõi phê duyệt và nhận hàng.',
        value: purchaseOrders,
      })
    }

    return {
      title: '7 ngày tới',
      items: items.slice(0, 8),
    }
  }

  private async yardSummary() {
    const [slots, placements] = await Promise.all([
      this.prisma.yardSlot.count(),
      this.prisma.yardItemPlacement.count({ where: { removedAt: null } }),
    ])

    return {
      occupancy: slots > 0 ? (placements / slots) * 100 : 0,
    }
  }
}
