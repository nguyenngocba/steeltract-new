import { Injectable } from '@nestjs/common';

import { TransactionType } from '@prisma/client';

import { SnapshotReaderService } from '../../core/snapshots/snapshot-reader.service';
import { SnapshotUpdateDispatcher } from '../../core/jobs/snapshot-update-dispatcher.service';
import { PerformanceMetricsService } from '../../core/performance/performance-metrics.service';
import { InventoryRepository } from './inventory.repository';
import type {
  InventoryMaterialListQueryDto,
  InventoryOverviewQueryDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryReadModelService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly metrics: PerformanceMetricsService,
    private readonly snapshots: SnapshotReaderService,
    private readonly snapshotDispatcher: SnapshotUpdateDispatcher,
  ) {}

  async materialList(query: InventoryMaterialListQueryDto) {
    const [page, summary, facets] = await Promise.all([
      this.repository.listMaterialSnapshotPage(query),
      this.repository.materialSnapshotSummary(query),
      this.repository.materialSnapshotFacets(query),
    ]);
    const items = page.items.map((item: any) => this.toMaterialListRow(item));
    const totalPages = Math.max(1, Math.ceil(page.total / page.pageSize));

    if (items.some((item: any) => item.readSource !== 'snapshot')) {
      this.metrics.recordSnapshotFallback();
    } else {
      this.metrics.recordReadModelHit();
    }

    return {
      items,
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages,
      summary: this.normalizeSummary(summary),
      facets: {
        categories: facets[0],
        warehouses: facets[1],
      },
    };
  }

  async overview(query: InventoryOverviewQueryDto) {
    const [summary, facets, transactionMetrics, overviewHistory] = await Promise.all([
      this.repository.materialSnapshotSummary(query),
      this.repository.materialSnapshotFacets(query),
      this.repository.inventoryOverviewTransactionMetrics(),
      this.snapshots.inventoryOverviewHistory(12),
    ]);
    const transactionMap = (rows: any[]) =>
      Object.fromEntries(rows.map((row) => [
        this.toBusinessType(row.type),
        {
          documents: Number(row.documentCount ?? 0),
          quantity: Number(row.quantity ?? 0),
          value: Number(row.value ?? 0),
        },
      ]));
    const normalizedSummary = this.normalizeSummary(summary);
    const stockTrend = transactionMetrics.snapshotTrend
      .slice()
      .map((row: any) => ({
        date: row.snapshotDate,
        value: Number(row._sum.inventoryValue ?? 0),
        quantity: Number(row._sum.totalStock ?? 0),
      }))
      .reverse();
    const historicalMetrics = overviewHistory
      .slice()
      .reverse()
      .map((row) => ({
        date: row.snapshotDate,
        totalItems: row.totalMaterials,
        lowStock: row.lowStockCount,
        ...(row.outOfStockCount == null
          ? {}
          : { outOfStock: row.outOfStockCount }),
        ...(row.primaryMaterialCount == null
          ? {}
          : { primaryCount: row.primaryMaterialCount }),
        ...(row.primaryStock == null
          ? {}
          : { primaryStock: row.primaryStock }),
        ...(row.secondaryMaterialCount == null
          ? {}
          : { secondaryCount: row.secondaryMaterialCount }),
        ...(row.secondaryStock == null
          ? {}
          : { secondaryStock: row.secondaryStock }),
        ...(row.consumableMaterialCount == null
          ? {}
          : { consumableCount: row.consumableMaterialCount }),
        ...(row.consumableStock == null
          ? {}
          : { consumableStock: row.consumableStock }),
      }));

    this.metrics.recordReadModelHit();
    return {
      summary: normalizedSummary,
      facets: {
        categories: facets[0],
        warehouses: facets[1],
      },
      today: transactionMap(transactionMetrics.todayRows),
      month: transactionMap(transactionMetrics.monthRows),
      movementTrend: transactionMetrics.trendRows.map((row: any) => ({
        date: row.month,
        inboundValue: Number(row.inboundValue ?? 0),
        outboundValue: Number(row.outboundValue ?? 0),
      })),
      stockTrend,
      historicalMetrics,
      source: 'snapshot',
    };
  }

  async materialDetail(id: string) {
    const snapshot = await this.snapshots.inventoryMaterial(id);
    if (snapshot?.detailPayload && this.isFresh(snapshot.updatedAt)) {
      this.metrics.recordSnapshotAge(this.ageSeconds(snapshot.updatedAt));
      this.metrics.recordSnapshotConfidence(
        this.snapshotConfidence(snapshot.updatedAt),
      );
      return snapshot.detailPayload;
    }

    if (snapshot?.updatedAt) {
      this.metrics.recordSnapshotStale();
    }
    this.metrics.recordSnapshotFallback();
    await this.requestMaterialSnapshotRebuild(
      id,
      snapshot?.updatedAt ? 'stale-snapshot' : 'fallback-miss',
    );

    return this.materialDetailFromRepository(id);
  }

  async locations() {
    const snapshots = await this.snapshots.inventoryLocations();
    const fresh = snapshots.length > 0 && snapshots.every((row) => this.isFresh(row.updatedAt));
    if (fresh) {
      const oldest = snapshots.reduce((min, row) =>
        row.updatedAt.getTime() < min.getTime() ? row.updatedAt : min,
      snapshots[0].updatedAt);
      this.metrics.recordSnapshotAge(this.ageSeconds(oldest));
      this.metrics.recordSnapshotConfidence(this.snapshotConfidence(oldest));
      return this.locationsFromSnapshots(snapshots);
    }

    if (snapshots.length > 0) {
      this.metrics.recordSnapshotStale();
    }
    this.metrics.recordSnapshotFallback();
    await this.requestLocationSnapshotRebuild(
      snapshots.length > 0 ? 'stale-snapshot' : 'fallback-miss',
    );
    return this.locationsFromRepository();
  }

  private toMaterialListRow(item: any) {
    const allSnapshot = item.materialSnapshots.find(
      (snapshot: any) => snapshot.scopeKey === 'ALL',
    );
    const snapshotFresh = Boolean(
      allSnapshot?.updatedAt && this.isFresh(allSnapshot.updatedAt),
    );
    const locations = item.locationStocks.map((row: any) => ({
      zoneId: row.zoneId,
      zoneCode: row.zone?.code ?? null,
      zoneName: row.zone ? `${row.zone.code} - ${row.zone.name}` : null,
      slotId: row.slotId,
      level: row.level,
      row: row.zone?.row ?? null,
      column: row.zone?.column ?? null,
      warehouseName: row.zone?.warehouse?.name ?? null,
      warehouseCode: row.zone?.warehouse?.code ?? null,
      quantity: Number(row.quantity ?? 0),
    }));
    const currentStock = locations.reduce(
      (sum: number, row: any) => sum + Number(row.quantity ?? 0),
      0,
    );
    const averageCost =
      Number(allSnapshot?.currentStock ?? 0) > 0
        ? Number(allSnapshot?.inventoryValue ?? 0) /
          Number(allSnapshot.currentStock)
        : 0;

    return {
      materialId: item.id,
      materialCode: item.code,
      materialName: item.name,
      description: item.description,
      categoryId: item.categoryId,
      category: item.category?.name ?? '',
      materialTypeId: item.materialTypeId,
      materialType: item.materialType?.name ?? '',
      materialUsageType: item.materialUsageType,
      minimumStock: Number(item.minimumStock ?? 0),
      unit: item.unit ?? item.unitMaster?.code ?? 'PCS',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      zoneId: item.zoneId,
      slotId: item.slotId,
      level: item.level,
      zoneCode: item.zone?.code ?? '',
      zoneName: item.zone?.name ?? '',
      zone: item.zone ? `${item.zone.code} - ${item.zone.name}` : '',
      position: item.zone ? `${item.zone.code} - ${item.zone.name}` : '',
      locationBalances: locations,
      currentStock,
      averageCost,
      inventoryValue: currentStock * averageCost,
      lastMovementDate:
        allSnapshot?.lastInboundAt && allSnapshot?.lastOutboundAt
          ? new Date(allSnapshot.lastInboundAt) > new Date(allSnapshot.lastOutboundAt)
            ? allSnapshot.lastInboundAt
            : allSnapshot.lastOutboundAt
          : allSnapshot?.lastInboundAt ?? allSnapshot?.lastOutboundAt ?? null,
      readSource: snapshotFresh ? 'repository-live-stock' : 'repository-fallback',
      snapshotUpdatedAt: allSnapshot?.updatedAt ?? null,
    };
  }

  private normalizeSummary(row: any) {
    return {
      totalItems: Number(row?.totalItems ?? 0),
      totalStock: Number(row?.totalStock ?? 0),
      mainStock: Number(row?.mainStock ?? 0),
      productionStock: Number(row?.productionStock ?? 0),
      totalValue: Number(row?.totalValue ?? 0),
      lowStock: Number(row?.lowStock ?? 0),
      outOfStock: Number(row?.outOfStock ?? 0),
      primaryCount: Number(row?.primaryCount ?? 0),
      primaryStock: Number(row?.primaryStock ?? 0),
      secondaryCount: Number(row?.secondaryCount ?? 0),
      secondaryStock: Number(row?.secondaryStock ?? 0),
      consumableCount: Number(row?.consumableCount ?? 0),
      consumableStock: Number(row?.consumableStock ?? 0),
    };
  }

  private async materialDetailFromRepository(id: string) {
    const item = await this.repository.findItemById(id);
    if (!item) {
      throw new Error('Material not found');
    }

    const [locationStocks, transactions] = await Promise.all([
      this.repository.findPositiveLocationStocksByItem(id),
      this.repository.findTransactionsByItem(id),
    ]);

    const supplierIds = Array.from(
      new Set(transactions.map((tx) => tx.supplierId).filter(Boolean)),
    ) as string[];
    const suppliers = supplierIds.length
      ? await this.repository.findSuppliersByIds(supplierIds)
      : [];
    const supplierMap = new Map(
      suppliers.map((supplier) => [supplier.id, supplier]),
    );

    const currentStock = transactions.reduce(
      (acc, tx) =>
        acc +
        tx.items.reduce(
          (lineAcc, line) => lineAcc + Number(line.quantity ?? 0),
          0,
        ),
      0,
    );

    const inboundLines = transactions.flatMap((tx) =>
      tx.items
        .filter((line) => Number(line.quantity) > 0)
        .map((line) => ({
          transactionId: tx.id,
          type: this.toBusinessType(tx.type),
          transactionNo: tx.transactionNo ?? tx.code,
          referenceModule: tx.referenceModule,
          referenceId: tx.referenceId,
          note: tx.note,
          remarks: tx.remarks,
          transactionDate: tx.transactionDate,
          quantity: Number(line.quantity),
          unitPrice: line.unitPrice != null ? Number(line.unitPrice) : null,
          totalAmount: line.totalAmount != null ? Number(line.totalAmount) : null,
          signedQuantity: Number(line.quantity),
          unit: line.unit?.code ?? item.unit ?? item.unitMaster?.code ?? 'PCS',
          supplierId: tx.supplierId,
          supplierName: tx.supplierId
            ? supplierMap.get(tx.supplierId)?.name ?? tx.supplierId
            : null,
          projectId: tx.projectId,
          projectName: tx.project?.name ?? null,
          projectCode: tx.project?.code ?? null,
          zoneId: line.zoneId ?? tx.zoneId ?? item.zoneId ?? null,
          zoneCode: line.zone?.code ?? tx.zone?.code ?? item.zone?.code ?? null,
          zoneName: line.zone
            ? `${line.zone.code} - ${line.zone.name}`
            : tx.zone
              ? `${tx.zone.code} - ${tx.zone.name}`
              : item.zone
                ? `${item.zone.code} - ${item.zone.name}`
                : null,
          zoneRawName: line.zone?.name ?? tx.zone?.name ?? item.zone?.name ?? null,
          attachmentName: null,
        })),
    );

    const outboundLines = transactions.flatMap((tx) =>
      tx.items
        .filter((line) => Number(line.quantity) < 0)
        .map((line) => ({
          transactionId: tx.id,
          type: this.toBusinessType(tx.type),
          transactionNo: tx.transactionNo ?? tx.code,
          referenceModule: tx.referenceModule,
          referenceId: tx.referenceId,
          note: tx.note,
          remarks: tx.remarks,
          transactionDate: tx.transactionDate,
          quantity: Number(line.quantity),
          signedQuantity: Number(line.quantity),
          unitPrice: line.unitPrice != null ? Number(line.unitPrice) : null,
          totalAmount: line.totalAmount != null ? Number(line.totalAmount) : null,
          unit: line.unit?.code ?? item.unit ?? item.unitMaster?.code ?? 'PCS',
          projectId: tx.projectId,
          projectName: tx.project?.name ?? null,
          projectCode: tx.project?.code ?? null,
          zoneId: line.zoneId ?? tx.zoneId ?? item.zoneId ?? null,
          zoneCode: line.zone?.code ?? tx.zone?.code ?? item.zone?.code ?? null,
          zoneName: line.zone
            ? `${line.zone.code} - ${line.zone.name}`
            : tx.zone
              ? `${tx.zone.code} - ${tx.zone.name}`
              : item.zone
                ? `${item.zone.code} - ${item.zone.name}`
                : null,
          zoneRawName: line.zone?.name ?? tx.zone?.name ?? item.zone?.name ?? null,
          attachmentName: null,
        })),
    );

    const locationBalances = locationStocks
      .map((row) => ({
        zoneId: row.zoneId,
        zoneCode: row.zone?.code ?? null,
        zoneName: row.zone ? `${row.zone.code} - ${row.zone.name}` : null,
        slotId: row.slotId,
        level: row.level,
        row: row.zone?.row ?? null,
        column: row.zone?.column ?? null,
        warehouseName: row.zone?.warehouse?.name ?? null,
        warehouseCode: row.zone?.warehouse?.code ?? null,
        quantity: Number(row.quantity),
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const inboundQuantity = inboundLines.reduce((acc, line) => acc + line.quantity, 0);
    const inboundCost = inboundLines.reduce(
      (acc, line) =>
        acc +
        Number(
          line.totalAmount ??
            (line.unitPrice != null ? line.unitPrice * line.quantity : 0),
        ),
      0,
    );
    const averageCost = inboundQuantity > 0 ? inboundCost / inboundQuantity : 0;

    this.metrics.recordReadModelHit();

    return {
      item: {
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        category: item.category?.name ?? '',
        categoryId: item.categoryId,
        materialTypeId: item.materialTypeId,
        materialType: item.materialType?.name ?? '',
        materialUsageType: item.materialUsageType,
        zoneId: item.zoneId,
        slotId: item.slotId,
        level: item.level,
        zoneCode: item.zone?.code ?? '',
        zoneName: item.zone ? `${item.zone.code} - ${item.zone.name}` : '',
        minimumStock: item.minimumStock ?? 0,
        unit: item.unit ?? item.unitMaster?.code ?? 'PCS',
      },
      currentStock,
      averageCost,
      inventoryValue: currentStock * averageCost,
      inboundHistory: inboundLines,
      outboundHistory: outboundLines,
      supplierHistory: inboundLines,
      projectConsumptionHistory: outboundLines,
      locationBalances,
    };
  }

  private async locationsFromRepository() {
    const zones = await this.repository.listZones();

    return zones.map((zone) => {
      const totalStockQuantity = zone.locationStocks
        .filter((row) => Number(row.quantity) > 0)
        .reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);

      return {
        ...zone,
        materialCount: zone.inventoryItems.length,
        totalStockQuantity,
        cellOccupancy: this.buildCellOccupancy(
          zone.locationStocks
            .filter((row) => Number(row.quantity) > 0)
            .map((row) => ({
              id: row.inventoryItem.id,
              code: row.inventoryItem.code,
              name: row.inventoryItem.name,
              quantity: row.quantity,
              unit: row.inventoryItem.unit,
              slotId: row.slotId,
              level: row.level,
            })),
          true,
        ),
      };
    });
  }

  private async locationsFromSnapshots(
    snapshots: Awaited<ReturnType<SnapshotReaderService['inventoryLocations']>>,
  ) {
    const zones = await this.repository.listZones();
    const snapshotByZone = new Map<string, typeof snapshots>();
    for (const row of snapshots) {
      if (!row.zoneId) {
        continue;
      }
      snapshotByZone.set(row.zoneId, [...(snapshotByZone.get(row.zoneId) ?? []), row]);
    }

    return zones.map((zone) => {
      const zoneSnapshots = snapshotByZone.get(zone.id) ?? [];
      const totalStockQuantity = zoneSnapshots.reduce(
        (sum, row) => sum + Number(row.quantity ?? 0),
        0,
      );
      const materialIds = new Set<string>();
      for (const row of zoneSnapshots) {
        const payload = Array.isArray(row.materialPayload)
          ? row.materialPayload
          : [];
        for (const material of payload) {
          if (
            material &&
            typeof material === 'object' &&
            'id' in material &&
            typeof material.id === 'string'
          ) {
            materialIds.add(material.id);
          }
        }
      }

      return {
        ...zone,
        materialCount: materialIds.size || zone.inventoryItems.length,
        totalStockQuantity,
        cellOccupancy: zoneSnapshots
          .filter((row) => Number(row.quantity) > 0)
          .map((row) => ({
            key: `${row.slotId ?? ''}:${row.level ?? ''}`,
            slotId: row.slotId ?? '',
            level: row.level ?? '',
            materialCount: row.materialCount,
            totalQuantity: Number(row.quantity ?? 0),
            materialIds: this.snapshotMaterialIds(row.materialPayload),
            materials: this.snapshotMaterials(row.materialPayload),
          }))
          .sort((a, b) => a.key.localeCompare(b.key)),
      };
    });
  }

  async inboundSuggestions(id: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [item, lastLine, recentLines] =
      await this.repository.findInboundSuggestionSources(id, since);

    if (!item) {
      throw new Error('Material not found');
    }

    const weightedTotal = recentLines.reduce((sum, line) => {
      const quantity = Math.abs(Number(line.quantity ?? 0));
      const unitPrice =
        Number(line.unitPrice ?? 0) ||
        (quantity > 0 ? Number(line.totalAmount ?? 0) / quantity : 0);
      return sum + quantity * unitPrice;
    }, 0);
    const weightedQuantity = recentLines.reduce(
      (sum, line) => sum + Math.abs(Number(line.quantity ?? 0)),
      0,
    );

    const supplier = lastLine?.transaction.supplierId
      ? await this.repository.findSupplierById(lastLine.transaction.supplierId)
      : null;

    const lastQuantity = Math.abs(Number(lastLine?.quantity ?? 0));
    const lastUnitPrice =
      Number(lastLine?.unitPrice ?? 0) ||
      (lastQuantity > 0 ? Number(lastLine?.totalAmount ?? 0) / lastQuantity : 0);

    const locationOccupancy =
      lastLine?.zoneId && lastLine?.slotId && lastLine?.level
        ? await this.repository.aggregateLocationOccupancy({
            zoneId: lastLine.zoneId,
            slotId: lastLine.slotId,
            level: lastLine.level,
          })
        : null;
    const capacity = Number(lastLine?.zone?.capacity ?? 0);
    const occupied = Number(locationOccupancy?._sum.quantity ?? 0);
    const freePercent =
      capacity > 0 ? Math.max(0, Math.min(100, 100 - (occupied / capacity) * 100)) : null;

    this.metrics.recordReadModelHit();

    return {
      materialId: item.id,
      materialCode: item.code,
      materialName: item.name,
      lastLocation:
        lastLine?.zoneId && lastLine?.slotId && lastLine?.level
          ? {
              warehouseId: lastLine.warehouseId ?? lastLine.zone?.warehouseId ?? null,
              warehouseName:
                lastLine.warehouse?.name ?? lastLine.zone?.warehouse?.name ?? null,
              zoneId: lastLine.zoneId,
              zoneCode: lastLine.zone?.code ?? null,
              zoneName: lastLine.zone?.name ?? null,
              slotId: lastLine.slotId,
              level: lastLine.level,
              freePercent,
            }
          : null,
      lastPrice:
        lastUnitPrice > 0
          ? {
              unitPrice: lastUnitPrice,
              transactionDate: lastLine?.transaction.transactionDate ?? null,
              supplierName: supplier?.name ?? null,
              transactionNo:
                lastLine?.transaction.transactionNo ?? lastLine?.transaction.code ?? null,
            }
          : null,
      averagePrice30Days:
        weightedQuantity > 0 ? weightedTotal / weightedQuantity : null,
    };
  }

  private toBusinessType(value: TransactionType | string | null | undefined) {
    const upper = String(value ?? '').trim().toUpperCase();
    if (upper === 'IMPORT' || upper === 'INBOUND') return 'INBOUND';
    if (upper === 'EXPORT' || upper === 'OUTBOUND') return 'OUTBOUND';
    if (upper === 'TRANSFER') return 'TRANSFER';
    if (upper === 'RETURN') return 'RETURN';
    if (upper === 'ADJUSTMENT') return 'ADJUSTMENT';
    return upper || 'UNKNOWN';
  }

  private isFresh(updatedAt: Date) {
    return this.ageSeconds(updatedAt) <= this.snapshotMaxAgeSeconds();
  }

  private ageSeconds(updatedAt: Date) {
    return Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 1000));
  }

  private snapshotMaxAgeSeconds() {
    return Number(process.env.INVENTORY_SNAPSHOT_MAX_AGE_SECONDS ?? 3600);
  }

  private snapshotConfidence(updatedAt: Date) {
    const age = this.ageSeconds(updatedAt);
    const maxAge = this.snapshotMaxAgeSeconds();
    if (age <= Math.max(30, maxAge * 0.1)) return 100;
    if (age <= maxAge) return 90;
    return 0;
  }

  private requestMaterialSnapshotRebuild(
    inventoryItemId: string,
    reason: 'fallback-miss' | 'stale-snapshot',
  ) {
    return this.snapshotDispatcher.requestUpdate({
      scope: {
        module: 'inventory',
        snapshotType: 'inventory-material',
        inventoryItemId,
        scopeId: inventoryItemId,
      },
      reason,
      sourceWatermark: new Date().toISOString(),
      priority: 40,
    });
  }

  private requestLocationSnapshotRebuild(
    reason: 'fallback-miss' | 'stale-snapshot',
  ) {
    return this.snapshotDispatcher.requestUpdate({
      scope: {
        module: 'inventory',
        snapshotType: 'inventory-location',
        scopeId: 'locations',
      },
      reason,
      sourceWatermark: new Date().toISOString(),
      priority: 40,
    });
  }

  private buildCellOccupancy(
    items: Array<{
      id: string;
      code: string;
      name: string;
      quantity: number | string | null;
      unit?: string | null;
      slotId?: string | null;
      level?: string | null;
    }>,
    includeMaterials = false,
  ) {
    const occupancy = new Map<
      string,
      {
        key: string;
        slotId: string;
        level: string;
        materialCount: number;
        totalQuantity: number;
        materialIds: string[];
        materials?: Array<{
          id: string;
          code: string;
          name: string;
          quantity: number;
          unit?: string | null;
        }>;
      }
    >();

    items.forEach((item) => {
      const location = this.normalizeInternalSlot(item.slotId, item.level);
      if (!location) return;

      const key = `${location.slotId}:${location.level}`;
      const current = occupancy.get(key) ?? {
        key,
        slotId: location.slotId,
        level: location.level,
        materialCount: 0,
        totalQuantity: 0,
        materialIds: [],
        materials: includeMaterials ? [] : undefined,
      };

      current.materialCount += 1;
      current.totalQuantity += Number(item.quantity ?? 0);
      current.materialIds.push(item.id);
      current.materials?.push({
        id: item.id,
        code: item.code,
        name: item.name,
        quantity: Number(item.quantity ?? 0),
        unit: item.unit,
      });
      occupancy.set(key, current);
    });

    return Array.from(occupancy.values()).sort((a, b) =>
      a.key.localeCompare(b.key),
    );
  }

  private normalizeInternalSlot(slotId?: string | null, level?: string | null) {
    const rawSlot = String(slotId ?? '').trim();
    const [cellFromCombined, levelFromCombined] = rawSlot.includes(':')
      ? rawSlot.split(':')
      : ['', ''];
    const cell = (rawSlot.includes(':') ? cellFromCombined : rawSlot).trim();
    const normalizedLevel =
      String(level ?? levelFromCombined ?? '').trim() || 'L1';

    if (!cell) return null;

    return {
      slotId: cell.toUpperCase(),
      level: normalizedLevel.toUpperCase(),
    };
  }

  private snapshotMaterials(payload: unknown) {
    return Array.isArray(payload)
      ? payload
          .filter((item) => item && typeof item === 'object')
          .map((item) => {
            const row = item as Record<string, unknown>;
            return {
              id: String(row.id ?? ''),
              code: String(row.code ?? ''),
              name: String(row.name ?? ''),
              quantity: Number(row.quantity ?? 0),
              unit: row.unit != null ? String(row.unit) : null,
            };
          })
      : [];
  }

  private snapshotMaterialIds(payload: unknown) {
    return this.snapshotMaterials(payload)
      .map((item) => item.id)
      .filter(Boolean);
  }
}
