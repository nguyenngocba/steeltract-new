import { Injectable } from '@nestjs/common';
import {
  HistoricalDashboardModule,
  Prisma,
  SnapshotJobStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type DashboardSnapshotFilters = {
  date: Date;
  module: HistoricalDashboardModule;
  scopeKey: string;
  authoritative?: boolean;
};

export type LatestDashboardSnapshotFilters = {
  module: HistoricalDashboardModule;
  scopeKey: string;
};

export type DashboardMonthlyFilters = {
  from?: Date;
  to?: Date;
  module: HistoricalDashboardModule;
  scopeKey: string;
  authoritative?: boolean;
  skip: number;
  take: number;
};

export type InventorySnapshotFilters = {
  date: Date;
  warehouseId?: string;
  authoritative?: boolean;
  skip: number;
  take: number;
};

export type InventoryMonthlyFilters = {
  from?: Date;
  to?: Date;
  warehouseId?: string;
  authoritative?: boolean;
  skip: number;
  take: number;
};

export type SnapshotJobsFilters = {
  status?: SnapshotJobStatus;
  module?: HistoricalDashboardModule;
  date?: Date;
  skip: number;
  take: number;
};

@Injectable()
export class HistoricalDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDashboardSnapshot(filters: DashboardSnapshotFilters) {
    return this.prisma.dashboardSnapshot.findFirst({
      where: {
        snapshotDate: filters.date,
        module: filters.module,
        scopeKey: filters.scopeKey,
        authoritative: filters.authoritative,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });
  }

  findLatestDashboardSnapshot(filters: LatestDashboardSnapshotFilters) {
    return this.prisma.dashboardSnapshot.findFirst({
      where: {
        module: filters.module,
        scopeKey: filters.scopeKey,
        authoritative: true,
      },
      orderBy: [
        { snapshotDate: 'desc' },
        { generatedAt: 'desc' },
      ],
    });
  }

  async findDashboardMonthlyRollups(filters: DashboardMonthlyFilters) {
    const where: Prisma.DashboardMonthlyRollupWhereInput = {
      module: filters.module,
      scopeKey: filters.scopeKey,
      authoritative: filters.authoritative,
      monthStart: this.dateRange(filters.from, filters.to),
    };

    const [data, total] = await Promise.all([
      this.prisma.dashboardMonthlyRollup.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy: {
          monthStart: 'desc',
        },
      }),
      this.prisma.dashboardMonthlyRollup.count({ where }),
    ]);

    return { data, total };
  }

  async findInventorySnapshots(filters: InventorySnapshotFilters) {
    const where: Prisma.InventoryBalanceSnapshotWhereInput = {
      snapshotDate: filters.date,
      warehouseId: filters.warehouseId,
      metadata: this.authoritativeJsonFilter(filters.authoritative),
    };

    const [data, total] = await Promise.all([
      this.prisma.inventoryBalanceSnapshot.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy: [
          { materialCode: 'asc' },
          { locationBucketKey: 'asc' },
        ],
      }),
      this.prisma.inventoryBalanceSnapshot.count({ where }),
    ]);

    return { data, total };
  }

  async findInventoryMonthlyRollups(filters: InventoryMonthlyFilters) {
    const where: Prisma.InventoryMonthlyRollupWhereInput = {
      monthStart: this.dateRange(filters.from, filters.to),
      warehouseId: filters.warehouseId,
      metadata: this.authoritativeJsonFilter(filters.authoritative),
    };

    const [data, total] = await Promise.all([
      this.prisma.inventoryMonthlyRollup.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy: [
          { monthStart: 'desc' },
          { materialCode: 'asc' },
        ],
      }),
      this.prisma.inventoryMonthlyRollup.count({ where }),
    ]);

    return { data, total };
  }

  async findSnapshotJobs(filters: SnapshotJobsFilters) {
    const where: Prisma.SnapshotJobWhereInput = {
      status: filters.status,
      module: filters.module,
      OR: filters.date
        ? [
            { snapshotDate: filters.date },
            { fromDate: { lte: filters.date }, toDate: { gte: filters.date } },
          ]
        : undefined,
    };

    const [data, total] = await Promise.all([
      this.prisma.snapshotJob.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
      }),
      this.prisma.snapshotJob.count({ where }),
    ]);

    return { data, total };
  }

  private dateRange(from?: Date, to?: Date) {
    if (!from && !to) {
      return undefined;
    }

    return {
      gte: from,
      lte: to,
    };
  }

  private authoritativeJsonFilter(authoritative?: boolean) {
    if (authoritative === undefined) {
      return undefined;
    }

    return {
      path: ['authoritative'],
      equals: authoritative,
    };
  }
}
