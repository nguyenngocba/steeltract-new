import { Injectable } from '@nestjs/common';

import { Prisma, QcInspectionStatus } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import type {
  QcInspectionHistoryDto,
  QcWorkspaceReadDto,
} from '../dto/qc.dto';

@Injectable()
export class QcReadModelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async workspace(query: QcWorkspaceReadDto) {
    const skip = (query.page - 1) * query.limit;
    const searchPage = query.search
      ? await this.searchInspectionPage(query)
      : null;
    const where: Prisma.QcInspectionWhereInput = searchPage
      ? { id: { in: searchPage.ids } }
      : { status: query.status };
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const [
      inspections,
      total,
      statusGroups,
      openIssues,
      overdueIssues,
      openNcrs,
      defects,
      checklists,
      ncrs,
      completedOrders,
      trendRows,
    ] = await Promise.all([
      this.prisma.qcInspection.findMany({
        where,
        select: this.inspectionListSelect(),
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: searchPage ? undefined : skip,
        take: query.limit,
      }),
      searchPage
        ? Promise.resolve(searchPage.total)
        : this.prisma.qcInspection.count({ where }),
      this.prisma.qcInspection.groupBy({ by: ['status'], _count: true }),
      this.prisma.qcIssue.count({ where: { status: { not: 'CLOSED' } } }),
      this.prisma.qcIssue.count({
        where: {
          status: { not: 'CLOSED' },
          dueAt: { lt: new Date() },
        },
      }),
      this.prisma.nonConformanceReport.count({
        where: { status: { not: 'CLOSED' } },
      }),
      this.prisma.qcIssue.groupBy({
        by: ['severity', 'status'],
        _count: true,
      }),
      this.prisma.qcChecklist.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: { items: { orderBy: { sequence: 'asc' } } },
      }),
      this.prisma.nonConformanceReport.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      this.prisma.productionOrder.findMany({
        where: { status: 'COMPLETED' },
        select: {
          id: true,
          orderNo: true,
          title: true,
          componentId: true,
          projectId: true,
          status: true,
          completedAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 200,
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

    const inspectionOrderIds = inspections.flatMap((row) =>
      row.productionOrderId ? [row.productionOrderId] : [],
    );
    const inspectionComponentIds = inspections.flatMap((row) =>
      row.componentId ? [row.componentId] : [],
    );
    const componentIds = Array.from(
      new Set([
        ...inspectionComponentIds,
        ...completedOrders.flatMap((row) =>
          row.componentId ? [row.componentId] : [],
        ),
      ]),
    );
    const orderIds = Array.from(
      new Set([
        ...inspectionOrderIds,
        ...completedOrders.map((row) => row.id),
      ]),
    );
    const [components, projects, orderInspectionStatuses] = await Promise.all([
      this.prisma.component.findMany({
        where: { id: { in: componentIds } },
        select: {
          id: true,
          code: true,
          name: true,
          projectId: true,
          project: { select: { id: true, name: true } },
        },
      }),
      this.prisma.project.findMany({
        where: {
          id: {
            in: Array.from(
              new Set([
                ...inspections.flatMap((row) =>
                  row.projectId ? [row.projectId] : [],
                ),
                ...completedOrders.flatMap((row) =>
                  row.projectId ? [row.projectId] : [],
                ),
              ]),
            ),
          },
        },
        select: { id: true, name: true },
      }),
      this.prisma.qcInspection.findMany({
        where: {
          OR: [
            { productionOrderId: { in: orderIds } },
            { componentId: { in: componentIds } },
          ],
        },
        select: {
          id: true,
          productionOrderId: true,
          componentId: true,
          status: true,
        },
      }),
    ]);

    const componentMap = new Map(components.map((row) => [row.id, row]));
    const projectMap = new Map(projects.map((row) => [row.id, row]));
    const orderMap = new Map(completedOrders.map((row) => [row.id, row]));
    const inspectionRows = inspections.map((inspection) => {
      const order = inspection.productionOrderId
        ? orderMap.get(inspection.productionOrderId)
        : undefined;
      const componentId = inspection.componentId ?? order?.componentId;
      const component = componentId ? componentMap.get(componentId) : undefined;
      const projectId =
        inspection.projectId ?? component?.projectId ?? order?.projectId;
      const project = projectId ? projectMap.get(projectId) : undefined;
      const passed = inspection.results.filter(
        (result) => result.status === 'PASS',
      ).length;
      const failed = inspection.results.filter(
        (result) => result.status === 'FAIL',
      ).length;

      return {
        id: inspection.id,
        inspectionNo: inspection.inspectionNo,
        date: inspection.completedAt ?? inspection.updatedAt,
        projectId,
        projectName: project?.name ?? component?.project?.name ?? '-',
        componentId,
        componentCode: component?.code ?? '-',
        componentName: component?.name ?? '-',
        productionOrderId: inspection.productionOrderId,
        productionOrderNo: order?.orderNo ?? '-',
        category: inspection.checklist?.type ?? 'FINAL',
        checklistName: inspection.checklist?.name ?? '-',
        result: this.resultLabel(inspection.status, failed),
        status: inspection.status,
        inspectorId: inspection.inspectorId,
        passRate: inspection.results.length
          ? Math.round((passed / inspection.results.length) * 100)
          : 0,
        issueCount: inspection._count.issues,
        ncrCount: inspection._count.ncrs,
      };
    });
    const productionQueue = completedOrders.map((order) => {
      const related = orderInspectionStatuses.filter(
        (inspection) =>
          inspection.productionOrderId === order.id ||
          Boolean(
            order.componentId && inspection.componentId === order.componentId,
          ),
      );
      const approved = related.some((inspection) =>
        (
          [
            QcInspectionStatus.APPROVED,
            QcInspectionStatus.PASSED,
          ] as QcInspectionStatus[]
        ).includes(inspection.status),
      );
      const failed = related.some((inspection) =>
        (
          [
            QcInspectionStatus.FAILED,
            QcInspectionStatus.REWORK_REQUIRED,
            QcInspectionStatus.REJECTED,
          ] as QcInspectionStatus[]
        ).includes(inspection.status),
      );
      const component = order.componentId
        ? componentMap.get(order.componentId)
        : undefined;

      return {
        id: order.id,
        orderNo: order.orderNo,
        title: order.title,
        componentId: order.componentId,
        componentCode: component?.code ?? '-',
        componentName: component?.name ?? '-',
        projectId: order.projectId,
        status: order.status,
        qcStatus: approved
          ? 'APPROVED'
          : failed
            ? 'REWORK_REQUIRED'
            : 'WAITING_QC',
        inspectionCount: related.length,
        completedAt: order.completedAt ?? order.updatedAt,
      };
    });
    const statusCount = (statuses: QcInspectionStatus[]) =>
      statusGroups
        .filter((row) => statuses.includes(row.status))
        .reduce((sum, row) => sum + row._count, 0);
    const totalInspections = statusGroups.reduce(
      (sum, row) => sum + row._count,
      0,
    );
    const passed = statusCount([
      QcInspectionStatus.PASSED,
      QcInspectionStatus.APPROVED,
    ]);
    const byProject = Array.from(
      inspectionRows.reduce((map, row) => {
        const current = map.get(row.projectName) ?? { total: 0, passed: 0 };
        current.total += 1;
        if (row.result === 'PASS') current.passed += 1;
        map.set(row.projectName, current);
        return map;
      }, new Map<string, { total: number; passed: number }>()),
    ).map(([projectName, value]) => ({
      projectName,
      total: value.total,
      passed: value.passed,
      passRate: value.total
        ? Math.round((value.passed / value.total) * 100)
        : 0,
    }));

    return {
      metrics: {
        total: totalInspections,
        pending: statusCount([
          QcInspectionStatus.DRAFT,
          QcInspectionStatus.READY,
        ]),
        inProgress: statusCount([QcInspectionStatus.IN_PROGRESS]),
        passed,
        failed: statusCount([QcInspectionStatus.FAILED]),
        rework: statusCount([QcInspectionStatus.REWORK_REQUIRED]),
        overdue: overdueIssues,
        openIssues,
        openNcrs,
        waitingProductionOrders: productionQueue.filter(
          (row) => row.qcStatus !== 'APPROVED',
        ).length,
        passRate: totalInspections
          ? Math.round((passed / totalInspections) * 100)
          : 0,
        defects,
      },
      inspections: inspectionRows,
      productionQueue,
      checklists,
      ncrs,
      byCategory: Array.from(
        inspectionRows.reduce((map, row) => {
          map.set(row.category, (map.get(row.category) ?? 0) + 1);
          return map;
        }, new Map<string, number>()),
      ).map(([category, count]) => ({ category, count })),
      byProject,
      trend: trendRows.map((row) => ({
        date: row.date,
        total: Number(row.total),
        passed: Number(row.passed),
        failed: Number(row.failed),
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  inspectionDetail(id: string) {
    return this.prisma.qcInspection.findUnique({
      where: { id },
      include: {
        checklist: {
          include: {
            items: { orderBy: { sequence: 'asc' }, take: 100 },
          },
        },
        results: {
          include: { checklistItem: true, issues: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        issues: {
          include: {
            result: true,
            attachments: { include: { attachment: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        attachments: { include: { attachment: true }, take: 100 },
        ncrs: { orderBy: { createdAt: 'desc' }, take: 100 },
        _count: {
          select: {
            results: true,
            issues: true,
            attachments: true,
            ncrs: true,
          },
        },
      },
    });
  }

  async inspectionHistory(id: string, query: QcInspectionHistoryDto) {
    const where: Prisma.ActivityLogWhereInput = {
      module: 'qc',
      entity: 'QcInspection',
      entityId: id,
    };
    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async ncrSummary() {
    const [status, severity, total] = await Promise.all([
      this.prisma.nonConformanceReport.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.nonConformanceReport.groupBy({
        by: ['severity'],
        _count: true,
      }),
      this.prisma.nonConformanceReport.count(),
    ]);

    return { total, status, severity };
  }

  private async searchInspectionPage(query: QcWorkspaceReadDto) {
    const pattern = `%${query.search}%`;
    const statusFilter = query.status
      ? Prisma.sql`AND qi."status"::text = ${query.status}`
      : Prisma.empty;
    const sortColumns: Record<QcWorkspaceReadDto['sortBy'], string> = {
      updatedAt: 'qi."updatedAt"',
      createdAt: 'qi."createdAt"',
      inspectionNo: 'qi."inspectionNo"',
      status: 'qi."status"',
    };
    const order = query.sortOrder === 'asc' ? Prisma.raw('ASC') : Prisma.raw('DESC');
    const sortColumn = Prisma.raw(sortColumns[query.sortBy]);
    const search = Prisma.sql`
      FROM "qc_inspections" qi
      LEFT JOIN "components" c ON c."id" = qi."componentId"
      LEFT JOIN "production_orders" po ON po."id" = qi."productionOrderId"
      LEFT JOIN "projects" p ON p."id" = qi."projectId"
      LEFT JOIN "projects" cp ON cp."id" = c."projectId"
      WHERE (
        qi."inspectionNo" ILIKE ${pattern}
        OR c."code" ILIKE ${pattern}
        OR c."name" ILIKE ${pattern}
        OR po."orderNo" ILIKE ${pattern}
        OR po."title" ILIKE ${pattern}
        OR p."name" ILIKE ${pattern}
        OR cp."name" ILIKE ${pattern}
      )
      ${statusFilter}
    `;
    const [rows, counts] = await Promise.all([
      this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT qi."id"
        ${search}
        ORDER BY ${sortColumn} ${order}, qi."id" ${order}
        LIMIT ${query.limit}
        OFFSET ${(query.page - 1) * query.limit}
      `),
      this.prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS "total"
        ${search}
      `),
    ]);

    return {
      ids: rows.map((row) => row.id),
      total: Number(counts[0]?.total ?? 0),
    };
  }

  private inspectionListSelect() {
    return {
      id: true,
      inspectionNo: true,
      productionOrderId: true,
      componentId: true,
      projectId: true,
      status: true,
      inspectorId: true,
      completedAt: true,
      updatedAt: true,
      checklist: { select: { name: true, type: true } },
      results: { select: { status: true } },
      _count: { select: { issues: true, ncrs: true } },
    } satisfies Prisma.QcInspectionSelect;
  }

  private resultLabel(status: QcInspectionStatus, failedResults: number) {
    if (
      (
        [
          QcInspectionStatus.APPROVED,
          QcInspectionStatus.PASSED,
        ] as QcInspectionStatus[]
      ).includes(status)
    ) {
      return 'PASS' as const;
    }
    if (
      (
        [
          QcInspectionStatus.FAILED,
          QcInspectionStatus.REWORK_REQUIRED,
        ] as QcInspectionStatus[]
      ).includes(status) || failedResults > 0
    ) {
      return 'FAIL' as const;
    }
    return 'PENDING' as const;
  }

}
