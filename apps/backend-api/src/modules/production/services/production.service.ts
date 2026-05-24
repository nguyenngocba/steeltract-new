import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  ProductionLogType,
  ProductionOrderStatus,
  ProductionStageCode,
  ProductionStageStatus,
  ProductionTaskStatus,
} from '@prisma/client';

import { EventBusService } from '../../../core/events/event-bus.service';
import { AttachmentsService } from '../../attachments/services/attachments.service';
import { WorkflowService } from '../../workflow/services/workflow.service';
import {
  AssignProductionTaskDto,
  CompleteStageDto,
  CreateMachineDto,
  CreateProductionLogDto,
  CreateProductionOrderDto,
  CreateProductionScheduleDto,
  CreateProductionTaskDto,
  CreateWorkCenterDto,
  ListProductionOrdersDto,
  StartProductionDto,
  UpdateProductionOrderDto,
  UpdateProductionTaskDto,
} from '../dto/production.dto';
import {
  ProductionRepository,
  ProductionTx,
} from '../repositories/production.repository';

const defaultStages: Array<{
  code: ProductionStageCode;
  name: string;
  sequence: number;
}> = [
  { code: ProductionStageCode.CUTTING, name: 'Cutting', sequence: 1 },
  { code: ProductionStageCode.ASSEMBLY, name: 'Assembly', sequence: 2 },
  { code: ProductionStageCode.WELDING, name: 'Welding', sequence: 3 },
  { code: ProductionStageCode.DRILLING, name: 'Drilling', sequence: 4 },
  { code: ProductionStageCode.PAINTING, name: 'Painting', sequence: 5 },
  { code: ProductionStageCode.GALVANIZING, name: 'Galvanizing', sequence: 6 },
  { code: ProductionStageCode.PACKING, name: 'Packing', sequence: 7 },
];

type ProductionOrderWithDetails = Prisma.ProductionOrderGetPayload<{
  include: ReturnType<ProductionRepository['orderInclude']>;
}>;

@Injectable()
export class ProductionService {
  constructor(
    private readonly repository: ProductionRepository,
    private readonly eventBus: EventBusService,
    private readonly workflowService: WorkflowService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async findAll(query: ListProductionOrdersDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    const filters = {
      search,
      status: query.status,
      projectId: query.projectId,
      componentId: query.componentId,
      currentStageCode: query.currentStageCode,
    };

    if (!hasPagination) {
      return this.repository.findOrders(filters);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findOrders({ ...filters, skip, take: limit }),
      this.repository.countOrders(filters),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.getOrderOrThrow(id);
  }

  async create(dto: CreateProductionOrderDto, actorId?: string) {
    const order = await this.repository.transaction(async (tx) => {
      const stageInputs =
        dto.stages && dto.stages.length > 0
          ? dto.stages.map((stage, index) => ({
              code: stage.code,
              name: stage.name ?? this.stageLabel(stage.code),
              sequence: stage.sequence ?? index + 1,
              workCenter: stage.workCenterId
                ? { connect: { id: stage.workCenterId } }
                : undefined,
              machine: stage.machineId
                ? { connect: { id: stage.machineId } }
                : undefined,
              assignedWorkerId: stage.assignedWorkerId,
              plannedStartAt: stage.plannedStartAt,
              plannedEndAt: stage.plannedEndAt,
              metadata: this.toJson(stage.metadata),
            }))
          : defaultStages.map((stage) => ({
              ...stage,
              status:
                stage.sequence === 1
                  ? ProductionStageStatus.READY
                  : ProductionStageStatus.PENDING,
            }));

      const order = await this.repository.createOrder(
        {
          orderNo: dto.orderNo,
          title: dto.title,
          description: dto.description,
          projectId: dto.projectId,
          componentId: dto.componentId,
          quantity: dto.quantity,
          priority: dto.priority,
          status: dto.status,
          currentStageCode: stageInputs[0]?.code,
          plannedStartAt: dto.plannedStartAt,
          plannedEndAt: dto.plannedEndAt,
          metadata: this.toJson(dto.metadata),
          stages: {
            create: stageInputs,
          },
        },
        tx,
      );

      await this.createLog(
        order.id,
        {
          type: ProductionLogType.NOTE,
          message: 'Production order created',
          attachmentIds: dto.attachmentIds,
        },
        actorId,
        tx,
      );

      await this.logActivity(tx, 'PRODUCTION_ORDER_CREATED', order, actorId);

      return order;
    });

    await this.linkAttachments(order.id, dto.attachmentIds);

    if (dto.workflowDefinitionKey) {
      try {
        const workflow = await this.workflowService.startWorkflow(
          {
            definitionKey: dto.workflowDefinitionKey,
            referenceModule: 'production',
            referenceId: order.id,
            metadata: {
              orderNo: order.orderNo,
            },
          },
          actorId,
        );

        return this.repository.updateOrder(order.id, {
          workflowInstanceId: workflow.id,
        });
      } catch {
        return order;
      }
    }

    return order;
  }

  async update(id: string, dto: UpdateProductionOrderDto, actorId?: string) {
    const order = await this.repository.transaction(async (tx) => {
      await this.getOrderOrThrow(id, tx);

      const updated = await this.repository.updateOrder(
        id,
        {
          title: dto.title,
          description: dto.description,
          quantity: dto.quantity,
          priority: dto.priority,
          status: dto.status,
          plannedStartAt: dto.plannedStartAt,
          plannedEndAt: dto.plannedEndAt,
          delayReason: dto.delayReason,
          delayedAt:
            dto.status === ProductionOrderStatus.DELAYED
              ? new Date()
              : undefined,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'PRODUCTION_ORDER_UPDATED', updated, actorId);

      return updated;
    });

    if (order.status === ProductionOrderStatus.DELAYED) {
      await this.emitProductionEvent('production.delayed', order);
    }

    return order;
  }

  async start(id: string, dto: StartProductionDto, actorId?: string) {
    const order = await this.repository.transaction(async (tx) => {
      const existing = await this.getOrderOrThrow(id, tx);
      const firstStage = existing.stages[0];

      if (!firstStage) {
        throw new BadRequestException('Production order has no stages');
      }

      const updated = await this.repository.updateOrder(
        id,
        {
          status: ProductionOrderStatus.IN_PROGRESS,
          startedAt: existing.startedAt ?? new Date(),
          currentStageCode: firstStage.code,
        },
        tx,
      );

      await this.repository.updateStage(
        firstStage.id,
        {
          status: ProductionStageStatus.IN_PROGRESS,
          startedAt: firstStage.startedAt ?? new Date(),
        },
        tx,
      );

      await this.createLog(
        id,
        {
          stageId: firstStage.id,
          type: ProductionLogType.START,
          message: dto.message ?? 'Production started',
          attachmentIds: [],
        },
        actorId,
        tx,
      );

      await this.logActivity(tx, 'PRODUCTION_STARTED', updated, actorId);

      return this.getOrderOrThrow(id, tx);
    });

    await this.emitProductionEvent('production.started', order);

    return order;
  }

  async completeStage(
    stageId: string,
    dto: CompleteStageDto,
    actorId?: string,
  ) {
    const order = await this.repository.transaction(async (tx) => {
      const stage = await this.repository.findStageById(stageId, tx);

      if (!stage) {
        throw new NotFoundException('Production stage not found');
      }

      await this.repository.updateStage(
        stageId,
        {
          status: ProductionStageStatus.COMPLETED,
          completedAt: new Date(),
          qualityStatus: dto.qualityStatus,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      const order = await this.getOrderOrThrow(stage.productionOrderId, tx);
      const nextStage = order.stages.find(
        (item) => item.sequence > stage.sequence,
      );

      let updatedOrder: ProductionOrderWithDetails;

      if (nextStage) {
        await this.repository.updateStage(
          nextStage.id,
          {
            status: ProductionStageStatus.IN_PROGRESS,
            startedAt: nextStage.startedAt ?? new Date(),
          },
          tx,
        );

        updatedOrder = await this.repository.updateOrder(
          order.id,
          {
            currentStageCode: nextStage.code,
          },
          tx,
        );
      } else {
        updatedOrder = await this.repository.updateOrder(
          order.id,
          {
            status: ProductionOrderStatus.COMPLETED,
            completedAt: new Date(),
            currentStageCode: null,
          },
          tx,
        );
      }

      await this.createLog(
        order.id,
        {
          stageId,
          type: ProductionLogType.COMPLETE,
          message: dto.message ?? `${this.stageLabel(stage.code)} completed`,
          quantity: dto.quantity,
          attachmentIds: dto.attachmentIds,
          metadata: dto.metadata,
        },
        actorId,
        tx,
      );

      await this.logActivity(
        tx,
        'PRODUCTION_STAGE_COMPLETED',
        updatedOrder,
        actorId,
      );

      return updatedOrder;
    });

    await this.linkAttachments(order.id, dto.attachmentIds);
    await this.emitProductionEvent('production.stage.completed', order);

    if (order.status === ProductionOrderStatus.COMPLETED) {
      await this.emitProductionEvent('production.completed', order);
    }

    return order;
  }

  async createTask(
    orderId: string,
    dto: CreateProductionTaskDto,
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      const order = await this.getOrderOrThrow(orderId, tx);

      const task = await this.repository.createTask(
        {
          productionOrder: { connect: { id: orderId } },
          stage: dto.stageId ? { connect: { id: dto.stageId } } : undefined,
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          workCenter: dto.workCenterId
            ? { connect: { id: dto.workCenterId } }
            : undefined,
          machine: dto.machineId
            ? { connect: { id: dto.machineId } }
            : undefined,
          assignedWorkerId: dto.assignedWorkerId,
          plannedStartAt: dto.plannedStartAt,
          plannedEndAt: dto.plannedEndAt,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'PRODUCTION_TASK_CREATED', order, actorId);

      return task;
    });
  }

  async updateTask(
    taskId: string,
    dto: UpdateProductionTaskDto,
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      const task = await this.repository.updateTask(
        taskId,
        {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          workCenter: dto.workCenterId
            ? { connect: { id: dto.workCenterId } }
            : undefined,
          machine: dto.machineId
            ? { connect: { id: dto.machineId } }
            : undefined,
          assignedWorkerId: dto.assignedWorkerId,
          plannedStartAt: dto.plannedStartAt,
          plannedEndAt: dto.plannedEndAt,
          startedAt:
            dto.status === ProductionTaskStatus.IN_PROGRESS
              ? new Date()
              : undefined,
          completedAt:
            dto.status === ProductionTaskStatus.DONE ? new Date() : undefined,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.repository.createActivityLog(
        {
          action: 'PRODUCTION_TASK_UPDATED',
          entity: 'ProductionTask',
          entityId: task.id,
          module: 'production',
          userId: actorId,
          metadata: { status: task.status },
        },
        tx,
      );

      return task;
    });
  }

  assignTask(taskId: string, dto: AssignProductionTaskDto, actorId?: string) {
    return this.updateTask(
      taskId,
      {
        ...dto,
        status: ProductionTaskStatus.ASSIGNED,
      },
      actorId,
    );
  }

  async createLog(
    orderId: string,
    dto: CreateProductionLogDto,
    actorId: string | undefined,
    tx?: ProductionTx,
  ) {
    const execute = async (client: ProductionTx) => {
      return this.repository.createLog(
        {
          productionOrder: { connect: { id: orderId } },
          stage: dto.stageId ? { connect: { id: dto.stageId } } : undefined,
          type: dto.type,
          message: dto.message,
          quantity: dto.quantity,
          workerId: dto.workerId ?? actorId,
          machineId: dto.machineId,
          attachmentIds: dto.attachmentIds,
          metadata: this.toJson(dto.metadata),
        },
        client,
      );
    };

    if (tx) {
      return execute(tx);
    }

    const log = await this.repository.transaction(async (client) => {
      const order = await this.getOrderOrThrow(orderId, client);
      const created = await execute(client);

      await this.logActivity(client, 'PRODUCTION_LOG_CREATED', order, actorId);

      return created;
    });

    await this.linkAttachments(orderId, dto.attachmentIds);

    return log;
  }

  createWorkCenter(dto: CreateWorkCenterDto) {
    return this.repository.createWorkCenter({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      capacityPerDay: dto.capacityPerDay,
      metadata: this.toJson(dto.metadata),
    });
  }

  listWorkCenters() {
    return this.repository.listWorkCenters();
  }

  createMachine(dto: CreateMachineDto) {
    return this.repository.createMachine({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      utilization: dto.utilization,
      workCenter: dto.workCenterId
        ? { connect: { id: dto.workCenterId } }
        : undefined,
      metadata: this.toJson(dto.metadata),
    });
  }

  listMachines() {
    return this.repository.listMachines();
  }

  createSchedule(dto: CreateProductionScheduleDto) {
    return this.repository.createSchedule({
      productionOrder: { connect: { id: dto.productionOrderId } },
      workCenter: dto.workCenterId
        ? { connect: { id: dto.workCenterId } }
        : undefined,
      machine: dto.machineId ? { connect: { id: dto.machineId } } : undefined,
      startAt: dto.startAt,
      endAt: dto.endAt,
      capacityPlanned: dto.capacityPlanned,
      capacityUsed: dto.capacityUsed,
      metadata: this.toJson(dto.metadata),
    });
  }

  listSchedules() {
    return this.repository.listSchedules();
  }

  async metrics() {
    const metrics = await this.repository.metrics();
    const throughputBase = metrics.completed + metrics.inProgress;

    return {
      totalOrders: metrics.total,
      inProgress: metrics.inProgress,
      delayed: metrics.delayed,
      completed: metrics.completed,
      completionRate:
        metrics.total > 0
          ? Math.round((metrics.completed / metrics.total) * 100)
          : 0,
      throughput:
        throughputBase > 0 ? Math.round(metrics.completed / throughputBase) : 0,
      stageStatus: metrics.stages,
      machineUtilization: metrics.machines.map((machine) => ({
        id: machine.id,
        code: machine.code,
        name: machine.name,
        status: machine.status,
        utilization: machine.utilization,
      })),
      bottlenecks: metrics.stages
        .filter((stage) => stage.status === ProductionStageStatus.BLOCKED)
        .map((stage) => ({
          stage: stage.code,
          count: stage._count,
        })),
    };
  }

  private async getOrderOrThrow(id: string, tx?: ProductionTx) {
    const order = await this.repository.findOrderById(id, tx);

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    return order;
  }

  private async linkAttachments(orderId: string, attachmentIds?: string[]) {
    if (!attachmentIds || attachmentIds.length === 0) {
      return;
    }

    await Promise.all(
      attachmentIds.map((attachmentId) =>
        this.attachmentsService.link(attachmentId, {
          module: 'production',
          entityId: orderId,
          purpose: 'production-evidence',
        }),
      ),
    );
  }

  private logActivity(
    tx: ProductionTx,
    action: string,
    order: ProductionOrderWithDetails,
    userId?: string,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity: 'ProductionOrder',
        entityId: order.id,
        module: 'production',
        userId,
        metadata: {
          orderNo: order.orderNo,
          status: order.status,
          currentStageCode: order.currentStageCode,
        },
      },
      tx,
    );
  }

  private emitProductionEvent(
    eventName:
      | 'production.started'
      | 'production.stage.completed'
      | 'production.delayed'
      | 'production.completed',
    order: ProductionOrderWithDetails,
  ) {
    return this.eventBus.emit(
      eventName,
      {
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
        currentStageCode: order.currentStageCode,
        projectId: order.projectId,
        componentId: order.componentId,
      },
      {
        module: 'production',
        persistToOutbox: true,
        idempotencyKey: `${eventName}:${order.id}:${order.updatedAt.toISOString()}`,
      },
    );
  }

  private stageLabel(code: ProductionStageCode) {
    return code
      .toLowerCase()
      .replace(/^\w/, (character) => character.toUpperCase());
  }

  private toJson(value: Record<string, unknown> | undefined) {
    return value as Prisma.InputJsonValue | undefined;
  }
}
