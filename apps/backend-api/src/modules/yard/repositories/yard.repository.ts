import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type YardTx = Prisma.TransactionClient;

@Injectable()
export class YardRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: YardTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  createZone(data: Prisma.YardZoneCreateInput, tx: YardTx = this.prisma) {
    return tx.yardZone.create({
      data,
      include: this.zoneInclude(),
    });
  }

  updateZone(
    id: string,
    data: Prisma.YardZoneUpdateInput,
    tx: YardTx = this.prisma,
  ) {
    return tx.yardZone.update({
      where: { id },
      data,
      include: this.zoneInclude(),
    });
  }

  findZoneById(id: string, tx: YardTx = this.prisma) {
    return tx.yardZone.findUnique({
      where: { id },
      include: this.zoneInclude(),
    });
  }

  findZones(params: {
    search?: string;
    status?: Prisma.EnumYardZoneStatusFilter['equals'];
    skip?: number;
    take?: number;
  }) {
    return this.prisma.yardZone.findMany({
      where: this.zoneWhere(params),
      include: this.zoneInclude(),
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countZones(params: {
    search?: string;
    status?: Prisma.EnumYardZoneStatusFilter['equals'];
  }) {
    return this.prisma.yardZone.count({
      where: this.zoneWhere(params),
    });
  }

  createRow(data: Prisma.YardRowCreateInput, tx: YardTx = this.prisma) {
    return tx.yardRow.create({
      data,
      include: {
        zone: true,
        slots: true,
      },
    });
  }

  createSlot(data: Prisma.YardSlotCreateInput, tx: YardTx = this.prisma) {
    return tx.yardSlot.create({
      data,
      include: this.slotInclude(),
    });
  }

  updateSlot(
    id: string,
    data: Prisma.YardSlotUpdateInput,
    tx: YardTx = this.prisma,
  ) {
    return tx.yardSlot.update({
      where: { id },
      data,
      include: this.slotInclude(),
    });
  }

  findSlotById(id: string, tx: YardTx = this.prisma) {
    return tx.yardSlot.findUnique({
      where: { id },
      include: this.slotInclude(),
    });
  }

  findSlots(params: {
    zoneId?: string;
    rowId?: string;
    status?: Prisma.EnumYardSlotStatusFilter['equals'];
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.yardSlot.findMany({
      where: this.slotWhere(params),
      include: this.slotInclude(),
      orderBy: [{ zoneId: 'asc' }, { code: 'asc' }],
      skip: params.skip,
      take: params.take,
    });
  }

  countSlots(params: {
    zoneId?: string;
    rowId?: string;
    status?: Prisma.EnumYardSlotStatusFilter['equals'];
    search?: string;
  }) {
    return this.prisma.yardSlot.count({
      where: this.slotWhere(params),
    });
  }

  createPlacement(data: Prisma.YardItemPlacementCreateInput, tx: YardTx) {
    return tx.yardItemPlacement.create({
      data,
      include: this.placementInclude(),
    });
  }

  updatePlacement(
    id: string,
    data: Prisma.YardItemPlacementUpdateInput,
    tx: YardTx,
  ) {
    return tx.yardItemPlacement.update({
      where: { id },
      data,
      include: this.placementInclude(),
    });
  }

  findPlacementById(id: string, tx: YardTx = this.prisma) {
    return tx.yardItemPlacement.findUnique({
      where: { id },
      include: this.placementInclude(),
    });
  }

  findActivePlacementsForSlot(slotId: string, tx: YardTx = this.prisma) {
    return tx.yardItemPlacement.findMany({
      where: {
        slotId,
        removedAt: null,
      },
      orderBy: {
        stackLevel: 'asc',
      },
    });
  }

  searchPlacements(params: {
    search?: string;
    itemType?: Prisma.EnumYardItemTypeFilter['equals'];
    zoneId?: string;
    includeRemoved?: boolean;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.yardItemPlacement.findMany({
      where: this.placementWhere(params),
      include: this.placementInclude(),
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countPlacements(params: {
    search?: string;
    itemType?: Prisma.EnumYardItemTypeFilter['equals'];
    zoneId?: string;
    includeRemoved?: boolean;
  }) {
    return this.prisma.yardItemPlacement.count({
      where: this.placementWhere(params),
    });
  }

  createMovement(data: Prisma.YardMovementCreateInput, tx: YardTx) {
    return tx.yardMovement.create({
      data,
      include: this.movementInclude(),
    });
  }

  findMovements(params: {
    itemType?: Prisma.EnumYardItemTypeFilter['equals'];
    itemId?: string;
    itemCode?: string;
    slotId?: string;
    craneId?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.yardMovement.findMany({
      where: this.movementWhere(params),
      include: this.movementInclude(),
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countMovements(params: {
    itemType?: Prisma.EnumYardItemTypeFilter['equals'];
    itemId?: string;
    itemCode?: string;
    slotId?: string;
    craneId?: string;
  }) {
    return this.prisma.yardMovement.count({
      where: this.movementWhere(params),
    });
  }

  createCrane(data: Prisma.CraneCreateInput) {
    return this.prisma.crane.create({ data });
  }

  updateCrane(id: string, data: Prisma.CraneUpdateInput) {
    return this.prisma.crane.update({
      where: { id },
      data,
    });
  }

  listCranes() {
    return this.prisma.crane.findMany({
      orderBy: { name: 'asc' },
    });
  }

  createSnapshot(data: Prisma.YardSnapshotCreateInput, tx: YardTx) {
    return tx.yardSnapshot.create({
      data,
      include: {
        zone: true,
      },
    });
  }

  listSnapshots(params: { zoneId?: string; skip?: number; take?: number }) {
    return this.prisma.yardSnapshot.findMany({
      where: {
        zoneId: params.zoneId,
      },
      include: {
        zone: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countSnapshots(params: { zoneId?: string }) {
    return this.prisma.yardSnapshot.count({
      where: {
        zoneId: params.zoneId,
      },
    });
  }

  snapshotSource(zoneId?: string, tx: YardTx = this.prisma) {
    return tx.yardZone.findMany({
      where: {
        id: zoneId,
      },
      include: {
        rows: {
          orderBy: {
            index: 'asc',
          },
        },
        slots: {
          include: {
            placements: {
              where: {
                removedAt: null,
              },
              orderBy: {
                stackLevel: 'asc',
              },
            },
          },
          orderBy: {
            code: 'asc',
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  metrics() {
    return this.prisma.$transaction(async (tx) => {
      const [zones, totalSlots, occupiedSlots, placements, cranes] =
        await Promise.all([
          tx.yardZone.count(),
          tx.yardSlot.count(),
          tx.yardSlot.count({ where: { status: 'OCCUPIED' } }),
          tx.yardItemPlacement.count({ where: { removedAt: null } }),
          tx.crane.findMany(),
        ]);

      const zoneUtilization = await tx.yardZone.findMany({
        include: {
          _count: {
            select: {
              slots: true,
            },
          },
          slots: {
            select: {
              status: true,
              currentStackLevel: true,
              maxStackLevel: true,
            },
          },
        },
        orderBy: {
          code: 'asc',
        },
      });

      return {
        zones,
        totalSlots,
        occupiedSlots,
        placements,
        occupancyRate:
          totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
        cranes,
        zoneUtilization: zoneUtilization.map((zone) => {
          const occupied = zone.slots.filter(
            (slot) => slot.status === 'OCCUPIED',
          ).length;

          return {
            id: zone.id,
            code: zone.code,
            name: zone.name,
            totalSlots: zone._count.slots,
            occupiedSlots: occupied,
            occupancyRate:
              zone._count.slots > 0
                ? Math.round((occupied / zone._count.slots) * 100)
                : 0,
          };
        }),
      };
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    tx: YardTx = this.prisma,
  ) {
    return tx.activityLog.create({ data });
  }

  zoneInclude() {
    return {
      rows: {
        orderBy: {
          index: 'asc' as const,
        },
      },
      slots: {
        orderBy: {
          code: 'asc' as const,
        },
      },
    };
  }

  slotInclude() {
    return {
      zone: true,
      row: true,
      placements: {
        where: {
          removedAt: null,
        },
        orderBy: {
          stackLevel: 'asc' as const,
        },
      },
    };
  }

  placementInclude() {
    return {
      slot: {
        include: {
          zone: true,
          row: true,
        },
      },
      movements: {
        orderBy: {
          createdAt: 'desc' as const,
        },
        take: 20,
      },
    };
  }

  movementInclude() {
    return {
      placement: true,
      fromSlot: {
        include: {
          zone: true,
          row: true,
        },
      },
      toSlot: {
        include: {
          zone: true,
          row: true,
        },
      },
      crane: true,
    };
  }

  private zoneWhere(params: {
    search?: string;
    status?: Prisma.EnumYardZoneStatusFilter['equals'];
  }): Prisma.YardZoneWhereInput {
    return {
      status: params.status,
      OR: params.search
        ? [
            { code: { contains: params.search, mode: 'insensitive' } },
            { name: { contains: params.search, mode: 'insensitive' } },
            {
              description: { contains: params.search, mode: 'insensitive' },
            },
          ]
        : undefined,
    };
  }

  private slotWhere(params: {
    zoneId?: string;
    rowId?: string;
    status?: Prisma.EnumYardSlotStatusFilter['equals'];
    search?: string;
  }): Prisma.YardSlotWhereInput {
    return {
      zoneId: params.zoneId,
      rowId: params.rowId,
      status: params.status,
      OR: params.search
        ? [{ code: { contains: params.search, mode: 'insensitive' } }]
        : undefined,
    };
  }

  private placementWhere(params: {
    search?: string;
    itemType?: Prisma.EnumYardItemTypeFilter['equals'];
    zoneId?: string;
    includeRemoved?: boolean;
  }): Prisma.YardItemPlacementWhereInput {
    return {
      itemType: params.itemType,
      removedAt: params.includeRemoved ? undefined : null,
      slot: {
        zoneId: params.zoneId,
      },
      OR: params.search
        ? [
            { itemCode: { contains: params.search, mode: 'insensitive' } },
            { itemName: { contains: params.search, mode: 'insensitive' } },
            { itemId: { contains: params.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
  }

  private movementWhere(params: {
    itemType?: Prisma.EnumYardItemTypeFilter['equals'];
    itemId?: string;
    itemCode?: string;
    slotId?: string;
    craneId?: string;
  }): Prisma.YardMovementWhereInput {
    return {
      itemType: params.itemType,
      itemId: params.itemId,
      itemCode: params.itemCode,
      craneId: params.craneId,
      OR: params.slotId
        ? [{ fromSlotId: params.slotId }, { toSlotId: params.slotId }]
        : undefined,
    };
  }
}
