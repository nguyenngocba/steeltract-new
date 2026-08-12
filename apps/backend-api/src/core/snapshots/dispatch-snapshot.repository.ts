import { Inject, Injectable } from '@nestjs/common';

import { DispatchOrderStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface DispatchSnapshotPayload {
  dispatchOrderId: string;
  projectId?: string | null;
  loadingCount: number;
  inTransitCount: number;
  arrivedCount: number;
  completedCount: number;
  delayCount: number;
}

@Injectable()
export class DispatchSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findLatest(dispatchOrderId: string) {
    return this.prisma.dispatchDashboardSnapshot.findUnique({
      where: {
        dispatchOrderId,
      },
    });
  }

  findManyLatest() {
    return this.prisma.dispatchDashboardSnapshot.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async calculate(
    dispatchOrderId?: string,
  ): Promise<DispatchSnapshotPayload[]> {
    const orders = await this.prisma.dispatchOrder.findMany({
      where: {
        id: dispatchOrderId,
      },
      select: {
        id: true,
        projectId: true,
        status: true,
        plannedAt: true,
      },
    });
    const now = new Date();

    return orders.map((order) => ({
      dispatchOrderId: order.id,
      projectId: order.projectId,
      loadingCount: order.status === DispatchOrderStatus.LOADING ? 1 : 0,
      inTransitCount: order.status === DispatchOrderStatus.IN_TRANSIT ? 1 : 0,
      arrivedCount: (
        [
          DispatchOrderStatus.ARRIVED,
          DispatchOrderStatus.RECEIVED,
        ] as DispatchOrderStatus[]
      ).includes(order.status)
        ? 1
        : 0,
      completedCount: order.status === DispatchOrderStatus.COMPLETED ? 1 : 0,
      delayCount:
        order.plannedAt &&
        order.plannedAt < now &&
        !(
          [
            DispatchOrderStatus.COMPLETED,
            DispatchOrderStatus.CANCELLED,
          ] as DispatchOrderStatus[]
        ).includes(order.status)
          ? 1
          : 0,
    }));
  }

  upsert(payload: DispatchSnapshotPayload, tx: Prisma.TransactionClient) {
    return tx.dispatchDashboardSnapshot.upsert({
      where: {
        dispatchOrderId: payload.dispatchOrderId,
      },
      create: payload,
      update: {
        projectId: payload.projectId,
        loadingCount: payload.loadingCount,
        inTransitCount: payload.inTransitCount,
        arrivedCount: payload.arrivedCount,
        completedCount: payload.completedCount,
        delayCount: payload.delayCount,
      },
    });
  }
}
