import { Inject, Injectable } from '@nestjs/common';

import {
  ComponentStatus,
  Prisma,
  ProjectStatus,
  ProjectTemplateStatus,
} from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;
export type ProjectTx = Prisma.TransactionClient;

export const projectTaskRepositoryInclude = {
  dependencies: true,
  dependentTasks: true,
  materialAllocations: {
    include: {
      inventoryItem: true,
    },
  },
  componentAllocations: {
    include: {
      component: true,
    },
  },
  resources: true,
  inspection: true,
  cost: true,
} satisfies Prisma.ProjectTaskInclude;

@Injectable()
export class ProjectsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  transaction<T>(callback: (tx: ProjectTx) => Promise<T>) {
    return this.prisma.$transaction(callback, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findAll(params: {
    search?: string;
    status?: ProjectStatus;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.project.findMany({
      where: this.buildWhere(params),
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  count(params: { search?: string; status?: ProjectStatus }) {
    return this.prisma.project.count({
      where: this.buildWhere(params),
    });
  }

  findOne(id: string, db: DbClient = this.prisma) {
    return db.project.findUnique({
      where: {
        id,
      },
    });
  }

  findAggregate(id: string, db: DbClient = this.prisma) {
    return db.project.findUnique({
      where: { id },
      include: {
        tasks: {
          select: {
            id: true,
            parentTaskId: true,
            status: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  create(data: Prisma.ProjectCreateInput, db: DbClient = this.prisma) {
    return db.project.create({
      data,
    });
  }

  update(
    id: string,
    data: Prisma.ProjectUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.project.update({
      where: {
        id,
      },
      data,
    });
  }

  async updateVersioned(
    id: string,
    expectedUpdatedAt: Date,
    data: Prisma.ProjectUpdateManyMutationInput,
    tx: ProjectTx,
  ) {
    const result = await tx.project.updateMany({
      where: { id, updatedAt: expectedUpdatedAt },
      data,
    });
    return result.count === 1 ? this.findAggregate(id, tx) : null;
  }

  delete(id: string, db: DbClient = this.prisma) {
    return db.project.delete({
      where: {
        id,
      },
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({
      data,
    });
  }

  updateManyActivityLogs(
    args: Prisma.ActivityLogUpdateManyArgs,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.updateMany(args);
  }

  findProjectTemplate(id: string, db: DbClient = this.prisma) {
    return db.projectTemplate.findUnique({
      where: { id },
    });
  }

  findActiveProjectTemplate(id: string, db: DbClient = this.prisma) {
    return db.projectTemplate.findFirst({
      where: {
        id,
        status: {
          not: ProjectTemplateStatus.INACTIVE,
        },
      },
    });
  }

  findProjectTemplates() {
    return this.prisma.projectTemplate.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  clearDefaultProjectTemplates(exceptId?: string, db: DbClient = this.prisma) {
    return db.projectTemplate.updateMany({
      where: {
        isDefault: true,
        id: exceptId ? { not: exceptId } : undefined,
      },
      data: {
        isDefault: false,
      },
    });
  }

  createProjectTemplate(
    data: Prisma.ProjectTemplateCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTemplate.create({
      data,
    });
  }

  updateProjectTemplate(
    id: string,
    data: Prisma.ProjectTemplateUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTemplate.update({
      where: { id },
      data,
    });
  }

  upsertProjectTemplateByCode(
    code: string,
    create: Prisma.ProjectTemplateCreateInput,
    update: Prisma.ProjectTemplateUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTemplate.upsert({
      where: { code },
      create,
      update,
    });
  }

  findProjectTask(taskId: string, db: DbClient = this.prisma) {
    return db.projectTask.findUnique({
      where: { id: taskId },
      include: projectTaskRepositoryInclude,
    });
  }

  findProjectTasks(projectId: string, db: DbClient = this.prisma) {
    return db.projectTask.findMany({
      where: { projectId },
      include: projectTaskRepositoryInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  createProjectTask(
    data: Prisma.ProjectTaskUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTask.create({
      data,
    });
  }

  updateProjectTask(
    id: string,
    data: Prisma.ProjectTaskUncheckedUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTask.update({
      where: { id },
      data,
    });
  }

  findProjectTaskOrThrow(id: string, db: DbClient = this.prisma) {
    return db.projectTask.findUniqueOrThrow({
      where: { id },
      include: projectTaskRepositoryInclude,
    });
  }

  deleteProjectTasks(ids: string[], db: DbClient = this.prisma) {
    return db.projectTask.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  clearProjectTaskRelations(taskId: string, db: DbClient = this.prisma) {
    return Promise.all([
      db.projectTaskDependency.deleteMany({
        where: {
          OR: [{ projectTaskId: taskId }, { dependsOnTaskId: taskId }],
        },
      }),
      db.projectTaskMaterialAllocation.deleteMany({
        where: { projectTaskId: taskId },
      }),
      db.projectTaskComponentAllocation.deleteMany({
        where: { projectTaskId: taskId },
      }),
      db.projectTaskResource.deleteMany({ where: { projectTaskId: taskId } }),
    ]);
  }

  createProjectTaskDependency(
    data: Prisma.ProjectTaskDependencyUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskDependency.create({ data });
  }

  createProjectTaskMaterialAllocation(
    data: Prisma.ProjectTaskMaterialAllocationUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskMaterialAllocation.create({ data });
  }

  findProjectTaskMaterialAllocation(
    projectTaskId: string,
    inventoryItemId: string,
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskMaterialAllocation.findFirst({
      where: { projectTaskId, inventoryItemId },
    });
  }

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
    },
    tx: ProjectTx,
  ) {
    return tx.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: data,
      update: {},
    });
  }

  findOutboxEvent(idempotencyKey: string, tx: ProjectTx) {
    return tx.outboxEvent.findUnique({ where: { idempotencyKey } });
  }

  findProjectAcceptanceEvents(projectId: string, tx: ProjectTx) {
    return tx.outboxEvent.findMany({
      where: {
        eventName: 'project.acceptance.completed',
        payload: { path: ['projectId'], equals: projectId },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  createProjectTaskComponentAllocation(
    data: Prisma.ProjectTaskComponentAllocationUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskComponentAllocation.create({ data });
  }

  createProjectTaskResource(
    data: Prisma.ProjectTaskResourceUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskResource.create({ data });
  }

  upsertProjectTaskInspection(
    projectTaskId: string,
    status: Prisma.ProjectTaskInspectionUncheckedCreateInput['status'],
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskInspection.upsert({
      where: { projectTaskId },
      create: {
        projectTaskId,
        status,
      },
      update: {
        status,
      },
    });
  }

  upsertProjectTaskCost(
    projectTaskId: string,
    data: Omit<Prisma.ProjectTaskCostUncheckedCreateInput, 'projectTaskId'>,
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskCost.upsert({
      where: { projectTaskId },
      create: {
        projectTaskId,
        ...data,
      },
      update: data,
    });
  }

  findInventoryItemByIdOrCode(value: string, db: DbClient = this.prisma) {
    return db.inventoryItem.findFirst({
      where: {
        OR: [{ id: value }, { code: value }],
      },
      select: { id: true },
    });
  }

  findComponentByIdOrCode(value: string, db: DbClient = this.prisma) {
    return db.component.findFirst({
      where: {
        OR: [{ id: value }, { code: value }],
      },
      select: { id: true },
    });
  }

  findProjectComponent(
    projectId: string,
    componentId: string,
    db: DbClient = this.prisma,
  ) {
    return db.component
      .findUnique({
        where: { id: componentId },
      })
      .then((component) =>
        component && component.projectId === projectId ? component : null,
      );
  }

  findProjectComponentInstance(
    projectId: string,
    componentInstanceId: string,
    db: DbClient = this.prisma,
  ) {
    return db.componentInstance.findFirst({
      where: { id: componentInstanceId, projectId },
      select: {
        id: true,
        instanceNo: true,
        state: true,
        projectId: true,
      },
    });
  }

  updateProjectComponentReturned(
    componentId: string,
    db: DbClient = this.prisma,
  ) {
    return db.component.update({
      where: { id: componentId },
      data: {
        projectId: null,
        status: ComponentStatus.READY,
        installedDate: null,
        installZone: null,
        installAxis: null,
        installLevel: null,
        installPosition: null,
      },
    });
  }

  createComponentTimeline(
    data: Prisma.ComponentTimelineUncheckedCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.componentTimeline.create({ data });
  }

  tableExists(tableName: string) {
    return this.prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = ${tableName}
      ) AS "exists"
    `;
  }

  async findRuntimeSources() {
    return Promise.all([
      this.prisma.project.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.component.findMany({
        include: {
          project: true,
        },
      }),
      this.prisma.inventoryTransaction.findMany({
        include: {
          items: {
            include: {
              inventoryItem: true,
              unit: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'desc',
        },
        take: 500,
      }),
      this.prisma.productionOrder.findMany({
        include: {
          stages: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.task.findMany({
        where: {
          component: {
            is: {
              projectId: {
                not: null,
              },
            },
          },
        },
        include: {
          component: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.projectTask.findMany({
        include: projectTaskRepositoryInclude,
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.findProjectReturnRequests(),
      this.findProjectDocuments(),
      this.findProjectActivityLogs(),
    ] as const);
  }

  async findProjectDetailSources(projectId: string, tab: string) {
    const needsComponents = [
      'overview',
      'components',
      'costs',
      'command',
    ].includes(tab);
    const needsMaterials = [
      'overview',
      'materials',
      'costs',
      'command',
    ].includes(tab);
    const needsWbs = [
      'overview',
      'progress',
      'command',
      'site',
      'costs',
      'logs',
    ].includes(tab);
    const needsReturns = ['overview', 'materials', 'command', 'logs'].includes(
      tab,
    );
    const needsDocuments = [
      'overview',
      'documents',
      'command',
      'site',
    ].includes(tab);
    const needsLogs = ['overview', 'logs', 'command', 'site'].includes(tab);
    const needsProduction = ['overview', 'command'].includes(tab);
    const needsComponentTasks = ['overview', 'progress', 'command'].includes(
      tab,
    );

    const [
      project,
      components,
      inventoryTransactions,
      productionOrders,
      componentTasks,
      projectTasks,
      returnRequests,
      documents,
      activityLogs,
    ] = await Promise.all([
      this.findOne(projectId),
      needsComponents
        ? this.prisma.component.findMany({
            where: { projectId },
            include: { project: true },
          })
        : Promise.resolve([]),
      needsMaterials
        ? this.prisma.inventoryTransaction.findMany({
            where: { projectId },
            include: {
              items: {
                include: {
                  inventoryItem: true,
                  unit: true,
                },
              },
            },
            orderBy: { transactionDate: 'desc' },
            take: 500,
          })
        : Promise.resolve([]),
      needsProduction
        ? this.prisma.productionOrder.findMany({
            where: { projectId },
            include: { stages: true },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      needsComponentTasks
        ? this.prisma.task.findMany({
            where: {
              component: {
                is: { projectId },
              },
            },
            include: { component: true },
            orderBy: { createdAt: 'asc' },
          })
        : Promise.resolve([]),
      needsWbs
        ? this.prisma.projectTask.findMany({
            where: { projectId },
            include: projectTaskRepositoryInclude,
            orderBy: { createdAt: 'asc' },
          })
        : Promise.resolve([]),
      needsReturns
        ? this.findProjectReturnRequests(projectId)
        : Promise.resolve([]),
      needsDocuments
        ? this.findProjectDocuments(projectId)
        : Promise.resolve([]),
      needsLogs ? this.findProjectActivityLogs(projectId) : Promise.resolve([]),
    ]);

    return {
      project,
      components,
      inventoryTransactions,
      productionOrders,
      componentTasks,
      projectTasks,
      returnRequests,
      documents,
      activityLogs,
    };
  }

  findProjectExecutionSources(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        componentRequirements: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            requirementNo: true,
            status: true,
            requiredQuantity: true,
            producedQuantity: true,
            acceptedQuantity: true,
            installedQuantity: true,
            requiredBy: true,
            component: {
              select: {
                id: true,
                code: true,
                name: true,
                componentType: true,
                profile: true,
              },
            },
            productionOrders: {
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                orderNo: true,
                status: true,
                quantity: true,
              },
            },
            componentInstances: {
              orderBy: [{ serialSequence: 'asc' }, { createdAt: 'asc' }],
              select: {
                id: true,
                instanceNo: true,
                state: true,
                productionOrderId: true,
                producedAt: true,
                qcPassedAt: true,
                yardPlacements: {
                  where: { removedAt: null },
                  select: {
                    id: true,
                    slotId: true,
                    placedAt: true,
                    removedAt: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  private findProjectReturnRequests(projectId?: string) {
    return this.prisma.returnRequest.findMany({
      where: {
        projectId: projectId ?? {
          not: null,
        },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 300,
    });
  }

  private findProjectDocuments(projectId?: string) {
    return this.prisma.attachment.findMany({
      where: {
        deletedAt: null,
        OR: projectId
          ? [
              {
                entityType: { in: ['project', 'Project'] },
                entityId: projectId,
              },
              {
                links: {
                  some: {
                    module: { in: ['projects', 'project'] },
                    entityId: projectId,
                  },
                },
              },
            ]
          : [
              { module: { in: ['projects', 'project'] } },
              { entityType: { in: ['project', 'Project'] } },
            ],
      },
      include: {
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
        links: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 300,
    });
  }

  private findProjectActivityLogs(projectId?: string) {
    return this.prisma.activityLog.findMany({
      where: projectId
        ? {
            OR: [
              { entity: 'Project', entityId: projectId },
              { metadata: { path: ['projectId'], equals: projectId } },
            ],
          }
        : {
            OR: [
              { module: { in: ['projects', 'project'] } },
              { entity: { in: ['Project', 'ProjectTask', 'ReturnRequest'] } },
            ],
          },
      orderBy: {
        createdAt: 'desc',
      },
      take: 300,
    });
  }

  private buildWhere(params: {
    search?: string;
    status?: ProjectStatus;
  }): Prisma.ProjectWhereInput {
    const value = params.search?.trim();

    return {
      status: params.status,
      OR: value
        ? [
            {
              code: {
                contains: value,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: value,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: value,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }
}
