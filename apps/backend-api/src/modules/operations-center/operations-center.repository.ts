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

  async countBackgroundJobsByStatus() {
    const rows = await this.prisma.backgroundJob.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = new Map(
      rows.map((row) => [row.status, row._count._all]),
    );
    return Object.values(BackgroundJobStatus).map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }

  recentBackgroundJobs() {
    return this.prisma.backgroundJob.findMany({
      take: 10,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
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

  async countOutboxEventsByStatus() {
    const rows = await this.prisma.outboxEvent.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = new Map(
      rows.map((row) => [row.status, row._count._all]),
    );
    return Object.values(OutboxEventStatus).map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }

  recentOutboxEvents() {
    return this.prisma.outboxEvent.findMany({
      take: 10,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
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
      this.prisma.componentDashboardSnapshot.count(),
      this.prisma.componentDashboardSnapshot.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      }),
      this.prisma.componentSummarySnapshot.count(),
      this.prisma.componentSummarySnapshot.findFirst({
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      }),
      this.prisma.qcDashboardSnapshot.count(),
      this.prisma.qcDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.qcInspectionSnapshot.count(),
      this.prisma.qcInspectionSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.yardDashboardSnapshot.count(),
      this.prisma.yardDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.yardWorkspaceSnapshot.count(),
      this.prisma.yardWorkspaceSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);
  }

  async databaseTableCounts() {
    const tableNames = [
      'inventory_transactions',
      'inventory_transaction_items',
      'inventory_location_stocks',
      'projects',
      'project_tasks',
      'dispatch_orders',
      'production_orders',
      'work_centers',
      'production_stages',
      'background_jobs',
      'outbox_events',
      'attachments',
    ];
    const rows = await this.prisma.$queryRaw<
      Array<{ tableName: string; estimatedRows: bigint }>
    >`
      SELECT relname AS "tableName",
             GREATEST(n_live_tup, 0)::bigint AS "estimatedRows"
      FROM pg_stat_user_tables
      WHERE schemaname = current_schema()
        AND relname IN (
          'inventory_transactions',
          'inventory_transaction_items',
          'inventory_location_stocks',
          'projects',
          'project_tasks',
          'dispatch_orders',
          'production_orders',
          'work_centers',
          'production_stages',
          'background_jobs',
          'outbox_events',
          'attachments'
        )
    `;
    const estimates = new Map(
      rows.map((row) => [row.tableName, Number(row.estimatedRows)]),
    );
    return tableNames.map((tableName) => estimates.get(tableName) ?? 0);
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

  async componentsPlatformHealth() {
    const [
      componentCount,
      timelineCount,
      dashboardSnapshotCount,
      latestDashboardSnapshot,
      summarySnapshotCount,
      latestSummarySnapshot,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    ] = await Promise.all([
      this.prisma.component.count(),
      this.prisma.componentTimeline.count(),
      this.prisma.componentDashboardSnapshot.count(),
      this.prisma.componentDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.componentSummarySnapshot.count(),
      this.prisma.componentSummarySnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'component.' },
          status: { in: ['PENDING', 'DISPATCHING'] },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'component.' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.components' },
          status: { in: ['QUEUED', 'RUNNING', 'RETRYING'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.components' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
    ]);

    return {
      componentCount,
      timelineCount,
      dashboardSnapshotCount,
      latestDashboardSnapshotAt: latestDashboardSnapshot?.updatedAt ?? null,
      summarySnapshotCount,
      latestSummarySnapshotAt: latestSummarySnapshot?.updatedAt ?? null,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    };
  }

  async qcPlatformHealth() {
    const [
      inspectionCount,
      resultCount,
      issueCount,
      ncrCount,
      dashboardSnapshotCount,
      latestDashboardSnapshot,
      inspectionSnapshotCount,
      latestInspectionSnapshot,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    ] = await Promise.all([
      this.prisma.qcInspection.count(),
      this.prisma.qcResult.count(),
      this.prisma.qcIssue.count(),
      this.prisma.nonConformanceReport.count(),
      this.prisma.qcDashboardSnapshot.count(),
      this.prisma.qcDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.qcInspectionSnapshot.count(),
      this.prisma.qcInspectionSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'qc.' },
          status: { in: ['PENDING', 'DISPATCHING'] },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'qc.' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.qc' },
          status: { in: ['QUEUED', 'RUNNING', 'RETRYING'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.qc' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
    ]);

    return {
      inspectionCount,
      resultCount,
      issueCount,
      ncrCount,
      dashboardSnapshotCount,
      latestDashboardSnapshotAt: latestDashboardSnapshot?.updatedAt ?? null,
      inspectionSnapshotCount,
      latestInspectionSnapshotAt: latestInspectionSnapshot?.updatedAt ?? null,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    };
  }

  async yardPlatformHealth() {
    const [
      zoneCount,
      slotCount,
      activePlacementCount,
      movementCount,
      dashboardSnapshotCount,
      latestDashboardSnapshot,
      workspaceSnapshotCount,
      latestWorkspaceSnapshot,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    ] = await Promise.all([
      this.prisma.yardZone.count(),
      this.prisma.yardSlot.count(),
      this.prisma.yardItemPlacement.count({ where: { removedAt: null } }),
      this.prisma.yardMovement.count(),
      this.prisma.yardDashboardSnapshot.count(),
      this.prisma.yardDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.yardWorkspaceSnapshot.count(),
      this.prisma.yardWorkspaceSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'yard.' },
          status: { in: ['PENDING', 'DISPATCHING'] },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'yard.' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.yard' },
          status: { in: ['QUEUED', 'RUNNING', 'RETRYING'] },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          name: { startsWith: 'snapshot.yard' },
          status: { in: ['FAILED', 'DEAD_LETTER'] },
        },
      }),
    ]);

    return {
      zoneCount,
      slotCount,
      activePlacementCount,
      movementCount,
      dashboardSnapshotCount,
      latestDashboardSnapshotAt: latestDashboardSnapshot?.updatedAt ?? null,
      workspaceSnapshotCount,
      latestWorkspaceSnapshotAt: latestWorkspaceSnapshot?.updatedAt ?? null,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    };
  }
}
