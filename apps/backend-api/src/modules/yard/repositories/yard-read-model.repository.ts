import { Injectable } from '@nestjs/common';

import { Prisma, YardMovementType } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import type { YardWorkspaceReadDto } from '../dto/yard.dto';

@Injectable()
export class YardReadModelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async latestDashboardMutationAt() {
    const rows = await this.prisma.$queryRaw<Array<{ latest: Date | null }>>`
      SELECT MAX(changes."changedAt") AS latest
      FROM (
        SELECT MAX("updatedAt") AS "changedAt" FROM "yard_zones"
        UNION ALL
        SELECT MAX("updatedAt") AS "changedAt" FROM "yard_slots"
        UNION ALL
        SELECT MAX("updatedAt") AS "changedAt" FROM "yard_item_placements"
        UNION ALL
        SELECT MAX("createdAt") AS "changedAt" FROM "yard_movements"
        UNION ALL
        SELECT MAX("updatedAt") AS "changedAt" FROM "cranes"
      ) AS changes
    `;

    return rows[0]?.latest ?? null;
  }

  async workspace(query: YardWorkspaceReadDto) {
    const slotWhere = this.slotWhere(query);
    const movementWhere = this.movementWhere(query);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trendStart = new Date(today);
    trendStart.setDate(trendStart.getDate() - 29);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      zones,
      totalZones,
      slots,
      totalSlots,
      occupiedSlots,
      activePlacements,
      placementWeight,
      movements,
      totalMovements,
      movementGroups,
      movementsToday,
      movementsMonth,
      movementTodayGroups,
      cranes,
      placementGroups,
      trendRows,
      zoneRows,
    ] = await Promise.all([
      this.prisma.yardZone.findMany({
        where: {
          id: query.zoneId,
          OR: query.search
            ? [
                { code: { contains: query.search, mode: 'insensitive' } },
                { name: { contains: query.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        orderBy: { code: 'asc' },
        take: 100,
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          status: true,
          originX: true,
          originY: true,
          width: true,
          height: true,
          color: true,
          slots: { select: { id: true, code: true } },
        },
      }),
      this.prisma.yardZone.count({ where: { id: query.zoneId } }),
      this.prisma.yardSlot.findMany({
        where: slotWhere,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          zone: { select: { id: true, code: true, name: true } },
          placements: {
            where: { removedAt: null },
            orderBy: { stackLevel: 'asc' },
            include: {
              componentInstance: {
                select: {
                  id: true,
                  instanceNo: true,
                  state: true,
                  componentId: true,
                  productionOrderId: true,
                  requirementId: true,
                  projectId: true,
                  component: { select: { id: true, code: true, name: true } },
                  project: { select: { id: true, code: true, name: true } },
                  requirement: { select: { id: true, requirementNo: true } },
                  productionOrder: { select: { id: true, orderNo: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.yardSlot.count({ where: slotWhere }),
      this.prisma.yardSlot.count({
        where: { ...slotWhere, status: 'OCCUPIED' },
      }),
      this.prisma.yardItemPlacement.count({ where: { removedAt: null } }),
      this.prisma.yardItemPlacement.aggregate({
        where: { removedAt: null },
        _sum: { weight: true },
      }),
      this.prisma.yardMovement.findMany({
        where: movementWhere,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.movementPage - 1) * query.movementLimit,
        take: query.movementLimit,
        include: this.movementInclude(),
      }),
      this.prisma.yardMovement.count({ where: movementWhere }),
      this.prisma.yardMovement.groupBy({
        by: ['type'],
        where: movementWhere,
        _count: true,
      }),
      this.prisma.yardMovement.count({ where: { createdAt: { gte: today } } }),
      this.prisma.yardMovement.count({
        where: { createdAt: { gte: monthStart } },
      }),
      this.prisma.yardMovement.groupBy({
        by: ['type'],
        where: { createdAt: { gte: today } },
        _count: true,
      }),
      this.prisma.crane.findMany({ orderBy: { name: 'asc' }, take: 100 }),
      this.prisma.yardItemPlacement.groupBy({
        by: ['itemName', 'itemCode'],
        where: { removedAt: null },
        _sum: { weight: true, quantity: true },
      }),
      this.prisma.$queryRaw<Array<{ day: string; count: number }>>`
        SELECT TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM "yard_movements"
        WHERE "createdAt" >= ${trendStart}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `,
      this.prisma.yardZone.findMany({
        where: { id: query.zoneId },
        orderBy: { code: 'asc' },
        take: 100,
        select: {
          id: true,
          code: true,
          name: true,
          slots: {
            select: { status: true },
          },
        },
      }),
    ]);

    const zoneUtilization = zoneRows.map((zone) => {
      const occupied = zone.slots.filter(
        (slot) => slot.status === 'OCCUPIED',
      ).length;
      return {
        id: zone.id,
        code: zone.code,
        name: zone.name,
        totalSlots: zone.slots.length,
        occupiedSlots: occupied,
        occupancyRate: zone.slots.length
          ? Math.round((occupied / zone.slots.length) * 100)
          : 0,
      };
    });
    const movementCount = (type: YardMovementType) =>
      movementGroups.find((row) => row.type === type)?._count ?? 0;
    const movementTodayCount = (type: YardMovementType) =>
      movementTodayGroups.find((row) => row.type === type)?._count ?? 0;
    const qcQueue = await this.qcQueue(slots);
    const overloadedZones = zoneUtilization.filter(
      (zone) => zone.occupancyRate >= 90,
    ).length;

    return {
      zones,
      slots,
      movements,
      cranes,
      qcQueue,
      meta: {
        slots: this.meta(query.page, query.limit, totalSlots),
        movements: this.meta(
          query.movementPage,
          query.movementLimit,
          totalMovements,
        ),
        zones: { total: totalZones, returned: zones.length },
      },
      summary: {
        zones: totalZones,
        totalSlots,
        occupiedSlots,
        availableSlots: Math.max(0, totalSlots - occupiedSlots),
        placements: activePlacements,
        totalWeight: Number(placementWeight._sum.weight ?? 0),
        movementsToday,
        overloadedZones,
      },
      analytics: {
        movementCounts: {
          place: movementCount(YardMovementType.PLACE),
          move: movementCount(YardMovementType.MOVE),
          remove: movementCount(YardMovementType.REMOVE),
          adjust: movementCount(YardMovementType.ADJUST),
        },
        movementMonth: movementsMonth,
        movementTodayCounts: {
          place: movementTodayCount(YardMovementType.PLACE),
          move: movementTodayCount(YardMovementType.MOVE),
          remove: movementTodayCount(YardMovementType.REMOVE),
          adjust: movementTodayCount(YardMovementType.ADJUST),
        },
        craneAvailableCount: cranes.filter(
          (crane) => crane.status !== 'MAINTENANCE',
        ).length,
        componentDistribution: Array.from(
          placementGroups.reduce((groups, row) => {
            const label =
              row.itemName?.split(' ')[0] ||
              row.itemCode.split('-')[0] ||
              'Khác';
            groups.set(
              label,
              (groups.get(label) ?? 0) +
                Number(row._sum.weight ?? row._sum.quantity ?? 0),
            );
            return groups;
          }, new Map<string, number>()),
        )
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5),
        movementTrend: trendRows.map((row) => ({
          date: row.day,
          count: Number(row.count),
        })),
        zoneUtilization,
        warningZoneCount: zoneUtilization.filter(
          (zone) => zone.occupancyRate >= 80,
        ).length,
      },
    };
  }

  private async qcQueue(
    slots: Array<{
      id: string;
      code: string;
      zone: { id: string; code: string; name: string };
      placements: Array<{
        id: string;
        itemType: string;
        itemId: string;
        itemCode: string;
        itemName: string | null;
        stackLevel: number;
        componentInstanceId?: string | null;
        componentInstance?: {
          componentId: string;
          instanceNo: string;
        } | null;
      }>;
    }>,
  ) {
    const placements = slots.flatMap((slot) =>
      slot.placements
        .filter((placement) => placement.itemType === 'COMPONENT')
        .map((placement) => ({ placement, slot })),
    );
    const componentIds = Array.from(
      new Set(
        placements
          .map(
            (row) =>
              row.placement.componentInstance?.componentId ??
              row.placement.itemId,
          )
          .filter(Boolean),
      ),
    );
    if (!componentIds.length) return [];

    const inspections = await this.prisma.qcInspection.findMany({
      where: { componentId: { in: componentIds } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        inspectionNo: true,
        componentId: true,
        status: true,
        updatedAt: true,
      },
    });
    const latest = new Map<string, (typeof inspections)[number]>();
    inspections.forEach((inspection) => {
      if (inspection.componentId && !latest.has(inspection.componentId)) {
        latest.set(inspection.componentId, inspection);
      }
    });

    return placements.flatMap(({ placement, slot }) => {
      const componentId =
        placement.componentInstance?.componentId ?? placement.itemId;
      const inspection = latest.get(componentId);
      return inspection
        ? [
            {
              id: placement.id,
              itemCode: placement.itemCode,
              instanceCode: placement.componentInstance?.instanceNo ?? null,
              componentInstanceId: placement.componentInstanceId ?? null,
              itemName: placement.itemName,
              slotCode: slot.code,
              zoneName: slot.zone.name,
              stackLevel: placement.stackLevel,
              inspectionId: inspection.id,
              inspectionNo: inspection.inspectionNo,
              status: inspection.status,
              updatedAt: inspection.updatedAt,
            },
          ]
        : [];
    });
  }

  private slotWhere(query: YardWorkspaceReadDto): Prisma.YardSlotWhereInput {
    return {
      zoneId: query.zoneId,
      status: query.slotStatus,
      OR: query.search
        ? [
            { code: { contains: query.search, mode: 'insensitive' } },
            { zone: { code: { contains: query.search, mode: 'insensitive' } } },
            {
              placements: {
                some: {
                  itemCode: { contains: query.search, mode: 'insensitive' },
                  removedAt: null,
                },
              },
            },
          ]
        : undefined,
    };
  }

  private movementWhere(
    query: YardWorkspaceReadDto,
  ): Prisma.YardMovementWhereInput {
    const movementDateEnd = query.movementDate
      ? new Date(query.movementDate.getTime() + 24 * 60 * 60 * 1000)
      : undefined;
    return {
      type: query.movementType,
      itemCode: query.movementItem
        ? { contains: query.movementItem, mode: 'insensitive' }
        : undefined,
      createdAt: query.movementDate
        ? { gte: query.movementDate, lt: movementDateEnd }
        : undefined,
      AND: query.movementLocation
        ? [
            {
              OR: [
                {
                  fromSlot: {
                    code: {
                      contains: query.movementLocation,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  toSlot: {
                    code: {
                      contains: query.movementLocation,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  fromSlot: {
                    zone: {
                      code: {
                        contains: query.movementLocation,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
                {
                  toSlot: {
                    zone: {
                      code: {
                        contains: query.movementLocation,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            },
          ]
        : undefined,
      OR: query.search
        ? [
            { itemCode: { contains: query.search, mode: 'insensitive' } },
            {
              fromSlot: {
                code: { contains: query.search, mode: 'insensitive' },
              },
            },
            {
              toSlot: { code: { contains: query.search, mode: 'insensitive' } },
            },
          ]
        : undefined,
    };
  }

  private movementInclude() {
    return {
      fromSlot: { include: { zone: true } },
      toSlot: { include: { zone: true } },
      crane: true,
      componentInstance: {
        select: {
          id: true,
          instanceNo: true,
          state: true,
          componentId: true,
          productionOrderId: true,
          requirementId: true,
          projectId: true,
        },
      },
    };
  }

  private meta(page: number, limit: number, total: number) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
