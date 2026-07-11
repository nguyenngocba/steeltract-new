import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { nextOperationalCode } from '../../../common/utils/code-generator';
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

  findBomById(id: string, tx: ProductionTx = this.prisma) {
    return tx.bOM.findUnique({
      where: { id },
      include: {
        routingSteps: {
          orderBy: {
            stepNo: 'asc',
          },
        },
      },
    });
  }

  findComponentById(id: string, tx: ProductionTx = this.prisma) {
    return tx.component.findUnique({
      where: { id },
    });
  }

  findApprovedQcInspection(productionOrderId: string) {
    return this.prisma.qcInspection.findFirst({
      where: {
        productionOrderId,
        status: {
          in: ['PASSED', 'APPROVED'],
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findYardSlot(id: string) {
    return this.prisma.yardSlot.findUnique({
      where: { id },
      include: { zone: true },
    });
  }

  findActiveYardPlacementsForProduction(input: {
    componentId: string;
    productionOrderId: string;
  }) {
    return this.prisma.yardItemPlacement.findMany({
      where: {
        itemType: 'COMPONENT',
        itemId: input.componentId,
        removedAt: null,
        metadata: {
          path: ['productionOrderId'],
          equals: input.productionOrderId,
        },
      },
    });
  }

  markComponentStagedFromProduction(input: {
    componentId: string;
    orderId: string;
    orderNo: string;
    status: Prisma.EnumComponentStatusFieldUpdateOperationsInput['set'];
    floor: string;
    zoneCode: string;
    slotCode: string;
    x: number;
    y: number;
    stackLevel: number;
    placementId: string;
    slotId: string;
    actorId?: string;
  }) {
    return this.prisma.$transaction([
      this.prisma.component.update({
        where: { id: input.componentId },
        data: {
          status: input.status,
          floor: input.floor,
          zone: input.zoneCode,
          position: input.slotCode,
          x: input.x,
          y: input.y,
        },
      }),
      this.prisma.componentTimeline.create({
        data: {
          componentId: input.componentId,
          action: 'MOVED_TO_YARD',
          note: `${input.orderNo} completed and staged at ${input.zoneCode}/${input.slotCode}/L${input.stackLevel}`,
        },
      }),
      this.prisma.productionLog.create({
        data: {
          productionOrderId: input.orderId,
          type: 'NOTE',
          message: `Finished component staged at ${input.zoneCode}/${input.slotCode}/L${input.stackLevel}`,
          workerId: input.actorId,
          metadata: {
            yardPlacementId: input.placementId,
            yardSlotId: input.slotId,
          },
        },
      }),
    ]);
  }

  updateComponentStatus(
    id: string,
    status: Prisma.EnumComponentStatusFieldUpdateOperationsInput['set'],
    tx: ProductionTx,
  ) {
    return tx.component.update({
      where: { id },
      data: { status },
    });
  }

  findOrderForComponentCreation(id: string) {
    return this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        component: true,
        materialIssues: true,
      },
    });
  }

  async upsertComponentFromProductionOrder(input: {
    orderId: string;
    orderNo: string;
    title: string;
    projectId: string | null;
    component?: { id: string; projectId: string | null } | null;
    actorId?: string;
  }) {
    const component = input.component
      ? await this.prisma.component.update({
          where: { id: input.component.id },
          data: {
            status: 'READY',
            projectId: input.projectId ?? input.component.projectId,
          },
          include: { project: true },
        })
      : await this.prisma.component.create({
          data: {
            code: await this.nextComponentCode(),
            name: input.title,
            projectId: input.projectId,
            status: 'READY',
            description: JSON.stringify({
              productionOrderId: input.orderId,
              source: 'production',
            }),
          },
          include: { project: true },
        });

    if (!input.component) {
      await this.prisma.productionOrder.update({
        where: { id: input.orderId },
        data: { componentId: component.id },
      });
    }

    await this.prisma.componentTimeline.create({
      data: {
        componentId: component.id,
        action: 'READY',
        note: `${input.orderNo} material issued and component created by production execution`,
      },
    });

    await this.prisma.productionLog.create({
      data: {
        productionOrderId: input.orderId,
        type: 'NOTE',
        message: `Component ${component.code} created from production execution`,
        workerId: input.actorId,
      },
    });

    return component;
  }

  nextIssueNo() {
    return nextOperationalCode(
      this.prisma,
      'productionMaterialIssue',
      'issueNo',
      'ISS',
    );
  }

  nextComponentCode() {
    return nextOperationalCode(this.prisma, 'component', 'code', 'CPL');
  }

  findIssuedMaterialIssues(materialIds: string[]) {
    return this.prisma.productionMaterialIssue.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        status: 'ISSUED',
      },
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

  listLogs() {
    return this.prisma.productionLog.findMany({
      include: {
        productionOrder: true,
        stage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
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
      bom: {
        include: {
          items: {
            include: {
              material: {
                include: {
                  category: true,
                  unitMaster: true,
                },
              },
            },
          },
          routingSteps: {
            orderBy: {
              stepNo: 'asc' as const,
            },
          },
        },
      },
      component: {
        include: {
          project: true,
        },
      },
      materialIssues: {
        include: {
          inventoryItem: true,
        },
        orderBy: {
          issuedDate: 'desc' as const,
        },
      },
      materialConsumptions: {
        include: {
          inventoryItem: true,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
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
