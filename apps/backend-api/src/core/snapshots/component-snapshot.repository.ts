import { Inject, Injectable } from '@nestjs/common';

import { ComponentStatus, Prisma, YardItemType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface ComponentDashboardSnapshotPayload {
  scopeKey: string;
  snapshotDate: Date;
  totalComponents: number;
  stockCount: number;
  producingCount: number;
  readyCount: number;
  shippedCount: number;
  deliveredCount: number;
  installedCount: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  payload?: Prisma.InputJsonValue;
}

export interface ComponentSummarySnapshotPayload {
  componentId: string;
  code: string;
  status: string;
  projectId?: string | null;
  productionOrderCount: number;
  timelineCount: number;
  estimatedCost: number;
  actualCost: number;
  currentLocation?: string | null;
  payload?: Prisma.InputJsonValue;
}

@Injectable()
export class ComponentSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findDashboardSnapshot(snapshotDate: Date, scopeKey = 'ALL') {
    return this.prisma.componentDashboardSnapshot.findUnique({
      where: { scopeKey_snapshotDate: { scopeKey, snapshotDate } },
    });
  }

  findDashboardHistory(take = 12, scopeKey = 'ALL') {
    return this.prisma.componentDashboardSnapshot.findMany({
      where: { scopeKey },
      orderBy: { snapshotDate: 'desc' },
      take,
    });
  }

  findSummarySnapshot(componentId: string) {
    return this.prisma.componentSummarySnapshot.findUnique({
      where: { componentId },
    });
  }

  findSummarySnapshots(componentId?: string) {
    return this.prisma.componentSummarySnapshot.findMany({
      where: { componentId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async calculateDashboard(
    snapshotDate = new Date(),
  ): Promise<ComponentDashboardSnapshotPayload[]> {
    const [statusGroups, costs, timelines] = await Promise.all([
      this.prisma.component.groupBy({ by: ['status'], _count: true }),
      this.prisma.component.aggregate({
        _sum: { estimatedCost: true, actualCost: true },
      }),
      this.prisma.componentTimeline.groupBy({ by: ['action'], _count: true }),
    ]);
    const count = (statuses: ComponentStatus[]) =>
      statusGroups
        .filter((row) => statuses.includes(row.status))
        .reduce((sum, row) => sum + row._count, 0);

    return [
      {
        scopeKey: 'ALL',
        snapshotDate: this.startOfDay(snapshotDate),
        totalComponents: statusGroups.reduce((sum, row) => sum + row._count, 0),
        stockCount: count([ComponentStatus.STOCK]),
        producingCount: count([
          ComponentStatus.CUTTING,
          ComponentStatus.WELDING,
          ComponentStatus.PAINTING,
        ]),
        readyCount: count([ComponentStatus.READY]),
        shippedCount: count([ComponentStatus.SHIPPED]),
        deliveredCount: count([ComponentStatus.DELIVERED]),
        installedCount: count([ComponentStatus.INSTALLED]),
        totalEstimatedCost: Number(costs._sum.estimatedCost ?? 0),
        totalActualCost: Number(costs._sum.actualCost ?? 0),
        payload: this.toJson({
          statusCounts: statusGroups.map((row) => ({
            status: row.status,
            count: row._count,
          })),
          timelineActions: timelines.map((row) => ({
            action: row.action,
            count: row._count,
          })),
        }),
      },
    ];
  }

  async calculateSummarySnapshots(
    componentId?: string,
  ): Promise<ComponentSummarySnapshotPayload[]> {
    const components = await this.prisma.component.findMany({
      where: { id: componentId },
      include: {
        project: { select: { code: true, name: true } },
        _count: { select: { productionOrders: true, timelines: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const placements = await this.prisma.yardItemPlacement.findMany({
      where: {
        removedAt: null,
        OR: [
          {
            itemType: YardItemType.COMPONENT,
            itemId: { in: components.map((row) => row.id) },
            componentInstanceId: null,
          },
          {
            componentInstance: {
              componentId: { in: components.map((row) => row.id) },
            },
          },
        ],
      },
      include: {
        slot: { include: { zone: true } },
        componentInstance: {
          select: { id: true, instanceNo: true, componentId: true },
        },
      },
      orderBy: { placedAt: 'desc' },
    });
    const placementByComponent = new Map<string, (typeof placements)[number]>();
    for (const placement of placements) {
      const componentKey =
        placement.componentInstance?.componentId ?? placement.itemId;
      if (!placementByComponent.has(componentKey)) {
        placementByComponent.set(componentKey, placement);
      }
    }

    return components.map((component) => {
      const placement = placementByComponent.get(component.id);
      const currentLocation = placement
        ? `${placement.slot.zone.code} / ${placement.slot.code} / L${placement.stackLevel}`
        : [component.floor, component.zone, component.position]
            .filter(Boolean)
            .join(' / ') || null;
      return {
        componentId: component.id,
        code: component.code,
        status: component.status,
        projectId: component.projectId,
        productionOrderCount: component._count.productionOrders,
        timelineCount: component._count.timelines,
        estimatedCost: Number(component.estimatedCost ?? 0),
        actualCost: Number(component.actualCost ?? 0),
        currentLocation,
        payload: this.toJson({
          name: component.name,
          projectCode: component.project?.code,
          projectName: component.project?.name,
          installedDate: component.installedDate,
          installZone: component.installZone,
          installAxis: component.installAxis,
          installLevel: component.installLevel,
          installPosition: component.installPosition,
        }),
      };
    });
  }

  upsertDashboard(
    payload: ComponentDashboardSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.componentDashboardSnapshot.upsert({
      where: {
        scopeKey_snapshotDate: {
          scopeKey: payload.scopeKey,
          snapshotDate: payload.snapshotDate,
        },
      },
      create: payload,
      update: {
        totalComponents: payload.totalComponents,
        stockCount: payload.stockCount,
        producingCount: payload.producingCount,
        readyCount: payload.readyCount,
        shippedCount: payload.shippedCount,
        deliveredCount: payload.deliveredCount,
        installedCount: payload.installedCount,
        totalEstimatedCost: payload.totalEstimatedCost,
        totalActualCost: payload.totalActualCost,
        payload: payload.payload,
      },
    });
  }

  upsertSummary(
    payload: ComponentSummarySnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.componentSummarySnapshot.upsert({
      where: { componentId: payload.componentId },
      create: payload,
      update: {
        code: payload.code,
        status: payload.status,
        projectId: payload.projectId,
        productionOrderCount: payload.productionOrderCount,
        timelineCount: payload.timelineCount,
        estimatedCost: payload.estimatedCost,
        actualCost: payload.actualCost,
        currentLocation: payload.currentLocation,
        payload: payload.payload,
      },
    });
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toJson(value: Record<string, unknown>) {
    return value as Prisma.InputJsonValue;
  }
}
