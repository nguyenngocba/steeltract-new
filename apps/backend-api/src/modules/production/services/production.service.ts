import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  ComponentStatus,
  Prisma,
  ProductionLogType,
  ProductionOrderStatus,
  ProductionStageCode,
  ProductionStageStatus,
  ProductionTaskStatus,
  YardItemType,
} from '@prisma/client';

import { EventBusService } from '../../../core/events/event-bus.service';
import { SnapshotUpdateDispatcher } from '../../../core/jobs/snapshot-update-dispatcher.service';
import { PerformanceMetricsService } from '../../../core/performance/performance-metrics.service';
import { DashboardReaderService } from '../../../core/snapshots/dashboard-reader.service';
import { SnapshotReaderService } from '../../../core/snapshots/snapshot-reader.service';
import { AttachmentsService } from '../../attachments/services/attachments.service';
import { ComponentCostingService } from '../../components/services/component-costing.service';
import { InventoryRepository } from '../../inventory/inventory.repository';
import { YardService } from '../../yard/services/yard.service';
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
  StageProductionToYardDto,
  StartProductionDto,
  UpdateProductionOrderDto,
  UpdateProductionTaskDto,
  ProductionOrderTransitionDto,
} from '../dto/production.dto';
import {
  InvalidProductionOrderTransitionError,
  ProductionOrderLifecycleCommand,
  productionOrderTransition,
} from '../domain/production-order-state-machine';
import { MaterialIssueService } from './material-issue.service';
import { ProductionOrderRepository } from '../repositories/production-order.repository';
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

type BomMaterialIssuePlan = {
  inventoryItemId: string;
  warehouseId?: string;
  zoneId?: string;
  slotId?: string;
  level?: string;
  quantity: number;
  materialCode: string;
};

type CanonicalProductionOrderEventName =
  | 'production.order.created'
  | 'production.order.released'
  | 'production.order.ready'
  | 'production.order.started'
  | 'production.order.paused'
  | 'production.order.resumed'
  | 'production.order.completed'
  | 'production.order.closed'
  | 'production.order.cancelled';

const lifecycleEventByCommand: Record<
  ProductionOrderLifecycleCommand,
  CanonicalProductionOrderEventName
> = {
  release: 'production.order.released',
  ready: 'production.order.ready',
  start: 'production.order.started',
  pause: 'production.order.paused',
  resume: 'production.order.resumed',
  complete: 'production.order.completed',
  close: 'production.order.closed',
  cancel: 'production.order.cancelled',
};

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(
    private readonly repository: ProductionRepository,
    private readonly orderRepository: ProductionOrderRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly eventBus: EventBusService,
    private readonly dashboardReader: DashboardReaderService,
    private readonly snapshotReader: SnapshotReaderService,
    private readonly snapshotDispatcher: SnapshotUpdateDispatcher,
    private readonly metricsService: PerformanceMetricsService,
    private readonly workflowService: WorkflowService,
    private readonly attachmentsService: AttachmentsService,
    private readonly yardService: YardService,
    private readonly materialIssueService: MaterialIssueService,
    private readonly componentCostingService: ComponentCostingService,
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
    if (dto.status !== ProductionOrderStatus.DRAFT) {
      throw new BadRequestException(
        'New production orders must be created in DRAFT status',
      );
    }

    const order = await this.repository.transaction(async (tx) => {
      const [component, bom] = await Promise.all([
        dto.componentId
          ? this.repository.findComponentById(dto.componentId, tx)
          : undefined,
        dto.bomId ? this.repository.findBomById(dto.bomId, tx) : undefined,
      ]);

      if (dto.componentId && !component) {
        throw new NotFoundException('Component not found');
      }

      if (dto.bomId && !bom) {
        throw new NotFoundException('BOM not found');
      }

      if (component && bom && bom.productCode !== component.code) {
        throw new BadRequestException(
          'Selected BOM does not belong to the selected component',
        );
      }

      const routingStages =
        bom?.routingSteps.map((step, index) => ({
          code: this.stageCodeForRouting(step.stepName),
          name: step.stepName,
          sequence: step.stepNo,
          status:
            index === 0
              ? ProductionStageStatus.READY
              : ProductionStageStatus.PENDING,
          metadata: this.toJson({
            workshop: step.workshop,
            expectedHours: step.expectedHours,
            qcRequired: step.qcRequired,
            source: 'BOM_ROUTING',
          }),
        })) ?? [];

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
          : routingStages.length > 0
            ? routingStages
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
          component: dto.componentId
            ? { connect: { id: dto.componentId } }
            : undefined,
          bom: dto.bomId ? { connect: { id: dto.bomId } } : undefined,
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
      await this.createLifecycleOutboxEvent(
        tx,
        'production.order.created',
        order,
        actorId,
      );

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
    if (dto.status !== undefined) {
      throw new BadRequestException(
        'Production order status must be changed through a lifecycle command',
      );
    }

    const order = await this.repository.transaction(async (tx) => {
      await this.getOrderOrThrow(id, tx);

      const updated = await this.repository.updateOrder(
        id,
        {
          title: dto.title,
          description: dto.description,
          bom: dto.bomId ? { connect: { id: dto.bomId } } : undefined,
          quantity: dto.quantity,
          priority: dto.priority,
          plannedStartAt: dto.plannedStartAt,
          plannedEndAt: dto.plannedEndAt,
          delayReason: dto.delayReason,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'PRODUCTION_ORDER_UPDATED', updated, actorId);

      return updated;
    });

    return order;
  }

  release(id: string, dto: ProductionOrderTransitionDto, actorId?: string) {
    return this.transitionOrder(id, 'release', dto, actorId);
  }

  ready(id: string, dto: ProductionOrderTransitionDto, actorId?: string) {
    return this.transitionOrder(id, 'ready', dto, actorId);
  }

  pause(id: string, dto: ProductionOrderTransitionDto, actorId?: string) {
    return this.transitionOrder(id, 'pause', dto, actorId);
  }

  resume(id: string, dto: ProductionOrderTransitionDto, actorId?: string) {
    return this.transitionOrder(id, 'resume', dto, actorId);
  }

  complete(id: string, dto: ProductionOrderTransitionDto, actorId?: string) {
    return this.transitionOrder(id, 'complete', dto, actorId);
  }

  close(id: string, dto: ProductionOrderTransitionDto, actorId?: string) {
    return this.transitionOrder(id, 'close', dto, actorId);
  }

  cancel(id: string, dto: ProductionOrderTransitionDto, actorId?: string) {
    return this.transitionOrder(id, 'cancel', dto, actorId);
  }

  async start(id: string, dto: StartProductionDto, actorId?: string) {
    const existingOrder = await this.getOrderOrThrow(id);
    this.nextLifecycleStatus(existingOrder.status, 'start');
    const issuePlans = await this.planMissingBomMaterialIssues(existingOrder);

    const order = await this.repository.transaction(async (tx) => {
      const existing = await this.getOrderOrThrow(id, tx);
      const nextStatus = this.nextLifecycleStatus(existing.status, 'start');
      const firstStage = existing.stages[0];

      if (!firstStage) {
        throw new BadRequestException('Production order has no stages');
      }

      const updated = await this.repository.updateOrder(
        id,
        {
          status: nextStatus,
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

      if (existing.componentId) {
        await this.repository.updateComponentStatus(
          existing.componentId,
          ComponentStatus.CUTTING,
          tx,
        );
      }

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
      const transitioned = await this.getOrderOrThrow(id, tx);
      await this.createLifecycleOutboxEvent(
        tx,
        lifecycleEventByCommand.start,
        transitioned,
        actorId,
        dto,
      );

      return transitioned;
    });

    await this.createPlannedMaterialIssues(order, issuePlans, actorId);

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

      const order = await this.getOrderOrThrow(stage.productionOrderId, tx);
      this.nextLifecycleStatus(order.status, 'complete');

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
        const completedStatus = this.nextLifecycleStatus(
          order.status,
          'complete',
        );
        updatedOrder = await this.repository.updateOrder(
          order.id,
          {
            status: completedStatus,
            completedAt: new Date(),
            currentStageCode: null,
          },
          tx,
        );
      }

      if (order.componentId) {
        await this.repository.updateComponentStatus(
          order.componentId,
          nextStage
            ? this.componentStatusForStage(nextStage.code)
            : ComponentStatus.READY,
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

      if (!nextStage) {
        await this.createLifecycleOutboxEvent(
          tx,
          lifecycleEventByCommand.complete,
          updatedOrder,
          actorId,
          dto,
        );
      }

      return updatedOrder;
    });

    await this.linkAttachments(order.id, dto.attachmentIds);
    await this.emitProductionEvent('production.stage.completed', order);

    if (order.status === ProductionOrderStatus.COMPLETED) {
      await this.autoRecalculateComponentCosting(order);
    }

    return order;
  }

  async stageToYard(
    id: string,
    dto: StageProductionToYardDto,
    actorId?: string,
  ) {
    const order = await this.getOrderOrThrow(id);

    if (order.status !== ProductionOrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Production order must be completed before yard staging',
      );
    }

    if (!order.component) {
      throw new BadRequestException(
        'Production order must reference a component before yard staging',
      );
    }

    const approvedQc = await this.repository.findApprovedQcInspection(order.id);

    if (!approvedQc) {
      throw new BadRequestException(
        'QC inspection must be passed or approved before staging finished component to yard',
      );
    }

    const slot = await this.repository.findYardSlot(dto.slotId);

    if (!slot) {
      throw new NotFoundException('Yard slot not found');
    }

    const placements =
      await this.repository.findActiveYardPlacementsForProduction({
        componentId: order.component.id,
        productionOrderId: order.id,
      });

    const stagedQuantity = placements.reduce(
      (sum, row) => sum + Number(row.quantity ?? 0),
      0,
    );
    const remainingQuantity = Number(order.quantity) - stagedQuantity;
    const quantity = Number(dto.quantity ?? remainingQuantity);

    if (quantity <= 0) {
      throw new BadRequestException('Invalid quantity');
    }

    if (quantity > remainingQuantity) {
      throw new BadRequestException(`Only ${remainingQuantity} remaining`);
    }

    const placement = await this.yardService.placeItem(
      {
        slotId: dto.slotId,
        itemType: YardItemType.COMPONENT,
        itemId: order.component.id,
        itemCode: order.component.code,
        itemName: order.component.name,
        quantity,
        stackLevel: dto.stackLevel,
        weight: dto.weight,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        craneId: dto.craneId,
        reason: dto.reason ?? `Staged from production order ${order.orderNo}`,
        attachmentIds: [],
        metadata: {
          ...(dto.metadata ?? {}),
          productionOrderId: order.id,
          productionOrderNo: order.orderNo,
        },
      },
      actorId,
    );

    await this.repository.markComponentStagedFromProduction({
      componentId: order.component.id,
      orderId: order.id,
      orderNo: order.orderNo,
      status: ComponentStatus.STOCK,
      floor: `L${placement.stackLevel}`,
      zoneCode: slot.zone.code,
      slotCode: slot.code,
      x: slot.x,
      y: slot.y,
      stackLevel: placement.stackLevel,
      placementId: placement.id,
      slotId: slot.id,
      actorId,
    });
    await this.eventBus.emit(
      'production.staged.to-yard',
      {
        productionOrderId: order.id,
        productionOrderNo: order.orderNo,
        componentId: order.component.id,
        componentCode: order.component.code,
        placementId: placement.id,
        slotId: slot.id,
        slotCode: slot.code,
        zoneCode: slot.zone.code,
      },
      {
        module: 'production',
        persistToOutbox: true,
        idempotencyKey: `production.staged.to-yard:${placement.id}`,
      },
    );

    return placement;
  }

  async createComponentFromProductionOrder(id: string, actorId?: string) {
    const order = await this.repository.findOrderForComponentCreation(id);

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    const netIssuedQty = order.materialIssues.reduce(
      (total, issue) =>
        total + Number(issue.issuedQty ?? 0) - Number(issue.returnedQty ?? 0),
      0,
    );

    if (netIssuedQty <= 0) {
      throw new BadRequestException(
        'Cannot create component without issued production material',
      );
    }

    const component = await this.repository.upsertComponentFromProductionOrder({
      orderId: order.id,
      orderNo: order.orderNo,
      title: order.title,
      projectId: order.projectId,
      component: order.component,
      actorId,
    });

    await this.autoRecalculateComponentCosting({
      id: order.id,
      orderNo: order.orderNo,
      componentId: component.id,
    });

    return component;
  }

  private componentStatusForStage(stage: ProductionStageCode) {
    if (stage === ProductionStageCode.WELDING) {
      return ComponentStatus.WELDING;
    }

    if (
      stage === ProductionStageCode.PAINTING ||
      stage === ProductionStageCode.GALVANIZING ||
      stage === ProductionStageCode.PACKING
    ) {
      return ComponentStatus.PAINTING;
    }

    return ComponentStatus.CUTTING;
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

  listLogs() {
    return this.repository.listLogs();
  }

  async materialRequirements(id: string) {
    const order = await this.getOrderOrThrow(id);
    const materialIds = (order.bom?.items ?? []).map((item) => item.materialId);
    const productionStockByMaterialId = new Map<string, number>();

    if (materialIds.length > 0) {
      const buckets = await this.productionStockBuckets(materialIds);
      for (const [materialId, rows] of buckets.entries()) {
        productionStockByMaterialId.set(
          materialId,
          rows.reduce((total, row) => total + row.quantity, 0),
        );
      }
    }

    return (order.bom?.items ?? []).map((item) => {
      const requiredQty =
        item.quantity * (1 + item.wastePercent / 100) * order.quantity;
      const availableQty =
        productionStockByMaterialId.get(item.materialId) ?? 0;
      const issuedQty = order.materialIssues
        .filter((issue) => issue.inventoryItemId === item.materialId)
        .reduce((total, issue) => total + issue.issuedQty, 0);

      return {
        materialId: item.materialId,
        materialCode: item.material.code,
        materialName: item.material.name,
        unit: item.material.unitMaster?.symbol ?? item.material.unit,
        requiredQty,
        availableQty,
        issuedQty,
        shortageQty: Math.max(requiredQty - issuedQty - availableQty, 0),
      };
    });
  }

  private async planMissingBomMaterialIssues(
    order: ProductionOrderWithDetails,
  ): Promise<BomMaterialIssuePlan[]> {
    if (!order.bom?.items.length) return [];

    const requiredByMaterial = new Map<string, number>();
    const materialById = new Map<string, { code: string; name: string }>();

    for (const item of order.bom.items) {
      const requiredQty =
        Number(item.quantity ?? 0) *
        (1 + Number(item.wastePercent ?? 0) / 100) *
        Number(order.quantity ?? 1);
      requiredByMaterial.set(
        item.materialId,
        (requiredByMaterial.get(item.materialId) ?? 0) + requiredQty,
      );
      materialById.set(item.materialId, {
        code: item.material.code,
        name: item.material.name,
      });
    }

    const issuedByMaterial = new Map<string, number>();
    for (const issue of order.materialIssues ?? []) {
      if (issue.status !== 'ISSUED') continue;
      issuedByMaterial.set(
        issue.inventoryItemId,
        (issuedByMaterial.get(issue.inventoryItemId) ?? 0) +
          Number(issue.issuedQty ?? 0),
      );
    }

    const materialIds = Array.from(requiredByMaterial.keys());
    const buckets = await this.productionStockBuckets(materialIds);
    const shortages: string[] = [];
    const issuePlans: BomMaterialIssuePlan[] = [];

    for (const materialId of materialIds) {
      let remaining =
        (requiredByMaterial.get(materialId) ?? 0) -
        (issuedByMaterial.get(materialId) ?? 0);
      if (remaining <= 0.000001) continue;

      const materialBuckets = [...(buckets.get(materialId) ?? [])]
        .filter((bucket) => bucket.quantity > 0.000001)
        .sort((a, b) => `${a.zoneId ?? ''}`.localeCompare(`${b.zoneId ?? ''}`));
      const available = materialBuckets.reduce(
        (total, bucket) => total + bucket.quantity,
        0,
      );

      if (available + 0.000001 < remaining) {
        const material = materialById.get(materialId);
        shortages.push(
          `${material?.code ?? materialId}: cần ${remaining.toLocaleString('vi-VN')}, kho SX còn ${available.toLocaleString('vi-VN')}`,
        );
        continue;
      }

      for (const bucket of materialBuckets) {
        if (remaining <= 0.000001) break;
        const quantity = Math.min(bucket.quantity, remaining);
        issuePlans.push({
          inventoryItemId: materialId,
          warehouseId: bucket.warehouseId,
          zoneId: bucket.zoneId,
          slotId: bucket.slotId,
          level: bucket.level,
          quantity,
          materialCode: materialById.get(materialId)?.code ?? materialId,
        });
        remaining -= quantity;
      }
    }

    if (shortages.length) {
      throw new BadRequestException(
        `Không đủ vật tư trong kho SX để bắt đầu sản xuất. ${shortages.join('; ')}`,
      );
    }

    return issuePlans;
  }

  private async createPlannedMaterialIssues(
    order: ProductionOrderWithDetails,
    issuePlans: BomMaterialIssuePlan[],
    actorId?: string,
  ) {
    if (!issuePlans.length) return;

    for (const plan of issuePlans) {
      await this.materialIssueService.create(
        {
          issueNo: await this.repository.nextIssueNo(),
          productionOrderId: order.id,
          inventoryItemId: plan.inventoryItemId,
          warehouseId: plan.warehouseId,
          zoneId: plan.zoneId,
          slotId: plan.slotId,
          level: plan.level,
          issuedQty: plan.quantity,
          issuedDate: new Date(),
          status: 'ISSUED',
          remarks: `[PRODUCTION_MATERIAL_CONSUME] Auto cấp phát ${plan.materialCode} cho ${order.orderNo}`,
        },
        actorId,
      );
    }
  }

  private async productionStockBuckets(materialIds: string[]) {
    const buckets = new Map<
      string,
      Array<{
        warehouseId?: string;
        zoneId?: string;
        slotId?: string;
        level?: string;
        quantity: number;
      }>
    >();

    const transactions =
      await this.inventoryRepository.findProductionInventoryTransactions(
        materialIds,
      );

    for (const transaction of transactions) {
      const text = `${transaction.remarks ?? ''} ${transaction.note ?? ''}`;
      const isReturn = text.includes('[COMPONENT_PRODUCTION_RETURN]');

      for (const line of transaction.items) {
        if (!materialIds.includes(line.inventoryItemId)) continue;
        const rawQty = Number(line.quantity ?? 0);
        if (!Number.isFinite(rawQty) || rawQty === 0) continue;
        if (!this.isProductionWarehouseLine(line, transaction)) continue;
        if (!isReturn && rawQty <= 0) continue;
        if (isReturn && rawQty >= 0) continue;

        const rows = buckets.get(line.inventoryItemId) ?? [];
        const zoneId = line.zoneId ?? transaction.zoneId ?? undefined;
        const warehouseId =
          line.warehouseId ?? transaction.warehouseId ?? undefined;
        const slotId = line.slotId ?? undefined;
        const level = line.level ?? undefined;
        const existing = rows.find(
          (row) =>
            (row.zoneId ?? null) === (zoneId ?? null) &&
            (row.warehouseId ?? null) === (warehouseId ?? null) &&
            (row.slotId ?? null) === (slotId ?? null) &&
            (row.level ?? null) === (level ?? null),
        );
        if (existing) {
          existing.quantity += rawQty;
        } else {
          rows.push({ warehouseId, zoneId, slotId, level, quantity: rawQty });
        }
        buckets.set(line.inventoryItemId, rows);
      }
    }

    const issues = await this.repository.findIssuedMaterialIssues(materialIds);

    for (const issue of issues) {
      let remaining = Number(issue.issuedQty ?? 0);
      const rows = buckets.get(issue.inventoryItemId) ?? [];
      const preferred = rows.filter(
        (row) =>
          (!issue.warehouseId || row.warehouseId === issue.warehouseId) &&
          (!issue.zoneId || row.zoneId === issue.zoneId) &&
          (!issue.slotId || row.slotId === issue.slotId) &&
          (!issue.level || row.level === issue.level),
      );
      const orderedRows = [
        ...preferred,
        ...rows.filter((row) => !preferred.includes(row)),
      ];

      for (const row of orderedRows) {
        if (remaining <= 0.000001) break;
        if (row.quantity <= 0) continue;
        const deducted = Math.min(row.quantity, remaining);
        row.quantity -= deducted;
        remaining -= deducted;
      }
    }

    return buckets;
  }

  private isProductionWarehouseLine(
    line: { warehouse?: { code?: string | null; name?: string | null } | null },
    transaction: {
      warehouse?: { code?: string | null; name?: string | null } | null;
    },
  ) {
    const warehouseCode = String(
      line.warehouse?.code ?? transaction.warehouse?.code ?? '',
    ).toUpperCase();
    const warehouseName = String(
      line.warehouse?.name ?? transaction.warehouse?.name ?? '',
    ).toLowerCase();
    return warehouseCode === 'PRODUCTION' || warehouseName.includes('sản xuất');
  }

  async metrics() {
    const result = await this.dashboardReader.read({
      module: 'production',
      snapshotType: 'ProductionDashboardSnapshot',
      loadSnapshot: async () => {
        const snapshot = await this.snapshotReader.productionDashboard(
          this.startOfDay(new Date()),
        );
        if (!snapshot) {
          return null;
        }

        return {
          data: snapshot,
          updatedAt: snapshot.updatedAt,
          rowCount: 1,
        };
      },
      readSnapshot: (snapshot) => this.productionMetricsFromSnapshot(snapshot),
      readRuntime: () => this.productionMetricsRuntime(),
      compare: (snapshot, runtime) =>
        this.compareRuntimeNumbers(snapshot, runtime, [
          'totalOrders',
          'inProgress',
          'delayed',
          'completed',
          'completionRate',
        ]),
    });

    if (result.source === 'snapshot') {
      this.metricsService.recordProductionReadModelHit();
    } else {
      this.metricsService.recordProductionFallback();
      void this.snapshotDispatcher.requestUpdate({
        scope: {
          module: 'production',
          snapshotType: 'ProductionDashboardSnapshot',
        },
        reason:
          result.meta.fallbackReason === 'stale'
            ? 'stale-snapshot'
            : 'fallback-miss',
        priority: 60,
      });
    }

    return result.data;
  }

  private async productionMetricsRuntime() {
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

  private productionMetricsFromSnapshot(snapshot: {
    totalOrders: number;
    inProgress: number;
    delayed: number;
    completed: number;
    completionRate: number;
    throughput: number;
    payload?: unknown;
  }) {
    const payload = this.asRecord(snapshot.payload);

    return {
      totalOrders: Number(snapshot.totalOrders ?? 0),
      inProgress: Number(snapshot.inProgress ?? 0),
      delayed: Number(snapshot.delayed ?? 0),
      completed: Number(snapshot.completed ?? 0),
      completionRate: Number(snapshot.completionRate ?? 0),
      throughput: Number(snapshot.throughput ?? 0),
      stageStatus: this.asArray(payload.stageStatus),
      machineUtilization: this.asArray(payload.machineUtilization),
      bottlenecks: this.asArray(payload.bottlenecks),
    };
  }

  private compareRuntimeNumbers(
    snapshot: Record<string, unknown>,
    runtime: Record<string, unknown>,
    fields: string[],
  ) {
    return fields.flatMap((field) => {
      const snapshotValue = Number(snapshot[field] ?? 0);
      const runtimeValue = Number(runtime[field] ?? 0);

      return Math.abs(snapshotValue - runtimeValue) > 0.0001
        ? [
            {
              field,
              snapshotValue,
              runtimeValue,
              reason: 'VALUE_MISMATCH' as const,
            },
          ]
        : [];
    });
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

  private async autoRecalculateComponentCosting(order: {
    id: string;
    orderNo?: string | null;
    componentId?: string | null;
  }) {
    if (!order.componentId) {
      return;
    }

    try {
      await this.componentCostingService.recalculate(order.componentId, {
        activityAction: 'AUTO_RECALCULATE_COSTING',
        metadata: {
          componentId: order.componentId,
          productionOrderId: order.id,
          source: 'production_completion',
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.warn(
        `Automatic component costing failed for component ${order.componentId} from production order ${order.orderNo ?? order.id}: ${message}`,
      );
    }
  }

  private async transitionOrder(
    id: string,
    command: Exclude<ProductionOrderLifecycleCommand, 'start'>,
    dto: ProductionOrderTransitionDto,
    actorId?: string,
  ) {
    const order = await this.orderRepository.transaction(async (tx) => {
      const existing = await this.orderRepository.findById(id, tx);

      if (!existing) {
        throw new NotFoundException('Production order not found');
      }

      const nextStatus = this.nextLifecycleStatus(existing.status, command);
      const updated = await this.orderRepository.update(
        id,
        {
          status: nextStatus,
          completedAt:
            nextStatus === ProductionOrderStatus.COMPLETED
              ? (existing.completedAt ?? new Date())
              : undefined,
          currentStageCode:
            nextStatus === ProductionOrderStatus.COMPLETED ? null : undefined,
        },
        tx,
      );

      await this.orderRepository.createActivity(
        {
          action: `PRODUCTION_ORDER_${command.toUpperCase()}`,
          entity: 'ProductionOrder',
          entityId: updated.id,
          module: 'production',
          userId: actorId,
          metadata: {
            orderNo: updated.orderNo,
            previousStatus: existing.status,
            status: updated.status,
            message: dto.message ?? null,
            reason: dto.reason ?? null,
          },
        },
        tx,
      );

      await this.createLifecycleOutboxEvent(
        tx,
        lifecycleEventByCommand[command],
        updated,
        actorId,
        dto,
      );

      return updated;
    });

    if (order.status === ProductionOrderStatus.COMPLETED) {
      await this.autoRecalculateComponentCosting(order);
    }

    return order;
  }

  private nextLifecycleStatus(
    status: ProductionOrderStatus,
    command: ProductionOrderLifecycleCommand,
  ) {
    try {
      return productionOrderTransition(status, command);
    } catch (error) {
      if (error instanceof InvalidProductionOrderTransitionError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  private createLifecycleOutboxEvent(
    tx: ProductionTx,
    eventName: CanonicalProductionOrderEventName,
    order: ProductionOrderWithDetails,
    actorId?: string,
    details: ProductionOrderTransitionDto = {},
  ) {
    const occurredAt = new Date();
    const timestampField = this.lifecycleTimestampField(eventName);
    const timestamp =
      eventName === 'production.order.created'
        ? order.createdAt
        : eventName === 'production.order.started'
          ? (order.startedAt ?? occurredAt)
          : eventName === 'production.order.completed'
            ? (order.completedAt ?? occurredAt)
            : occurredAt;
    const payload = {
      orderId: order.id,
      productionOrderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      currentStageCode: order.currentStageCode,
      projectId: order.projectId,
      componentId: order.componentId,
      actorId: actorId ?? null,
      operatorId: actorId ?? null,
      reason: details.reason ?? null,
      message: details.message ?? null,
      occurredAt: occurredAt.toISOString(),
      [timestampField]: timestamp.toISOString(),
      sourceVersion: order.updatedAt.toISOString(),
    } as Prisma.InputJsonObject;

    return this.orderRepository.createOutboxEvent(
      {
        eventName,
        payload,
        metadata: {
          module: 'production',
        },
        idempotencyKey: `${eventName}:${order.id}:${order.updatedAt.toISOString()}`,
      },
      tx,
    );
  }

  private lifecycleTimestampField(
    eventName: CanonicalProductionOrderEventName,
  ) {
    const fields: Record<CanonicalProductionOrderEventName, string> = {
      'production.order.created': 'createdAt',
      'production.order.released': 'releasedAt',
      'production.order.ready': 'readyAt',
      'production.order.started': 'startedAt',
      'production.order.paused': 'pausedAt',
      'production.order.resumed': 'resumedAt',
      'production.order.completed': 'completedAt',
      'production.order.closed': 'closedAt',
      'production.order.cancelled': 'cancelledAt',
    };

    return fields[eventName];
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
    eventName: 'production.stage.completed',
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

  private stageCodeForRouting(name: string) {
    const normalized = name.toUpperCase();

    if (normalized.includes('CUT') || normalized.includes('CẮT')) {
      return ProductionStageCode.CUTTING;
    }
    if (normalized.includes('DRILL') || normalized.includes('KHOAN')) {
      return ProductionStageCode.DRILLING;
    }
    if (normalized.includes('ASSEMB') || normalized.includes('LẮP')) {
      return ProductionStageCode.ASSEMBLY;
    }
    if (normalized.includes('WELD') || normalized.includes('HÀN')) {
      return ProductionStageCode.WELDING;
    }
    if (normalized.includes('PAINT') || normalized.includes('SƠN')) {
      return ProductionStageCode.PAINTING;
    }
    if (normalized.includes('GALV') || normalized.includes('MẠ')) {
      return ProductionStageCode.GALVANIZING;
    }

    return ProductionStageCode.PACKING;
  }

  private toJson(value: Record<string, unknown> | undefined) {
    return value as Prisma.InputJsonValue | undefined;
  }
}
