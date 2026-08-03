import { Injectable } from '@nestjs/common';

import {
  ComponentInstanceExecutionStatus,
  ComponentInstanceState,
  Prisma,
  ProductionMaterialReservationStatus,
} from '@prisma/client';

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
    componentCode: string;
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
      this.prisma.outboxEvent.upsert({
        where: {
          idempotencyKey: `production.staged.to-yard:${input.placementId}`,
        },
        create: {
          eventName: 'production.staged.to-yard',
          payload: {
            productionOrderId: input.orderId,
            productionOrderNo: input.orderNo,
            componentId: input.componentId,
            componentCode: input.componentCode,
            placementId: input.placementId,
            slotId: input.slotId,
            slotCode: input.slotCode,
            zoneCode: input.zoneCode,
          },
          metadata: {
            module: 'production',
            persistToOutbox: true,
            idempotencyKey: `production.staged.to-yard:${input.placementId}`,
          },
          idempotencyKey: `production.staged.to-yard:${input.placementId}`,
        },
        update: {},
      }),
    ]);
  }

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
    },
    tx: ProductionTx,
  ) {
    return tx.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: data,
      update: {},
    });
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

  findActiveReservationLines(materialIds: string[]) {
    return this.prisma.productionMaterialReservationLine.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        reservation: {
          status: {
            in: [
              ProductionMaterialReservationStatus.RESERVED,
              ProductionMaterialReservationStatus.PARTIALLY_ISSUED,
            ],
          },
        },
      },
      include: {
        reservation: {
          select: {
            id: true,
            productionOrderId: true,
            status: true,
          },
        },
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

  async cockpitReadModel(input: {
    search?: string;
    status?: Prisma.EnumProductionOrderStatusFilter['equals'];
    scope: 'all' | 'planning';
    sortBy: 'updatedAt' | 'orderNo' | 'plannedEndAt' | 'status';
    sortOrder: 'asc' | 'desc';
    page: number;
    limit: number;
  }) {
    const where: Prisma.ProductionOrderWhereInput = {
      status: input.status
        ? input.status
        : input.scope === 'planning'
          ? { in: ['PLANNED', 'RELEASED'] }
          : undefined,
      OR: input.search
        ? [
            { orderNo: { contains: input.search, mode: 'insensitive' } },
            { title: { contains: input.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const orderBy: Prisma.ProductionOrderOrderByWithRelationInput = {
      [input.sortBy]: input.sortOrder,
    };
    const skip = (input.page - 1) * input.limit;

    const [rows, aggregateRows, total, workCenters] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where,
        include: this.orderInclude(),
        orderBy,
        skip,
        take: input.limit,
      }),
      this.prisma.productionOrder.findMany({
        where,
        select: {
          id: true,
          orderNo: true,
          title: true,
          quantity: true,
          status: true,
          currentStageCode: true,
          plannedEndAt: true,
          component: {
            select: { id: true, code: true, name: true },
          },
          bom: {
            select: {
              estimatedWeight: true,
              items: {
                select: {
                  materialId: true,
                  quantity: true,
                  wastePercent: true,
                },
              },
            },
          },
          stages: {
            select: { name: true, status: true },
          },
          materialIssues: {
            select: {
              inventoryItemId: true,
              issuedQty: true,
              returnedQty: true,
              status: true,
            },
          },
          materialReservations: {
            select: { status: true },
          },
          componentInstances: {
            select: {
              id: true,
              state: true,
            },
          },
        },
      }),
      this.prisma.productionOrder.count({ where }),
      this.prisma.workCenter.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          _count: { select: { stages: true, machines: true, tasks: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    const aggregates = aggregateRows.map((row) => {
      const readiness = productionOrderReadiness(row);
      const progress = productionOrderProgress(row);
      return {
        row,
        progress,
        readiness,
        delayed: productionOrderDelayed(row),
      };
    });
    const data = rows.map((row) => ({
      ...row,
      cockpit: {
        progress: productionOrderProgress(row),
        delayed: productionOrderDelayed(row),
        materialReadiness: productionOrderReadiness(row),
      },
      canonical: productionOrderCanonical(row),
    }));
    const countStatus = (status: string) =>
      aggregates.filter(({ row }) => row.status === status).length;
    const issuedOrders = aggregates.filter(
      ({ row }) => row.materialIssues.length > 0,
    ).length;
    const shortageOrders = aggregates.filter(
      ({ row }) =>
        row.bom &&
        row.materialIssues.length === 0 &&
        !row.materialReservations.some((reservation) =>
          ['RESERVED', 'PARTIALLY_ISSUED'].includes(reservation.status),
        ) &&
        row.status !== 'COMPLETED',
    ).length;

    return {
      data,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
      summary: {
        total,
        planned: countStatus('PLANNED'),
        released: countStatus('RELEASED'),
        inProgress: countStatus('IN_PROGRESS'),
        completed: countStatus('COMPLETED'),
        completedToday: aggregates.filter(
          ({ row }) =>
            row.status === 'COMPLETED' && sameLocalDay(row.plannedEndAt),
        ).length,
        waitingMaterial: aggregates.filter(
          ({ row }) =>
            Boolean(row.bom) &&
            row.materialIssues.length === 0 &&
            row.status !== 'COMPLETED',
        ).length,
        delayed: aggregates.filter(({ delayed }) => delayed).length,
        runningComponents: aggregates.filter(
          ({ row }) => row.status === 'IN_PROGRESS' && Boolean(row.component),
        ).length,
        productionWeight: aggregates.reduce(
          (sum, { row }) =>
            sum +
            Number(row.quantity ?? 0) * Number(row.bom?.estimatedWeight ?? 0),
          0,
        ),
        componentInstances: aggregates.reduce(
          (sum, { row }) => sum + componentInstanceCount(row),
          0,
        ),
        waitingQc: aggregates.reduce(
          (sum, { row }) => sum + componentInstancesByState(row, [
            ComponentInstanceState.PRODUCED_WAITING_QC,
          ]),
          0,
        ),
        qcPassed: aggregates.reduce(
          (sum, { row }) => sum + componentInstancesByState(row, [
            ComponentInstanceState.QC_PASSED,
            ComponentInstanceState.USE_AS_IS,
          ]),
          0,
        ),
      },
      overview: {
        progress: {
          running: countStatus('IN_PROGRESS'),
          pending: aggregates.filter(
            ({ row, delayed }) =>
              !['IN_PROGRESS', 'COMPLETED'].includes(row.status) && !delayed,
          ).length,
          completed: countStatus('COMPLETED'),
        },
        material: {
          issued: issuedOrders,
          waiting: aggregates.filter(
            ({ row }) =>
              row.materialIssues.length === 0 &&
              row.materialReservations.some((reservation) =>
                ['RESERVED', 'PARTIALLY_ISSUED'].includes(reservation.status),
              ),
          ).length,
          shortage: shortageOrders,
        },
        stages: ['Cutting', 'Assembly', 'Welding', 'Painting', 'Finished'].map(
          (label) => ({
            label,
            value: aggregates.filter(
              ({ row }) =>
                productionStageFamily(
                  row.currentStageCode ??
                    row.stages.find((stage) =>
                      ['IN_PROGRESS', 'READY'].includes(stage.status),
                    )?.name,
                ) === label,
            ).length,
          }),
        ),
        activeComponents: aggregates
          .filter(({ row }) => row.component && row.status !== 'COMPLETED')
          .slice(0, 5)
          .map(({ row }) => row.component),
      },
      orderAnalytics: {
        progressSegments: [
          { label: 'Planning', min: 0, max: 25 },
          { label: 'Cutting', min: 25, max: 50 },
          { label: 'Welding', min: 50, max: 75 },
          { label: 'Painting', min: 75, max: 100 },
          { label: 'Finished', min: 100, max: 101 },
        ].map(({ label, min, max }) => ({
          label,
          value: aggregates.filter(
            ({ progress }) => progress >= min && progress < max,
          ).length,
        })),
        readinessSegments: [
          { label: '0-49%', min: 0, max: 50 },
          { label: '50-79%', min: 50, max: 80 },
          { label: '80-99%', min: 80, max: 100 },
          { label: '100%', min: 100, max: 101 },
        ].map(({ label, min, max }) => ({
          label,
          value: aggregates.filter(
            ({ readiness }) =>
              readiness.readinessPercent >= min &&
              readiness.readinessPercent < max,
          ).length,
        })),
        topMaterial: [...aggregates]
          .sort((a, b) => b.readiness.requiredQty - a.readiness.requiredQty)
          .slice(0, 5)
          .map(({ row, readiness }) => ({
            id: row.id,
            orderNo: row.orderNo,
            title: row.title,
            value: readiness.requiredQty,
          })),
        topShortage: aggregates
          .filter(
            ({ readiness }) => readiness.hasBom && readiness.remainingQty > 0,
          )
          .sort((a, b) => b.readiness.remainingQty - a.readiness.remainingQty)
          .slice(0, 5)
          .map(({ row, readiness }) => ({
            id: row.id,
            orderNo: row.orderNo,
            title: row.title,
            value: readiness.remainingQty,
          })),
        upcomingDelayed: aggregates
          .filter(
            ({ row }) =>
              !['COMPLETED', 'CANCELLED'].includes(row.status) &&
              Boolean(row.plannedEndAt),
          )
          .sort(
            (a, b) => Number(a.row.plannedEndAt) - Number(b.row.plannedEndAt),
          )
          .slice(0, 5)
          .map(({ row }) => ({
            id: row.id,
            orderNo: row.orderNo,
            title: row.title,
            plannedEndAt: row.plannedEndAt,
          })),
      },
      queue: {
        ready: countStatus('READY'),
        inProgress: countStatus('IN_PROGRESS'),
        paused: countStatus('PAUSED'),
        total,
      },
      workCenters,
    };
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
      componentRequirement: {
        include: {
          project: { select: { id: true, code: true, name: true } },
          projectTask: { select: { id: true, name: true } },
          component: {
            select: {
              id: true,
              code: true,
              name: true,
              componentType: true,
              profile: true,
              lifecycleState: true,
            },
          },
          componentRevision: {
            select: { id: true, revisionNo: true, state: true },
          },
          bomDefinition: {
            select: { id: true, state: true, contentHash: true },
          },
        },
      },
      componentInstances: {
        include: {
          componentRevision: {
            select: { id: true, revisionNo: true, state: true },
          },
          bomDefinition: {
            select: { id: true, state: true, contentHash: true },
          },
          executions: {
            include: {
              workOrder: {
                select: {
                  id: true,
                  workOrderNo: true,
                  productCode: true,
                  quantity: true,
                  status: true,
                  lifecycleState: true,
                  sequence: true,
                },
              },
              productionExecution: {
                select: {
                  id: true,
                  state: true,
                  workCenterId: true,
                  machineId: true,
                  startedAt: true,
                  completedAt: true,
                },
              },
            },
            orderBy: { updatedAt: 'desc' as const },
          },
          qcInspections: {
            select: {
              id: true,
              inspectionNo: true,
              status: true,
              completedAt: true,
              approvedAt: true,
              rejectedAt: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' as const },
            take: 5,
          },
          ncrs: {
            select: {
              id: true,
              ncrNo: true,
              status: true,
              disposition: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' as const },
            take: 5,
          },
        },
        orderBy: { serialSequence: 'asc' as const },
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
      materialReservations: {
        include: {
          lines: {
            include: {
              inventoryItem: {
                select: { id: true, code: true, name: true, unit: true },
              },
              warehouse: { select: { id: true, code: true, name: true } },
              zone: { select: { id: true, code: true, name: true } },
            },
          },
        },
        orderBy: {
          updatedAt: 'desc' as const,
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

type CockpitOrder = {
  id?: string;
  updatedAt?: Date;
  projectId?: string | null;
  componentRequirementId?: string | null;
  status: string;
  quantity: number;
  plannedEndAt: Date | null;
  component?: { id: string; code: string; name: string } | null;
  componentRequirement?: {
    id: string;
    requirementNo: string;
    requiredQuantity: number | string;
    project?: { id: string; code: string; name: string } | null;
    component?: {
      id: string;
      code: string;
      name: string;
      componentType?: string | null;
      profile?: string | null;
      lifecycleState: string;
    } | null;
    componentRevision?: {
      id: string;
      revisionNo: string;
      state: string;
    } | null;
    bomDefinition?: {
      id: string;
      state: string;
      contentHash?: string | null;
    } | null;
  } | null;
  stages: Array<{ status: string; name: string }>;
  componentInstances?: Array<{
    id: string;
    instanceNo?: string;
    state: ComponentInstanceState;
    producedAt?: Date | null;
    qcPassedAt?: Date | null;
    scrappedAt?: Date | null;
    updatedAt?: Date;
    executions?: Array<{
      id: string;
      status: ComponentInstanceExecutionStatus;
      startedAt: Date | null;
      completedAt: Date | null;
      cancelledAt: Date | null;
      updatedAt: Date;
      workOrder?: {
        id: string;
        workOrderNo: string;
        productCode: string;
        quantity: number;
        status: string;
        lifecycleState?: string;
        sequence?: number | null;
      } | null;
      productionExecution?: {
        id: string;
        state: string;
        workCenterId?: string | null;
        machineId?: string | null;
        startedAt?: Date | null;
        completedAt?: Date | null;
      } | null;
    }>;
    qcInspections?: Array<{
      id: string;
      inspectionNo: string;
      status: string;
      completedAt: Date | null;
      approvedAt: Date | null;
      rejectedAt: Date | null;
      updatedAt: Date;
    }>;
    ncrs?: Array<{
      id: string;
      ncrNo: string;
      status: string;
      disposition: string | null;
      updatedAt: Date;
    }>;
  }>;
  bom: {
    id?: string;
    bomNo?: string;
    productCode?: string;
    version?: string;
    status?: string;
    items: Array<{
      materialId: string;
      quantity: number;
      wastePercent: number;
    }>;
  } | null;
  materialIssues: Array<{
    inventoryItemId: string;
    issuedQty: number;
    returnedQty: number;
    status: string;
  }>;
  materialReservations?: Array<{
    id?: string;
    reservationNo?: string;
    status: string;
    reservedAt?: Date | null;
    lines?: Array<{
      id: string;
      requiredQty: number;
      reservedQty: number;
      issuedQty: number;
      returnedQty: number;
      status: string;
      inventoryItem: { id: string; code: string; name: string; unit?: string | null };
      warehouse?: { id: string; code: string; name: string } | null;
      zone?: { id: string; code: string; name: string } | null;
      slotId?: string | null;
      level?: string | null;
    }>;
  }>;
};

function productionOrderDelayed(order: CockpitOrder) {
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) return false;
  if (order.status === 'DELAYED') return true;
  return Boolean(order.plannedEndAt && order.plannedEndAt < new Date());
}

function productionOrderProgress(order: CockpitOrder) {
  if (order.status === 'COMPLETED') return 100;
  if (order.stages.length) {
    const completed = order.stages.filter(
      (stage) => stage.status === 'COMPLETED',
    ).length;
    const running = order.stages.some((stage) =>
      ['IN_PROGRESS', 'READY'].includes(stage.status),
    )
      ? 0.5
      : 0;
    return Math.min(
      99,
      Math.round(((completed + running) / order.stages.length) * 100),
    );
  }
  if (order.status === 'IN_PROGRESS') return 58;
  if (productionOrderDelayed(order)) return 22;
  return 12;
}

function productionOrderReadiness(order: CockpitOrder) {
  const requiredByMaterial = new Map<string, number>();
  for (const item of order.bom?.items ?? []) {
    const required =
      Number(item.quantity ?? 0) *
      (1 + Number(item.wastePercent ?? 0) / 100) *
      Number(order.quantity ?? 1);
    requiredByMaterial.set(
      item.materialId,
      (requiredByMaterial.get(item.materialId) ?? 0) + required,
    );
  }
  const issuedByMaterial = new Map<string, number>();
  for (const issue of order.materialIssues) {
    if (!['ISSUED', 'RETURNED'].includes(issue.status.toUpperCase())) continue;
    const netIssued = Math.max(
      0,
      Number(issue.issuedQty ?? 0) - Number(issue.returnedQty ?? 0),
    );
    issuedByMaterial.set(
      issue.inventoryItemId,
      (issuedByMaterial.get(issue.inventoryItemId) ?? 0) + netIssued,
    );
  }
  const requiredQty = [...requiredByMaterial.values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  const issuedQty = [...requiredByMaterial.entries()].reduce(
    (sum, [materialId, required]) =>
      sum + Math.min(required, issuedByMaterial.get(materialId) ?? 0),
    0,
  );
  const remainingQty = Math.max(0, requiredQty - issuedQty);
  const readinessPercent =
    requiredQty > 0 ? Math.min(100, (issuedQty / requiredQty) * 100) : 0;

  return {
    hasBom: Boolean(order.bom),
    requiredQty,
    issuedQty,
    remainingQty,
    readinessPercent,
    label: !order.bom
      ? 'Thiếu BOM'
      : readinessPercent >= 100
        ? 'READY TO RELEASE'
        : readinessPercent >= 80
          ? 'Gần đủ vật tư'
          : readinessPercent >= 50
            ? 'Thiếu một phần'
            : 'Thiếu vật tư',
  };
}

function componentInstanceCount(order: CockpitOrder) {
  return order.componentInstances?.length ?? 0;
}

function componentInstancesByState(
  order: CockpitOrder,
  states: ComponentInstanceState[],
) {
  const set = new Set(states);
  return (order.componentInstances ?? []).filter((instance) =>
    set.has(instance.state),
  ).length;
}

function productionOrderCanonical(order: CockpitOrder) {
  const instances = order.componentInstances ?? [];
  const executionCounts = countBy(
    instances.flatMap((instance) =>
      (instance.executions ?? []).map((run) => run.status),
    ),
  );
  const stateCounts = countBy(instances.map((instance) => instance.state));
  const latestQc = instances
    .flatMap((instance) =>
      (instance.qcInspections ?? []).map((inspection) => ({
        ...inspection,
        componentInstanceId: instance.id,
        instanceNo: instance.instanceNo ?? instance.id,
      })),
    )
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const qcCounts = countBy(latestQc.map((inspection) => inspection.status));
  const readiness = productionOrderReadiness(order);

  return {
    productionOrder: {
      id: order.id,
      componentRequirementId: order.componentRequirementId ?? null,
      projectId: order.projectId ?? order.componentRequirement?.project?.id ?? null,
      updatedAt: order.updatedAt ?? null,
    },
    project: order.componentRequirement?.project ?? null,
    requirement: order.componentRequirement
      ? {
          id: order.componentRequirement.id,
          requirementNo: order.componentRequirement.requirementNo,
          requiredQuantity: Number(order.componentRequirement.requiredQuantity ?? 0),
        }
      : null,
    componentDefinition:
      order.componentRequirement?.component ??
      (order.component
        ? {
            id: order.component.id,
            code: order.component.code,
            name: order.component.name,
            componentType: null,
            profile: null,
            lifecycleState: null,
          }
        : null),
    revision: order.componentRequirement?.componentRevision ?? null,
    bomDefinition: order.componentRequirement?.bomDefinition ?? null,
    bom: order.bom
      ? {
          id: order.bom.id ?? null,
          bomNo: order.bom.bomNo ?? null,
          productCode: order.bom.productCode ?? null,
          version: order.bom.version ?? null,
          status: order.bom.status ?? null,
        }
      : null,
    plannedQuantity: Number(order.quantity ?? 0),
    allocatedQuantity: Number(order.quantity ?? 0),
    componentInstances: {
      total: instances.length,
      stateCounts,
      rows: instances.map((instance) => ({
        id: instance.id,
        instanceNo: instance.instanceNo,
        state: instance.state,
        producedAt: instance.producedAt,
        qcPassedAt: instance.qcPassedAt,
        scrappedAt: instance.scrappedAt,
        updatedAt: instance.updatedAt,
        executions: instance.executions ?? [],
        qcInspections: instance.qcInspections ?? [],
        ncrs: instance.ncrs ?? [],
      })),
    },
    execution: {
      assigned: executionCounts.ASSIGNED ?? 0,
      running: executionCounts.RUNNING ?? 0,
      completed: executionCounts.COMPLETED ?? 0,
      cancelled: executionCounts.CANCELLED ?? 0,
      rows: instances.flatMap((instance) =>
        (instance.executions ?? []).map((run) => ({
          ...run,
          componentInstanceId: instance.id,
          instanceNo: instance.instanceNo ?? instance.id,
        })),
      ),
    },
    qc: {
      passed: qcCounts.PASSED ?? 0,
      failed: qcCounts.FAILED ?? 0,
      approved: qcCounts.APPROVED ?? 0,
      rejected: qcCounts.REJECTED ?? 0,
      rows: latestQc,
    },
    materialReadiness: readiness,
    material: {
      reservations: order.materialReservations ?? [],
      issues: order.materialIssues,
    },
    updatedAt: order.updatedAt ?? null,
  };
}

function countBy(values: Array<string | null | undefined>) {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function productionStageFamily(value?: string | null) {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('cut') || raw.includes('cắt')) return 'Cutting';
  if (raw.includes('assembl') || raw.includes('lắp')) return 'Assembly';
  if (raw.includes('weld') || raw.includes('hàn')) return 'Welding';
  if (raw.includes('paint') || raw.includes('sơn')) return 'Painting';
  if (raw.includes('finish') || raw.includes('hoàn')) return 'Finished';
  return 'Waiting';
}

function sameLocalDay(value: Date | null) {
  if (!value) return false;
  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  );
}
