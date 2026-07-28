import { Injectable } from '@nestjs/common';

import {
  ComponentLifecycleState,
  ComponentStatus,
  Prisma,
  ProductionOrderStatus,
} from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import type {
  ComponentHistoryDto,
  ComponentOverviewDto,
  ComponentWorkspaceListDto,
} from '../dto/components.dto';

const runningStatuses = new Set([
  'IN_PROGRESS',
  'RUNNING',
  'ACTIVE',
  'CUTTING',
  'WELDING',
  'PAINTING',
]);
const completedStatuses = new Set([
  'DONE',
  'COMPLETED',
  'FINISHED',
  'READY',
  'SHIPPED',
  'DELIVERED',
  'INSTALLED',
]);

type ComponentMetadata = {
  type?: string;
  profile?: string;
  quantity?: number;
  qcQuantity?: number;
};

const componentReadInclude = {
  project: true,
  requirements: {
    select: {
      id: true,
      requiredQuantity: true,
      requiredBy: true,
      project: { select: { id: true, code: true, name: true } },
    },
  },
  productionOrders: {
    orderBy: { updatedAt: 'desc' as const },
    take: 1,
    include: {
      bom: { include: { items: true } },
      materialIssues: true,
    },
  },
} satisfies Prisma.ComponentInclude;

type ComponentSource = Prisma.ComponentGetPayload<{
  include: typeof componentReadInclude;
}>;

@Injectable()
export class ComponentsReadModelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ComponentWorkspaceListDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 14;
    const where = this.workspaceWhere(query);
    const orderBy = {
      [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
    } as Prisma.ComponentOrderByWithRelationInput;

    const [sources, total, summary, analytics] = await Promise.all([
      this.prisma.component.findMany({
        where,
        include: componentReadInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.component.count({ where }),
      this.listSummaryFromDb(),
      this.listAnalyticsFromDb(),
    ]);

    const rows = await this.toRows(sources);

    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary,
      analytics,
    };
  }

  async overview(query: ComponentOverviewDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 14;
    const where = this.workspaceWhere(query);
    const [sources, total, aggregates, recentOrders] = await Promise.all([
      this.prisma.component.findMany({
        where,
        include: componentReadInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.component.count({ where }),
      this.overviewAggregatesFromDb(),
      this.prisma.productionOrder.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: { orderNo: true, projectId: true, status: true },
      }),
    ]);
    const rows = await this.toOverviewRows(sources);

    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: aggregates.summary,
      analytics: {
        typeSegments: aggregates.typeSegments,
        topProfiles: aggregates.topProfiles,
        totalQuantity: aggregates.totalQuantity,
        activitySeries: aggregates.activitySeries,
        recentOrders: recentOrders.map((order) => ({
          code: order.orderNo,
          project: order.projectId ?? '-',
          value:
            order.status === ProductionOrderStatus.COMPLETED
              ? 100
              : order.status === ProductionOrderStatus.IN_PROGRESS
                ? 68
                : order.status === ProductionOrderStatus.DELAYED
                  ? 38
                  : 18,
          status: order.status,
        })),
      },
      filters: aggregates.filters,
    };
  }

  async history(query: ComponentHistoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 14;
    const search = query.search || query.q;
    const where: Prisma.ComponentTimelineWhereInput = {
      action: query.action
        ? { contains: query.action, mode: 'insensitive' }
        : undefined,
      OR: search
        ? [
            { action: { contains: search, mode: 'insensitive' } },
            { note: { contains: search, mode: 'insensitive' } },
            { component: { code: { contains: search, mode: 'insensitive' } } },
            { component: { name: { contains: search, mode: 'insensitive' } } },
            {
              component: {
                project: { name: { contains: search, mode: 'insensitive' } },
              },
            },
          ]
        : undefined,
    };
    const [rows, total, grouped, recent] = await Promise.all([
      this.prisma.componentTimeline.findMany({
        where,
        include: {
          component: {
            include: {
              project: true,
              productionOrders: {
                orderBy: { updatedAt: 'desc' },
                take: 1,
                select: { orderNo: true, currentStageCode: true },
              },
            },
          },
        },
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.componentTimeline.count({ where }),
      this.prisma.componentTimeline.groupBy({ by: ['action'], _count: true }),
      this.prisma.componentTimeline.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { component: { select: { code: true } } },
      }),
    ]);
    const completedActions = new Set([
      'READY',
      'COMPLETED',
      'DELIVERED',
      'INSTALLED',
    ]);
    const failedActions = new Set(['REJECTED', 'FAILED', 'NCR']);
    const completed = grouped
      .filter((row) => completedActions.has(row.action.toUpperCase()))
      .reduce((sum, row) => sum + row._count, 0);
    const failed = grouped
      .filter((row) => failedActions.has(row.action.toUpperCase()))
      .reduce((sum, row) => sum + row._count, 0);
    const grandTotal = grouped.reduce((sum, row) => sum + row._count, 0);

    return {
      data: rows.map((row) => {
        const order = row.component.productionOrders[0];
        const isFailed = failedActions.has(row.action.toUpperCase());
        return [
          row.component.code,
          row.component.name,
          order?.orderNo ?? '-',
          row.component.project?.name ?? '-',
          '-',
          order?.currentStageCode ?? row.action,
          row.createdAt.toISOString(),
          completedActions.has(row.action.toUpperCase())
            ? row.createdAt.toISOString()
            : '-',
          completedActions.has(row.action.toUpperCase())
            ? 'Hoàn thành'
            : row.action,
          isFailed ? 'Không đạt' : 'Đạt',
        ];
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        total: grandTotal,
        completed,
        active: Math.max(0, grandTotal - completed - failed),
        waiting: 0,
        failed,
        passed: Math.max(0, grandTotal - failed),
      },
      recent: recent.map((row) => ({
        code: row.component.code,
        action: row.action,
      })),
    };
  }

  private workspaceWhere(
    query: ComponentWorkspaceListDto | ComponentOverviewDto,
  ): Prisma.ComponentWhereInput {
    const search = query.search || query.q;
    const statuses = this.componentStatuses(query.status);
    const and: Prisma.ComponentWhereInput[] = [];

    if (query.status === 'Tồn kho') {
      and.push({
        OR: [
          { lifecycleState: null },
          { lifecycleState: { not: ComponentLifecycleState.DRAFT } },
        ],
      });
    }

    if (query.location) {
      and.push({
        OR: [
          { floor: { contains: query.location, mode: 'insensitive' } },
          { zone: { contains: query.location, mode: 'insensitive' } },
          { position: { contains: query.location, mode: 'insensitive' } },
        ],
      });
    }

    if (query.type) {
      and.push({
        OR: [
          { componentType: { contains: query.type, mode: 'insensitive' } },
          { description: { contains: query.type, mode: 'insensitive' } },
        ],
      });
    }

    return {
      status: statuses?.length ? { in: statuses } : undefined,
      project: query.project
        ? {
            OR: [
              { code: { equals: query.project, mode: 'insensitive' } },
              { name: { equals: query.project, mode: 'insensitive' } },
            ],
          }
        : undefined,
      AND: and.length ? and : undefined,
      OR: search
        ? [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { componentType: { contains: search, mode: 'insensitive' } },
            { profile: { contains: search, mode: 'insensitive' } },
            { floor: { contains: search, mode: 'insensitive' } },
            { zone: { contains: search, mode: 'insensitive' } },
            { position: { contains: search, mode: 'insensitive' } },
            { project: { code: { contains: search, mode: 'insensitive' } } },
            { project: { name: { contains: search, mode: 'insensitive' } } },
          ]
        : undefined,
    };
  }

  private componentStatuses(value?: string): ComponentStatus[] | undefined {
    if (!value) return undefined;
    const direct = Object.values(ComponentStatus).find(
      (status) => status === value,
    );
    if (direct) return [direct];
    return {
      'Tồn kho': [
        ComponentStatus.STOCK,
        ComponentStatus.SHIPPED,
        ComponentStatus.DELIVERED,
        ComponentStatus.INSTALLED,
      ],
      'Đang SX': [
        ComponentStatus.CUTTING,
        ComponentStatus.WELDING,
        ComponentStatus.PAINTING,
      ],
      'Đã QC': [ComponentStatus.READY],
      'Đã QC đạt': [ComponentStatus.READY],
    }[value];
  }

  private async toRows(sources: ComponentSource[]) {
    const fallbackBoms = await this.prisma.bOM.findMany({
      where: {
        productCode: { in: sources.map((row) => row.code) },
        status: { not: 'ARCHIVED' },
      },
      include: { items: true },
    });
    return sources.map((source) => {
      const metadata = this.metadata(source.description);
      const order = source.productionOrders[0];
      const bom =
        order?.bom ??
        fallbackBoms.find((item) => item.productCode === source.code);
      const requirementQuantity = this.requirementQuantity(source);
      const quantity = Number(requirementQuantity ?? metadata.quantity ?? 1);
      const requiredByMaterial = new Map<string, number>();
      for (const item of bom?.items ?? []) {
        const required =
          Number(item.quantity ?? 0) *
          (1 + Number(item.wastePercent ?? 0) / 100) *
          Number(order?.quantity ?? quantity);
        requiredByMaterial.set(
          item.materialId,
          (requiredByMaterial.get(item.materialId) ?? 0) + required,
        );
      }
      const issuedByMaterial = new Map<string, number>();
      for (const issue of order?.materialIssues ?? []) {
        if (!['ISSUED', 'RETURNED'].includes(issue.status.toUpperCase()))
          continue;
        issuedByMaterial.set(
          issue.inventoryItemId,
          (issuedByMaterial.get(issue.inventoryItemId) ?? 0) +
            Math.max(0, Number(issue.issuedQty) - Number(issue.returnedQty)),
        );
      }
      const requiredQty = [...requiredByMaterial.values()].reduce(
        (sum, value) => sum + value,
        0,
      );
      const issuedQty = [...requiredByMaterial.entries()].reduce(
        (sum, [materialId, required]) =>
          sum + Math.min(issuedByMaterial.get(materialId) ?? 0, required),
        0,
      );
      const materialReady =
        requiredQty > 0 ? Math.min(100, (issuedQty / requiredQty) * 100) : 0;
      return {
        id: source.id,
        code: source.code,
        name: source.name,
        type: source.componentType ?? metadata.type ?? 'Cấu kiện thép',
        profile: source.profile ?? metadata.profile ?? 'N/A',
        project:
          source.project?.code ?? source.project?.name ?? 'Chưa gán dự án',
        projectId: source.projectId,
        projectRef: source.project,
        location:
          [source.floor, source.zone, source.position]
            .filter(Boolean)
            .join(' / ') || 'Kho cấu kiện',
        installZone: source.installZone,
        installAxis: source.installAxis,
        installLevel: source.installLevel,
        installPosition: source.installPosition,
        status: this.listStatus(source.status, source.lifecycleState),
        rawStatus: source.status,
        qty: quantity,
        qc:
          metadata.qcQuantity ??
          (source.status === ComponentStatus.READY ? quantity : 0),
        weight: Number(bom?.estimatedWeight ?? 0),
        progress: this.progress(source.status, order?.status),
        materialReady,
        requiredQty,
        issuedQty,
        remainingQty: Math.max(0, requiredQty - issuedQty),
        hasBom: Boolean(bom),
        hasProductionOrder: Boolean(order),
        workOrder: order?.orderNo ?? '-',
        dueDate: order?.plannedEndAt?.toISOString(),
        productionStatus: order?.status,
        rawCreatedAt: source.createdAt.toISOString(),
        createdAt: source.createdAt.toISOString(),
      };
    });
  }

  private async toOverviewRows(sources: ComponentSource[]) {
    const placements = await this.prisma.yardItemPlacement.findMany({
      where: { itemId: { in: sources.map((row) => row.id) }, removedAt: null },
      include: { slot: { include: { zone: true } } },
    });
    const placementByItem = new Map(placements.map((row) => [row.itemId, row]));
    return sources.map((source) => {
      const metadata = this.metadata(source.description);
      const placement = placementByItem.get(source.id);
      const requirementQuantity = this.requirementQuantity(source);
      const quantity = Number(requirementQuantity ?? metadata.quantity ?? 1);
      return {
        id: source.id,
        code: source.code,
        name: source.name,
        type: source.componentType ?? metadata.type ?? 'Cấu kiện thép',
        profile: source.profile ?? metadata.profile ?? 'N/A',
        project: source.project?.code ?? source.project?.name ?? 'Chưa gán',
        location: placement
          ? `${placement.slot.zone.code} / ${placement.slot.code} / L${placement.stackLevel}`
          : [source.floor, source.zone, source.position]
              .filter(Boolean)
              .join(' / ') || 'Kho cấu kiện',
        status: this.overviewStatus(source.status, source.lifecycleState),
        rawStatus: source.status,
        quantity,
        qcQuantity: Number(
          metadata.qcQuantity ??
            (source.status === ComponentStatus.READY
              ? quantity
              : 0),
        ),
        createdAt: source.createdAt.toISOString(),
      };
    });
  }

  private async listSummaryFromDb() {
    const [total, running, completed, delayed, material] = await Promise.all([
      this.prisma.component.count(),
      this.prisma.component.count({
        where: {
          OR: [
            {
              status: {
                in: [
                  ComponentStatus.CUTTING,
                  ComponentStatus.WELDING,
                  ComponentStatus.PAINTING,
                ],
              },
            },
            {
              productionOrders: {
                some: { status: ProductionOrderStatus.IN_PROGRESS },
              },
            },
          ],
        },
      }),
      this.prisma.component.count({
        where: {
          OR: [
            {
              status: {
                in: [
                  ComponentStatus.READY,
                  ComponentStatus.SHIPPED,
                  ComponentStatus.DELIVERED,
                  ComponentStatus.INSTALLED,
                ],
              },
            },
            {
              productionOrders: {
                some: { status: ProductionOrderStatus.COMPLETED },
              },
            },
          ],
        },
      }),
      this.prisma.component.count({
        where: {
          productionOrders: {
            some: {
              plannedEndAt: { lt: new Date() },
              status: {
                notIn: [
                  ProductionOrderStatus.COMPLETED,
                  ProductionOrderStatus.CLOSED,
                  ProductionOrderStatus.CANCELLED,
                ],
              },
            },
          },
        },
      }),
      this.prisma.$queryRaw<Array<{ waiting: bigint; weight: number | null }>>`
        WITH latest_order AS (
          SELECT DISTINCT ON ("componentId") id, "componentId", "bomId", quantity
          FROM production_orders
          WHERE "componentId" IS NOT NULL
          ORDER BY "componentId", "updatedAt" DESC
        ), required_by_material AS (
          SELECT lo."componentId", bi."materialId",
                 SUM(bi.quantity * (1 + bi."wastePercent" / 100.0) * lo.quantity) required
          FROM latest_order lo
          JOIN "BOMItem" bi ON bi."bomId" = lo."bomId"
          GROUP BY lo."componentId", bi."materialId"
        ), issued_by_material AS (
          SELECT lo."componentId", pmi."inventoryItemId" "materialId",
                 SUM(GREATEST(0, pmi."issuedQty" - pmi."returnedQty")) issued
          FROM latest_order lo
          JOIN "ProductionMaterialIssue" pmi ON pmi."productionOrderId" = lo.id
          WHERE UPPER(pmi.status) IN ('ISSUED', 'RETURNED')
          GROUP BY lo."componentId", pmi."inventoryItemId"
        ), readiness AS (
          SELECT rbm."componentId", SUM(rbm.required) required,
                 SUM(LEAST(COALESCE(ibm.issued, 0), rbm.required)) issued
          FROM required_by_material rbm
          LEFT JOIN issued_by_material ibm
            ON ibm."componentId" = rbm."componentId"
           AND ibm."materialId" = rbm."materialId"
          GROUP BY rbm."componentId"
        )
        SELECT
          (SELECT COUNT(*) FROM readiness WHERE issued < required)::bigint waiting,
          (SELECT COALESCE(SUM(b."estimatedWeight"), 0)
             FROM latest_order lo JOIN "BOM" b ON b.id = lo."bomId")::float weight
      `,
    ]);
    return {
      total,
      running,
      completed,
      waitingMaterial: Number(material[0]?.waiting ?? 0),
      delayed,
      weight: Number(material[0]?.weight ?? 0),
    };
  }

  private async listAnalyticsFromDb() {
    const colors: Record<string, string> = {
      Beam: '#1d7cff',
      Column: '#14c987',
      Brace: '#f59e0b',
      Plate: '#7c3aed',
      Assembly: '#06b6d4',
    };
    const [structures, newestSources, projectGroups, activity] =
      await Promise.all([
        this.prisma.$queryRaw<Array<{ label: string; value: bigint }>>`
        SELECT CASE
          WHEN LOWER(COALESCE("componentType", description, '')) LIKE '%beam%' OR LOWER(COALESCE("componentType", description, '')) LIKE '%dầm%' THEN 'Beam'
          WHEN LOWER(COALESCE("componentType", description, '')) LIKE '%column%' OR LOWER(COALESCE("componentType", description, '')) LIKE '%cột%' THEN 'Column'
          WHEN LOWER(COALESCE("componentType", description, '')) LIKE '%brace%' OR LOWER(COALESCE("componentType", description, '')) LIKE '%giằng%' THEN 'Brace'
          WHEN LOWER(COALESCE("componentType", description, '')) LIKE '%plate%' OR LOWER(COALESCE("componentType", description, '')) LIKE '%bản%' THEN 'Plate'
          ELSE 'Assembly'
        END label, COUNT(*)::bigint value
        FROM components
        GROUP BY label
      `,
        this.prisma.component.findMany({
          include: componentReadInclude,
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.component.groupBy({
          by: ['projectId'],
          _count: true,
          orderBy: { _count: { projectId: 'desc' } },
          take: 5,
        }),
        this.prisma.$queryRaw<Array<{ value: bigint }>>`
        SELECT COUNT(*)::bigint value
        FROM component_timelines
        WHERE "createdAt" >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
        GROUP BY date_trunc('month', "createdAt")
        ORDER BY date_trunc('month', "createdAt") ASC
      `,
      ]);
    const newestComponents = await this.toRows(newestSources);
    const projects = await this.prisma.project.findMany({
      where: {
        id: {
          in: projectGroups.flatMap((row) =>
            row.projectId ? [row.projectId] : [],
          ),
        },
      },
      select: { id: true, code: true, name: true },
    });
    const structureByLabel = new Map(
      structures.map((row) => [row.label, Number(row.value)]),
    );
    return {
      topWeight: [],
      delayedRows: [],
      materialShortage: [],
      structure: ['Beam', 'Column', 'Brace', 'Plate', 'Assembly'].map(
        (label) => ({
          label,
          value: structureByLabel.get(label) ?? 0,
          color: colors[label],
        }),
      ),
      newestComponents,
      activitySeries: activity.map((row) => Number(row.value)),
      projectDistribution: projectGroups.map((row) => {
        const project = projects.find((item) => item.id === row.projectId);
        return {
          projectName: project?.code ?? project?.name ?? 'Chưa gán dự án',
          count: row._count,
        };
      }),
    };
  }

  private async overviewAggregatesFromDb() {
    const [
      statusGroups,
      finishedGoods,
      metadataGroups,
      projects,
      floors,
      yardZones,
      activity,
    ] = await Promise.all([
      this.prisma.component.groupBy({ by: ['status'], _count: true }),
      this.prisma.component.count({
        where: {
          status: ComponentStatus.STOCK,
          OR: [
            { lifecycleState: null },
            { lifecycleState: { not: ComponentLifecycleState.DRAFT } },
          ],
        },
      }),
      this.prisma.$queryRaw<
        Array<{ type: string; profile: string; quantity: number }>
      >`
          SELECT
            COALESCE(c."componentType", substring(c.description from '"type"[[:space:]]*:[[:space:]]*"([^"]+)"'), 'Cấu kiện thép') type,
            COALESCE(c."profile", substring(c.description from '"profile"[[:space:]]*:[[:space:]]*"([^"]+)"'), 'N/A') profile,
            CASE
              WHEN COALESCE(r.required_quantity, 0) > 0 THEN r.required_quantity
              ELSE COALESCE(NULLIF(substring(c.description from '"quantity"[[:space:]]*:[[:space:]]*([0-9]+(\\.[0-9]+)?)'), '')::float, 1)
            END quantity
          FROM components c
          LEFT JOIN (
            SELECT "componentId", SUM("requiredQuantity")::float required_quantity
            FROM project_component_requirements
            GROUP BY "componentId"
          ) r ON r."componentId" = c.id
        `,
      this.prisma.project.findMany({
        where: { components: { some: {} } },
        select: { code: true, name: true },
      }),
      this.prisma.component.findMany({
        distinct: ['floor'],
        select: { floor: true },
      }),
      this.prisma.yardZone.findMany({
        where: {
          slots: {
            some: {
              placements: { some: { removedAt: null } },
            },
          },
        },
        select: { code: true },
      }),
      this.prisma.$queryRaw<Array<{ period: Date; value: bigint }>>`
          SELECT date_trunc('month', "createdAt") period, COUNT(*)::bigint value
          FROM component_timelines
          WHERE "createdAt" >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
          GROUP BY period
          ORDER BY period ASC
        `,
    ]);
    const count = (statuses: ComponentStatus[]) =>
      statusGroups
        .filter((row) => statuses.includes(row.status))
        .reduce((sum, row) => sum + row._count, 0);
    const typeTotals = new Map<string, number>();
    const profileTotals = new Map<string, number>();
    metadataGroups.forEach((row) => {
      typeTotals.set(
        row.type,
        (typeTotals.get(row.type) ?? 0) + Number(row.quantity),
      );
      profileTotals.set(
        row.profile,
        (profileTotals.get(row.profile) ?? 0) + Number(row.quantity),
      );
    });
    return {
      summary: {
        total: statusGroups.reduce((sum, row) => sum + row._count, 0),
        producing: count([
          ComponentStatus.CUTTING,
          ComponentStatus.WELDING,
          ComponentStatus.PAINTING,
        ]),
        stock: finishedGoods,
        qcPass: count([ComponentStatus.READY]),
        qcFail: 0,
        transferring: count([ComponentStatus.SHIPPED]),
      },
      typeSegments: [...typeTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
      topProfiles: [...profileTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      totalQuantity: metadataGroups.reduce(
        (sum, row) => sum + Number(row.quantity),
        0,
      ),
      activitySeries: activity.map((row) => Number(row.value)),
      filters: {
        projects: projects.map((row) => row.code ?? row.name),
        statuses: [
          ...new Set(
            statusGroups.map((row) => this.overviewStatus(row.status)),
          ),
        ],
        locations: [
          ...new Set([
            ...floors.flatMap((row) => (row.floor ? [row.floor] : [])),
            ...yardZones.map((row) => row.code),
          ]),
        ],
        types: [...typeTotals.keys()],
      },
    };
  }

  private metadata(raw?: string | null): ComponentMetadata {
    try {
      return raw ? (JSON.parse(raw) as ComponentMetadata) : {};
    } catch {
      return {};
    }
  }

  private requirementQuantity(source: ComponentSource) {
    if (!source.requirements?.length) return undefined;
    return source.requirements.reduce(
      (sum, row) => sum + Number(row.requiredQuantity ?? 0),
      0,
    );
  }

  private listStatus(
    status: ComponentStatus,
    lifecycleState?: ComponentLifecycleState | null,
  ) {
    if (lifecycleState === ComponentLifecycleState.DRAFT) return 'Draft';
    return {
      STOCK: 'Tồn kho',
      CUTTING: 'Đang SX',
      WELDING: 'Đang SX',
      PAINTING: 'Đang SX',
      READY: 'Đã QC',
      SHIPPED: 'Tồn kho',
      DELIVERED: 'Tồn kho',
      INSTALLED: 'Tồn kho',
    }[status];
  }

  private overviewStatus(
    status: ComponentStatus,
    lifecycleState?: ComponentLifecycleState | null,
  ) {
    if (lifecycleState === ComponentLifecycleState.DRAFT) return 'Draft';
    return {
      STOCK: 'Tồn kho',
      CUTTING: 'Đang SX',
      WELDING: 'Đang SX',
      PAINTING: 'Đang SX',
      READY: 'Đã QC đạt',
      SHIPPED: 'Đang chuyển',
      DELIVERED: 'Đã giao',
      INSTALLED: 'Đã lắp',
    }[status];
  }

  private progress(
    componentStatus: ComponentStatus,
    orderStatus?: ProductionOrderStatus,
  ) {
    if (
      completedStatuses.has(componentStatus) ||
      completedStatuses.has(String(orderStatus ?? ''))
    )
      return 100;
    if (componentStatus === ComponentStatus.PAINTING) return 75;
    if (componentStatus === ComponentStatus.WELDING) return 50;
    if (
      componentStatus === ComponentStatus.CUTTING ||
      orderStatus === ProductionOrderStatus.IN_PROGRESS
    )
      return orderStatus === ProductionOrderStatus.IN_PROGRESS ? 50 : 25;
    return 0;
  }
}
