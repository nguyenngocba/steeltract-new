import { Inject, Injectable } from '@nestjs/common';
import {
  ComponentInstanceState,
  DispatchOrderStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';
import { nextOperationalCode } from '../../common/utils/code-generator';

export const dispatchInclude = {
  project: true,
  projectTask: true,
  items: {
    include: {
      inventoryItem: true,
      component: true,
      componentInstance: {
        include: {
          component: true,
          requirement: true,
          productionOrder: true,
          project: true,
          projectTask: true,
          yardPlacements: {
            where: { removedAt: null },
            include: {
              slot: {
                include: {
                  zone: true,
                  row: true,
                },
              },
            },
            orderBy: { placedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  },
  events: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.DispatchOrderInclude;

type DbClient = PrismaService | Prisma.TransactionClient;
export type LogisticsTx = Prisma.TransactionClient;

@Injectable()
export class LogisticsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  transaction<T>(fn: (tx: LogisticsTx) => Promise<T>) {
    return this.prisma.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  nextShipmentCode(tx: LogisticsTx) {
    return nextOperationalCode(tx, 'dispatchOrder', 'code', 'DX');
  }

  findDispatchOrders() {
    return this.prisma.dispatchOrder.findMany({
      include: dispatchInclude,
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });
  }

  findDispatchOrder(id: string, db: DbClient = this.prisma) {
    return db.dispatchOrder.findUnique({
      where: { id },
      include: dispatchInclude,
    });
  }

  createDispatchOrder(
    data: Prisma.DispatchOrderCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.dispatchOrder.create({
      data,
      include: dispatchInclude,
    });
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
    });
  }

  async updateDispatchOrderVersioned(
    id: string,
    expectedUpdatedAt: Date,
    data: Prisma.DispatchOrderUpdateManyMutationInput,
    tx: LogisticsTx,
  ) {
    const result = await tx.dispatchOrder.updateMany({
      where: { id, updatedAt: expectedUpdatedAt },
      data,
    });
    return result.count === 1 ? this.findDispatchOrder(id, tx) : null;
  }

  createDispatchEvent(data: Prisma.DispatchEventCreateInput, tx: LogisticsTx) {
    return tx.dispatchEvent.create({ data });
  }

  findDispatchOrderStatus(id: string) {
    return this.prisma.dispatchOrder.findUnique({
      where: { id },
      select: { status: true },
    });
  }

  findYardStagedComponentInstances(params: {
    projectId: string;
    projectTaskId?: string;
    activeStatuses: DispatchOrderStatus[];
  }) {
    return this.prisma.componentInstance.findMany({
      where: {
        projectId: params.projectId,
        ...(params.projectTaskId && { projectTaskId: params.projectTaskId }),
        state: ComponentInstanceState.IN_YARD,
        yardPlacements: {
          some: { removedAt: null },
        },
        dispatchItems: {
          none: {
            dispatchOrder: {
              status: { in: params.activeStatuses },
            },
          },
        },
      },
      include: {
        component: true,
        requirement: true,
        productionOrder: true,
        project: true,
        projectTask: true,
        yardPlacements: {
          where: { removedAt: null },
          include: {
            slot: {
              include: {
                zone: true,
                row: true,
              },
            },
          },
          orderBy: { placedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { instanceNo: 'asc' }],
      take: 200,
    });
  }

  findComponentInstancesForDispatch(componentInstanceIds: string[]) {
    return this.prisma.componentInstance.findMany({
      where: {
        id: { in: componentInstanceIds },
      },
      include: {
        component: true,
        project: true,
        projectTask: true,
        yardPlacements: {
          where: { removedAt: null },
          include: {
            slot: {
              include: {
                zone: true,
                row: true,
              },
            },
          },
          orderBy: { placedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  findActiveComponentInstanceDispatch(
    componentInstanceIds: string[],
    activeStatuses: DispatchOrderStatus[],
  ) {
    return this.prisma.dispatchItem.findFirst({
      where: {
        componentInstanceId: { in: componentInstanceIds },
        dispatchOrder: {
          status: { in: activeStatuses },
        },
      },
      include: {
        dispatchOrder: true,
        componentInstance: {
          include: {
            component: true,
          },
        },
      },
    });
  }

  updateComponentInstances(
    ids: string[],
    data: Prisma.ComponentInstanceUpdateManyMutationInput,
  ) {
    if (!ids.length) {
      return Promise.resolve({ count: 0 });
    }
    return this.prisma.componentInstance.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  findProjectTaskMaterialAllocation(
    projectTaskId: string,
    inventoryItemId: string,
  ) {
    return this.prisma.projectTaskMaterialAllocation.findFirst({
      where: {
        projectTaskId,
        inventoryItemId,
      },
    });
  }

  updateProjectTaskMaterialAllocation(
    id: string,
    data: Prisma.ProjectTaskMaterialAllocationUpdateInput,
  ) {
    return this.prisma.projectTaskMaterialAllocation.update({
      where: { id },
      data,
    });
  }

  createProjectTaskMaterialAllocation(
    data: Prisma.ProjectTaskMaterialAllocationCreateInput,
  ) {
    return this.prisma.projectTaskMaterialAllocation.create({ data });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({ data });
  }

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
    },
    tx: LogisticsTx,
  ) {
    return tx.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: data,
      update: {},
    });
  }

  findOutboxEvent(idempotencyKey: string, tx: LogisticsTx) {
    return tx.outboxEvent.findUnique({ where: { idempotencyKey } });
  }
}
