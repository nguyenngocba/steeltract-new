import { Inject, Injectable } from '@nestjs/common';

import { TransactionType } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';
import { PerformanceMetricsService } from '../../core/performance/performance-metrics.service';
import { DashboardReaderService } from '../../core/snapshots/dashboard-reader.service';
import { SnapshotReaderService } from '../../core/snapshots/snapshot-reader.service';
import { InventoryRepository } from '../inventory/inventory.repository';

type InventoryDashboardLine = {
  transactionId: string;
  transactionNo: string | null;
  code: string;
  type: TransactionType;
  transactionDate: Date;
  createdAt: Date;
  inventoryItemId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
};

type InventoryDashboardItem = {
  id: string;
  code: string;
  name: string;
  unit: string;
  categoryName: string;
  quantity: number;
  minimumStock: number;
  stock: number;
};

type InventoryDashboardSnapshot = {
  generatedAt: Date;
  items: InventoryDashboardItem[];
  stockByItem: Map<string, number>;
  recentLines90d: InventoryDashboardLine[];
  transactionCount: number;
};

type MaterialUsageWindow = {
  current30d: number;
  previous30d: number;
  total90d: number;
};

const cacheTtlMs = 30_000;

function daysAgo(days: number) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  value.setHours(0, 0, 0, 0);
  return value;
}

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function absoluteQuantity(value: number | null | undefined) {
  return Math.abs(toNumber(value));
}

@Injectable()
export class DashboardInventoryReadModelService {
  private cache: {
    expiresAt: number;
    snapshot: InventoryDashboardSnapshot;
  } | null = null;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(InventoryRepository)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(PerformanceMetricsService)
    private readonly metrics: PerformanceMetricsService,
    @Inject(DashboardReaderService)
    private readonly dashboardReader: DashboardReaderService,
    @Inject(SnapshotReaderService)
    private readonly snapshotReader: SnapshotReaderService,
  ) {}

  async getSnapshot() {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      this.metrics.recordReadModelHit();
      return this.cache.snapshot;
    }

    const since90 = daysAgo(90);
    const [items, locationStocks, recentTransactions, transactionCount] =
      await this.inventoryRepository.findDashboardSnapshotSources(since90);

    const stockByItem = new Map<string, number>();
    for (const stock of locationStocks) {
      stockByItem.set(
        stock.inventoryItemId,
        (stockByItem.get(stock.inventoryItemId) ?? 0) +
          toNumber(stock.quantity),
      );
    }

    const mappedItems = items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      unit: item.unit ?? item.unitMaster?.symbol ?? '',
      categoryName: item.category?.name ?? 'Khác',
      quantity: toNumber(item.quantity),
      minimumStock: toNumber(item.minimumStock),
      stock: stockByItem.has(item.id)
        ? stockByItem.get(item.id)!
        : toNumber(item.quantity),
    }));

    const recentLines90d = recentTransactions.flatMap((transaction) =>
      transaction.items.map((line) => ({
        transactionId: transaction.id,
        transactionNo: transaction.transactionNo,
        code: transaction.code,
        type: transaction.type,
        transactionDate: transaction.transactionDate,
        createdAt: transaction.createdAt,
        inventoryItemId: line.inventoryItemId,
        materialCode: line.inventoryItem?.code ?? '',
        materialName: line.inventoryItem?.name ?? '',
        quantity: toNumber(line.quantity),
      })),
    );

    const snapshot = {
      generatedAt: new Date(),
      items: mappedItems,
      stockByItem,
      recentLines90d,
      transactionCount,
    };

    this.cache = {
      expiresAt: now + cacheTtlMs,
      snapshot,
    };

    return snapshot;
  }

  async getStats() {
    const snapshot = await this.getSnapshot();
    return {
      inventoryCount: snapshot.items.length,
      transactionCount: snapshot.transactionCount,
      lowStockCount: snapshot.items.filter(
        (item) => item.stock <= item.minimumStock,
      ).length,
    };
  }

  async getLowStockItems() {
    const snapshot = await this.getSnapshot();
    return snapshot.items
      .filter((item) => item.stock <= item.minimumStock)
      .map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        unit: item.unit,
        quantity: item.stock,
        minimumStock: item.minimumStock,
        category: {
          name: item.categoryName,
        },
      }));
  }

  async getProcurementSuggestions() {
    const lowStock = await this.getLowStockItems();
    return lowStock.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      quantity: item.quantity,
      minimumStock: item.minimumStock,
      suggestedOrder: item.minimumStock * 2 - item.quantity,
    }));
  }

  async getAnomalies() {
    const snapshot = await this.getSnapshot();
    return snapshot.items.filter((item) => item.stock < item.minimumStock / 2);
  }

  async getRecentTransactions(take = 5) {
    return this.inventoryRepository.findRecentDashboardTransactions(take);
  }

  async getCockpitInventory() {
    const today = this.startOfDay(new Date());
    const result = await this.dashboardReader.read({
      module: 'inventory',
      snapshotType: 'InventoryDashboardSnapshot',
      loadSnapshot: async () => {
        const rows = await this.snapshotReader.inventoryDashboard(today);
        if (rows.length === 0) {
          return null;
        }
        return {
          data: rows,
          updatedAt: rows.reduce(
            (oldest, row) =>
              row.updatedAt.getTime() < oldest.getTime()
                ? row.updatedAt
                : oldest,
            rows[0].updatedAt,
          ),
          rowCount: rows.length,
        };
      },
      readSnapshot: async (rows) => {
        const compatible = await this.getCockpitInventoryRuntime();
        return {
          ...compatible,
          inventoryTotal: rows.reduce(
            (sum, row) => sum + Number(row.totalStock ?? 0),
            0,
          ),
          lowStockCount: rows.reduce(
            (sum, row) => sum + Number(row.lowStockCount ?? 0),
            0,
          ),
        };
      },
      readRuntime: () => this.getCockpitInventoryRuntime(),
      compare: (snapshot, runtime) =>
        this.compareNumericFields(snapshot, runtime, [
          'inventoryTotal',
          'lowStockCount',
        ]),
    });

    if (result.source === 'snapshot') {
      this.metrics.recordInventoryReadModelHit();
    } else {
      this.metrics.recordInventoryFallback();
    }

    return result.data;
  }

  private async getCockpitInventoryRuntime() {
    const snapshot = await this.getSnapshot();
    const since = daysAgo(6);
    const distribution = new Map<string, number>();
    let inventoryTotal = 0;
    const inboundTransactions = new Set<string>();
    const outboundTransactions = new Set<string>();

    for (const item of snapshot.items) {
      inventoryTotal += item.stock;
      distribution.set(
        item.categoryName,
        (distribution.get(item.categoryName) ?? 0) + item.stock,
      );
    }

    const trend = new Map<string, number>();
    for (let index = 0; index < 7; index += 1) {
      const day = new Date(since);
      day.setDate(since.getDate() + index);
      trend.set(day.toISOString().slice(5, 10), 0);
    }

    for (const line of snapshot.recentLines90d) {
      if (line.type === TransactionType.IMPORT) {
        inboundTransactions.add(line.transactionId);
      }
      if (line.type === TransactionType.EXPORT) {
        outboundTransactions.add(line.transactionId);
      }
      if (line.transactionDate < since) continue;

      const key = line.transactionDate.toISOString().slice(5, 10);
      trend.set(key, (trend.get(key) ?? 0) + absoluteQuantity(line.quantity));
    }

    return {
      inventoryTotal,
      inboundTransactions: inboundTransactions.size,
      outboundTransactions: outboundTransactions.size,
      lowStockCount: snapshot.items.filter(
        (item) => item.stock <= item.minimumStock,
      ).length,
      distribution: Array.from(distribution.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value]) => ({ label, value })),
      movementTrend: Array.from(trend.entries()).map(([label, value]) => ({
        label,
        value,
      })),
    };
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private compareNumericFields<T extends Record<string, unknown>>(
    snapshot: T,
    runtime: T,
    fields: string[],
  ) {
    return fields.flatMap((field) => {
      const snapshotValue = Number(snapshot[field] ?? 0);
      const runtimeValue = Number(runtime[field] ?? 0);
      if (Math.abs(snapshotValue - runtimeValue) <= 0.0001) {
        return [];
      }
      return [
        {
          field,
          snapshotValue,
          runtimeValue,
          reason: 'VALUE_MISMATCH' as const,
        },
      ];
    });
  }

  async getForecastReadModel() {
    const snapshot = await this.getSnapshot();
    const since30 = daysAgo(30);
    const since60 = daysAgo(60);
    const usageByItem = new Map<string, MaterialUsageWindow>();
    let inbound30 = 0;
    let outbound30 = 0;
    let outbound90 = 0;

    for (const line of snapshot.recentLines90d) {
      const isCurrent30 = line.transactionDate >= since30;
      const isPrevious30 =
        line.transactionDate >= since60 && line.transactionDate < since30;
      const isOutbound = line.type === TransactionType.EXPORT;
      const isInbound =
        line.type === TransactionType.IMPORT ||
        line.type === TransactionType.RETURN;
      const qty = absoluteQuantity(line.quantity);

      if (isCurrent30 && isInbound) inbound30 += qty;
      if (isCurrent30 && isOutbound) outbound30 += qty;
      if (isOutbound) outbound90 += qty;

      if (!isOutbound) continue;

      const current = usageByItem.get(line.inventoryItemId) ?? {
        current30d: 0,
        previous30d: 0,
        total90d: 0,
      };

      if (isCurrent30) current.current30d += qty;
      if (isPrevious30) current.previous30d += qty;
      current.total90d += qty;
      usageByItem.set(line.inventoryItemId, current);
    }

    return {
      items: snapshot.items,
      stockByItem: snapshot.stockByItem,
      usageByItem,
      inbound30,
      outbound30,
      outbound90,
    };
  }
}
