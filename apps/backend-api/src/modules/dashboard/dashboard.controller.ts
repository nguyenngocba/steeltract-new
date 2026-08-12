import { Controller, Get, UseGuards } from '@nestjs/common';

import {
  ComponentStatus,
  ProductionOrderStatus,
  ProjectStatus,
  QcInspectionStatus,
} from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { DashboardActivityService } from './dashboard-activity.service';
import { DashboardInsightService } from './dashboard-insight.service';
import { DashboardInventoryReadModelService } from './dashboard-inventory-read-model.service';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { DashboardNotificationService } from './dashboard-notification.service';
import { DashboardRecommendationService } from './dashboard-recommendation.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('dashboard.view')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private prisma: PrismaService,
    private readonly dashboardMetrics: DashboardMetricsService,
    private readonly inventoryReadModel: DashboardInventoryReadModelService,
    private readonly dashboardActivity: DashboardActivityService,
    private readonly dashboardNotifications: DashboardNotificationService,
    private readonly dashboardInsights: DashboardInsightService,
    private readonly dashboardRecommendations: DashboardRecommendationService,
  ) {}

  @RequirePermissions('dashboard.executive')
  @Get('executive-cockpit')
  async executiveCockpit() {
    const [trends, activities, notifications] = await Promise.all([
      this.dashboardMetrics.getPredictiveTrends(),
      this.dashboardActivity.getRecentActivities(),
      this.dashboardNotifications.getNotifications(),
    ]);
    const insights = await this.dashboardInsights.getControlTowerInsights(
      trends,
      notifications,
    );
    const recommendations = this.dashboardRecommendations.getRecommendations(
      trends,
      insights,
      notifications,
    );

    return {
      generatedAt: new Date().toISOString(),
      health: insights.health,
      executiveSummary: insights.executiveSummary,
      recommendations,
      trends,
      activities,
      notifications,
    };
  }

  @Get('cockpit')
  async cockpit() {
    const [
      projects,
      activeProjects,
      productionOrders,
      productionActive,
      productionCompleted,
      components,
      completedComponents,
      inventory,
      logisticsActive,
      qcOpen,
      yardActive,
      recentActivities,
      recentNotifications,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({
        where: {
          status: { in: [ProjectStatus.ACTIVE, ProjectStatus.DELAYED] },
        },
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
      this.inventoryReadModel.getCockpitInventory(),
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
    ]);

    const productionStatus = await this.prisma.productionOrder.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const projectRows = await this.prisma.project.findMany({
      take: 6,
      orderBy: { updatedAt: 'desc' },
      include: { components: true },
    });
    const completedComponentStatuses: ComponentStatus[] = [
      ComponentStatus.READY,
      ComponentStatus.SHIPPED,
      ComponentStatus.DELIVERED,
      ComponentStatus.INSTALLED,
    ];
    return {
      generatedAt: new Date().toISOString(),
      kpis: {
        projects,
        activeProjects,
        productionOrders,
        productionActive,
        components,
        completedComponents,
        componentCompletionRate:
          components > 0
            ? Math.round((completedComponents / components) * 100)
            : 0,
        logisticsActive,
        inventoryTotal: inventory.inventoryTotal,
        inboundTransactions: inventory.inboundTransactions,
        outboundTransactions: inventory.outboundTransactions,
        qcOpen,
        yardActive,
      },
      productionStatus: productionStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
      inventoryDistribution: inventory.distribution,
      movementTrend: inventory.movementTrend,
      projects: projectRows.map((project) => {
        const total = project.components.length;
        const done = project.components.filter((component) =>
          completedComponentStatuses.includes(component.status),
        ).length;
        return {
          id: project.id,
          code: project.code,
          name: project.name,
          status: project.status,
          progress:
            total > 0
              ? Math.round((done / total) * 100)
              : project.status === ProjectStatus.COMPLETED
                ? 100
                : 0,
        };
      }),
      productionSummary: {
        active: productionActive,
        waiting: Math.max(
          0,
          productionOrders - productionActive - productionCompleted,
        ),
        completed: productionCompleted,
        delayed:
          productionStatus.find(
            (row) => row.status === ProductionOrderStatus.DELAYED,
          )?._count._all ?? 0,
      },
      alerts: [
        {
          code: 'LOW_STOCK',
          title: 'Vật tư dưới tồn tối thiểu',
          count: inventory.lowStockCount,
        },
        {
          code: 'PRODUCTION_DELAYED',
          title: 'Lệnh sản xuất trễ tiến độ',
          count:
            productionStatus.find(
              (row) => row.status === ProductionOrderStatus.DELAYED,
            )?._count._all ?? 0,
        },
        {
          code: 'QC_OPEN',
          title: 'Phiếu QC cần xử lý',
          count: qcOpen,
        },
      ],
      recentActivities,
      recentNotifications,
    };
  }

  @Get('stats')
  async stats() {
    const [projectCount, componentCount, inventoryStats] = await Promise.all([
      this.prisma.project.count(),

      this.prisma.component.count(),

      this.inventoryReadModel.getStats(),
    ]);

    return {
      inventoryCount: inventoryStats.inventoryCount,
      projectCount,
      componentCount,
      transactionCount: inventoryStats.transactionCount,
      lowStockCount: inventoryStats.lowStockCount,
    };
  }
  @Get('recent-transactions')
  async recentTransactions() {
    return this.inventoryReadModel.getRecentTransactions(5);
  }
  @Get('low-stock')
  async lowStock() {
    return this.inventoryReadModel.getLowStockItems();
  }
  @Get('construction-progress')
  async constructionProgress() {
    const total = await this.prisma.component.count();

    const installed = await this.prisma.component.count({
      where: {
        status: 'INSTALLED',
      },
    });

    const delivered = await this.prisma.component.count({
      where: {
        status: 'DELIVERED',
      },
    });

    const stock = await this.prisma.component.count({
      where: {
        status: 'STOCK',
      },
    });

    const progress = total > 0 ? Math.round((installed / total) * 100) : 0;

    return {
      total,
      installed,
      delivered,
      stock,
      progress,
    };
  }

  @RequirePermissions('dashboard.executive')
  @Get('analytics')
  async analytics() {
    const components = await this.prisma.component.findMany();

    const installed = components.filter((c) => c.status === 'INSTALLED').length;

    const delivered = components.filter((c) => c.status === 'DELIVERED').length;

    const stock = components.filter((c) => c.status === 'STOCK').length;

    const total = components.length;

    const progress = total ? Math.round((installed / total) * 100) : 0;

    return {
      total,
      installed,
      delivered,
      stock,
      progress,
    };
  }

  @RequirePermissions('dashboard.executive')
  @Get('forecast')
  async forecast() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);

    const installed = await this.prisma.component.count({
      where: {
        status: 'INSTALLED',
      },
    });

    const total = await this.prisma.component.count();

    const remaining = total - installed;

    const completedRecently = await this.prisma.component.count({
      where: {
        status: 'INSTALLED',
        installedDate: {
          gte: since,
        },
      },
    });

    const dailyRate = completedRecently / 30;

    const estimatedDays =
      dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null;

    return {
      installed,
      total,
      remaining,
      estimatedDays,
    };
  }

  @RequirePermissions('dashboard.executive')
  @Get('costs')
  async costs() {
    const components = await this.prisma.component.findMany();

    const estimated = components.reduce(
      (acc, item) => acc + (item.estimatedCost || 0),
      0,
    );

    const actual = components.reduce(
      (acc, item) => acc + (item.actualCost || 0),
      0,
    );

    return {
      estimated,
      actual,
      variance: actual - estimated,
    };
  }

  @RequirePermissions('dashboard.executive')
  @Get('procurement')
  async procurement() {
    return this.inventoryReadModel.getProcurementSuggestions();
  }

  @RequirePermissions('dashboard.executive')
  @Get('anomalies')
  async anomalies() {
    return this.inventoryReadModel.getAnomalies();
  }

  @Get('activities')
  async activities() {
    return this.prisma.activityLog.findMany({
      take: 10,

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
