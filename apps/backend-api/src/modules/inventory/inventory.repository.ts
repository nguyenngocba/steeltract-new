import { Inject, Injectable } from '@nestjs/common';

import { Prisma, TransactionType } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

import { BadRequestException } from '@nestjs/common';
import { nextOperationalCode } from '../../common/utils/code-generator';

type DbClient = PrismaService | Prisma.TransactionClient;

type PostingInventoryItem = {
  id: string;
  code: string;
  unit: string | null;
  unitMaster: { code: string; symbol: string } | null;
};

type AggregatedInboundCost = {
  inventoryItemId: string;
  totalQuantity: number;
  totalValue: number;
};

type LocationStockBucketRow = {
  inventoryItemId: string;
  warehouseId: string | null;
  zoneId: string | null;
  slotId: string | null;
  level: string | null;
  quantity: number;
};

export type InventoryMaterialQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  materialTypeId?: string;
  materialUsageType?: string;
  warehouse?: string;
  stockStatus?: 'OUT' | 'LOW' | 'NORMAL';
  sortBy?: 'code' | 'name' | 'currentStock' | 'inventoryValue' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

@Injectable()
export class InventoryRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findItems(params: { search?: string; skip?: number; take?: number }) {
    const where = this.buildItemWhere(params.search);

    return this.prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        materialType: true,
        unitMaster: true,
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  findItemsByIds(ids: string[], db: DbClient = this.prisma) {
    return db.inventoryItem.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, name: true },
    });
  }

  findPostingItemsByIds(
    ids: string[],
    db: DbClient = this.prisma,
  ): Promise<PostingInventoryItem[]> {
    return db.inventoryItem.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        code: true,
        unit: true,
        unitMaster: { select: { code: true, symbol: true } },
      },
    });
  }

  findWarehouseByCode(code: string, db: DbClient = this.prisma) {
    return db.masterWarehouse.findUnique({
      where: { code },
      select: { id: true, code: true, name: true },
    });
  }

  findPositiveLocationStocks(
    materialIds: string[],
    warehouseId: string,
    warehouseCode: string,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryLocationStock.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        quantity: { gt: 0.000001 },
        OR: [{ warehouseId }, { zone: { warehouse: { code: warehouseCode } } }],
      },
      include: { zone: { include: { warehouse: true } } },
      orderBy: [
        { inventoryItemId: 'asc' },
        { zoneId: 'asc' },
        { slotId: 'asc' },
        { level: 'asc' },
      ],
    });
  }

  findPositiveLocationStock(
    inventoryItemId: string,
    warehouseId: string,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryLocationStock.findFirst({
      where: { inventoryItemId, warehouseId, quantity: { gt: 0 } },
    });
  }

  findActiveWarehouseZone(code: string, db: DbClient = this.prisma) {
    return db.warehouseZone.findFirst({
      where: { active: true, warehouse: { code } },
      include: { warehouse: true },
      orderBy: { code: 'asc' },
    });
  }

  findProductionInventoryTransactions(
    materialIds: string[],
    db: DbClient = this.prisma,
  ) {
    return db.inventoryTransaction.findMany({
      where: {
        items: { some: { inventoryItemId: { in: materialIds } } },
        OR: [
          { remarks: { contains: '[COMPONENT_PRODUCTION]' } },
          { remarks: { contains: '[COMPONENT_PRODUCTION_RETURN]' } },
          { note: { contains: '[COMPONENT_PRODUCTION]' } },
          { note: { contains: '[COMPONENT_PRODUCTION_RETURN]' } },
        ],
      },
      include: {
        warehouse: true,
        items: { include: { warehouse: true } },
      },
    });
  }

  countItems(search?: string) {
    return this.prisma.inventoryItem.count({
      where: this.buildItemWhere(search),
    });
  }

  async listMaterialSnapshotPage(params: InventoryMaterialQuery) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 16;
    const offset = (page - 1) * pageSize;
    const where = this.materialSnapshotWhere(params);
    const orderBy = this.materialSnapshotOrder(params);

    const [idRows, countRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT i.id
        FROM inventory_items i
        LEFT JOIN inventory_material_snapshots all_snapshot
          ON all_snapshot."materialId" = i.id
          AND all_snapshot."scopeKey" = 'ALL'
        LEFT JOIN inventory_material_snapshots main_snapshot
          ON main_snapshot."materialId" = i.id
          AND UPPER(COALESCE(main_snapshot."warehouseCode", '')) = 'MAIN'
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT ${pageSize} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM inventory_items i
        LEFT JOIN inventory_material_snapshots all_snapshot
          ON all_snapshot."materialId" = i.id
          AND all_snapshot."scopeKey" = 'ALL'
        LEFT JOIN inventory_material_snapshots main_snapshot
          ON main_snapshot."materialId" = i.id
          AND UPPER(COALESCE(main_snapshot."warehouseCode", '')) = 'MAIN'
        WHERE ${where}
      `),
    ]);

    const ids = idRows.map((row) => row.id);
    const items = ids.length
      ? await this.prisma.inventoryItem.findMany({
          where: { id: { in: ids } },
          include: {
            category: true,
            materialType: true,
            unitMaster: true,
            zone: { include: { warehouse: true } },
            materialSnapshots: true,
            locationStocks: {
              where: { quantity: { gt: 0 } },
              include: {
                zone: { include: { warehouse: true } },
              },
            },
          },
        })
      : [];
    const itemMap = new Map(items.map((item) => [item.id, item]));

    return {
      items: ids.map((id) => itemMap.get(id)).filter(Boolean),
      total: Number(countRows[0]?.total ?? 0),
      page,
      pageSize,
    };
  }

  async listMaterialLivePage(params: InventoryMaterialQuery) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 16;
    const offset = (page - 1) * pageSize;
    const where = this.materialLiveWhere(params);
    const orderBy = this.materialLiveOrder(params);
    const sources = this.materialLiveSources();

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          id: string;
          currentStock: number;
          mainStock: number;
          productionStock: number;
          averageCost: number;
          lastMovementDate: Date | null;
        }>
      >(Prisma.sql`
        ${sources}
        SELECT i.id,
          COALESCE(stock."currentStock", 0)::float8 AS "currentStock",
          COALESCE(stock."mainStock", 0)::float8 AS "mainStock",
          COALESCE(stock."productionStock", 0)::float8 AS "productionStock",
          COALESCE(valuation."averageCost", 0)::float8 AS "averageCost",
          valuation."lastMovementDate"
        FROM inventory_items i
        LEFT JOIN stock ON stock."materialId" = i.id
        LEFT JOIN valuation ON valuation."materialId" = i.id
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT ${pageSize} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        ${sources}
        SELECT COUNT(*)::bigint AS total
        FROM inventory_items i
        LEFT JOIN stock ON stock."materialId" = i.id
        LEFT JOIN valuation ON valuation."materialId" = i.id
        WHERE ${where}
      `),
    ]);

    const ids = rows.map((row) => row.id);
    const items = ids.length
      ? await this.prisma.inventoryItem.findMany({
          where: { id: { in: ids } },
          include: {
            category: true,
            materialType: true,
            unitMaster: true,
            zone: { include: { warehouse: true } },
            locationStocks: {
              where: { quantity: { gt: 0 } },
              include: { zone: { include: { warehouse: true } } },
            },
          },
        })
      : [];
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const metricMap = new Map(rows.map((row) => [row.id, row]));

    return {
      items: ids
        .map((id) => {
          const item = itemMap.get(id);
          return item ? { ...item, liveMetrics: metricMap.get(id) } : null;
        })
        .filter(Boolean),
      total: Number(countRows[0]?.total ?? 0),
      page,
      pageSize,
    };
  }

  async materialLiveSummary(params: InventoryMaterialQuery) {
    const sources = this.materialLiveSources();
    const where = this.materialLiveWhere(params);
    const rows = await this.prisma.$queryRaw<
      Array<{
        totalItems: bigint;
        totalStock: number;
        mainStock: number;
        productionStock: number;
        totalValue: number;
        lowStock: bigint;
        outOfStock: bigint;
        primaryCount: bigint;
        primaryStock: number;
        secondaryCount: bigint;
        secondaryStock: number;
        consumableCount: bigint;
        consumableStock: number;
      }>
    >(Prisma.sql`
      ${sources}
      SELECT COUNT(*)::bigint AS "totalItems",
        COALESCE(SUM(COALESCE(stock."currentStock", 0)), 0)::float8 AS "totalStock",
        COALESCE(SUM(COALESCE(stock."mainStock", 0)), 0)::float8 AS "mainStock",
        COALESCE(SUM(COALESCE(stock."productionStock", 0)), 0)::float8 AS "productionStock",
        COALESCE(SUM(COALESCE(stock."currentStock", 0) * COALESCE(valuation."averageCost", 0)), 0)::float8 AS "totalValue",
        COUNT(*) FILTER (WHERE COALESCE(stock."mainStock", 0) > 0 AND COALESCE(stock."mainStock", 0) <= i."minimumStock")::bigint AS "lowStock",
        COUNT(*) FILTER (WHERE COALESCE(stock."mainStock", 0) <= 0)::bigint AS "outOfStock",
        COUNT(*) FILTER (WHERE i."materialUsageType"::text = 'PRIMARY')::bigint AS "primaryCount",
        COALESCE(SUM(COALESCE(stock."currentStock", 0)) FILTER (WHERE i."materialUsageType"::text = 'PRIMARY'), 0)::float8 AS "primaryStock",
        COUNT(*) FILTER (WHERE i."materialUsageType"::text = 'SECONDARY')::bigint AS "secondaryCount",
        COALESCE(SUM(COALESCE(stock."currentStock", 0)) FILTER (WHERE i."materialUsageType"::text = 'SECONDARY'), 0)::float8 AS "secondaryStock",
        COUNT(*) FILTER (WHERE i."materialUsageType"::text = 'CONSUMABLE')::bigint AS "consumableCount",
        COALESCE(SUM(COALESCE(stock."currentStock", 0)) FILTER (WHERE i."materialUsageType"::text = 'CONSUMABLE'), 0)::float8 AS "consumableStock"
      FROM inventory_items i
      LEFT JOIN stock ON stock."materialId" = i.id
      LEFT JOIN valuation ON valuation."materialId" = i.id
      WHERE ${where}
    `);
    return rows[0];
  }

  materialLiveFacets(params: InventoryMaterialQuery) {
    const sources = this.materialLiveSources();
    const where = this.materialLiveWhere(params);
    return Promise.all([
      this.prisma.$queryRaw<Array<{ label: string; value: number }>>(Prisma.sql`
        ${sources}
        SELECT COALESCE(c.name, 'Khác') AS label,
          COALESCE(SUM(COALESCE(stock."currentStock", 0)), 0)::float8 AS value
        FROM inventory_items i
        LEFT JOIN inventory_categories c ON c.id = i."categoryId"
        LEFT JOIN stock ON stock."materialId" = i.id
        LEFT JOIN valuation ON valuation."materialId" = i.id
        WHERE ${where}
        GROUP BY c.name
        ORDER BY value DESC
        LIMIT 12
      `),
      this.prisma.$queryRaw<Array<{ label: string; value: number }>>(Prisma.sql`
        SELECT COALESCE(w.code, zw.code, 'Chưa rõ') AS label,
          COALESCE(SUM(ls.quantity), 0)::float8 AS value
        FROM inventory_location_stocks ls
        JOIN inventory_items i ON i.id = ls."inventoryItemId"
        LEFT JOIN warehouse_zones z ON z.id = ls."zoneId"
        LEFT JOIN master_warehouses w ON w.id = ls."warehouseId"
        LEFT JOIN master_warehouses zw ON zw.id = z."warehouseId"
        WHERE i."deletedAt" IS NULL AND ls.quantity > 0
          ${params.search ? Prisma.sql`AND (i.code ILIKE ${`%${params.search}%`} OR i.name ILIKE ${`%${params.search}%`})` : Prisma.empty}
          ${params.categoryId ? Prisma.sql`AND i."categoryId" = ${params.categoryId}` : Prisma.empty}
          ${params.materialTypeId ? Prisma.sql`AND i."materialTypeId" = ${params.materialTypeId}` : Prisma.empty}
          ${params.materialUsageType ? Prisma.sql`AND i."materialUsageType"::text = ${params.materialUsageType}` : Prisma.empty}
          ${params.warehouse ? Prisma.sql`AND (COALESCE(ls."warehouseId", z."warehouseId") = ${params.warehouse} OR UPPER(COALESCE(w.code, zw.code, '')) = UPPER(${params.warehouse}))` : Prisma.empty}
        GROUP BY COALESCE(w.code, zw.code, 'Chưa rõ')
        ORDER BY value DESC
        LIMIT 12
      `),
    ]);
  }

  private materialLiveSources() {
    return Prisma.sql`
      WITH stock AS (
        SELECT ls."inventoryItemId" AS "materialId",
          COALESCE(SUM(ls.quantity), 0)::float8 AS "currentStock",
          COALESCE(SUM(ls.quantity) FILTER (WHERE UPPER(COALESCE(w.code, zw.code, '')) = 'MAIN'), 0)::float8 AS "mainStock",
          COALESCE(SUM(ls.quantity) FILTER (WHERE UPPER(COALESCE(w.code, zw.code, '')) = 'PRODUCTION'), 0)::float8 AS "productionStock"
        FROM inventory_location_stocks ls
        LEFT JOIN warehouse_zones z ON z.id = ls."zoneId"
        LEFT JOIN master_warehouses w ON w.id = ls."warehouseId"
        LEFT JOIN master_warehouses zw ON zw.id = z."warehouseId"
        GROUP BY ls."inventoryItemId"
      ), valuation AS (
        SELECT ti."inventoryItemId" AS "materialId",
          CASE WHEN SUM(ti.quantity) FILTER (WHERE ti.quantity > 0) > 0
            THEN COALESCE(SUM(COALESCE(ti."totalAmount", ti.quantity * ti."unitPrice", 0)) FILTER (WHERE ti.quantity > 0), 0)
              / SUM(ti.quantity) FILTER (WHERE ti.quantity > 0)
            ELSE 0 END::float8 AS "averageCost",
          MAX(t."transactionDate") AS "lastMovementDate"
        FROM inventory_transaction_items ti
        JOIN inventory_transactions t ON t.id = ti."transactionId"
        GROUP BY ti."inventoryItemId"
      )
    `;
  }

  private materialLiveWhere(params: InventoryMaterialQuery) {
    const clauses: Prisma.Sql[] = [Prisma.sql`i."deletedAt" IS NULL`];
    if (params.search) {
      clauses.push(
        Prisma.sql`(i.code ILIKE ${`%${params.search}%`} OR i.name ILIKE ${`%${params.search}%`})`,
      );
    }
    if (params.categoryId)
      clauses.push(Prisma.sql`i."categoryId" = ${params.categoryId}`);
    if (params.materialTypeId)
      clauses.push(Prisma.sql`i."materialTypeId" = ${params.materialTypeId}`);
    if (params.materialUsageType)
      clauses.push(
        Prisma.sql`i."materialUsageType"::text = ${params.materialUsageType}`,
      );
    if (params.warehouse) {
      clauses.push(Prisma.sql`EXISTS (
        SELECT 1 FROM inventory_location_stocks filter_stock
        LEFT JOIN warehouse_zones filter_zone ON filter_zone.id = filter_stock."zoneId"
        LEFT JOIN master_warehouses filter_warehouse ON filter_warehouse.id = filter_stock."warehouseId"
        LEFT JOIN master_warehouses filter_zone_warehouse ON filter_zone_warehouse.id = filter_zone."warehouseId"
        WHERE filter_stock."inventoryItemId" = i.id AND filter_stock.quantity > 0
          AND (COALESCE(filter_stock."warehouseId", filter_zone."warehouseId") = ${params.warehouse}
            OR UPPER(COALESCE(filter_warehouse.code, filter_zone_warehouse.code, '')) = UPPER(${params.warehouse}))
      )`);
    }
    if (params.stockStatus === 'OUT')
      clauses.push(Prisma.sql`COALESCE(stock."mainStock", 0) <= 0`);
    if (params.stockStatus === 'LOW')
      clauses.push(
        Prisma.sql`COALESCE(stock."mainStock", 0) > 0 AND COALESCE(stock."mainStock", 0) <= i."minimumStock"`,
      );
    if (params.stockStatus === 'NORMAL')
      clauses.push(
        Prisma.sql`COALESCE(stock."mainStock", 0) > i."minimumStock"`,
      );
    return Prisma.join(clauses, ' AND ');
  }

  private materialLiveOrder(params: InventoryMaterialQuery) {
    const direction =
      params.sortOrder === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
    const field = {
      code: Prisma.sql`i.code`,
      name: Prisma.sql`i.name`,
      currentStock: Prisma.sql`COALESCE(stock."currentStock", 0)`,
      inventoryValue: Prisma.sql`COALESCE(stock."currentStock", 0) * COALESCE(valuation."averageCost", 0)`,
      updatedAt: Prisma.sql`i."updatedAt"`,
    }[params.sortBy ?? 'code'];
    return Prisma.sql`${field} ${direction}, i.id ASC`;
  }

  async materialSnapshotSummary(params: InventoryMaterialQuery) {
    const where = this.materialSnapshotWhere(params);
    const rows = await this.prisma.$queryRaw<
      Array<{
        totalItems: bigint;
        totalStock: number | null;
        mainStock: number | null;
        productionStock: number | null;
        totalValue: number | null;
        lowStock: bigint;
        outOfStock: bigint;
        primaryCount: bigint;
        primaryStock: number | null;
        secondaryCount: bigint;
        secondaryStock: number | null;
        consumableCount: bigint;
        consumableStock: number | null;
      }>
    >(Prisma.sql`
      SELECT
        COUNT(*)::bigint AS "totalItems",
        COALESCE(SUM(COALESCE(all_snapshot."currentStock", i.quantity, 0)), 0)::float8 AS "totalStock",
        COALESCE(SUM(COALESCE(main_snapshot."currentStock", 0)), 0)::float8 AS "mainStock",
        COALESCE(SUM(COALESCE(production_snapshot."currentStock", 0)), 0)::float8 AS "productionStock",
        COALESCE(SUM(COALESCE(all_snapshot."inventoryValue", 0)), 0)::float8 AS "totalValue",
        COUNT(*) FILTER (
          WHERE COALESCE(main_snapshot."currentStock", 0) > 0
            AND COALESCE(main_snapshot."currentStock", 0) <= i."minimumStock"
        )::bigint AS "lowStock",
        COUNT(*) FILTER (
          WHERE COALESCE(main_snapshot."currentStock", 0) <= 0
        )::bigint AS "outOfStock",
        COUNT(*) FILTER (WHERE i."materialUsageType"::text = 'PRIMARY')::bigint AS "primaryCount",
        COALESCE(SUM(COALESCE(all_snapshot."currentStock", 0))
          FILTER (WHERE i."materialUsageType"::text = 'PRIMARY'), 0)::float8 AS "primaryStock",
        COUNT(*) FILTER (WHERE i."materialUsageType"::text = 'SECONDARY')::bigint AS "secondaryCount",
        COALESCE(SUM(COALESCE(all_snapshot."currentStock", 0))
          FILTER (WHERE i."materialUsageType"::text = 'SECONDARY'), 0)::float8 AS "secondaryStock",
        COUNT(*) FILTER (WHERE i."materialUsageType"::text = 'CONSUMABLE')::bigint AS "consumableCount",
        COALESCE(SUM(COALESCE(all_snapshot."currentStock", 0))
          FILTER (WHERE i."materialUsageType"::text = 'CONSUMABLE'), 0)::float8 AS "consumableStock"
      FROM inventory_items i
      LEFT JOIN inventory_material_snapshots all_snapshot
        ON all_snapshot."materialId" = i.id AND all_snapshot."scopeKey" = 'ALL'
      LEFT JOIN inventory_material_snapshots main_snapshot
        ON main_snapshot."materialId" = i.id
        AND UPPER(COALESCE(main_snapshot."warehouseCode", '')) = 'MAIN'
      LEFT JOIN inventory_material_snapshots production_snapshot
        ON production_snapshot."materialId" = i.id
        AND UPPER(COALESCE(production_snapshot."warehouseCode", '')) = 'PRODUCTION'
      WHERE ${where}
    `);
    return rows[0];
  }

  materialSnapshotFacets(params: InventoryMaterialQuery) {
    const where = this.materialSnapshotWhere(params);
    return Promise.all([
      this.prisma.$queryRaw<Array<{ label: string; value: number }>>(Prisma.sql`
        SELECT COALESCE(c.name, 'Khác') AS label,
          COALESCE(SUM(COALESCE(all_snapshot."currentStock", 0)), 0)::float8 AS value
        FROM inventory_items i
        LEFT JOIN inventory_categories c ON c.id = i."categoryId"
        LEFT JOIN inventory_material_snapshots all_snapshot
          ON all_snapshot."materialId" = i.id AND all_snapshot."scopeKey" = 'ALL'
        LEFT JOIN inventory_material_snapshots main_snapshot
          ON main_snapshot."materialId" = i.id
          AND UPPER(COALESCE(main_snapshot."warehouseCode", '')) = 'MAIN'
        WHERE ${where}
        GROUP BY c.name
        ORDER BY value DESC
        LIMIT 12
      `),
      this.prisma.$queryRaw<Array<{ label: string; value: number }>>(Prisma.sql`
        SELECT COALESCE(s."warehouseCode", 'Chưa rõ') AS label,
          COALESCE(SUM(s."currentStock"), 0)::float8 AS value
        FROM inventory_material_snapshots s
        JOIN inventory_items i ON i.id = s."materialId"
        LEFT JOIN inventory_material_snapshots all_snapshot
          ON all_snapshot."materialId" = i.id AND all_snapshot."scopeKey" = 'ALL'
        LEFT JOIN inventory_material_snapshots main_snapshot
          ON main_snapshot."materialId" = i.id
          AND UPPER(COALESCE(main_snapshot."warehouseCode", '')) = 'MAIN'
        WHERE s."scopeKey" <> 'ALL' AND ${where}
        GROUP BY s."warehouseCode"
        ORDER BY value DESC
        LIMIT 12
      `),
    ]);
  }

  async inventoryOverviewTransactionMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const trendStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);

    const [todayRows, monthRows, trendRows, snapshotTrend] = await Promise.all([
      this.transactionMetricsBetween(
        today,
        new Date(today.getTime() + 86_400_000),
      ),
      this.transactionMetricsBetween(monthStart, new Date()),
      this.prisma.$queryRaw<
        Array<{
          month: Date;
          inboundValue: number;
          outboundValue: number;
        }>
      >(Prisma.sql`
        SELECT date_trunc('month', t."transactionDate") AS month,
          COALESCE(SUM(ABS(COALESCE(ti."totalAmount", ti.quantity * ti."unitPrice", 0)))
            FILTER (WHERE t.type::text IN ('IMPORT', 'RETURN')), 0)::float8 AS "inboundValue",
          COALESCE(SUM(ABS(COALESCE(ti."totalAmount", ti.quantity * ti."unitPrice", 0)))
            FILTER (WHERE t.type::text = 'EXPORT'), 0)::float8 AS "outboundValue"
        FROM inventory_transactions t
        JOIN inventory_transaction_items ti ON ti."transactionId" = t.id
        WHERE t."transactionDate" >= ${trendStart}
        GROUP BY date_trunc('month', t."transactionDate")
        ORDER BY month ASC
      `),
      this.prisma.inventoryDashboardSnapshot.groupBy({
        where: {
          scopeKey: {
            startsWith: 'WAREHOUSE:',
          },
        },
        by: ['snapshotDate'],
        _sum: { inventoryValue: true, totalStock: true },
        orderBy: { snapshotDate: 'desc' },
        take: 12,
      }),
    ]);

    return { todayRows, monthRows, trendRows, snapshotTrend };
  }

  private transactionMetricsBetween(from: Date, to: Date) {
    return this.prisma.$queryRaw<
      Array<{
        type: string;
        documentCount: bigint;
        quantity: number;
        value: number;
      }>
    >(Prisma.sql`
      SELECT t.type::text AS type,
        COUNT(DISTINCT t.id)::bigint AS "documentCount",
        COALESCE(SUM(ABS(ti.quantity)), 0)::float8 AS quantity,
        COALESCE(SUM(
          CASE WHEN t.type::text = 'TRANSFER' AND ti.quantity < 0 THEN 0
          ELSE ABS(COALESCE(ti."totalAmount", ti.quantity * ti."unitPrice", 0)) END
        ), 0)::float8 AS value
      FROM inventory_transactions t
      JOIN inventory_transaction_items ti ON ti."transactionId" = t.id
      WHERE t."transactionDate" >= ${from} AND t."transactionDate" < ${to}
      GROUP BY t.type
    `);
  }

  private materialSnapshotWhere(params: InventoryMaterialQuery) {
    const clauses: Prisma.Sql[] = [Prisma.sql`i."deletedAt" IS NULL`];
    if (params.search) {
      const search = `%${params.search}%`;
      clauses.push(
        Prisma.sql`(i.code ILIKE ${search} OR i.name ILIKE ${search})`,
      );
    }
    if (params.categoryId) {
      clauses.push(Prisma.sql`(
        i."categoryId" = ${params.categoryId}
        OR EXISTS (
          SELECT 1 FROM inventory_categories category_filter
          WHERE category_filter.id = i."categoryId"
            AND category_filter.name = ${params.categoryId}
        )
      )`);
    }
    if (params.materialTypeId)
      clauses.push(Prisma.sql`i."materialTypeId" = ${params.materialTypeId}`);
    if (params.materialUsageType) {
      clauses.push(
        Prisma.sql`i."materialUsageType"::text = ${params.materialUsageType}`,
      );
    }
    if (params.warehouse) {
      clauses.push(Prisma.sql`EXISTS (
        SELECT 1 FROM inventory_material_snapshots warehouse_snapshot
        WHERE warehouse_snapshot."materialId" = i.id
          AND warehouse_snapshot."scopeKey" <> 'ALL'
          AND (
            warehouse_snapshot."warehouseId" = ${params.warehouse}
            OR UPPER(COALESCE(warehouse_snapshot."warehouseCode", '')) =
              UPPER(${params.warehouse})
          )
          AND warehouse_snapshot."currentStock" > 0
      )`);
    }
    if (params.stockStatus === 'OUT') {
      clauses.push(Prisma.sql`COALESCE(main_snapshot."currentStock", 0) <= 0`);
    } else if (params.stockStatus === 'LOW') {
      clauses.push(Prisma.sql`COALESCE(main_snapshot."currentStock", 0) > 0
        AND COALESCE(main_snapshot."currentStock", 0) <= i."minimumStock"`);
    } else if (params.stockStatus === 'NORMAL') {
      clauses.push(
        Prisma.sql`COALESCE(main_snapshot."currentStock", 0) > i."minimumStock"`,
      );
    }
    return Prisma.join(clauses, ' AND ');
  }

  private materialSnapshotOrder(params: InventoryMaterialQuery) {
    const direction =
      params.sortOrder === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
    const field = {
      code: Prisma.sql`i.code`,
      name: Prisma.sql`i.name`,
      currentStock: Prisma.sql`COALESCE(all_snapshot."currentStock", i.quantity, 0)`,
      inventoryValue: Prisma.sql`COALESCE(all_snapshot."inventoryValue", 0)`,
      updatedAt: Prisma.sql`i."updatedAt"`,
    }[params.sortBy ?? 'code'];
    return Prisma.sql`${field} ${direction}, i.id ASC`;
  }

  findItemById(id: string, db: DbClient = this.prisma) {
    return db.inventoryItem.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        materialType: true,
        unitMaster: true,
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
    });
  }

  findPositiveLocationStocksByItem(id: string) {
    return this.prisma.inventoryLocationStock.findMany({
      where: {
        inventoryItemId: id,
        quantity: {
          gt: 0,
        },
      },
      include: {
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
    });
  }

  findTransactionsByItem(id: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: {
        items: {
          some: {
            inventoryItemId: id,
          },
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
      include: {
        project: true,
        zone: {
          include: {
            warehouse: true,
          },
        },
        items: {
          where: {
            inventoryItemId: id,
          },
          include: {
            unit: true,
            warehouse: true,
            zone: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });
  }

  findSuppliersByIds(ids: string[]) {
    return this.prisma.supplier.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async findDashboardSnapshotSources(since: Date) {
    return Promise.all([
      this.prisma.inventoryItem.findMany({
        where: { deletedAt: null },
        include: {
          category: true,
          unitMaster: true,
        },
        take: 5000,
      }),
      this.prisma.inventoryLocationStock.findMany({
        where: {
          quantity: {
            gt: 0,
          },
        },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: {
          transactionDate: {
            gte: since,
          },
        },
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'asc',
        },
        take: 5000,
      }),
      this.prisma.inventoryTransaction.count(),
    ] as const);
  }

  findRecentDashboardTransactions(take: number) {
    return this.prisma.inventoryTransaction.findMany({
      take,
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findCategoryById(id: string, db: DbClient = this.prisma) {
    return db.inventoryCategory.findUnique({
      where: {
        id,
      },
    });
  }

  findCategoryByCodeOrName(value: string, db: DbClient = this.prisma) {
    return db.inventoryCategory.findFirst({
      where: {
        OR: [
          {
            code: {
              equals: value,
              mode: 'insensitive',
            },
          },
          {
            name: {
              equals: value,
              mode: 'insensitive',
            },
          },
        ],
      },
    });
  }

  findUnitById(id: string, db: DbClient = this.prisma) {
    return db.masterUnit.findUnique({
      where: {
        id,
      },
    });
  }

  findUnitByCode(value: string, db: DbClient = this.prisma) {
    return db.masterUnit.findUnique({
      where: {
        code: value.trim().toUpperCase(),
      },
    });
  }

  findTransactionTypeById(id: string, db: DbClient = this.prisma) {
    return db.masterTransactionType.findUnique({
      where: { id },
    });
  }

  findTransactionTypeByCode(code: string, db: DbClient = this.prisma) {
    return db.masterTransactionType.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
  }

  createItem(
    data: Prisma.InventoryItemCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.create({
      data,
      include: {
        category: true,
        materialType: true,
        unitMaster: true,
        zone: true,
      },
    });
  }

  updateItemInfo(
    id: string,
    data: Prisma.InventoryItemUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.update({
      where: {
        id,
      },
      data,
      include: {
        category: true,
        materialType: true,
        unitMaster: true,
        zone: true,
      },
    });
  }

  deleteItem(id: string, db: DbClient = this.prisma) {
    return db.inventoryItem.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  createTransaction(
    data: Prisma.InventoryTransactionCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryTransaction.create({
      data,
      include: {
        transactionType: true,
        warehouse: true,
        zone: true,
        project: true,
        items: {
          include: {
            inventoryItem: true,
            unit: true,
            warehouse: true,
            zone: true,
          },
        },
      },
    });
  }

  findTransactionByReference(
    reference: {
      type: TransactionType;
      referenceModule: string;
      referenceId: string;
    },
    db: DbClient = this.prisma,
  ) {
    return db.inventoryTransaction.findFirst({
      where: reference,
      include: {
        transactionType: true,
        warehouse: true,
        zone: true,
        project: true,
        items: {
          include: {
            inventoryItem: true,
            unit: true,
            warehouse: true,
            zone: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  listMaterialMovementLines(take = 50) {
    return this.prisma.inventoryTransactionItem.findMany({
      take,
      include: {
        inventoryItem: true,
        transaction: {
          include: {
            zone: true,
            warehouse: true,
          },
        },
        zone: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findInventoryItemByIdentity(
    input: { id?: string; code?: string },
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.findFirst({
      where: {
        OR: [
          ...(input.id ? [{ id: input.id }] : []),
          ...(input.code ? [{ code: input.code }] : []),
        ],
      },
    });
  }

  listTransactions(params: {
    skip?: number;
    take?: number;
    fromDate?: Date;
    toDate?: Date;
    supplierId?: string;
    projectId?: string;
    materialId?: string;
    transactionTypes?: Array<
      'IMPORT' | 'EXPORT' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT'
    >;
  }) {
    const where: Prisma.InventoryTransactionWhereInput = {};

    if (params.fromDate || params.toDate) {
      where.transactionDate = {
        ...(params.fromDate && {
          gte: params.fromDate,
        }),
        ...(params.toDate && {
          lte: params.toDate,
        }),
      };
    }

    if (params.supplierId) {
      where.supplierId = params.supplierId;
    }

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    if (params.materialId) {
      where.items = {
        some: {
          inventoryItemId: params.materialId,
        },
      };
    }

    if (params.transactionTypes?.length) {
      where.type = {
        in: params.transactionTypes,
      };
    }

    return this.prisma.inventoryTransaction.findMany({
      where,
      include: {
        transactionType: true,
        warehouse: true,
        zone: true,
        project: true,
        items: {
          where: params.materialId
            ? { inventoryItemId: params.materialId }
            : undefined,
          include: {
            inventoryItem: true,
            unit: true,
            warehouse: true,
            zone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  countTransactions(params: {
    fromDate?: Date;
    toDate?: Date;
    supplierId?: string;
    projectId?: string;
    materialId?: string;
    transactionTypes?: Array<
      'IMPORT' | 'EXPORT' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT'
    >;
  }) {
    const where: Prisma.InventoryTransactionWhereInput = {
      supplierId: params.supplierId,
      projectId: params.projectId,
      type: params.transactionTypes?.length
        ? { in: params.transactionTypes }
        : undefined,
      transactionDate:
        params.fromDate || params.toDate
          ? {
              gte: params.fromDate,
              lte: params.toDate,
            }
          : undefined,
      items: params.materialId
        ? { some: { inventoryItemId: params.materialId } }
        : undefined,
    };
    return this.prisma.inventoryTransaction.count({ where });
  }

  findTransactionAttachmentCounts(transactionIds: string[]) {
    if (transactionIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.attachment.groupBy({
      by: ['entityId'],
      where: {
        module: 'inventory',
        entityType: 'transaction',
        entityId: { in: transactionIds },
        deletedAt: null,
      },
      _count: { _all: true },
    });
  }

  updateItemQuantitySnapshot(
    id: string,
    delta: number,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.update({
      where: {
        id,
      },
      data: {
        quantity: {
          increment: delta,
        },
      },
    });
  }
  async upsertLocationStock(
    data: {
      inventoryItemId: string;
      warehouseId?: string | null;
      zoneId?: string | null;
      slotId?: string | null;
      level?: string | null;
      quantity: number;
    },
    db: DbClient = this.prisma,
  ) {
    const existing = await db.inventoryLocationStock.findFirst({
      where: {
        inventoryItemId: data.inventoryItemId,
        warehouseId: data.warehouseId ?? null,
        zoneId: data.zoneId ?? null,
        slotId: data.slotId ?? null,
        level: data.level ?? null,
      },
    });

    if (existing) {
      const nextQuantity = Number(existing.quantity) + Number(data.quantity);

      if (nextQuantity <= 0) {
        return db.inventoryLocationStock.delete({
          where: {
            id: existing.id,
          },
        });
      }

      return db.inventoryLocationStock.update({
        where: {
          id: existing.id,
        },
        data: {
          quantity: nextQuantity,
        },
      });
    }

    if (data.quantity <= 0) {
      return null;
    }
    if (data.quantity > 0 && data.zoneId && data.slotId && data.level) {
      const occupied = await db.inventoryLocationStock.findFirst({
        where: {
          warehouseId: data.warehouseId ?? null,
          zoneId: data.zoneId ?? null,
          slotId: data.slotId ?? null,
          level: data.level ?? null,
          quantity: {
            gt: 0,
          },
          inventoryItemId: {
            not: data.inventoryItemId,
          },
        },
        include: {
          inventoryItem: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      if (occupied) {
        throw new BadRequestException(
          `Vị trí ${data.slotId ?? ''}/${data.level ?? ''} đang chứa vật tư ${
            occupied.inventoryItem?.code ?? ''
          }`,
        );
      }
    }

    return db.inventoryLocationStock.create({
      data: {
        inventoryItemId: data.inventoryItemId,
        warehouseId: data.warehouseId,
        zoneId: data.zoneId,
        slotId: data.slotId,
        level: data.level,
        quantity: data.quantity,
      },
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({
      data,
    });
  }

  nextOperationalCode(
    modelName: string,
    fieldName: string,
    prefix: string,
    db: DbClient = this.prisma,
  ) {
    return nextOperationalCode(db, modelName as any, fieldName, prefix);
  }

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
    },
    db: DbClient = this.prisma,
  ) {
    return db.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: data,
      update: {},
    });
  }

  findTransactionById(id: string) {
    return this.prisma.inventoryTransaction.findUnique({
      where: { id },
      include: {
        transactionType: true,
        project: true,
        warehouse: true,
        zone: true,
        items: {
          include: {
            inventoryItem: true,
            unit: true,
            warehouse: true,
            zone: true,
          },
        },
      },
    });
  }

  findInboundSuggestionSources(id: string, since: Date) {
    return Promise.all([
      this.prisma.inventoryItem.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
      this.prisma.inventoryTransactionItem.findFirst({
        where: {
          inventoryItemId: id,
          quantity: {
            gt: 0,
          },
          transaction: {
            type: 'IMPORT',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          transaction: true,
          warehouse: true,
          zone: {
            include: {
              warehouse: true,
            },
          },
        },
      }),
      this.prisma.inventoryTransactionItem.findMany({
        where: {
          inventoryItemId: id,
          quantity: {
            gt: 0,
          },
          transaction: {
            type: 'IMPORT',
            transactionDate: {
              gte: since,
            },
          },
        },
      }),
    ] as const);
  }

  findSupplierById(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }

  aggregateLocationOccupancy(params: {
    zoneId: string;
    slotId: string;
    level: string;
  }) {
    return this.prisma.inventoryLocationStock.aggregate({
      where: {
        zoneId: params.zoneId,
        slotId: params.slotId,
        level: params.level,
        quantity: {
          gt: 0,
        },
      },
      _sum: {
        quantity: true,
      },
    });
  }

  findInventoryAuditTransactionLines(itemIds: string[]) {
    return this.prisma.inventoryTransactionItem.findMany({
      where: {
        inventoryItemId: {
          in: itemIds,
        },
      },
      include: {
        transaction: {
          select: {
            transactionDate: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                code: true,
                name: true,
                row: true,
                column: true,
                level: true,
                warehouse: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        zone: {
          select: {
            id: true,
            code: true,
            name: true,
            row: true,
            column: true,
            level: true,
            warehouse: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  findDefaultCategory() {
    return this.prisma.inventoryCategory.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  findWarehouseZonesByIds(ids: string[]) {
    return this.prisma.warehouseZone.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        warehouseId: true,
      },
    });
  }

  findInboundCostLines(materialIds: string[], db: DbClient = this.prisma) {
    return db.inventoryTransactionItem.findMany({
      where: {
        inventoryItemId: {
          in: materialIds,
        },
        quantity: {
          gt: 0,
        },
        OR: [
          {
            unitPrice: {
              gt: 0,
            },
          },
          {
            totalAmount: {
              gt: 0,
            },
          },
        ],
      },
      select: {
        inventoryItemId: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
      },
    });
  }

  aggregateInboundCosts(
    materialIds: string[],
    db: DbClient = this.prisma,
  ): Promise<AggregatedInboundCost[]> {
    if (materialIds.length === 0) return Promise.resolve([]);
    return db.$queryRaw<AggregatedInboundCost[]>(Prisma.sql`
      SELECT
        "inventoryItemId",
        SUM(ABS(quantity))::double precision AS "totalQuantity",
        SUM(
          CASE
            WHEN "totalAmount" IS NOT NULL THEN ABS("totalAmount")
            ELSE ABS(COALESCE("unitPrice", 0)) * ABS(quantity)
          END
        )::double precision AS "totalValue"
      FROM inventory_transaction_items
      WHERE "inventoryItemId" IN (${Prisma.join(materialIds)})
        AND quantity > 0
        AND ("unitPrice" > 0 OR "totalAmount" > 0)
      GROUP BY "inventoryItemId"
    `);
  }

  aggregateTransactionItemQuantity(
    inventoryItemId: string,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryTransactionItem.aggregate({
      where: { inventoryItemId },
      _sum: { quantity: true },
    });
  }

  findLocationStockBucket(
    where: {
      inventoryItemId: string;
      warehouseId?: string | null;
      zoneId?: string | null;
      slotId?: string | null;
      level?: string | null;
    },
    db: DbClient = this.prisma,
  ) {
    return db.inventoryLocationStock.findFirst({
      where: {
        inventoryItemId: where.inventoryItemId,
        warehouseId: where.warehouseId ?? null,
        zoneId: where.zoneId ?? null,
        slotId: where.slotId ?? null,
        level: where.level ?? null,
      },
    });
  }

  findLocationStockBuckets(
    buckets: Array<{
      inventoryItemId: string;
      warehouseId?: string | null;
      zoneId?: string | null;
      slotId?: string | null;
      level?: string | null;
    }>,
    db: DbClient = this.prisma,
  ): Promise<LocationStockBucketRow[]> {
    if (buckets.length === 0) return Promise.resolve([]);
    return db.inventoryLocationStock.findMany({
      where: {
        OR: buckets.map((bucket) => ({
          inventoryItemId: bucket.inventoryItemId,
          warehouseId: bucket.warehouseId ?? null,
          zoneId: bucket.zoneId ?? null,
          slotId: bucket.slotId ?? null,
          level: bucket.level ?? null,
        })),
      },
      select: {
        inventoryItemId: true,
        warehouseId: true,
        zoneId: true,
        slotId: true,
        level: true,
        quantity: true,
      },
    });
  }

  groupTransactionItemStockByItems(itemIds: string[]) {
    return this.prisma.inventoryTransactionItem.groupBy({
      by: ['inventoryItemId'],
      where: {
        inventoryItemId: {
          in: itemIds,
        },
      },
      _sum: {
        quantity: true,
      },
    });
  }

  listReturnRequests(query: { status?: any; flowType?: any; search?: string }) {
    return this.prisma.returnRequest.findMany({
      where: {
        status: query.status,
        flowType: query.flowType,
        OR: query.search
          ? [
              {
                returnNo: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                remarks: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ]
          : undefined,
      },
      include: this.returnRequestInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findActivityLogsByEntity(entity: string, entityIds: string[]) {
    return this.prisma.activityLog.findMany({
      where: {
        entity,
        entityId: {
          in: entityIds,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  createReturnRequest(data: any, db: DbClient = this.prisma) {
    return db.returnRequest.create({
      data,
      include: this.returnRequestInclude(),
    });
  }

  updateReturnRequest(
    id: string,
    data: Prisma.ReturnRequestUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.returnRequest.update({
      where: { id },
      data,
      include: this.returnRequestInclude(),
    });
  }

  updateReturnRequestItem(
    id: string,
    data: Prisma.ReturnRequestItemUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.returnRequestItem.update({
      where: { id },
      data,
    });
  }

  findReturnRequestById(id: string, db: DbClient = this.prisma) {
    return db.returnRequest.findUnique({
      where: { id },
      include: this.returnRequestInclude(),
    });
  }

  findSiteReturnAvailabilitySources(params: {
    projectId: string;
    inventoryItemId: string;
    flowType: any;
    statuses: any[];
  }) {
    return Promise.all([
      this.prisma.projectTaskMaterialAllocation.findMany({
        where: {
          inventoryItemId: params.inventoryItemId,
          projectTask: {
            projectId: params.projectId,
          },
        },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: {
          projectId: params.projectId,
        },
        include: {
          items: true,
        },
      }),
      this.prisma.returnRequest.findMany({
        where: {
          projectId: params.projectId,
          flowType: params.flowType,
          status: {
            in: params.statuses,
          },
        },
        include: {
          items: true,
        },
      }),
    ] as const);
  }

  findProjectTaskMaterialAllocationsForReturn(
    params: {
      projectId: string;
      inventoryItemId: string;
    },
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskMaterialAllocation.findMany({
      where: {
        inventoryItemId: params.inventoryItemId,
        projectTask: {
          projectId: params.projectId,
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  updateProjectTaskMaterialAllocation(
    id: string,
    data: Prisma.ProjectTaskMaterialAllocationUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.projectTaskMaterialAllocation.update({
      where: { id },
      data,
    });
  }

  listZones() {
    return this.prisma.warehouseZone.findMany({
      orderBy: [{ active: 'desc' }, { code: 'asc' }],
      include: this.zoneInclude(),
    });
  }

  findZoneById(id: string) {
    return this.prisma.warehouseZone.findUnique({
      where: { id },
      include: this.zoneInclude(),
    });
  }

  createZone(data: Prisma.WarehouseZoneUncheckedCreateInput) {
    return this.prisma.warehouseZone.create({ data });
  }

  updateZone(id: string, data: Prisma.WarehouseZoneUncheckedUpdateInput) {
    return this.prisma.warehouseZone.update({
      where: { id },
      data,
    });
  }

  listCategories() {
    return this.prisma.inventoryCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(data: Prisma.InventoryCategoryCreateInput) {
    return this.prisma.inventoryCategory.create({ data });
  }

  updateCategory(id: string, data: Prisma.InventoryCategoryUpdateInput) {
    return this.prisma.inventoryCategory.update({
      where: { id },
      data,
    });
  }

  listUnits() {
    return this.prisma.masterUnit.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
      select: this.unitSelect(),
    });
  }

  createUnit(data: Prisma.MasterUnitCreateInput) {
    return this.prisma.masterUnit.create({
      data,
      select: this.unitSelect(),
    });
  }

  updateUnit(id: string, data: Prisma.MasterUnitUpdateInput) {
    return this.prisma.masterUnit.update({
      where: { id },
      data,
      select: this.unitSelect(),
    });
  }

  listMaterialTypes() {
    return this.prisma.materialType.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  createMaterialType(data: Prisma.MaterialTypeCreateInput) {
    return this.prisma.materialType.create({ data });
  }

  updateMaterialType(id: string, data: Prisma.MaterialTypeUpdateInput) {
    return this.prisma.materialType.update({
      where: { id },
      data,
    });
  }

  async inventoryPlatformHealth() {
    const [
      itemCount,
      transactionCount,
      locationStockCount,
      returnRequestCount,
      snapshotCount,
      latestSnapshot,
      materialSnapshotCount,
      latestMaterialSnapshot,
      locationSnapshotCount,
      latestLocationSnapshot,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    ] = await Promise.all([
      this.prisma.inventoryItem.count({ where: { deletedAt: null } }),
      this.prisma.inventoryTransaction.count(),
      this.prisma.inventoryLocationStock.count(),
      this.prisma.returnRequest.count(),
      this.prisma.inventoryDashboardSnapshot.count(),
      this.prisma.inventoryDashboardSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.inventoryMaterialSnapshot.count(),
      this.prisma.inventoryMaterialSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.inventoryLocationSnapshot.count(),
      this.prisma.inventoryLocationSnapshot.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'inventory.' },
          status: { in: ['PENDING', 'DISPATCHING', 'FAILED'] as any },
        },
      }),
      this.prisma.outboxEvent.count({
        where: {
          eventName: { startsWith: 'inventory.' },
          status: { in: ['FAILED', 'DEAD_LETTER'] as any },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          OR: [
            { name: { contains: 'inventory', mode: 'insensitive' } },
            { queue: { contains: 'inventory', mode: 'insensitive' } },
          ],
          status: { in: ['QUEUED', 'RUNNING', 'RETRYING'] as any },
        },
      }),
      this.prisma.backgroundJob.count({
        where: {
          OR: [
            { name: { contains: 'inventory', mode: 'insensitive' } },
            { queue: { contains: 'inventory', mode: 'insensitive' } },
          ],
          status: { in: ['FAILED', 'DEAD_LETTER'] as any },
        },
      }),
    ]);

    return {
      itemCount,
      transactionCount,
      locationStockCount,
      returnRequestCount,
      snapshotCount,
      latestSnapshotAt: latestSnapshot?.updatedAt ?? null,
      materialSnapshotCount,
      latestMaterialSnapshotAt: latestMaterialSnapshot?.updatedAt ?? null,
      locationSnapshotCount,
      latestLocationSnapshotAt: latestLocationSnapshot?.updatedAt ?? null,
      pendingOutbox,
      failedOutbox,
      activeJobs,
      failedJobs,
    };
  }

  private returnRequestInclude() {
    return {
      project: true,
      warehouse: true,
      items: {
        include: {
          inventoryItem: true,
          unit: true,
          zone: true,
        },
      },
    };
  }

  private zoneInclude() {
    return {
      warehouse: true,
      inventoryItems: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          code: true,
          name: true,
          quantity: true,
          unit: true,
          slotId: true,
          level: true,
          unitMaster: {
            select: {
              symbol: true,
              code: true,
            },
          },
        },
      },
      locationStocks: {
        where: {
          quantity: {
            gt: 0,
          },
        },
        include: {
          inventoryItem: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
            },
          },
        },
      },
    };
  }

  private unitSelect() {
    return {
      id: true,
      code: true,
      name: true,
      symbol: true,
      category: true,
      precision: true,
      active: true,
    };
  }

  private buildItemWhere(search?: string): Prisma.InventoryItemWhereInput {
    const value = search?.trim();
    const base: Prisma.InventoryItemWhereInput = {
      deletedAt: null,
    };

    if (!value) return base;

    return {
      ...base,
      OR: [
        {
          code: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          category: {
            name: {
              contains: value,
              mode: 'insensitive',
            },
          },
        },
      ],
    };
  }
}
