import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  DashboardMonthlyQueryDto,
  DashboardSnapshotQueryDto,
  HistoricalPaginatedResponseDto,
  InventoryMonthlyQueryDto,
  InventorySnapshotQueryDto,
  LatestDashboardSnapshotQueryDto,
  SnapshotJobsQueryDto,
} from './historical-dashboard.dto';
import { HistoricalDashboardRepository } from './historical-dashboard.repository';
import {
  formatSnapshotBusinessDate,
  parseSnapshotBusinessDate,
} from '../historical-snapshots/snapshot-business-date';

@Injectable()
export class HistoricalDashboardService {
  constructor(private readonly repository: HistoricalDashboardRepository) {}

  async dashboard(query: DashboardSnapshotQueryDto) {
    const snapshot = await this.repository.findDashboardSnapshot({
      date: this.toDate(query.date),
      module: query.module,
      scopeKey: this.scopeKey(query.warehouse),
      authoritative: query.authoritative,
    });

    if (!snapshot) {
      throw new NotFoundException('Historical dashboard snapshot not found');
    }

    return this.serialize(snapshot);
  }

  async latestDashboard(query: LatestDashboardSnapshotQueryDto) {
    const snapshot = await this.repository.findLatestDashboardSnapshot({
      module: query.module,
      scopeKey: this.scopeKey(query.warehouse),
    });

    if (!snapshot) {
      throw new NotFoundException(
        'Latest authoritative dashboard snapshot not found',
      );
    }

    return this.serialize(snapshot);
  }

  async dashboardMonthly(
    query: DashboardMonthlyQueryDto,
  ): Promise<HistoricalPaginatedResponseDto<unknown>> {
    const page = query.page;
    const pageSize = query.pageSize;
    const { data, total } = await this.repository.findDashboardMonthlyRollups({
      from: query.from ? this.toDate(query.from) : undefined,
      to: query.to ? this.toDate(query.to) : undefined,
      module: query.module,
      scopeKey: this.scopeKey(query.warehouse),
      authoritative: query.authoritative,
      skip: this.skip(page, pageSize),
      take: pageSize,
    });

    return this.paginated(data, page, pageSize, total);
  }

  async inventory(
    query: InventorySnapshotQueryDto,
  ): Promise<HistoricalPaginatedResponseDto<unknown>> {
    const page = query.page;
    const pageSize = query.pageSize;
    const { data, total } = await this.repository.findInventorySnapshots({
      date: this.toDate(query.date),
      warehouseId: query.warehouse,
      authoritative: query.authoritative,
      skip: this.skip(page, pageSize),
      take: pageSize,
    });

    return this.paginated(data, page, pageSize, total);
  }

  async inventoryMonthly(
    query: InventoryMonthlyQueryDto,
  ): Promise<HistoricalPaginatedResponseDto<unknown>> {
    const page = query.page;
    const pageSize = query.pageSize;
    const { data, total } = await this.repository.findInventoryMonthlyRollups({
      from: query.from ? this.toDate(query.from) : undefined,
      to: query.to ? this.toDate(query.to) : undefined,
      warehouseId: query.warehouse,
      authoritative: query.authoritative,
      skip: this.skip(page, pageSize),
      take: pageSize,
    });

    return this.paginated(data, page, pageSize, total);
  }

  async jobs(
    query: SnapshotJobsQueryDto,
  ): Promise<HistoricalPaginatedResponseDto<unknown>> {
    const page = query.page;
    const pageSize = query.pageSize;
    const { data, total } = await this.repository.findSnapshotJobs({
      status: query.status,
      module: query.module,
      date: query.date ? this.toDate(query.date) : undefined,
      skip: this.skip(page, pageSize),
      take: pageSize,
    });

    return this.paginated(data, page, pageSize, total);
  }

  private scopeKey(warehouse?: string) {
    return warehouse ?? 'ALL';
  }

  private toDate(value: string) {
    return parseSnapshotBusinessDate(value);
  }

  private skip(page: number, pageSize: number) {
    return (page - 1) * pageSize;
  }

  private paginated<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number,
  ): HistoricalPaginatedResponseDto<unknown> {
    return {
      data: data.map((row) => this.serialize(row)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private serialize(value: unknown): unknown {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (this.isPrismaDecimal(value)) {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.serialize(item));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [
          key,
          this.isBusinessDateField(key, nested)
            ? formatSnapshotBusinessDate(nested)
            : this.serialize(nested),
        ]),
      );
    }

    return value;
  }

  private isPrismaDecimal(value: unknown): value is Prisma.Decimal {
    const decimal = Prisma.Decimal as unknown as {
      isDecimal?: (candidate: unknown) => boolean;
    };

    if (decimal.isDecimal?.(value)) {
      return true;
    }

    return (
      Boolean(value) &&
      typeof value === 'object' &&
      value?.constructor?.name === 'Decimal'
    );
  }

  private isBusinessDateField(key: string, value: unknown): value is Date {
    return (
      value instanceof Date &&
      [
        'snapshotDate',
        'monthStart',
        'fromDate',
        'toDate',
        'lastSuccessfulSnapshotDate',
        'staleFromDate',
      ].includes(key)
    );
  }
}
