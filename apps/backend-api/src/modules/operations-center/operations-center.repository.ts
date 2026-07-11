import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  BackgroundJobStatus,
  OutboxEventStatus,
} from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class OperationsCenterRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  countBackgroundJobsByStatus() {
    return Promise.all(
      Object.values(BackgroundJobStatus).map(async (status) => ({
        status,
        count: await this.prisma.backgroundJob.count({
          where: {
            status,
          },
        }),
      })),
    );
  }

  recentBackgroundJobs() {
    return this.prisma.backgroundJob.findMany({
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        queue: true,
        status: true,
        retryCount: true,
        maxRetries: true,
        runAt: true,
        updatedAt: true,
        lastError: true,
      },
    });
  }

  countOutboxEventsByStatus() {
    return Promise.all(
      Object.values(OutboxEventStatus).map(async (status) => ({
        status,
        count: await this.prisma.outboxEvent.count({
          where: {
            status,
          },
        }),
      })),
    );
  }

  recentOutboxEvents() {
    return this.prisma.outboxEvent.findMany({
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        eventName: true,
        status: true,
        retryCount: true,
        maxRetries: true,
        nextAttemptAt: true,
        updatedAt: true,
        lastError: true,
      },
    });
  }

  snapshotStats() {
    return Promise.all([
      this.prisma.inventoryDashboardSnapshot.count(),
      this.prisma.inventoryDashboardSnapshot.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      }),
      this.prisma.projectDashboardSnapshot.count(),
      this.prisma.projectDashboardSnapshot.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      }),
      this.prisma.dispatchDashboardSnapshot.count(),
      this.prisma.dispatchDashboardSnapshot.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      }),
      this.prisma.productionDashboardSnapshot.count(),
      this.prisma.productionDashboardSnapshot.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      }),
      this.prisma.productionOrderSnapshot.count(),
      this.prisma.productionOrderSnapshot.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      }),
      this.prisma.workCenterSnapshot.count(),
      this.prisma.workCenterSnapshot.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      }),
    ]);
  }

  databaseTableCounts() {
    return Promise.all([
      this.prisma.inventoryTransaction.count(),
      this.prisma.inventoryTransactionItem.count(),
      this.prisma.inventoryLocationStock.count(),
      this.prisma.project.count(),
      this.prisma.projectTask.count(),
      this.prisma.dispatchOrder.count(),
      this.prisma.productionOrder.count(),
      this.prisma.workCenter.count(),
      this.prisma.productionStage.count(),
      this.prisma.backgroundJob.count(),
      this.prisma.outboxEvent.count(),
      this.prisma.attachment.count(),
    ]);
  }

  databaseSize() {
    return this.prisma.$queryRaw<Array<{ sizeBytes: bigint }>>`
      SELECT pg_database_size(current_database())::bigint AS "sizeBytes"
    `;
  }

  async projectPlatformHealth() {
    const [
      projectCount,
      taskCount,
      templateCount,
      snapshotCount,
      latestSnapshot,
      detailSnapshotCount,
      latestDetailSnapshot,
      staleDetailSnapshots,
      detailSnapshotWarnings,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.projectTask.count(),
      this.prisma.projectTemplate.count(),
      this.prisma.projectDashboardSnapshot.count(),
      this.prisma.projectDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.projectDetailSnapshot.count(),
      this.prisma.projectDetailSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.projectDetailSnapshot.count({
        where: {
          stale: true,
        },
      }),
      this.prisma.projectDetailSnapshot.aggregate({
        _sum: {
          warningCount: true,
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'project.' },
          status: { in: ['PENDING', 'DISPATCHING'] },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'project.' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.projects' },
          status: { in: ['QUEUED', 'RUNNING', 'RETRYING'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.projects' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
    ]);

    return {
      projectCount,
      taskCount,
      templateCount,
      snapshotCount,
      latestSnapshotAt: latestSnapshot?.updatedAt ?? null,
      detailSnapshotCount,
      latestDetailSnapshotAt: latestDetailSnapshot?.updatedAt ?? null,
      staleDetailSnapshots,
      detailSnapshotWarnings:
        Number(detailSnapshotWarnings._sum.warningCount ?? 0),
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    };
  }

  async productionPlatformHealth() {
    const [
      productionOrderCount,
      workCenterCount,
      stageCount,
      taskCount,
      dashboardSnapshotCount,
      latestDashboardSnapshot,
      orderSnapshotCount,
      latestOrderSnapshot,
      workCenterSnapshotCount,
      latestWorkCenterSnapshot,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    ] = await Promise.all([
      this.prisma.productionOrder.count(),
      this.prisma.workCenter.count(),
      this.prisma.productionStage.count(),
      this.prisma.productionTask.count(),
      this.prisma.productionDashboardSnapshot.count(),
      this.prisma.productionDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.productionOrderSnapshot.count(),
      this.prisma.productionOrderSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.workCenterSnapshot.count(),
      this.prisma.workCenterSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'production.' },
          status: { in: ['PENDING', 'DISPATCHING'] },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'production.' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.production' },
          status: { in: ['QUEUED', 'RUNNING', 'RETRYING'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.production' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
    ]);

    return {
      productionOrderCount,
      workCenterCount,
      stageCount,
      taskCount,
      dashboardSnapshotCount,
      latestDashboardSnapshotAt: latestDashboardSnapshot?.updatedAt ?? null,
      orderSnapshotCount,
      latestOrderSnapshotAt: latestOrderSnapshot?.updatedAt ?? null,
      workCenterSnapshotCount,
      latestWorkCenterSnapshotAt: latestWorkCenterSnapshot?.updatedAt ?? null,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    };
  }
}
