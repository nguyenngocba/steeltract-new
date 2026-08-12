import { Inject, Injectable } from '@nestjs/common';

import { Prisma, QcInspectionStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface QcDashboardSnapshotPayload {
  scopeKey: string;
  snapshotDate: Date;
  totalInspections: number;
  pendingCount: number;
  inProgressCount: number;
  passedCount: number;
  failedCount: number;
  reworkCount: number;
  openIssueCount: number;
  openNcrCount: number;
  waitingProductionCount: number;
  passRate: number;
  payload?: Prisma.InputJsonValue;
}

export interface QcInspectionSnapshotPayload {
  inspectionId: string;
  inspectionNo: string;
  status: string;
  checklistId?: string | null;
  productionOrderId?: string | null;
  componentInstanceId?: string | null;
  componentId?: string | null;
  projectId?: string | null;
  resultCount: number;
  issueCount: number;
  ncrCount: number;
  passRate: number;
  payload?: Prisma.InputJsonValue;
}

@Injectable()
export class QcSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findDashboardSnapshot(snapshotDate: Date, scopeKey = 'ALL') {
    return this.prisma.qcDashboardSnapshot.findUnique({
      where: { scopeKey_snapshotDate: { scopeKey, snapshotDate } },
    });
  }

  findDashboardHistory(take = 12, scopeKey = 'ALL') {
    return this.prisma.qcDashboardSnapshot.findMany({
      where: { scopeKey },
      orderBy: { snapshotDate: 'desc' },
      take,
    });
  }

  findInspectionSnapshot(inspectionId: string) {
    return this.prisma.qcInspectionSnapshot.findUnique({
      where: { inspectionId },
    });
  }

  findInspectionSnapshots(inspectionId?: string) {
    return this.prisma.qcInspectionSnapshot.findMany({
      where: { inspectionId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async calculateDashboard(
    snapshotDate = new Date(),
  ): Promise<QcDashboardSnapshotPayload[]> {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);
    const [
      statusGroups,
      openIssueCount,
      openNcrCount,
      defects,
      completedOrders,
      trend,
    ] = await Promise.all([
      this.prisma.qcInspection.groupBy({ by: ['status'], _count: true }),
      this.prisma.qcIssue.count({ where: { status: { not: 'CLOSED' } } }),
      this.prisma.nonConformanceReport.count({
        where: { status: { not: 'CLOSED' } },
      }),
      this.prisma.qcIssue.groupBy({
        by: ['severity', 'status'],
        _count: true,
      }),
      this.prisma.productionOrder.findMany({
        where: { status: 'COMPLETED' },
        select: { id: true, componentId: true },
      }),
      this.prisma.$queryRaw<
        Array<{
          date: string;
          total: number;
          passed: number;
          failed: number;
        }>
      >`
        SELECT
          TO_CHAR(DATE(COALESCE("completedAt", "createdAt")), 'YYYY-MM-DD') AS "date",
          COUNT(*)::int AS "total",
          COUNT(*) FILTER (
            WHERE "status"::text IN ('PASSED', 'APPROVED')
          )::int AS "passed",
          COUNT(*) FILTER (
            WHERE "status"::text IN ('FAILED', 'REWORK_REQUIRED', 'REJECTED')
          )::int AS "failed"
        FROM "qc_inspections"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE(COALESCE("completedAt", "createdAt"))
        ORDER BY DATE(COALESCE("completedAt", "createdAt")) ASC
      `,
    ]);
    const orderIds = completedOrders.map((row) => row.id);
    const componentIds = completedOrders.flatMap((row) =>
      row.componentId ? [row.componentId] : [],
    );
    const releaseInspections = await this.prisma.qcInspection.findMany({
      where: {
        OR: [
          { productionOrderId: { in: orderIds } },
          { componentId: { in: componentIds } },
        ],
      },
      select: {
        productionOrderId: true,
        componentInstanceId: true,
        componentId: true,
        status: true,
      },
    });
    const count = (statuses: QcInspectionStatus[]) =>
      statusGroups
        .filter((row) => statuses.includes(row.status))
        .reduce((sum, row) => sum + row._count, 0);
    const totalInspections = statusGroups.reduce(
      (sum, row) => sum + row._count,
      0,
    );
    const passedCount = count([
      QcInspectionStatus.PASSED,
      QcInspectionStatus.APPROVED,
    ]);
    const waitingProductionCount = completedOrders.filter(
      (order) =>
        !releaseInspections.some(
          (inspection) =>
            (inspection.productionOrderId === order.id ||
              Boolean(
                order.componentId &&
                inspection.componentId === order.componentId,
              )) &&
            (
              [
                QcInspectionStatus.PASSED,
                QcInspectionStatus.APPROVED,
              ] as QcInspectionStatus[]
            ).includes(inspection.status),
        ),
    ).length;

    return [
      {
        scopeKey: 'ALL',
        snapshotDate: this.startOfDay(snapshotDate),
        totalInspections,
        pendingCount: count([
          QcInspectionStatus.DRAFT,
          QcInspectionStatus.READY,
        ]),
        inProgressCount: count([QcInspectionStatus.IN_PROGRESS]),
        passedCount,
        failedCount: count([QcInspectionStatus.FAILED]),
        reworkCount: count([QcInspectionStatus.REWORK_REQUIRED]),
        openIssueCount,
        openNcrCount,
        waitingProductionCount,
        passRate: totalInspections
          ? Math.round((passedCount / totalInspections) * 100)
          : 0,
        payload: this.toJson({
          defects,
          trend: trend.map((row) => ({
            date: row.date,
            total: Number(row.total),
            passed: Number(row.passed),
            failed: Number(row.failed),
          })),
        }),
      },
    ];
  }

  async calculateInspectionSnapshots(
    inspectionId?: string,
  ): Promise<QcInspectionSnapshotPayload[]> {
    const rows = await this.prisma.qcInspection.findMany({
      where: { id: inspectionId },
      select: {
        id: true,
        inspectionNo: true,
        status: true,
        checklistId: true,
        productionOrderId: true,
        componentInstanceId: true,
        componentId: true,
        projectId: true,
        inspectorId: true,
        startedAt: true,
        completedAt: true,
        approvedAt: true,
        rejectedAt: true,
        results: { select: { status: true } },
        _count: { select: { issues: true, ncrs: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => {
      const passed = row.results.filter(
        (result) => result.status === 'PASS',
      ).length;
      return {
        inspectionId: row.id,
        inspectionNo: row.inspectionNo,
        status: row.status,
        checklistId: row.checklistId,
        productionOrderId: row.productionOrderId,
        componentInstanceId: row.componentInstanceId,
        componentId: row.componentId,
        projectId: row.projectId,
        resultCount: row.results.length,
        issueCount: row._count.issues,
        ncrCount: row._count.ncrs,
        passRate: row.results.length
          ? Math.round((passed / row.results.length) * 100)
          : 0,
        payload: this.toJson({
          inspectorId: row.inspectorId,
          startedAt: row.startedAt,
          completedAt: row.completedAt,
          approvedAt: row.approvedAt,
          rejectedAt: row.rejectedAt,
        }),
      };
    });
  }

  upsertDashboard(
    payload: QcDashboardSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.qcDashboardSnapshot.upsert({
      where: {
        scopeKey_snapshotDate: {
          scopeKey: payload.scopeKey,
          snapshotDate: payload.snapshotDate,
        },
      },
      create: payload,
      update: {
        totalInspections: payload.totalInspections,
        pendingCount: payload.pendingCount,
        inProgressCount: payload.inProgressCount,
        passedCount: payload.passedCount,
        failedCount: payload.failedCount,
        reworkCount: payload.reworkCount,
        openIssueCount: payload.openIssueCount,
        openNcrCount: payload.openNcrCount,
        waitingProductionCount: payload.waitingProductionCount,
        passRate: payload.passRate,
        payload: payload.payload,
      },
    });
  }

  upsertInspection(
    payload: QcInspectionSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.qcInspectionSnapshot.upsert({
      where: { inspectionId: payload.inspectionId },
      create: payload,
      update: {
        inspectionNo: payload.inspectionNo,
        status: payload.status,
        checklistId: payload.checklistId,
        productionOrderId: payload.productionOrderId,
        componentInstanceId: payload.componentInstanceId,
        componentId: payload.componentId,
        projectId: payload.projectId,
        resultCount: payload.resultCount,
        issueCount: payload.issueCount,
        ncrCount: payload.ncrCount,
        passRate: payload.passRate,
        payload: payload.payload,
      },
    });
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toJson(value: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
