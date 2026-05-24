import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type ProductionTx = Prisma.TransactionClient;

@Injectable()
export class ProductionRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: ProductionTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  createOrder(data: Prisma.ProductionOrderCreateInput, tx: ProductionTx) {
    return tx.productionOrder.create({
      data,
      include: this.orderInclude(),
    });
  }

  updateOrder(
    id: string,
    data: Prisma.ProductionOrderUpdateInput,
    tx: ProductionTx = this.prisma,
  ) {
    return tx.productionOrder.update({
      where: { id },
      data,
      include: this.orderInclude(),
    });
  }

  findOrderById(id: string, tx: ProductionTx = this.prisma) {
    return tx.productionOrder.findUnique({
      where: { id },
      include: this.orderInclude(),
    });
  }

  findOrders(params: {
    search?: string;
    status?: Prisma.EnumProductionOrderStatusFilter['equals'];
    projectId?: string;
    componentId?: string;
    currentStageCode?: Prisma.EnumProductionStageCodeNullableFilter['equals'];
    skip?: number;
    take?: number;
  }) {
    return this.prisma.productionOrder.findMany({
      where: this.orderWhere(params),
      include: this.orderInclude(),
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countOrders(params: {
    search?: string;
    status?: Prisma.EnumProductionOrderStatusFilter['equals'];
    projectId?: string;
    componentId?: string;
    currentStageCode?: Prisma.EnumProductionStageCodeNullableFilter['equals'];
  }) {
    return this.prisma.productionOrder.count({
      where: this.orderWhere(params),
    });
  }

  findStageById(id: string, tx: ProductionTx = this.prisma) {
    return tx.productionStage.findUnique({
      where: { id },
      include: {
        productionOrder: {
          include: this.orderInclude(),
        },
      },
    });
  }

  updateStage(
    id: string,
    data: Prisma.ProductionStageUpdateInput,
    tx: ProductionTx,
  ) {
    return tx.productionStage.update({
      where: { id },
      data,
    });
  }

  createTask(data: Prisma.ProductionTaskCreateInput, tx: ProductionTx) {
    return tx.productionTask.create({ data });
  }

  updateTask(
    id: string,
    data: Prisma.ProductionTaskUpdateInput,
    tx: ProductionTx,
  ) {
    return tx.productionTask.update({
      where: { id },
      data,
    });
  }

  createLog(data: Prisma.ProductionLogCreateInput, tx: ProductionTx) {
    return tx.productionLog.create({ data });
  }

  createWorkCenter(data: Prisma.WorkCenterCreateInput) {
    return this.prisma.workCenter.create({
      data,
      include: {
        machines: true,
      },
    });
  }

  listWorkCenters() {
    return this.prisma.workCenter.findMany({
      include: {
        machines: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  createMachine(data: Prisma.MachineCreateInput) {
    return this.prisma.machine.create({
      data,
      include: {
        workCenter: true,
      },
    });
  }

  listMachines() {
    return this.prisma.machine.findMany({
      include: {
        workCenter: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  createSchedule(data: Prisma.ProductionScheduleCreateInput) {
    return this.prisma.productionSchedule.create({
      data,
      include: {
        productionOrder: true,
        workCenter: true,
        machine: true,
      },
    });
  }

  listSchedules() {
    return this.prisma.productionSchedule.findMany({
      include: {
        productionOrder: true,
        workCenter: true,
        machine: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    tx: ProductionTx = this.prisma,
  ) {
    return tx.activityLog.create({ data });
  }

  metrics() {
    return this.prisma.$transaction(async (tx) => {
      const [total, inProgress, delayed, completed, stages, machines] =
        await Promise.all([
          tx.productionOrder.count(),
          tx.productionOrder.count({ where: { status: 'IN_PROGRESS' } }),
          tx.productionOrder.count({ where: { status: 'DELAYED' } }),
          tx.productionOrder.count({ where: { status: 'COMPLETED' } }),
          tx.productionStage.groupBy({
            by: ['code', 'status'],
            _count: true,
          }),
          tx.machine.findMany(),
        ]);

      return {
        total,
        inProgress,
        delayed,
        completed,
        stages,
        machines,
      };
    });
  }

  orderInclude() {
    return {
      stages: {
        include: {
          workCenter: true,
          machine: true,
        },
        orderBy: {
          sequence: 'asc' as const,
        },
      },
      tasks: {
        include: {
          workCenter: true,
          machine: true,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
      schedules: {
        include: {
          workCenter: true,
          machine: true,
        },
        orderBy: {
          startAt: 'asc' as const,
        },
      },
      logs: {
        orderBy: {
          createdAt: 'desc' as const,
        },
        take: 20,
      },
    };
  }

  private orderWhere(params: {
    search?: string;
    status?: Prisma.EnumProductionOrderStatusFilter['equals'];
    projectId?: string;
    componentId?: string;
    currentStageCode?: Prisma.EnumProductionStageCodeNullableFilter['equals'];
  }): Prisma.ProductionOrderWhereInput {
    return {
      status: params.status,
      projectId: params.projectId,
      componentId: params.componentId,
      currentStageCode: params.currentStageCode,
      OR: params.search
        ? [
            {
              orderNo: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
            {
              title: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }
}
