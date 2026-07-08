import {
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  DispatchOrderStatus,
  Prisma,
  ProjectTaskStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface ProjectSnapshotPayload {
  projectId: string;
  progress: number;
  delayedTaskCount: number;
  completedTaskCount: number;
  activeTaskCount: number;
  materialProgress: number;
  componentProgress: number;
  logisticsProgress: number;
  costProgress: number;
  healthScore: number;
}

export interface ProjectDetailSnapshotPayload {
  projectId: string;
  tab: string;
  payload: Record<string, unknown>;
  sourceWatermark?: string;
  parityStatus?: string;
  warningCount?: number;
  stale?: boolean;
  refreshReason?: string;
}

const projectDetailTabs = [
  'overview',
  'materials',
  'components',
  'progress',
  'command',
  'site',
  'costs',
] as const;

@Injectable()
export class ProjectSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findLatest(projectId: string) {
    return this.prisma.projectDashboardSnapshot.findUnique({
      where: {
        projectId,
      },
    });
  }

  findManyLatest() {
    return this.prisma.projectDashboardSnapshot.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findDetail(projectId: string, tab: string) {
    return this.prisma.projectDetailSnapshot.findUnique({
      where: {
        projectId_tab: {
          projectId,
          tab,
        },
      },
    });
  }

  findDetails(projectId?: string) {
    return this.prisma.projectDetailSnapshot.findMany({
      where: {
        projectId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async calculate(projectId?: string): Promise<ProjectSnapshotPayload[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        id: projectId,
      },
      include: {
        tasks: {
          include: {
            materialAllocations: true,
            componentAllocations: true,
            cost: true,
          },
        },
        dispatchOrders: true,
      },
    });

    const now = new Date();

    return projects.map((project) => {
      const tasks = project.tasks;
      const completedTaskCount = tasks.filter(
        (task) => task.status === ProjectTaskStatus.COMPLETED,
      ).length;
      const activeStatuses: ProjectTaskStatus[] = [
        ProjectTaskStatus.READY,
        ProjectTaskStatus.IN_PROGRESS,
        ProjectTaskStatus.BLOCKED,
        ProjectTaskStatus.PAUSED,
      ];
      const activeTaskCount = tasks.filter((task) =>
        activeStatuses.includes(task.status),
      ).length;
      const delayedTaskCount = tasks.filter(
        (task) =>
          task.status !== ProjectTaskStatus.COMPLETED &&
          task.scheduledFinishAt &&
          task.scheduledFinishAt < now,
      ).length;
      const progress = tasks.length
        ? this.average(tasks.map((task) => Number(task.progress ?? 0)))
        : 0;

      const materialPlanned = this.sum(
        tasks.flatMap((task) =>
          task.materialAllocations.map((row) => Number(row.plannedQty ?? 0)),
        ),
      );
      const materialIssued = this.sum(
        tasks.flatMap((task) =>
          task.materialAllocations.map((row) => Number(row.issuedQty ?? 0)),
        ),
      );
      const componentTotal = this.sum(
        tasks.map((task) => task.componentAllocations.length),
      );
      const componentDone = this.sum(
        tasks.map(
          (task) =>
            task.componentAllocations.filter((row) => row.installedAt).length,
        ),
      );
      const dispatchTotal = project.dispatchOrders.length;
      const dispatchDone = project.dispatchOrders.filter(
        (order) => order.status === DispatchOrderStatus.COMPLETED,
      ).length;
      const budget = this.sum(
        tasks.map((task) => Number(task.cost?.budgetCost ?? 0)),
      );
      const actual = this.sum(
        tasks.map((task) => Number(task.cost?.actualCost ?? 0)),
      );
      const healthPenalty =
        delayedTaskCount * 8 +
        tasks.filter((task) => task.status === ProjectTaskStatus.BLOCKED)
          .length *
          6;

      return {
        projectId: project.id,
        progress,
        delayedTaskCount,
        completedTaskCount,
        activeTaskCount,
        materialProgress: this.percent(materialIssued, materialPlanned),
        componentProgress: this.percent(componentDone, componentTotal),
        logisticsProgress: this.percent(dispatchDone, dispatchTotal),
        costProgress: budget > 0 ? this.percent(actual, budget) : 0,
        healthScore: Math.max(0, Math.min(100, 100 - healthPenalty)),
      };
    });
  }

  upsert(payload: ProjectSnapshotPayload, tx: Prisma.TransactionClient) {
    return tx.projectDashboardSnapshot.upsert({
      where: {
        projectId: payload.projectId,
      },
      create: payload,
      update: {
        progress: payload.progress,
        delayedTaskCount: payload.delayedTaskCount,
        completedTaskCount: payload.completedTaskCount,
        activeTaskCount: payload.activeTaskCount,
        materialProgress: payload.materialProgress,
        componentProgress: payload.componentProgress,
        logisticsProgress: payload.logisticsProgress,
        costProgress: payload.costProgress,
        healthScore: payload.healthScore,
      },
    });
  }

  upsertDetail(payload: ProjectDetailSnapshotPayload, tx: Prisma.TransactionClient) {
    return tx.projectDetailSnapshot.upsert({
      where: {
        projectId_tab: {
          projectId: payload.projectId,
          tab: payload.tab,
        },
      },
      create: {
        projectId: payload.projectId,
        tab: payload.tab,
        payload: this.toJson(payload.payload),
        sourceWatermark: payload.sourceWatermark,
        parityStatus: payload.parityStatus ?? 'PASS',
        warningCount: payload.warningCount ?? 0,
        stale: payload.stale ?? false,
        refreshReason: payload.refreshReason,
      },
      update: {
        payload: this.toJson(payload.payload),
        sourceWatermark: payload.sourceWatermark,
        parityStatus: payload.parityStatus ?? 'PASS',
        warningCount: payload.warningCount ?? 0,
        stale: payload.stale ?? false,
        refreshReason: payload.refreshReason,
        generatedAt: new Date(),
      },
    });
  }

  async calculateDetailSnapshots(
    projectId?: string,
    tab?: string,
  ): Promise<ProjectDetailSnapshotPayload[]> {
    const projects = await this.prisma.project.findMany({
      where: { id: projectId },
      orderBy: { createdAt: 'desc' },
    });
    const projectIds = projects.map((project) => project.id);
    if (projectIds.length === 0) {
      return [];
    }

    const [
      components,
      inventoryTransactions,
      productionOrders,
      componentTasks,
      projectTasks,
      returnRequests,
      documents,
      activityLogs,
    ] = await Promise.all([
      this.prisma.component.findMany({
        where: { projectId: { in: projectIds } },
        include: { project: true },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          items: {
            include: {
              inventoryItem: true,
              unit: true,
            },
          },
        },
        orderBy: { transactionDate: 'desc' },
        take: 1000,
      }),
      this.prisma.productionOrder.findMany({
        where: { projectId: { in: projectIds } },
        include: { stages: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.findMany({
        where: {
          component: {
            is: {
              projectId: { in: projectIds },
            },
          },
        },
        include: { component: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.projectTask.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          dependencies: true,
          dependentTasks: true,
          materialAllocations: {
            include: { inventoryItem: true },
          },
          componentAllocations: {
            include: { component: true },
          },
          resources: true,
          inspection: true,
          cost: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.returnRequest.findMany({
        where: {
          projectId: { in: projectIds },
        },
        include: {
          project: true,
          warehouse: true,
          items: {
            include: {
              inventoryItem: true,
              unit: true,
              zone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      this.prisma.attachment.findMany({
        where: {
          deletedAt: null,
          OR: [
            { entityType: { in: ['project', 'Project'] }, entityId: { in: projectIds } },
            {
              links: {
                some: {
                  module: { in: ['projects', 'project'] },
                  entityId: { in: projectIds },
                },
              },
            },
          ],
        },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
          },
          links: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      this.prisma.activityLog.findMany({
        where: {
          OR: [
            { entity: 'Project', entityId: { in: projectIds } },
            { module: { in: ['projects', 'project'] } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ]);

    const tabs = tab ? [tab] : [...projectDetailTabs];
    return projects.flatMap((project) => {
      const payload = this.buildProjectDetailPayload({
        project,
        components: components.filter((row) => row.projectId === project.id),
        inventoryTransactions: inventoryTransactions.filter((row) => row.projectId === project.id),
        productionOrders: productionOrders.filter((row) => row.projectId === project.id),
        componentTasks: componentTasks.filter((row) => row.component?.projectId === project.id),
        projectTasks: projectTasks.filter((row) => row.projectId === project.id),
        returnRequests: returnRequests.filter((row) => row.projectId === project.id),
        documents: documents.filter((row) => {
          const direct = row.entityType?.toLowerCase() === 'project' && row.entityId === project.id;
          const linked = row.links.some((link) => link.entityId === project.id);
          return direct || linked;
        }),
        activityLogs: activityLogs.filter((row) => {
          const metadata = this.objectMetadata(row.metadata);
          return row.entityId === project.id || metadata.projectId === project.id;
        }),
      });

      return tabs.map((nextTab) => ({
        projectId: project.id,
        tab: nextTab,
        payload: this.pickDetailTabPayload(payload, nextTab),
        sourceWatermark: new Date().toISOString(),
        parityStatus: 'PASS',
        warningCount: 0,
        stale: false,
      }));
    });
  }

  private buildProjectDetailPayload(input: {
    project: any;
    components: any[];
    inventoryTransactions: any[];
    productionOrders: any[];
    componentTasks: any[];
    projectTasks: any[];
    returnRequests: any[];
    documents: any[];
    activityLogs: any[];
  }) {
    const project = this.buildProjectRuntimeRow(
      input.project,
      input.components,
      input.inventoryTransactions,
      input.productionOrders,
    );
    const components = this.buildProjectComponentRows(input.components);
    const materials = this.buildProjectMaterialRows(
      input.project,
      input.inventoryTransactions,
      input.projectTasks,
      input.returnRequests,
    );
    const wbs = this.buildProjectWbsFromDomain(input.project.id, input.projectTasks);
    const financial = this.buildProjectFinancial(project, components, materials);
    const health = this.buildProjectHealth(
      project,
      components,
      materials,
      input.componentTasks,
      input.returnRequests,
    );
    const returnRequests = this.mapProjectReturnRequests(input.returnRequests);
    const documents = this.mapProjectDocuments(input.documents);
    const logs = this.mapProjectLogs(input.activityLogs);

    return {
      base: {
        project,
        generatedAt: new Date().toISOString(),
      },
      materials,
      components,
      wbs,
      financial,
      health,
      returnRequests,
      documents,
      logs,
    };
  }

  private pickDetailTabPayload(detail: Record<string, any>, tab: string) {
    const base = detail.base;
    if (tab === 'materials') return { ...base, materials: detail.materials, returnRequests: detail.returnRequests };
    if (tab === 'components') return { ...base, components: detail.components };
    if (['progress', 'command', 'site'].includes(tab)) return { ...base, wbs: detail.wbs, health: detail.health, documents: detail.documents, logs: detail.logs };
    if (tab === 'costs') return { ...base, financial: detail.financial, wbs: detail.wbs };
    if (tab === 'documents') return { ...base, documents: detail.documents };
    if (tab === 'logs') return { ...base, logs: detail.logs, wbs: detail.wbs, returnRequests: detail.returnRequests };
    return {
      ...base,
      materials: detail.materials,
      components: detail.components,
      wbs: detail.wbs,
      financial: detail.financial,
      health: detail.health,
      returnRequests: detail.returnRequests,
      documents: detail.documents,
      logs: detail.logs,
    };
  }

  private buildProjectRuntimeRow(
    project: any,
    components: any[],
    inventoryTransactions: any[],
    productionOrders: any[],
  ) {
    const completedComponents = components.filter((component) => component.status === 'INSTALLED');
    const deliveredComponents = components.filter((component) => ['DELIVERED', 'INSTALLED'].includes(component.status)).length;
    const componentProgress = components.length
      ? (completedComponents.length / components.length) * 100
      : project.status === 'COMPLETED'
        ? 100
        : project.status === 'ACTIVE'
          ? 60
          : 0;
    const orderProgress = productionOrders.length
      ? (productionOrders.filter((order) => order.status === 'COMPLETED').length / productionOrders.length) * 100
      : componentProgress;
    const transactionValue = inventoryTransactions.reduce(
      (sum, transaction) =>
        sum + transaction.items.reduce((lineSum, item) => lineSum + Math.abs(Number(item.totalAmount ?? 0)), 0),
      0,
    );
    const componentEstimate = components.reduce((sum, component) => sum + Number(component.estimatedCost ?? 0), 0);
    const componentActual = components.reduce((sum, component) => sum + Number(component.actualCost ?? 0), 0);
    return {
      ...project,
      progress: Math.round((componentProgress + orderProgress) / 2),
      type: this.projectType(project.name, project.description),
      location: this.projectLocation(project.description),
      owner: this.projectOwner(project.description),
      contractValue: componentEstimate || transactionValue,
      actualValue: componentActual || transactionValue,
      tonnage: productionOrders.reduce((sum, order) => sum + Number(order.quantity ?? 0), 0) || components.length,
      readyComponents: components.filter((component) => component.status === 'READY').length,
      shippedComponents: components.filter((component) => component.status === 'SHIPPED').length,
      delivered: deliveredComponents,
      deliveredComponents,
      installedComponents: completedComponents.length,
      pending: Math.max(0, components.length - deliveredComponents),
      delayedOrders: productionOrders.filter((order) => order.status === 'DELAYED').length,
      componentCount: components.length,
      orderCount: productionOrders.length,
      materialTransactions: inventoryTransactions.length,
      startedAt: project.createdAt,
      plannedEndAt: project.updatedAt,
    };
  }

  private buildProjectComponentRows(components: any[]) {
    return components.map((component) => ({
      id: component.id,
      projectId: component.projectId,
      projectCode: component.project?.code ?? '-',
      projectName: component.project?.name ?? '-',
      code: component.code,
      name: component.name,
      status: component.status,
      plannedDate: component.plannedDate,
      installedDate: component.installedDate,
      installZone: component.installZone,
      installAxis: component.installAxis,
      installLevel: component.installLevel,
      installPosition: component.installPosition,
      estimatedCost: Number(component.estimatedCost ?? 0),
      actualCost: Number(component.actualCost ?? 0),
    }));
  }

  private buildProjectMaterialRows(
    project: any,
    inventoryTransactions: any[],
    projectTasks: any[],
    returnRequests: any[],
  ) {
    const allocationMetrics = new Map<string, { allocatedQuantity: number; usedQuantity: number; returnedQuantity: number }>();
    for (const task of projectTasks) {
      for (const allocation of task.materialAllocations) {
        const key = `${task.projectId}:${allocation.inventoryItemId}`;
        const current = allocationMetrics.get(key) ?? { allocatedQuantity: 0, usedQuantity: 0, returnedQuantity: 0 };
        current.allocatedQuantity += Number(allocation.issuedQty ?? 0);
        current.usedQuantity += Number(allocation.usedQty ?? 0);
        current.returnedQuantity += Number(allocation.returnedQty ?? 0);
        allocationMetrics.set(key, current);
      }
    }
    const returnMetrics = new Map<string, { pendingReturnQuantity: number; returnedQuantity: number }>();
    for (const request of returnRequests) {
      if (!request.projectId || request.flowType !== 'SITE_RETURN') continue;
      const status = String(request.status);
      const isPending = ['REQUESTED', 'APPROVED'].includes(status);
      const isReturned = ['RECEIVED', 'INSPECTED', 'DISPOSED'].includes(status);
      if (!isPending && !isReturned) continue;
      for (const item of request.items) {
        const key = `${request.projectId}:${item.inventoryItemId}`;
        const current = returnMetrics.get(key) ?? { pendingReturnQuantity: 0, returnedQuantity: 0 };
        if (isPending) current.pendingReturnQuantity += Number(item.requestedQuantity ?? 0);
        if (isReturned) current.returnedQuantity += Number(item.receivedQuantity ?? item.inspectedQuantity ?? item.requestedQuantity ?? 0);
        returnMetrics.set(key, current);
      }
    }
    return inventoryTransactions.flatMap((transaction) =>
      transaction.items.map((item) => {
        const key = `${transaction.projectId ?? ''}:${item.inventoryItemId}`;
        const allocation = allocationMetrics.get(key);
        const returns = returnMetrics.get(key);
        const fallbackAllocated = transaction.type === 'EXPORT' ? Math.abs(Number(item.quantity ?? 0)) : 0;
        const allocatedQuantity =
          allocation?.allocatedQuantity && allocation.allocatedQuantity > 0
            ? allocation.allocatedQuantity
            : fallbackAllocated;
        const usedQuantity = allocation?.usedQuantity ?? 0;
        const pendingReturnQuantity = returns?.pendingReturnQuantity ?? 0;
        const returnedQuantity = Math.max(allocation?.returnedQuantity ?? 0, returns?.returnedQuantity ?? 0);
        return {
          id: item.id,
          projectId: transaction.projectId,
          projectCode: project.code,
          projectName: project.name,
          materialCode: item.inventoryItem.code,
          materialName: item.inventoryItem.name,
          unit: item.unit?.symbol ?? item.inventoryItem.unit,
          inventoryItemId: item.inventoryItemId,
          unitId: item.unitId,
          zoneId: item.zoneId,
          quantity: Number(item.quantity ?? 0),
          allocatedQuantity,
          usedQuantity,
          pendingReturnQuantity,
          returnedQuantity,
          availableReturnQuantity: Math.max(0, allocatedQuantity - usedQuantity - pendingReturnQuantity),
          unitPrice: Number(item.unitPrice ?? 0),
          totalAmount: Number(item.totalAmount ?? 0),
          type: transaction.type,
          date: transaction.transactionDate,
        };
      }),
    );
  }

  private buildProjectWbsFromDomain(projectId: string, tasks: any[]) {
    const rows = tasks
      .filter((task) => task.projectId === projectId)
      .map((task) => {
        const materials = task.materialAllocations.map((item) => ({
          id: item.inventoryItemId,
          code: item.inventoryItem.code,
          name: item.inventoryItem.name,
          planned: Number(item.plannedQty ?? 0),
          issued: Number(item.issuedQty ?? 0),
          used: Number(item.usedQty ?? 0),
          returned: Number(item.returnedQty ?? 0),
          remaining: Number(item.remainingQty ?? 0),
          cost: Number(item.totalCost ?? 0),
        }));
        const components = task.componentAllocations.map((item) => ({
          id: item.componentId,
          code: item.component.code,
          name: item.component.name,
          assigned: item.assignedAt ? 1 : 0,
          installed: item.installedAt ? 1 : 0,
          returned: item.returnedAt ? 1 : 0,
          status: item.status,
          cost: Number(item.cost ?? 0),
        }));
        const materialCost = Number(task.cost?.materialCost ?? this.sum(materials.map((item) => item.cost)));
        const laborCost = Number(task.cost?.laborCost ?? 0);
        const machineCost = Number(task.cost?.machineCost ?? 0);
        const otherCost = Number(task.cost?.otherCost ?? 0);
        const actualCost = Number(task.cost?.actualCost ?? materialCost + laborCost + machineCost + otherCost);
        const revenue = Number(task.cost?.budgetCost ?? 0);
        return {
          id: task.id,
          projectId: task.projectId,
          parentId: task.parentTaskId,
          level: 0,
          type: task.parentTaskId ? 'TASK' : 'PHASE',
          name: task.name,
          description: task.description ?? '',
          owner: '-',
          plannedStartAt: task.plannedStartAt,
          plannedFinishAt: task.plannedFinishAt,
          scheduledStartAt: task.scheduledStartAt,
          scheduledFinishAt: task.scheduledFinishAt,
          forecastFinishAt: task.forecastFinishAt,
          baselineStartAt: task.baselineStartAt ?? task.plannedStartAt,
          baselineFinishAt: task.baselineFinishAt ?? task.plannedFinishAt,
          actualStartAt: task.actualStartAt,
          actualFinishAt: task.actualFinishAt,
          progress: Number(task.progress ?? 0),
          status: task.status,
          materialCount: materials.length,
          componentCount: components.length,
          delayDays: this.delayDays(task.plannedFinishAt, task.actualFinishAt),
          cost: actualCost,
          sortOrder: Number(task.sortOrder ?? 0),
          materials,
          components,
          predecessors: task.dependencies.map((dependency) => ({
            taskId: dependency.dependsOnTaskId,
            type: dependency.type,
            lagDays: dependency.lagDays,
          })),
          successors: task.dependentTasks.map((dependency) => ({
            taskId: dependency.projectTaskId,
            type: dependency.type,
            lagDays: dependency.lagDays,
          })),
          revenue,
          laborCost,
          machineCost,
          otherCost,
          workers: task.resources
            .filter((resource) => resource.type === 'WORKER')
            .map((resource) => ({
              role: resource.name ?? 'Nhân công',
              required: Number(resource.quantity ?? 0),
              allocated: Number(resource.allocatedQuantity ?? 0),
            })),
          machines: task.resources
            .filter((resource) => resource.type === 'MACHINE')
            .map((resource) => ({
              type: resource.name ?? 'Thiết bị',
              required: Number(resource.quantity ?? 0),
              allocated: Number(resource.allocatedQuantity ?? 0),
            })),
          inspectionStatus: task.inspection?.status ?? null,
          profit: revenue - actualCost,
          baselineVarianceDays: task.baselineVarianceDays,
          cascadeDelayDays: task.cascadeDelayDays,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return this.applyProjectScheduling(rows);
  }

  private buildProjectFinancial(
    project: { id: string; contractValue: number },
    components: Array<{ actualCost: number; estimatedCost: number }>,
    materials: Array<{ totalAmount: number; type: string; date: Date }>,
  ) {
    const materialCost = materials.reduce((sum, item) => {
      const amount = Math.abs(Number(item.totalAmount ?? 0));
      return item.type === 'RETURN' ? sum - amount : sum + amount;
    }, 0);
    const componentCost = this.sum(components.map((component) => component.actualCost || component.estimatedCost));
    const actualCost = Math.max(0, materialCost) + componentCost;
    const budget = Number(project.contractValue ?? 0);
    const profit = budget - actualCost;
    const marginPercent = budget > 0 ? (profit / budget) * 100 : 0;
    const byTime = Array.from(
      materials.reduce((map, item) => {
        const key = item.date instanceof Date ? item.date.toISOString().slice(0, 10) : new Date(item.date).toISOString().slice(0, 10);
        map.set(key, (map.get(key) ?? 0) + Math.abs(Number(item.totalAmount ?? 0)));
        return map;
      }, new Map<string, number>()),
    ).map(([date, value]) => ({ date, value }));
    return {
      projectId: project.id,
      contractValue: budget,
      budget,
      actualCost,
      profit,
      marginPercent,
      breakdown: {
        materialCost: Math.max(0, materialCost),
        componentCost,
        laborCost: 0,
        machineCost: 0,
        otherCost: 0,
      },
      byTime,
      profitByProgress: [
        { label: 'Hợp đồng', value: budget },
        { label: 'Chi phí', value: actualCost },
        { label: 'Lãi/Lỗ', value: profit },
      ],
    };
  }

  private buildProjectHealth(
    project: { id: string; progress: number; plannedEndAt: Date; delayedOrders: number; contractValue: number },
    components: Array<{ status: string }>,
    materials: Array<{ quantity: number; type: string; totalAmount: number }>,
    tasks: Array<{ status: string; dueDate: Date | null }>,
    returns: Array<{ status: string }>,
  ) {
    const overdueTasks = tasks.filter((task) =>
      task.dueDate && task.dueDate.getTime() < Date.now() && task.status !== 'DONE',
    ).length;
    const missingComponents = components.filter((component) =>
      !['DELIVERED', 'INSTALLED'].includes(component.status),
    ).length;
    const materialBalance = materials.reduce((sum, item) => {
      const quantity = Math.abs(Number(item.quantity ?? 0));
      return item.type === 'RETURN' ? sum - quantity : sum + quantity;
    }, 0);
    const actualCost = materials.reduce((sum, item) => sum + Math.abs(Number(item.totalAmount ?? 0)), 0);
    const overBudget = project.contractValue > 0 && actualCost > project.contractValue;
    const openReturns = returns.filter((item) => !['DISPOSED', 'CANCELLED'].includes(item.status)).length;
    const delayed = project.delayedOrders > 0 || overdueTasks > 0 || this.delayDays(project.plannedEndAt, null) > 0;
    const warnings = [
      overdueTasks > 0 ? `${overdueTasks} công việc quá hạn` : '',
      project.delayedOrders > 0 ? `${project.delayedOrders} lệnh sản xuất chậm` : '',
      missingComponents > 0 ? `${missingComponents} cấu kiện chưa bàn giao/lắp đặt` : '',
      materialBalance <= 0 && materials.length > 0 ? 'Không còn vật tư tồn tại công trình' : '',
      overBudget ? 'Chi phí vật tư vượt giá trị hợp đồng' : '',
      openReturns > 0 ? `${openReturns} phiếu trả đang mở` : '',
    ].filter(Boolean);
    const suggestedActions = [
      overdueTasks > 0 ? 'Rà soát công việc quá hạn' : '',
      missingComponents > 0 ? 'Điều phối cấu kiện chưa bàn giao' : '',
      materialBalance > 0 ? 'Kiểm tra vật tư dư có cần hoàn trả' : '',
      overBudget ? 'Rà soát ngân sách và chi phí phát sinh' : '',
      openReturns > 0 ? 'Hoàn tất quy trình nhận/kiểm/nhập trả' : '',
    ].filter(Boolean);
    return {
      projectId: project.id,
      status: delayed || overBudget ? 'DELAYED' : warnings.length > 0 ? 'RISK' : 'NORMAL',
      score: Math.max(0, 100 - warnings.length * 12 - project.delayedOrders * 8),
      warnings,
      suggestedActions,
      blockedTasks: 0,
      overdueTasks,
      missingMaterials: materialBalance <= 0 && materials.length > 0 ? 1 : 0,
      missingComponents,
      overBudget,
      openReturns,
    };
  }

  private mapProjectReturnRequests(returnRequests: any[]) {
    return returnRequests.map((request) => ({
      id: request.id,
      returnNo: request.returnNo,
      flowType: request.flowType,
      status: request.status,
      projectId: request.projectId,
      projectCode: request.project?.code ?? '-',
      projectName: request.project?.name ?? '-',
      warehouseCode: request.warehouse?.code ?? '-',
      warehouseName: request.warehouse?.name ?? '-',
      requestedBy: request.requestedBy,
      remarks: request.remarks,
      createdAt: request.createdAt,
      items: request.items.map((item) => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        materialCode: item.inventoryItem.code,
        materialName: item.inventoryItem.name,
        requestedQuantity: Number(item.requestedQuantity ?? 0),
        receivedQuantity: Number(item.receivedQuantity ?? 0),
        inspectedQuantity: Number(item.inspectedQuantity ?? 0),
        disposition: item.disposition,
        unit: item.unit?.symbol ?? item.inventoryItem.unit,
        zoneCode: item.zone?.code ?? '-',
        zoneName: item.zone?.name ?? '-',
      })),
    }));
  }

  private mapProjectDocuments(documents: any[]) {
    return documents.map((document) => {
      const version = document.versions[0];
      const projectLink = document.links.find((link) => ['projects', 'project'].includes(link.module));
      const projectId = document.entityType?.toLowerCase() === 'project'
        ? document.entityId
        : projectLink?.entityId ?? null;
      const source = document.entityType?.toLowerCase() === 'project'
        ? 'Project'
        : document.entityType
          ? `${document.module ?? 'Attachment'} · ${document.entityType}`
          : document.module ?? 'Attachment';
      return {
        id: document.id,
        title: document.title,
        originalName: document.originalName ?? version?.originalName ?? document.title,
        category: document.category,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        module: document.module,
        entityType: document.entityType,
        entityId: document.entityId,
        projectId,
        source,
        publicUrl: version?.publicUrl ?? document.thumbnailUrl ?? null,
        createdAt: document.createdAt,
      };
    });
  }

  private mapProjectLogs(activityLogs: any[]) {
    return activityLogs.map((log) => {
      const metadata = this.objectMetadata(log.metadata);
      const projectId = typeof metadata.projectId === 'string'
        ? metadata.projectId
        : log.entity === 'Project'
          ? log.entityId
          : null;
      const detail = [
        typeof metadata.projectCode === 'string' ? metadata.projectCode : null,
        typeof metadata.componentCode === 'string' ? metadata.componentCode : null,
        typeof metadata.returnNo === 'string' ? metadata.returnNo : null,
      ].filter(Boolean).join(' · ');
      return {
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        module: log.module,
        userId: log.userId,
        projectId,
        title: this.projectLogTitle(log.action),
        detail: detail || null,
        createdAt: log.createdAt,
      };
    });
  }

  private projectLogTitle(action: string) {
    const map: Record<string, string> = {
      CREATE: 'Tạo công trình',
      UPDATE: 'Cập nhật công trình',
      PROJECT_COMPONENT_RETURNED: 'Trả cấu kiện về bãi',
      'project.task.created': 'Tạo công việc',
      'project.task.updated': 'Cập nhật công việc',
      'project.task.deleted': 'Xóa công việc',
      'project.schedule.changed': 'Thay đổi tiến độ',
      'project.material.changed': 'Thay đổi vật tư',
      'project.cost.changed': 'Thay đổi chi phí',
      'project.inspection.changed': 'Thay đổi nghiệm thu',
      'project.template.created': 'Tạo template',
      'project.template.updated': 'Cập nhật template',
    };
    return map[action] ?? action.replaceAll('_', ' ').toLowerCase();
  }

  private applyProjectScheduling<T extends Record<string, any>>(rows: T[]) {
    const scheduled = rows.map((row) => ({
      ...row,
      scheduledStartAt: row.plannedStartAt ?? null,
      scheduledFinishAt: row.plannedFinishAt ?? null,
      forecastFinishAt: row.actualFinishAt ?? row.plannedFinishAt ?? null,
      baselineVarianceDays: this.dayDiff(
        this.parseDate(row.baselineFinishAt),
        this.parseDate(row.plannedFinishAt),
      ),
      cascadeDelayDays: 0,
    }));
    const byId = new Map(scheduled.map((row) => [row.id, row]));

    for (let i = 0; i < scheduled.length; i += 1) {
      for (const row of scheduled) {
        const duration = Math.max(
          1,
          this.dayDiff(
            this.parseDate(row.scheduledStartAt),
            this.parseDate(row.scheduledFinishAt),
          ),
        );

        for (const dependency of row.predecessors ?? []) {
          const predecessor = byId.get(String(dependency.taskId));
          if (!predecessor) continue;
          const type = dependency.type ?? 'FS';
          const predecessorStart = this.parseDate(predecessor.actualStartAt) ?? this.parseDate(predecessor.scheduledStartAt);
          const predecessorFinish = this.parseDate(predecessor.actualFinishAt) ?? this.parseDate(predecessor.scheduledFinishAt);
          let nextStart = this.parseDate(row.scheduledStartAt);
          let nextFinish = this.parseDate(row.scheduledFinishAt);

          if (type === 'FS' && predecessorFinish) {
            nextStart = this.maxDate(nextStart, this.addDays(predecessorFinish, 1));
            nextFinish = nextStart ? this.addDays(nextStart, duration) : nextFinish;
          } else if (type === 'SS' && predecessorStart) {
            nextStart = this.maxDate(nextStart, predecessorStart);
            nextFinish = nextStart ? this.addDays(nextStart, duration) : nextFinish;
          } else if (type === 'FF' && predecessorFinish) {
            nextFinish = this.maxDate(nextFinish, predecessorFinish);
            nextStart = nextFinish ? this.addDays(nextFinish, -duration) : nextStart;
          }

          row.scheduledStartAt = nextStart?.toISOString() ?? row.scheduledStartAt;
          row.scheduledFinishAt = nextFinish?.toISOString() ?? row.scheduledFinishAt;
          row.forecastFinishAt = row.actualFinishAt ?? row.scheduledFinishAt;
        }
      }
    }

    return scheduled.map((row) => ({
      ...row,
      baselineVarianceDays: this.dayDiff(
        this.parseDate(row.baselineFinishAt),
        this.parseDate(row.scheduledFinishAt),
      ),
      cascadeDelayDays: Math.max(
        0,
        this.dayDiff(
          this.parseDate(row.plannedFinishAt),
          this.parseDate(row.scheduledFinishAt),
        ),
      ),
    }));
  }

  private projectType(name: string, description?: string | null) {
    const explicit = description?.match(/(?:loại|type)\s*:\s*([^;]+)/i)?.[1]?.trim();
    if (explicit) return explicit;
    const value = name.toLowerCase();
    if (value.includes('kho') || value.includes('logistics')) return 'Kho bãi';
    if (value.includes('cầu') || value.includes('hạ tầng')) return 'Hạ tầng';
    if (value.includes('văn phòng')) return 'Văn phòng';
    if (value.includes('trung tâm')) return 'Tòa nhà';
    return 'Nhà xưởng';
  }

  private projectLocation(description?: string | null) {
    if (!description) return '-';
    const match = description.match(/(?:địa điểm|location)\s*:\s*([^;]+)/i);
    return match?.[1]?.trim() ?? '-';
  }

  private projectOwner(description?: string | null) {
    if (!description) return '-';
    const match = description.match(/(?:chủ đầu tư|owner)\s*:\s*([^;]+)/i);
    return match?.[1]?.trim() ?? '-';
  }

  private delayDays(planned?: Date | null, actual?: Date | null) {
    if (!planned) return 0;
    const compare = actual ?? new Date();
    const delta = compare.getTime() - planned.getTime();
    return delta > 0 ? Math.ceil(delta / 86_400_000) : 0;
  }

  private dayDiff(start: Date | null, finish: Date | null) {
    if (!start || !finish) return 0;
    return Math.round((finish.getTime() - start.getTime()) / 86_400_000);
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 86_400_000);
  }

  private maxDate(left: Date | null, right: Date | null) {
    if (!left) return right;
    if (!right) return left;
    return left.getTime() >= right.getTime() ? left : right;
  }

  private parseDate(value?: string | Date | null) {
    if (!value) return null;
    if (value instanceof Date) return value;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  private objectMetadata(value: unknown): Record<string, any> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, any>;
    }
    return {};
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private percent(value: number, total: number) {
    if (total <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (value / total) * 100));
  }

  private average(values: number[]) {
    if (values.length === 0) {
      return 0;
    }

    return this.sum(values) / values.length;
  }

  private sum(values: number[]) {
    return values.reduce((total, value) => total + value, 0);
  }
}
