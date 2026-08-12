import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComponentInstanceState,
  DispatchEventType,
  DispatchItemType,
  DispatchOrderStatus,
  Prisma,
} from '@prisma/client';

import { nextOperationalCode } from '../../common/utils/code-generator';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DashboardReaderService } from '../../core/snapshots/dashboard-reader.service';
import { SnapshotReaderService } from '../../core/snapshots/snapshot-reader.service';
import { InventoryService } from '../inventory/inventory.service';
import { YardService } from '../yard/services/yard.service';
import { dispatchInclude, LogisticsRepository } from './logistics.repository';
import {
  DepartDispatchReturnDto,
  ReceiveDispatchReturnDto,
  RequestDispatchReturnDto,
} from './logistics-reverse.dto';

const activeDispatchStatuses: DispatchOrderStatus[] = [
  'DRAFT',
  'PLANNED',
  'LOADING',
  'IN_TRANSIT',
  'ARRIVED',
  'RECEIVED',
  'RETURN_REQUESTED',
  'RETURN_IN_TRANSIT',
];

type NormalizedDispatchItems = {
  create: Prisma.DispatchItemCreateWithoutDispatchOrderInput[];
  componentInstanceIds: string[];
};

@Injectable()
export class LogisticsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(LogisticsRepository)
    private readonly logisticsRepository: LogisticsRepository,
    @Inject(InventoryService)
    private readonly inventoryService: InventoryService,
    @Inject(DashboardReaderService)
    private readonly dashboardReader: DashboardReaderService,
    @Inject(SnapshotReaderService)
    private readonly snapshotReader: SnapshotReaderService,
    @Inject(YardService)
    private readonly yardService: YardService,
  ) {}

  async listDispatchOrders() {
    return this.logisticsRepository.findDispatchOrders();
  }

  async getDispatchOrder(id: string) {
    const order = await this.logisticsRepository.findDispatchOrder(id);

    if (!order) {
      throw new NotFoundException('Dispatch order not found');
    }

    return order;
  }

  async dashboard() {
    const result = await this.dashboardReader.read({
      module: 'logistics',
      snapshotType: 'DispatchDashboardSnapshot',
      loadSnapshot: async () => {
        const rows = await this.snapshotReader.dispatchDashboard();
        if (rows.length === 0) {
          return null;
        }
        return {
          data: rows,
          updatedAt: rows.reduce(
            (oldest, row) =>
              row.updatedAt.getTime() < oldest.getTime()
                ? row.updatedAt
                : oldest,
            rows[0].updatedAt,
          ),
          rowCount: rows.length,
        };
      },
      readSnapshot: async (rows) =>
        this.applyDispatchDashboardSnapshots(
          await this.dashboardRuntime(),
          rows,
        ),
      readRuntime: () => this.dashboardRuntime(),
      compare: (snapshot, runtime) =>
        this.compareRuntimeNumbers(snapshot.kpis, runtime.kpis, [
          'inTransit',
          'delivered',
          'completed',
        ]),
    });

    return result.data;
  }

  private async dashboardRuntime() {
    const orders = await this.listDispatchOrders();
    const todayKey = this.dateKey(new Date());
    const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});

    const trend = Object.values(
      orders.reduce<
        Record<string, { date: string; total: number; completed: number }>
      >((acc, order) => {
        const key = this.dateKey(order.plannedAt ?? order.createdAt);
        acc[key] ??= {
          date: key,
          total: 0,
          completed: 0,
        };
        acc[key].total += 1;
        if (order.status === 'COMPLETED') {
          acc[key].completed += 1;
        }
        return acc;
      }, {}),
    ).sort((a, b) => a.date.localeCompare(b.date));

    const vehicleUtilization = Object.values(
      orders.reduce<
        Record<string, { vehicle: string; total: number; active: number }>
      >((acc, order) => {
        const vehicle = order.vehicle || 'Chưa gán xe';
        acc[vehicle] ??= {
          vehicle,
          total: 0,
          active: 0,
        };
        acc[vehicle].total += 1;
        if (['LOADING', 'IN_TRANSIT', 'ARRIVED'].includes(order.status)) {
          acc[vehicle].active += 1;
        }
        return acc;
      }, {}),
    );

    const componentStateCounts = orders.reduce<Record<string, number>>(
      (acc, order) => {
        for (const item of order.items) {
          const state = item.componentInstance?.state;
          if (!state) continue;
          acc[state] = (acc[state] ?? 0) + 1;
        }
        return acc;
      },
      {},
    );

    const topProjects = Object.values(
      orders.reduce<
        Record<
          string,
          { id: string; name: string; active: number; total: number }
        >
      >((acc, order) => {
        const id = order.project?.id ?? order.projectId;
        acc[id] ??= {
          id,
          name:
            order.project?.name ?? order.project?.code ?? 'Chưa rõ công trình',
          active: 0,
          total: 0,
        };
        acc[id].total += order.items.filter(
          (item) => item.componentInstanceId,
        ).length;
        if (
          ['PLANNED', 'LOADING', 'IN_TRANSIT', 'ARRIVED'].includes(order.status)
        ) {
          acc[id].active += order.items.filter(
            (item) => item.componentInstanceId,
          ).length;
        }
        return acc;
      }, {}),
    )
      .filter((row) => row.total > 0)
      .sort((a, b) => b.active - a.active || b.total - a.total);

    return {
      kpis: {
        waiting: orders.filter((order) =>
          ['DRAFT', 'PLANNED', 'LOADING'].includes(order.status),
        ).length,
        inTransit: orders.filter((order) => order.status === 'IN_TRANSIT')
          .length,
        delivered: orders.filter((order) =>
          ['ARRIVED', 'RECEIVED'].includes(order.status),
        ).length,
        completed: orders.filter((order) => order.status === 'COMPLETED')
          .length,
        movementsToday: orders.filter(
          (order) => this.dateKey(order.createdAt) === todayKey,
        ).length,
      },
      statusCounts,
      trend,
      vehicleUtilization,
      componentStateCounts,
      topProjects,
      recent: orders.slice(0, 12),
    };
  }

  private applyDispatchDashboardSnapshots(runtime: any, snapshots: any[]) {
    const snapshotTotals = snapshots.reduce(
      (totals, row) => {
        totals.inTransit += Number(row.inTransitCount ?? 0);
        totals.delivered += Number(row.arrivedCount ?? 0);
        totals.completed += Number(row.completedCount ?? 0);
        totals.delayed += Number(row.delayCount ?? 0);
        return totals;
      },
      {
        inTransit: 0,
        delivered: 0,
        completed: 0,
        delayed: 0,
      },
    );

    return {
      ...runtime,
      kpis: {
        ...runtime.kpis,
        inTransit: snapshotTotals.inTransit,
        delivered: snapshotTotals.delivered,
        completed: snapshotTotals.completed,
      },
      statusCounts: {
        ...runtime.statusCounts,
        IN_TRANSIT: snapshotTotals.inTransit,
        ARRIVED: snapshotTotals.delivered,
        COMPLETED: snapshotTotals.completed,
      },
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
      if (Math.abs(snapshotValue - runtimeValue) <= 0.0001) {
        return [];
      }
      return [
        {
          field,
          snapshotValue,
          runtimeValue,
          reason: 'VALUE_MISMATCH' as const,
        },
      ];
    });
  }

  async suggestDispatchItems(body: any) {
    const projectId = String(body?.projectId ?? '');
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const where: {
      projectId: string;
      projectTaskId?: string;
    } = {
      projectId,
    };
    if (body?.projectTaskId) {
      where.projectTaskId = String(body.projectTaskId);
    }

    const instances =
      await this.logisticsRepository.findYardStagedComponentInstances({
        ...where,
        activeStatuses: activeDispatchStatuses,
      });

    return {
      projectId,
      tasks: Array.from(
        new Map(
          instances
            .filter((instance) => instance.projectTask)
            .map((instance) => [
              instance.projectTask.id,
              {
                id: instance.projectTask.id,
                name: instance.projectTask.name,
                plannedStartAt: instance.projectTask.plannedStartAt,
                scheduledStartAt: instance.projectTask.scheduledStartAt,
              },
            ]),
        ).values(),
      ),
      items: instances.map((instance) => {
        const placement = instance.yardPlacements[0];
        const slot = placement?.slot;
        const location = slot
          ? [slot.zone?.code, slot.row?.code, slot.code]
              .filter(Boolean)
              .join(' / ')
          : null;
        return {
          type: 'COMPONENT',
          componentInstanceId: instance.id,
          instanceNo: instance.instanceNo,
          projectTaskId: instance.projectTaskId ?? undefined,
          projectTaskName: instance.projectTask?.name,
          componentCode: instance.component.code,
          componentName: instance.component.name,
          productionOrderId: instance.productionOrderId,
          productionOrderCode: instance.productionOrder?.orderNo,
          requirementId: instance.requirementId,
          yardPlacementId: placement?.id,
          yardLocation: location,
          quantity: 1,
          unit: 'cấu kiện',
          reason: 'Cấu kiện thành phẩm đã staged tại Yard',
        };
      }),
    };
  }

  async createDispatchOrder(body: any) {
    const projectId = String(body?.projectId ?? '');
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const items = this.normalizeItems(body?.items);
    await this.assertDispatchableComponentInstances(items.componentInstanceIds);

    const code = await nextOperationalCode(
      this.prisma,
      'dispatchOrder',
      'code',
      'DX',
    );

    const order = await this.logisticsRepository.createDispatchOrder({
      code,
      project: {
        connect: {
          id: projectId,
        },
      },
      ...(body?.projectTaskId && {
        projectTask: {
          connect: {
            id: String(body.projectTaskId),
          },
        },
      }),
      status: 'PLANNED',
      plannedAt: body?.plannedAt ? new Date(body.plannedAt) : null,
      vehicle: body?.vehicle ?? null,
      driver: body?.driver ?? null,
      notes: body?.notes ?? null,
      items: {
        create: items.create,
      },
      events: {
        create: {
          type: 'CREATED',
          message: 'Tạo lệnh điều xe.',
          createdBy: body?.createdBy ?? null,
        },
      },
    });

    await this.logActivity(
      'PROJECT_DISPATCH_CREATED',
      'DispatchOrder',
      order.id,
      {
        dispatchCode: order.code,
        projectId,
      },
    );

    return order;
  }

  async markLoading(id: string, body: any) {
    await this.assertStatus(id, ['DRAFT', 'PLANNED']);
    return this.updateStatus(
      id,
      'LOADING',
      'LOADING',
      'Đang bốc xếp hàng hóa.',
      {
        loadingChecklist: body?.checklist ?? {},
      },
      body?.createdBy,
    );
  }

  async depart(id: string, body: any) {
    return this.logisticsRepository.transaction(async (tx) => {
      const order = await this.logisticsRepository.findDispatchOrder(id, tx);
      if (!order) throw new NotFoundException('Dispatch order not found');
      if (order.status !== DispatchOrderStatus.LOADING) {
        throw new BadRequestException(
          `Dispatch order cannot move from ${order.status}`,
        );
      }

      const componentInstanceIds = this.componentInstanceIds(order);
      await this.yardService.releaseComponentInstancesForDispatch(
        componentInstanceIds,
        order.id,
        body?.createdBy,
        tx,
      );
      const transitioned =
        await this.logisticsRepository.transitionComponentInstances(
          componentInstanceIds,
          ComponentInstanceState.IN_YARD,
          ComponentInstanceState.IN_TRANSIT,
          tx,
        );
      if (transitioned.count !== componentInstanceIds.length) {
        throw new BadRequestException(
          'Component instance state changed before dispatch departure',
        );
      }
      const updated = await this.updateStatus(
        id,
        'IN_TRANSIT',
        'DEPARTED',
        'Xe đã rời bãi.',
        { departedAt: new Date() },
        body?.createdBy,
        tx,
      );
      await this.logActivity(
        'PROJECT_DISPATCH_DEPARTED',
        'DispatchOrder',
        id,
        {
          dispatchCode: order.code,
          projectId: order.projectId,
          componentInstanceIds,
        },
        tx,
      );
      return updated;
    });
  }

  async arrive(id: string, body: any) {
    await this.assertStatus(id, ['IN_TRANSIT']);
    return this.updateStatus(
      id,
      'ARRIVED',
      'ARRIVED',
      'Xe đã đến công trình.',
      {
        arrivedAt: new Date(),
      },
      body?.createdBy,
    );
  }

  async receive(id: string, body: any) {
    await this.assertStatus(id, ['ARRIVED']);
    const order = await this.getDispatchOrder(id);

    const materialItems = order.items.filter(
      (item) => item.type === 'MATERIAL' && item.inventoryItemId,
    );
    if (materialItems.length) {
      await this.inventoryService.createTransaction({
        type: 'EXPORT',
        projectId: order.projectId,
        referenceModule: 'logistics-dispatch',
        referenceId: order.id,
        performedBy: body?.receivedBy ?? body?.createdBy ?? null,
        note: JSON.stringify({
          source: 'PROJECT_DISPATCH',
          dispatchOrderId: order.id,
          dispatchCode: order.code,
          projectId: order.projectId,
          projectCode: order.project?.code,
          projectName: order.project?.name,
        }),
        remarks: `Công trường đã nhận điều xe ${order.code}`,
        items: materialItems.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: -Math.abs(Number(item.quantity ?? 0)),
        })),
      });
    }

    await this.reconcileProjectAllocations(order);
    await this.transitionComponentInstances(
      order,
      ComponentInstanceState.DELIVERED,
    );

    const updated = await this.updateStatus(
      id,
      'RECEIVED',
      'RECEIVED',
      'Công trình đã nhận hàng.',
      {
        receivedAt: new Date(),
      },
      body?.createdBy,
    );

    await this.logActivity('PROJECT_DISPATCH_RECEIVED', 'DispatchOrder', id, {
      dispatchCode: order.code,
      projectId: order.projectId,
      projectCode: order.project?.code,
      projectName: order.project?.name,
      items: order.items.map((item) => ({
        type: item.type,
        inventoryItemId: item.inventoryItemId,
        componentInstanceId: item.componentInstanceId,
        quantity: item.quantity,
      })),
    });

    return updated;
  }

  async complete(id: string, body: any) {
    return this.logisticsRepository.transaction(async (tx) => {
      const order = await this.logisticsRepository.findDispatchOrder(id, tx);
      if (!order) throw new NotFoundException('Dispatch order not found');
      if (order.status !== DispatchOrderStatus.RECEIVED) {
        throw new BadRequestException(
          `Dispatch order cannot move from ${order.status}`,
        );
      }
      const installedAt = new Date();
      const updated = await this.updateStatus(
        id,
        'COMPLETED',
        'COMPLETED',
        'Hoàn thành giao nhận.',
        {},
        body?.createdBy,
        tx,
      );
      const componentInstanceIds = this.componentInstanceIds(order);
      const transitioned =
        await this.logisticsRepository.transitionComponentInstances(
          componentInstanceIds,
          ComponentInstanceState.DELIVERED,
          ComponentInstanceState.INSTALLED,
          tx,
        );
      if (transitioned.count !== componentInstanceIds.length) {
        throw new BadRequestException(
          'Component instance state changed before installation completion',
        );
      }
      await this.logisticsRepository.updateComponentInstances(
        componentInstanceIds,
        { installedAt },
        tx,
      );
      await this.logActivity(
        'PROJECT_COMPONENTS_INSTALLED',
        'DispatchOrder',
        id,
        {
          dispatchCode: order.code,
          projectId: order.projectId,
          componentInstanceIds,
          installedAt: installedAt.toISOString(),
        },
        tx,
      );
      return updated;
    });
  }

  async cancel(id: string, body: any) {
    await this.assertStatus(id, [
      'DRAFT',
      'PLANNED',
      'LOADING',
      'IN_TRANSIT',
      'ARRIVED',
    ]);
    return this.updateStatus(
      id,
      'CANCELLED',
      'CANCELLED',
      body?.message ?? 'Hủy lệnh điều xe.',
      {},
      body?.createdBy,
    );
  }

  async requestReturn(id: string, body: RequestDispatchReturnDto) {
    return this.logisticsRepository.transaction(async (tx) => {
      const order = await this.logisticsRepository.findDispatchOrder(id, tx);
      if (!order) throw new NotFoundException('Dispatch order not found');
      const returnableStatuses = new Set<DispatchOrderStatus>([
        DispatchOrderStatus.RECEIVED,
        DispatchOrderStatus.COMPLETED,
      ]);
      if (!returnableStatuses.has(order.status)) {
        throw new BadRequestException(
          `Dispatch order cannot request return from ${order.status}`,
        );
      }
      const componentInstanceIds = this.componentInstanceIds(order);
      if (!componentInstanceIds.length) {
        throw new BadRequestException(
          'Canonical dispatch return requires ComponentInstance items',
        );
      }
      const expectedState =
        order.status === DispatchOrderStatus.COMPLETED
          ? ComponentInstanceState.INSTALLED
          : ComponentInstanceState.DELIVERED;
      const invalid = order.items.find(
        (item) =>
          item.componentInstanceId &&
          item.componentInstance?.state !== expectedState,
      );
      if (invalid) {
        throw new BadRequestException(
          'Dispatch contains a ComponentInstance outside the returnable physical state',
        );
      }
      const updated = await this.updateStatus(
        id,
        DispatchOrderStatus.RETURN_REQUESTED,
        DispatchEventType.RETURN_REQUESTED,
        body.reason,
        {},
        body.createdBy,
        tx,
      );
      await this.logActivity(
        'PROJECT_DISPATCH_RETURN_REQUESTED',
        'DispatchOrder',
        id,
        {
          dispatchCode: order.code,
          projectId: order.projectId,
          componentInstanceIds,
          reason: body.reason,
        },
        tx,
      );
      return updated;
    });
  }

  async departReturn(id: string, body: DepartDispatchReturnDto) {
    return this.logisticsRepository.transaction(async (tx) => {
      const order = await this.logisticsRepository.findDispatchOrder(id, tx);
      if (!order) throw new NotFoundException('Dispatch order not found');
      if (order.status !== DispatchOrderStatus.RETURN_REQUESTED) {
        throw new BadRequestException(
          `Dispatch return cannot depart from ${order.status}`,
        );
      }
      const componentInstanceIds = this.componentInstanceIds(order);
      const transitioned =
        await this.logisticsRepository.transitionComponentInstancesFromStates(
          componentInstanceIds,
          [ComponentInstanceState.DELIVERED, ComponentInstanceState.INSTALLED],
          ComponentInstanceState.IN_TRANSIT,
          { installedAt: null },
          tx,
        );
      if (transitioned.count !== componentInstanceIds.length) {
        throw new BadRequestException(
          'Component instance state changed before return departure',
        );
      }
      const updated = await this.updateStatus(
        id,
        DispatchOrderStatus.RETURN_IN_TRANSIT,
        DispatchEventType.RETURN_DEPARTED,
        body.reason,
        {},
        body.createdBy,
        tx,
      );
      await this.logActivity(
        'PROJECT_DISPATCH_RETURN_DEPARTED',
        'DispatchOrder',
        id,
        {
          dispatchCode: order.code,
          projectId: order.projectId,
          componentInstanceIds,
          reason: body.reason,
        },
        tx,
      );
      return updated;
    });
  }

  async receiveReturnToYard(id: string, body: ReceiveDispatchReturnDto) {
    return this.logisticsRepository.transaction(async (tx) => {
      const order = await this.logisticsRepository.findDispatchOrder(id, tx);
      if (!order) throw new NotFoundException('Dispatch order not found');
      if (order.status !== DispatchOrderStatus.RETURN_IN_TRANSIT) {
        throw new BadRequestException(
          `Dispatch return cannot be received from ${order.status}`,
        );
      }
      const componentInstanceIds = this.componentInstanceIds(order);
      const requestedIds = body.placements.map(
        (placement) => placement.componentInstanceId,
      );
      if (
        new Set(requestedIds).size !== requestedIds.length ||
        requestedIds.length !== componentInstanceIds.length ||
        requestedIds.some(
          (instanceId) => !componentInstanceIds.includes(instanceId),
        )
      ) {
        throw new BadRequestException(
          'Return placements must cover each dispatched ComponentInstance exactly once',
        );
      }
      const placements = [];
      for (const requested of body.placements) {
        placements.push(
          await this.yardService.returnComponentInstanceToYard(
            {
              componentInstanceId: requested.componentInstanceId,
              slotId: requested.slotId,
              reason: body.reason,
              sourceDispatchOrderId: order.id,
              metadata: {
                projectId: order.projectId,
                dispatchCode: order.code,
              },
            },
            body.createdBy,
            tx,
          ),
        );
      }
      const updated = await this.updateStatus(
        id,
        DispatchOrderStatus.RETURNED,
        DispatchEventType.RETURNED,
        body.reason,
        {},
        body.createdBy,
        tx,
      );
      await this.logActivity(
        'PROJECT_DISPATCH_RETURNED_TO_YARD',
        'DispatchOrder',
        id,
        {
          dispatchCode: order.code,
          projectId: order.projectId,
          componentInstanceIds,
          placementIds: placements.map((placement) => placement.id),
          reason: body.reason,
        },
        tx,
      );
      return updated;
    });
  }

  private normalizeItems(items: any[]): NormalizedDispatchItems {
    if (!Array.isArray(items) || !items.length) {
      throw new BadRequestException(
        'Dispatch order requires at least one item',
      );
    }

    const componentInstanceIds: string[] = [];
    const create = items.map((item) => {
      const type = String(item?.type ?? '').toUpperCase();
      const quantity = Number(item?.quantity ?? 0);
      if (!['MATERIAL', 'COMPONENT'].includes(type)) {
        throw new BadRequestException(
          'Dispatch item type must be MATERIAL or COMPONENT',
        );
      }
      if (quantity <= 0) {
        throw new BadRequestException(
          'Dispatch item quantity must be greater than 0',
        );
      }
      if (type === 'MATERIAL' && !item?.inventoryItemId) {
        throw new BadRequestException(
          'Material dispatch item requires inventoryItemId',
        );
      }
      if (type === 'COMPONENT' && !item?.componentInstanceId) {
        throw new BadRequestException(
          'Component dispatch item requires componentInstanceId',
        );
      }
      if (type === 'COMPONENT' && quantity !== 1) {
        throw new BadRequestException(
          'Component dispatch item quantity must be exactly 1 physical instance',
        );
      }
      if (type === 'COMPONENT') {
        componentInstanceIds.push(String(item.componentInstanceId));
      }

      return {
        type: type as DispatchItemType,
        quantity,
        ...(item?.inventoryItemId && {
          inventoryItem: {
            connect: {
              id: String(item.inventoryItemId),
            },
          },
        }),
        ...(item?.componentInstanceId && {
          componentInstance: {
            connect: {
              id: String(item.componentInstanceId),
            },
          },
        }),
      };
    });

    if (new Set(componentInstanceIds).size !== componentInstanceIds.length) {
      throw new BadRequestException(
        'Dispatch order contains duplicate ComponentInstance',
      );
    }

    return { create, componentInstanceIds };
  }

  private async assertDispatchableComponentInstances(
    componentInstanceIds: string[],
  ) {
    if (!componentInstanceIds.length) {
      return;
    }

    const instances =
      await this.logisticsRepository.findComponentInstancesForDispatch(
        componentInstanceIds,
      );
    const found = new Set(instances.map((instance) => instance.id));
    const missing = componentInstanceIds.filter((id) => !found.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `ComponentInstance not found: ${missing.join(', ')}`,
      );
    }

    const notStaged = instances.find(
      (instance) =>
        instance.state !== ComponentInstanceState.IN_YARD ||
        instance.yardPlacements.length === 0,
    );
    if (notStaged) {
      throw new BadRequestException(
        `Cấu kiện ${notStaged.instanceNo} chưa ở trạng thái staged tại Yard`,
      );
    }

    const activeItem =
      await this.logisticsRepository.findActiveComponentInstanceDispatch(
        componentInstanceIds,
        activeDispatchStatuses,
      );

    if (activeItem) {
      throw new BadRequestException(
        `Cấu kiện ${activeItem.componentInstance?.instanceNo ?? activeItem.componentInstanceId} đang nằm trong lệnh điều xe ${activeItem.dispatchOrder.code}`,
      );
    }
  }

  private componentInstanceIds(
    order: Prisma.DispatchOrderGetPayload<{ include: typeof dispatchInclude }>,
  ) {
    return order.items
      .map((item) => item.componentInstanceId)
      .filter((id): id is string => Boolean(id));
  }

  private transitionComponentInstances(
    order: Prisma.DispatchOrderGetPayload<{ include: typeof dispatchInclude }>,
    state: ComponentInstanceState,
  ) {
    return this.logisticsRepository.updateComponentInstances(
      this.componentInstanceIds(order),
      { state },
    );
  }

  private async reconcileProjectAllocations(
    order: Prisma.DispatchOrderGetPayload<{ include: typeof dispatchInclude }>,
  ) {
    if (!order.projectTaskId) {
      return;
    }

    for (const item of order.items) {
      if (item.type === 'MATERIAL' && item.inventoryItemId) {
        const allocation =
          await this.logisticsRepository.findProjectTaskMaterialAllocation(
            order.projectTaskId,
            item.inventoryItemId,
          );
        const quantity = Number(item.quantity ?? 0);
        if (allocation) {
          const issuedQty = Number(allocation.issuedQty ?? 0) + quantity;
          await this.logisticsRepository.updateProjectTaskMaterialAllocation(
            allocation.id,
            {
              issuedQty,
              remainingQty: Math.max(
                0,
                Number(allocation.plannedQty ?? 0) - issuedQty,
              ),
              totalCost: issuedQty * Number(allocation.unitCost ?? 0),
            },
          );
        } else {
          await this.logisticsRepository.createProjectTaskMaterialAllocation({
            projectTask: { connect: { id: order.projectTaskId } },
            inventoryItem: { connect: { id: item.inventoryItemId } },
            plannedQty: quantity,
            issuedQty: quantity,
            remainingQty: 0,
          });
        }
      }

      // Component delivery is canonicalized on ComponentInstance state/timestamps.
      // Legacy Component.status and component-allocation mutation are intentionally not touched here.
    }
  }

  private async assertStatus(id: string, statuses: DispatchOrderStatus[]) {
    const order = await this.logisticsRepository.findDispatchOrderStatus(id);

    if (!order) {
      throw new NotFoundException('Dispatch order not found');
    }

    if (!statuses.includes(order.status)) {
      throw new BadRequestException(
        `Dispatch order cannot move from ${order.status}`,
      );
    }
  }

  private async updateStatus(
    id: string,
    status: DispatchOrderStatus,
    eventType: DispatchEventType,
    message: string,
    data: Prisma.DispatchOrderUpdateInput,
    createdBy?: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.logisticsRepository.updateDispatchOrder(
      id,
      {
        ...data,
        status,
        events: {
          create: {
            type: eventType,
            message,
            createdBy: createdBy ?? null,
          },
        },
      },
      tx,
    );
  }

  private logActivity(
    action: string,
    entity: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
    tx?: Prisma.TransactionClient,
  ) {
    return this.logisticsRepository.createActivityLog(
      {
        action,
        entity,
        entityId,
        module: 'logistics',
        metadata,
      },
      tx,
    );
  }

  private dateKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }
}
