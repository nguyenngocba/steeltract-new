import {
  Inject,
  Injectable,
} from '@nestjs/common'
import {
  DispatchOrderStatus,
  Prisma,
} from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'

export const dispatchInclude = {
  project: true,
  projectTask: true,
  items: {
    include: {
      inventoryItem: true,
      component: true,
    },
  },
  events: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.DispatchOrderInclude

type DbClient = PrismaService | Prisma.TransactionClient

@Injectable()
export class LogisticsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findDispatchOrders() {
    return this.prisma.dispatchOrder.findMany({
      include: dispatchInclude,
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    })
  }

  findDispatchOrder(id: string) {
    return this.prisma.dispatchOrder.findUnique({
      where: { id },
      include: dispatchInclude,
    })
  }

  createDispatchOrder(
    data: Prisma.DispatchOrderCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.dispatchOrder.create({
      data,
      include: dispatchInclude,
    })
  }

  updateDispatchOrder(
    id: string,
    data: Prisma.DispatchOrderUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.dispatchOrder.update({
      where: { id },
      data,
      include: dispatchInclude,
    })
  }

  findDispatchOrderStatus(id: string) {
    return this.prisma.dispatchOrder.findUnique({
      where: { id },
      select: { status: true },
    })
  }

  findProjectTasksForDispatchSuggestion(params: {
    projectId: string
    projectTaskId?: string
  }) {
    const where: Prisma.ProjectTaskWhereInput = {
      projectId: params.projectId,
      progress: {
        lt: 100,
      },
    }

    if (params.projectTaskId) {
      where.id = params.projectTaskId
    }

    return this.prisma.projectTask.findMany({
      where,
      include: {
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
      },
      orderBy: [
        { scheduledStartAt: 'asc' },
        { plannedStartAt: 'asc' },
        { sortOrder: 'asc' },
      ],
      take: params.projectTaskId ? 1 : 5,
    })
  }

  findActiveComponentDispatch(
    componentIds: string[],
    activeStatuses: DispatchOrderStatus[],
  ) {
    return this.prisma.dispatchItem.findFirst({
      where: {
        componentId: { in: componentIds },
        dispatchOrder: {
          status: { in: activeStatuses },
        },
      },
      include: {
        dispatchOrder: true,
        component: true,
      },
    })
  }

  findProjectTaskMaterialAllocation(projectTaskId: string, inventoryItemId: string) {
    return this.prisma.projectTaskMaterialAllocation.findFirst({
      where: {
        projectTaskId,
        inventoryItemId,
      },
    })
  }

  updateProjectTaskMaterialAllocation(
    id: string,
    data: Prisma.ProjectTaskMaterialAllocationUpdateInput,
  ) {
    return this.prisma.projectTaskMaterialAllocation.update({
      where: { id },
      data,
    })
  }

  createProjectTaskMaterialAllocation(data: Prisma.ProjectTaskMaterialAllocationCreateInput) {
    return this.prisma.projectTaskMaterialAllocation.create({ data })
  }

  findProjectTaskComponentAllocation(projectTaskId: string, componentId: string) {
    return this.prisma.projectTaskComponentAllocation.findFirst({
      where: {
        projectTaskId,
        componentId,
      },
    })
  }

  updateProjectTaskComponentAllocation(
    id: string,
    data: Prisma.ProjectTaskComponentAllocationUpdateInput,
  ) {
    return this.prisma.projectTaskComponentAllocation.update({
      where: { id },
      data,
    })
  }

  createProjectTaskComponentAllocation(data: Prisma.ProjectTaskComponentAllocationCreateInput) {
    return this.prisma.projectTaskComponentAllocation.create({ data })
  }

  updateComponent(id: string, data: Prisma.ComponentUpdateInput) {
    return this.prisma.component.update({
      where: { id },
      data,
    })
  }

  createActivityLog(data: Prisma.ActivityLogCreateInput) {
    return this.prisma.activityLog.create({ data })
  }
}
