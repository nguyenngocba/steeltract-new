import {
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  Prisma,
  ProductionOrderStatus,
  ProductionStageStatus,
  ProductionTaskStatus,
  WorkCenterStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface ProductionDashboardSnapshotPayload {
  scopeKey: string;
  snapshotDate: Date;
  totalOrders: number;
  inProgress: number;
  delayed: number;
  completed: number;
  completionRate: number;
  throughput: number;
  activeWorkCenters: number;
  machineUtilization: number;
  bottleneckCount: number;
  payload?: Prisma.InputJsonValue;
}

export interface ProductionOrderSnapshotPayload {
  productionOrderId: string;
  orderNo: string;
  status: string;
  currentStageCode?: string | null;
  progress: number;
  stageCount: number;
  completedStageCount: number;
  taskCount: number;
  blockedTaskCount: number;
  materialIssueCount: number;
  materialIssuedQty: number;
  materialReturnedQty: number;
  materialConsumedQty: number;
  actualCost: number;
  payload?: Prisma.InputJsonValue;
}

export interface WorkCenterSnapshotPayload {
  workCenterId: string;
  code: string;
  status: string;
  machineCount: number;
  activeOrderCount: number;
  activeTaskCount: number;
  blockedTaskCount: number;
  capacityPerDay?: number | null;
  utilization: number;
  payload?: Prisma.InputJsonValue;
}

@Injectable()
export class ProductionSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findDashboardSnapshot(snapshotDate: Date, scopeKey = 'ALL') {
    return this.prisma.productionDashboardSnapshot.findUnique({
      where: {
        scopeKey_snapshotDate: {
          scopeKey,
          snapshotDate,
        },
      },
    });
  }

  findDashboardHistory(take = 12, scopeKey = 'ALL') {
    return this.prisma.productionDashboardSnapshot.findMany({
      where: {
        scopeKey,
      },
      orderBy: {
        snapshotDate: 'desc',
      },
      take,
    });
  }

  findOrderSnapshot(productionOrderId: string) {
    return this.prisma.productionOrderSnapshot.findUnique({
      where: {
        productionOrderId,
      },
    });
  }

  findOrderSnapshots(productionOrderId?: string) {
    return this.prisma.productionOrderSnapshot.findMany({
      where: {
        productionOrderId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findWorkCenterSnapshot(workCenterId: string) {
    return this.prisma.workCenterSnapshot.findUnique({
      where: {
        workCenterId,
      },
    });
  }

  findWorkCenterSnapshots(workCenterId?: string) {
    return this.prisma.workCenterSnapshot.findMany({
      where: {
        workCenterId,
      },
      orderBy: [
        {
          code: 'asc',
        },
      ],
    });
  }

  async calculateDashboard(
    snapshotDate = new Date(),
  ): Promise<ProductionDashboardSnapshotPayload[]> {
    const day = this.startOfDay(snapshotDate);
    const [
      totalOrders,
      inProgress,
      delayed,
      completed,
      activeWorkCenters,
      stages,
      machines,
    ] = await Promise.all([
      this.prisma.productionOrder.count(),
      this.prisma.productionOrder.count({
        where: { status: ProductionOrderStatus.IN_PROGRESS },
      }),
      this.prisma.productionOrder.count({
        where: { status: ProductionOrderStatus.DELAYED },
      }),
      this.prisma.productionOrder.count({
        where: { status: ProductionOrderStatus.COMPLETED },
      }),
      this.prisma.workCenter.count({
        where: { status: WorkCenterStatus.ACTIVE },
      }),
      this.prisma.productionStage.groupBy({
        by: ['code', 'status'],
        _count: true,
      }),
      this.prisma.machine.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          utilization: true,
        },
      }),
    ]);
    const throughputBase = completed + inProgress;
    const bottleneckCount = stages
      .filter((stage) => stage.status === ProductionStageStatus.BLOCKED)
      .reduce((sum, stage) => sum + Number(stage._count ?? 0), 0);
    const machineUtilization = machines.length
      ? this.average(machines.map((machine) => Number(machine.utilization ?? 0)))
      : 0;

    return [
      {
        scopeKey: 'ALL',
        snapshotDate: day,
        totalOrders,
        inProgress,
        delayed,
        completed,
        completionRate: this.percent(completed, totalOrders),
        throughput:
          throughputBase > 0 ? Math.round(completed / throughputBase) : 0,
        activeWorkCenters,
        machineUtilization,
        bottleneckCount,
        payload: this.toJson({
          stageStatus: stages,
          machineUtilization: machines,
          bottlenecks: stages
            .filter((stage) => stage.status === ProductionStageStatus.BLOCKED)
            .map((stage) => ({
              stage: stage.code,
              count: stage._count,
            })),
        }),
      },
    ];
  }

  async calculateOrderSnapshots(
    productionOrderId?: string,
  ): Promise<ProductionOrderSnapshotPayload[]> {
    const orders = await this.prisma.productionOrder.findMany({
      where: {
        id: productionOrderId,
      },
      include: {
        stages: true,
        tasks: true,
        materialIssues: true,
        materialConsumptions: true,
        componentCostings: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return orders.map((order) => {
      const stageCount = order.stages.length;
      const completedStageCount = order.stages.filter(
        (stage) => stage.status === ProductionStageStatus.COMPLETED,
      ).length;
      const taskCount = order.tasks.length;
      const blockedTaskCount = order.tasks.filter(
        (task) => task.status === ProductionTaskStatus.BLOCKED,
      ).length;
      const materialIssuedQty = this.sum(
        order.materialIssues.map((issue) => Number(issue.issuedQty ?? 0)),
      );
      const materialReturnedQty = this.sum(
        order.materialIssues.map((issue) => Number(issue.returnedQty ?? 0)),
      );
      const materialConsumedQty = this.sum(
        order.materialConsumptions.map((row) => Number(row.consumedQty ?? 0)),
      );
      const actualCost = this.sum(
        order.componentCostings.map((row) => Number(row.actualCost ?? 0)),
      );

      return {
        productionOrderId: order.id,
        orderNo: order.orderNo,
        status: order.status,
        currentStageCode: order.currentStageCode,
        progress: this.percent(completedStageCount, stageCount),
        stageCount,
        completedStageCount,
        taskCount,
        blockedTaskCount,
        materialIssueCount: order.materialIssues.length,
        materialIssuedQty,
        materialReturnedQty,
        materialConsumedQty,
        actualCost,
        payload: this.toJson({
          title: order.title,
          projectId: order.projectId,
          componentId: order.componentId,
          bomId: order.bomId,
          plannedStartAt: order.plannedStartAt,
          plannedEndAt: order.plannedEndAt,
          startedAt: order.startedAt,
          completedAt: order.completedAt,
          delayedAt: order.delayedAt,
        }),
      };
    });
  }

  async calculateWorkCenterSnapshots(
    workCenterId?: string,
  ): Promise<WorkCenterSnapshotPayload[]> {
    const workCenters = await this.prisma.workCenter.findMany({
      where: {
        id: workCenterId,
      },
      include: {
        machines: true,
        stages: true,
        tasks: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return workCenters.map((workCenter) => {
      const activeStageStatuses: ProductionStageStatus[] = [
        ProductionStageStatus.READY,
        ProductionStageStatus.IN_PROGRESS,
        ProductionStageStatus.BLOCKED,
      ];
      const activeTaskStatuses: ProductionTaskStatus[] = [
        ProductionTaskStatus.ASSIGNED,
        ProductionTaskStatus.IN_PROGRESS,
        ProductionTaskStatus.BLOCKED,
      ];
      const activeOrderIds = new Set(
        workCenter.stages
          .filter((stage) => activeStageStatuses.includes(stage.status))
          .map((stage) => stage.productionOrderId),
      );
      const activeTasks = workCenter.tasks.filter((task) =>
        activeTaskStatuses.includes(task.status),
      );
      const blockedTaskCount = workCenter.tasks.filter(
        (task) => task.status === ProductionTaskStatus.BLOCKED,
      ).length;
      const utilization = workCenter.machines.length
        ? this.average(
            workCenter.machines.map((machine) =>
              Number(machine.utilization ?? 0),
            ),
          )
        : 0;

      return {
        workCenterId: workCenter.id,
        code: workCenter.code,
        status: workCenter.status,
        machineCount: workCenter.machines.length,
        activeOrderCount: activeOrderIds.size,
        activeTaskCount: activeTasks.length,
        blockedTaskCount,
        capacityPerDay: workCenter.capacityPerDay,
        utilization,
        payload: this.toJson({
          name: workCenter.name,
          machineStatus: workCenter.machines.map((machine) => ({
            id: machine.id,
            code: machine.code,
            name: machine.name,
            status: machine.status,
            utilization: machine.utilization,
          })),
        }),
      };
    });
  }

  upsertDashboard(
    payload: ProductionDashboardSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionDashboardSnapshot.upsert({
      where: {
        scopeKey_snapshotDate: {
          scopeKey: payload.scopeKey,
          snapshotDate: payload.snapshotDate,
        },
      },
      create: payload,
      update: {
        totalOrders: payload.totalOrders,
        inProgress: payload.inProgress,
        delayed: payload.delayed,
        completed: payload.completed,
        completionRate: payload.completionRate,
        throughput: payload.throughput,
        activeWorkCenters: payload.activeWorkCenters,
        machineUtilization: payload.machineUtilization,
        bottleneckCount: payload.bottleneckCount,
        payload: payload.payload,
      },
    });
  }

  upsertOrder(
    payload: ProductionOrderSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.productionOrderSnapshot.upsert({
      where: {
        productionOrderId: payload.productionOrderId,
      },
      create: payload,
      update: {
        orderNo: payload.orderNo,
        status: payload.status,
        currentStageCode: payload.currentStageCode,
        progress: payload.progress,
        stageCount: payload.stageCount,
        completedStageCount: payload.completedStageCount,
        taskCount: payload.taskCount,
        blockedTaskCount: payload.blockedTaskCount,
        materialIssueCount: payload.materialIssueCount,
        materialIssuedQty: payload.materialIssuedQty,
        materialReturnedQty: payload.materialReturnedQty,
        materialConsumedQty: payload.materialConsumedQty,
        actualCost: payload.actualCost,
        payload: payload.payload,
      },
    });
  }

  upsertWorkCenter(
    payload: WorkCenterSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.workCenterSnapshot.upsert({
      where: {
        workCenterId: payload.workCenterId,
      },
      create: payload,
      update: {
        code: payload.code,
        status: payload.status,
        machineCount: payload.machineCount,
        activeOrderCount: payload.activeOrderCount,
        activeTaskCount: payload.activeTaskCount,
        blockedTaskCount: payload.blockedTaskCount,
        capacityPerDay: payload.capacityPerDay,
        utilization: payload.utilization,
        payload: payload.payload,
      },
    });
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private sum(values: number[]) {
    return values.reduce((total, value) => total + value, 0);
  }

  private average(values: number[]) {
    return values.length ? this.sum(values) / values.length : 0;
  }

  private percent(value: number, total: number) {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  private toJson(value: Record<string, unknown>) {
    return value as Prisma.InputJsonValue;
  }
}
