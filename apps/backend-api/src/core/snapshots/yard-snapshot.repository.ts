import { Inject, Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface YardDashboardSnapshotPayload {
  scopeKey: string;
  snapshotDate: Date;
  totalZones: number;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  activePlacementCount: number;
  totalWeight: number;
  movementToday: number;
  movementMonth: number;
  overloadedZoneCount: number;
  craneCount: number;
  availableCraneCount: number;
  payload?: Prisma.InputJsonValue;
}

export interface YardWorkspaceSnapshotPayload {
  scopeKey: string;
  zoneId?: string | null;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  placementCount: number;
  totalWeight: number;
  payload?: Prisma.InputJsonValue;
}

@Injectable()
export class YardSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findDashboardSnapshot(snapshotDate: Date, scopeKey = 'ALL') {
    return this.prisma.yardDashboardSnapshot.findUnique({
      where: { scopeKey_snapshotDate: { scopeKey, snapshotDate } },
    });
  }

  findDashboardHistory(take = 12, scopeKey = 'ALL') {
    return this.prisma.yardDashboardSnapshot.findMany({
      where: { scopeKey },
      orderBy: { snapshotDate: 'desc' },
      take,
    });
  }

  findWorkspaceSnapshot(scopeKey = 'ALL') {
    return this.prisma.yardWorkspaceSnapshot.findUnique({
      where: { scopeKey },
    });
  }

  findWorkspaceSnapshots(zoneId?: string) {
    return this.prisma.yardWorkspaceSnapshot.findMany({
      where: { zoneId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async calculateDashboard(
    snapshotDate = new Date(),
  ): Promise<YardDashboardSnapshotPayload[]> {
    const today = this.startOfDay(snapshotDate);
    const month = new Date(today.getFullYear(), today.getMonth(), 1);
    const [
      totalZones,
      totalSlots,
      occupiedSlots,
      placements,
      weight,
      movementToday,
      movementMonth,
      movementGroups,
      cranes,
      zoneRows,
    ] = await Promise.all([
      this.prisma.yardZone.count(),
      this.prisma.yardSlot.count(),
      this.prisma.yardSlot.count({ where: { status: 'OCCUPIED' } }),
      this.prisma.yardItemPlacement.count({ where: { removedAt: null } }),
      this.prisma.yardItemPlacement.aggregate({
        where: { removedAt: null },
        _sum: { weight: true },
      }),
      this.prisma.yardMovement.count({ where: { createdAt: { gte: today } } }),
      this.prisma.yardMovement.count({ where: { createdAt: { gte: month } } }),
      this.prisma.yardMovement.groupBy({ by: ['type'], _count: true }),
      this.prisma.crane.findMany({ select: { status: true } }),
      this.zoneRows(),
    ]);
    const zoneUtilization = this.zoneUtilization(zoneRows);

    return [
      {
        scopeKey: 'ALL',
        snapshotDate: today,
        totalZones,
        totalSlots,
        occupiedSlots,
        availableSlots: Math.max(0, totalSlots - occupiedSlots),
        activePlacementCount: placements,
        totalWeight: Number(weight._sum.weight ?? 0),
        movementToday,
        movementMonth,
        overloadedZoneCount: zoneUtilization.filter(
          (row) => row.occupancyRate >= 90,
        ).length,
        craneCount: cranes.length,
        availableCraneCount: cranes.filter(
          (row) => row.status !== 'MAINTENANCE',
        ).length,
        payload: this.toJson({
          movementCounts: movementGroups.map((row) => ({
            type: row.type,
            count: row._count,
          })),
          zoneUtilization,
        }),
      },
    ];
  }

  async calculateWorkspaceSnapshots(
    zoneId?: string,
  ): Promise<YardWorkspaceSnapshotPayload[]> {
    const zones = await this.prisma.yardZone.findMany({
      where: { id: zoneId },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        slots: {
          orderBy: { code: 'asc' },
          select: {
            id: true,
            code: true,
            status: true,
            currentStackLevel: true,
            maxStackLevel: true,
            placements: {
              where: { removedAt: null },
              select: { id: true, weight: true },
            },
          },
        },
      },
    });
    const zoneRows = zones.map((zone) => this.workspaceRow(zone));
    const global = zoneRows.reduce<YardWorkspaceSnapshotPayload>(
      (row, zone) => ({
        ...row,
        totalSlots: row.totalSlots + zone.totalSlots,
        occupiedSlots: row.occupiedSlots + zone.occupiedSlots,
        availableSlots: row.availableSlots + zone.availableSlots,
        placementCount: row.placementCount + zone.placementCount,
        totalWeight: row.totalWeight + zone.totalWeight,
      }),
      {
        scopeKey: 'ALL',
        zoneId: null,
        totalSlots: 0,
        occupiedSlots: 0,
        availableSlots: 0,
        placementCount: 0,
        totalWeight: 0,
        payload: this.toJson({ zoneCount: zones.length }),
      },
    );

    return zoneId ? zoneRows : [global, ...zoneRows];
  }

  upsertDashboard(
    payload: YardDashboardSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.yardDashboardSnapshot.upsert({
      where: {
        scopeKey_snapshotDate: {
          scopeKey: payload.scopeKey,
          snapshotDate: payload.snapshotDate,
        },
      },
      create: payload,
      update: {
        totalZones: payload.totalZones,
        totalSlots: payload.totalSlots,
        occupiedSlots: payload.occupiedSlots,
        availableSlots: payload.availableSlots,
        activePlacementCount: payload.activePlacementCount,
        totalWeight: payload.totalWeight,
        movementToday: payload.movementToday,
        movementMonth: payload.movementMonth,
        overloadedZoneCount: payload.overloadedZoneCount,
        craneCount: payload.craneCount,
        availableCraneCount: payload.availableCraneCount,
        payload: payload.payload,
      },
    });
  }

  upsertWorkspace(
    payload: YardWorkspaceSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.yardWorkspaceSnapshot.upsert({
      where: { scopeKey: payload.scopeKey },
      create: payload,
      update: {
        zoneId: payload.zoneId,
        totalSlots: payload.totalSlots,
        occupiedSlots: payload.occupiedSlots,
        availableSlots: payload.availableSlots,
        placementCount: payload.placementCount,
        totalWeight: payload.totalWeight,
        payload: payload.payload,
      },
    });
  }

  private zoneRows() {
    return this.prisma.yardZone.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        slots: { select: { status: true } },
      },
    });
  }

  private zoneUtilization(
    zones: Array<{
      id: string;
      code: string;
      name: string;
      slots: Array<{ status: string }>;
    }>,
  ) {
    return zones.map((zone) => {
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
  }

  private workspaceRow(zone: {
    id: string;
    code: string;
    name: string;
    slots: Array<{
      id: string;
      code: string;
      status: string;
      currentStackLevel: number;
      maxStackLevel: number;
      placements: Array<{ id: string; weight: number | null }>;
    }>;
  }): YardWorkspaceSnapshotPayload {
    const placements = zone.slots.flatMap((slot) => slot.placements);
    const occupiedSlots = zone.slots.filter(
      (slot) => slot.status === 'OCCUPIED',
    ).length;
    return {
      scopeKey: `ZONE:${zone.id}`,
      zoneId: zone.id,
      totalSlots: zone.slots.length,
      occupiedSlots,
      availableSlots: Math.max(0, zone.slots.length - occupiedSlots),
      placementCount: placements.length,
      totalWeight: placements.reduce(
        (sum, row) => sum + Number(row.weight ?? 0),
        0,
      ),
      payload: this.toJson({
        zoneCode: zone.code,
        zoneName: zone.name,
        slots: zone.slots.map((slot) => ({
          id: slot.id,
          code: slot.code,
          status: slot.status,
          currentStackLevel: slot.currentStackLevel,
          maxStackLevel: slot.maxStackLevel,
          placementCount: slot.placements.length,
        })),
      }),
    };
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toJson(value: Record<string, unknown>) {
    return value as Prisma.InputJsonValue;
  }
}
