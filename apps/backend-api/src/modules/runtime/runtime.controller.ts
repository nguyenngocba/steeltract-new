import {
  Controller,
  Get,
} from '@nestjs/common'

import { PrismaService }
  from '../../core/prisma/prisma.service'

import {
  QcInspectionStatus,
  TransactionType,
} from '@prisma/client'

@Controller('runtime')
export class RuntimeController {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  @Get('overview')
  async overview() {
    const [
      inventoryCount,
      projectCount,
      componentCount,
      transactionCount,
      recentActivities,
    ] = await Promise.all([
      this.prisma.inventoryItem.count(),

      this.prisma.project.count(),

      this.prisma.component.count(),

      this.prisma.inventoryTransaction.count(),

      this.prisma.activityLog.findMany({
        take: 10,

        orderBy: {
          createdAt:
            'desc',
        },
      }),
    ])

    return {
      summary: {
        inventoryCount,
        projectCount,
        componentCount,
        transactionCount,
      },

      activities:
        recentActivities,
    }
  }

  @Get('operational-workflow')
  async operationalWorkflow() {
    const [
      supplierInbound,
      inventoryItems,
      projectOutbound,
      productionOutbound,
      productionReturns,
      boms,
      productionOrders,
      materialIssues,
      qcInspections,
      activePlacements,
      removedPlacements,
      projectReturnedPlacements,
    ] = await Promise.all([
      this.prisma.inventoryTransaction.count({
        where: {
          type: TransactionType.IMPORT,
          supplierId: { not: null },
        },
      }),
      this.prisma.inventoryItem.count(),
      this.prisma.inventoryTransaction.count({
        where: {
          type: TransactionType.EXPORT,
          projectId: { not: null },
        },
      }),
      this.prisma.inventoryTransaction.count({
        where: {
          type: TransactionType.EXPORT,
          OR: [
            { referenceModule: 'production_material_issue' },
            { remarks: { contains: '[COMPONENT_PRODUCTION]' } },
          ],
        },
      }),
      this.prisma.inventoryTransaction.count({
        where: {
          type: TransactionType.RETURN,
          OR: [
            { referenceModule: 'production_material_issue' },
            { remarks: { contains: '[COMPONENT_PRODUCTION_RETURN]' } },
            { remarks: { contains: '[PRODUCTION_RETURN]' } },
          ],
        },
      }),
      this.prisma.bOM.count(),
      this.prisma.productionOrder.findMany({
        include: {
          component: true,
          stages: true,
          materialIssues: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      this.prisma.productionMaterialIssue.count({
        where: { status: 'ISSUED' },
      }),
      this.prisma.qcInspection.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      this.prisma.yardItemPlacement.findMany({
        where: { removedAt: null },
        orderBy: { placedAt: 'desc' },
        take: 100,
      }),
      this.prisma.yardItemPlacement.count({
        where: { removedAt: { not: null } },
      }),
      this.prisma.yardMovement.count({
        where: {
          type: 'PLACE',
          OR: [
            { reason: { contains: 'return', mode: 'insensitive' } },
            { reason: { contains: 'trả', mode: 'insensitive' } },
          ],
        },
      }),
    ])

    const completedOrders = productionOrders.filter(
      (order) => order.status === 'COMPLETED',
    )
    const approvedQc = qcInspections.filter(
      (inspection) =>
        inspection.status === QcInspectionStatus.PASSED ||
        inspection.status === QcInspectionStatus.APPROVED,
    )
    const failedQc = qcInspections.filter(
      (inspection) =>
        inspection.status === QcInspectionStatus.FAILED ||
        inspection.status === QcInspectionStatus.REWORK_REQUIRED ||
        inspection.status === QcInspectionStatus.REJECTED,
    )
    const completedWithoutQc = completedOrders.filter((order) => {
      if (!order.componentId) {
        return false
      }
      return !approvedQc.some(
        (inspection) =>
          inspection.productionOrderId === order.id ||
          inspection.componentId === order.componentId,
      )
    })
    const stagedWithoutQc = activePlacements.filter((placement) => {
      if (placement.itemType !== 'COMPONENT') {
        return false
      }
      return !approvedQc.some(
        (inspection) => inspection.componentId === placement.itemId,
      )
    })

    const steps = [
      this.step(
        'SUPPLIER_INBOUND',
        'Nhập hàng từ nhà cung cấp',
        supplierInbound > 0,
        `${supplierInbound} phiếu nhập có supplierId`,
      ),
      this.step(
        'MAIN_INVENTORY',
        'Lưu kho vật tư',
        inventoryItems > 0,
        `${inventoryItems} vật tư trong kho`,
      ),
      this.step(
        'PROJECT_OUTBOUND',
        'Xuất kho vật tư cho công trình',
        projectOutbound > 0,
        `${projectOutbound} phiếu xuất có projectId`,
      ),
      this.step(
        'PRODUCTION_OUTBOUND',
        'Xuất kho vật tư cho sản xuất',
        productionOutbound > 0 || materialIssues > 0,
        `${productionOutbound} giao dịch xuất SX, ${materialIssues} phiếu cấp phát ISSUED`,
      ),
      this.step(
        'BOM_AND_MO',
        'Tạo BOM và lệnh sản xuất',
        boms > 0 && productionOrders.length > 0,
        `${boms} BOM, ${productionOrders.length} lệnh sản xuất`,
      ),
      this.step(
        'QC_GATE',
        'QC kiểm tra đạt trước khi chuyển bãi',
        approvedQc.length > 0 && completedWithoutQc.length === 0,
        `${approvedQc.length} QC đạt/duyệt, ${completedWithoutQc.length} MO hoàn thành chưa đạt QC`,
        completedWithoutQc.length > 0 ? 'WARN' : undefined,
      ),
      this.step(
        'YARD_STAGING',
        'Chuyển thành phẩm sang bãi tập kết',
        activePlacements.length > 0 && stagedWithoutQc.length === 0,
        `${activePlacements.length} cấu kiện/vật tư đang ở bãi, ${stagedWithoutQc.length} cấu kiện thiếu QC`,
        stagedWithoutQc.length > 0 ? 'BLOCKED' : undefined,
      ),
      this.step(
        'YARD_TO_PROJECT',
        'Xuất bãi chuyển đi công trình',
        removedPlacements > 0,
        `${removedPlacements} placement đã xuất/removed khỏi bãi`,
      ),
      this.step(
        'EXCEPTION_RETURNS',
        'Trả vật tư dư và công trình trả về',
        productionReturns > 0 || projectReturnedPlacements > 0,
        `${productionReturns} giao dịch trả vật tư SX, ${projectReturnedPlacements} lượt nhập bãi dạng trả về`,
        productionReturns > 0 || projectReturnedPlacements > 0 ? undefined : 'WARN',
      ),
      this.step(
        'QC_FAILURE',
        'Cấu kiện lỗi không đạt',
        failedQc.length > 0,
        `${failedQc.length} phiếu QC không đạt/rework/rejected`,
        failedQc.length > 0 ? undefined : 'WARN',
      ),
    ]

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        supplierInbound,
        inventoryItems,
        projectOutbound,
        productionOutbound,
        productionReturns,
        boms,
        productionOrders: productionOrders.length,
        completedOrders: completedOrders.length,
        materialIssues,
        approvedQc: approvedQc.length,
        failedQc: failedQc.length,
        activePlacements: activePlacements.length,
        removedPlacements,
        completedWithoutQc: completedWithoutQc.length,
        stagedWithoutQc: stagedWithoutQc.length,
      },
      steps,
      blockers: steps.filter((step) => step.status === 'BLOCKED'),
      warnings: steps.filter((step) => step.status === 'WARN'),
      samples: {
        completedWithoutQc: completedWithoutQc.slice(0, 5).map((order) => ({
          id: order.id,
          orderNo: order.orderNo,
          componentCode: order.component?.code,
          componentName: order.component?.name,
        })),
        stagedWithoutQc: stagedWithoutQc.slice(0, 5).map((placement) => ({
          id: placement.id,
          itemCode: placement.itemCode,
          itemName: placement.itemName,
        })),
      },
    }
  }

  private step(
    code: string,
    name: string,
    passed: boolean,
    detail: string,
    forcedStatus?: 'OK' | 'WARN' | 'BLOCKED',
  ) {
    return {
      code,
      name,
      status: forcedStatus ?? (passed ? 'OK' : 'BLOCKED'),
      detail,
    }
  }
}
