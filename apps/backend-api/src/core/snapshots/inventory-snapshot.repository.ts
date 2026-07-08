import {
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  Prisma,
  ProductionMaterialReservationLineStatus,
  ReturnRequestStatus,
  TransactionType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface InventorySnapshotPayload {
  warehouseId: string;
  warehouseCode: string;
  snapshotDate: Date;
  totalMaterials: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  lowStockCount: number;
  movementToday: number;
  movementMonth: number;
  inventoryValue: number;
}

export interface InventoryMaterialSnapshotPayload {
  materialId: string;
  warehouseId?: string | null;
  warehouseCode?: string | null;
  scopeKey: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  allocatedToProjects: number;
  pendingReturn: number;
  returnedQuantity: number;
  inboundQuantity: number;
  outboundQuantity: number;
  inventoryValue: number;
  attachmentCount: number;
  locationCount: number;
  lastInboundAt?: Date | null;
  lastOutboundAt?: Date | null;
  detailPayload?: Prisma.InputJsonValue;
  locationPayload?: Prisma.InputJsonValue;
  transactionPayload?: Prisma.InputJsonValue;
}

export interface InventoryLocationSnapshotPayload {
  locationKey: string;
  warehouseId?: string | null;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  zoneId?: string | null;
  zoneCode?: string | null;
  zoneName?: string | null;
  slotId?: string | null;
  level?: string | null;
  quantity: number;
  occupied: boolean;
  materialCount: number;
  materialPayload?: Prisma.InputJsonValue;
}

@Injectable()
export class InventorySnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findLatest(warehouseId: string, snapshotDate: Date) {
    return this.prisma.inventoryDashboardSnapshot.findUnique({
      where: {
        warehouseId_snapshotDate: {
          warehouseId,
          snapshotDate,
        },
      },
    });
  }

  findByDate(snapshotDate: Date) {
    return this.prisma.inventoryDashboardSnapshot.findMany({
      where: {
        snapshotDate,
      },
      orderBy: {
        warehouseCode: 'asc',
      },
    });
  }

  findMaterialDetailSnapshot(materialId: string) {
    return this.prisma.inventoryMaterialSnapshot.findUnique({
      where: {
        materialId_scopeKey: {
          materialId,
          scopeKey: 'ALL',
        },
      },
    });
  }

  findMaterialSnapshots(materialId?: string) {
    return this.prisma.inventoryMaterialSnapshot.findMany({
      where: {
        materialId,
      },
      orderBy: [
        {
          materialId: 'asc',
        },
        {
          scopeKey: 'asc',
        },
      ],
    });
  }

  findLocationSnapshots() {
    return this.prisma.inventoryLocationSnapshot.findMany({
      orderBy: [
        {
          warehouseCode: 'asc',
        },
        {
          zoneCode: 'asc',
        },
        {
          slotId: 'asc',
        },
        {
          level: 'asc',
        },
      ],
    });
  }

  latestMaterialSnapshot() {
    return this.prisma.inventoryMaterialSnapshot.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    });
  }

  latestLocationSnapshot() {
    return this.prisma.inventoryLocationSnapshot.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    });
  }

  async calculate(snapshotDate = new Date()): Promise<InventorySnapshotPayload[]> {
    const dayStart = this.startOfDay(snapshotDate);
    const dayEnd = this.addDays(dayStart, 1);
    const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);

    const [
      warehouses,
      stocks,
      reservationLines,
      todayItems,
      monthItems,
      priceRows,
    ] = await Promise.all([
      this.prisma.masterWarehouse.findMany({
        where: {
          active: true,
        },
        select: {
          id: true,
          code: true,
        },
      }),
      this.prisma.inventoryLocationStock.findMany({
        include: {
          inventoryItem: {
            select: {
              id: true,
              minimumStock: true,
            },
          },
        },
      }),
      this.prisma.productionMaterialReservationLine.findMany({
        where: {
          status: {
            in: [
              ProductionMaterialReservationLineStatus.OPEN,
              ProductionMaterialReservationLineStatus.PARTIAL,
              ProductionMaterialReservationLineStatus.SHORTAGE,
            ],
          },
        },
        select: {
          warehouseId: true,
          reservedQty: true,
          issuedQty: true,
          returnedQty: true,
        },
      }),
      this.findMovementItems(dayStart, dayEnd),
      this.findMovementItems(monthStart, dayEnd),
      this.prisma.inventoryTransactionItem.findMany({
        where: {
          unitPrice: {
            not: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          inventoryItemId: true,
          unitPrice: true,
        },
      }),
    ]);

    const latestPrice = new Map<string, number>();
    for (const row of priceRows) {
      if (!latestPrice.has(row.inventoryItemId)) {
        latestPrice.set(row.inventoryItemId, Number(row.unitPrice ?? 0));
      }
    }

    return warehouses.map((warehouse) => {
      const warehouseStocks = stocks.filter(
        (stock) => stock.warehouseId === warehouse.id,
      );
      const materialIds = new Set(
        warehouseStocks.map((stock) => stock.inventoryItemId),
      );
      const totalStock = this.sum(
        warehouseStocks.map((stock) => Number(stock.quantity ?? 0)),
      );
      const reservedStock = this.sum(
        reservationLines
          .filter((line) => line.warehouseId === warehouse.id)
          .map((line) =>
            Math.max(
              0,
              Number(line.reservedQty ?? 0) -
                Number(line.issuedQty ?? 0) -
                Number(line.returnedQty ?? 0),
            ),
          ),
      );
      const inventoryValue = this.sum(
        warehouseStocks.map((stock) => {
          const unitPrice = latestPrice.get(stock.inventoryItemId) ?? 0;
          return Number(stock.quantity ?? 0) * unitPrice;
        }),
      );

      return {
        warehouseId: warehouse.id,
        warehouseCode: warehouse.code,
        snapshotDate: dayStart,
        totalMaterials: materialIds.size,
        totalStock,
        availableStock: Math.max(0, totalStock - reservedStock),
        reservedStock,
        lowStockCount: warehouseStocks.filter(
          (stock) =>
            Number(stock.quantity ?? 0) <=
            Number(stock.inventoryItem.minimumStock ?? 0),
        ).length,
        movementToday: this.movementTotal(todayItems, warehouse.id),
        movementMonth: this.movementTotal(monthItems, warehouse.id),
        inventoryValue,
      };
    });
  }

  upsert(payload: InventorySnapshotPayload, tx: Prisma.TransactionClient) {
    return tx.inventoryDashboardSnapshot.upsert({
      where: {
        warehouseId_snapshotDate: {
          warehouseId: payload.warehouseId,
          snapshotDate: payload.snapshotDate,
        },
      },
      create: payload,
      update: {
        warehouseCode: payload.warehouseCode,
        totalMaterials: payload.totalMaterials,
        totalStock: payload.totalStock,
        availableStock: payload.availableStock,
        reservedStock: payload.reservedStock,
        lowStockCount: payload.lowStockCount,
        movementToday: payload.movementToday,
        movementMonth: payload.movementMonth,
        inventoryValue: payload.inventoryValue,
      },
    });
  }

  upsertMaterial(
    payload: InventoryMaterialSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.inventoryMaterialSnapshot.upsert({
      where: {
        materialId_scopeKey: {
          materialId: payload.materialId,
          scopeKey: payload.scopeKey,
        },
      },
      create: payload,
      update: {
        warehouseId: payload.warehouseId,
        warehouseCode: payload.warehouseCode,
        currentStock: payload.currentStock,
        availableStock: payload.availableStock,
        reservedStock: payload.reservedStock,
        allocatedToProjects: payload.allocatedToProjects,
        pendingReturn: payload.pendingReturn,
        returnedQuantity: payload.returnedQuantity,
        inboundQuantity: payload.inboundQuantity,
        outboundQuantity: payload.outboundQuantity,
        inventoryValue: payload.inventoryValue,
        attachmentCount: payload.attachmentCount,
        locationCount: payload.locationCount,
        lastInboundAt: payload.lastInboundAt,
        lastOutboundAt: payload.lastOutboundAt,
        detailPayload: payload.detailPayload,
        locationPayload: payload.locationPayload,
        transactionPayload: payload.transactionPayload,
      },
    });
  }

  upsertLocation(
    payload: InventoryLocationSnapshotPayload,
    tx: Prisma.TransactionClient,
  ) {
    return tx.inventoryLocationSnapshot.upsert({
      where: {
        locationKey: payload.locationKey,
      },
      create: payload,
      update: {
        warehouseId: payload.warehouseId,
        warehouseCode: payload.warehouseCode,
        warehouseName: payload.warehouseName,
        zoneId: payload.zoneId,
        zoneCode: payload.zoneCode,
        zoneName: payload.zoneName,
        slotId: payload.slotId,
        level: payload.level,
        quantity: payload.quantity,
        occupied: payload.occupied,
        materialCount: payload.materialCount,
        materialPayload: payload.materialPayload,
      },
    });
  }

  markMissingLocationsEmpty(
    activeLocationKeys: string[],
    tx: Prisma.TransactionClient,
  ) {
    return tx.inventoryLocationSnapshot.updateMany({
      where: {
        locationKey: {
          notIn: activeLocationKeys,
        },
        occupied: true,
      },
      data: {
        quantity: 0,
        occupied: false,
        materialCount: 0,
        materialPayload: [],
      },
    });
  }

  async calculateMaterialSnapshots(
    materialId?: string,
  ): Promise<InventoryMaterialSnapshotPayload[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        deletedAt: null,
        id: materialId,
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
    const itemIds = items.map((item) => item.id);
    if (itemIds.length === 0) {
      return [];
    }

    const [
      stocks,
      transactionItems,
      suppliers,
      reservations,
      allocations,
      returnItems,
      attachments,
    ] = await Promise.all([
      this.prisma.inventoryLocationStock.findMany({
        where: {
          inventoryItemId: {
            in: itemIds,
          },
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
      }),
      this.prisma.inventoryTransactionItem.findMany({
        where: {
          inventoryItemId: {
            in: itemIds,
          },
        },
        include: {
          transaction: {
            include: {
              project: true,
              zone: {
                include: {
                  warehouse: true,
                },
              },
            },
          },
          unit: true,
          warehouse: true,
          zone: {
            include: {
              warehouse: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.supplier.findMany(),
      this.prisma.productionMaterialReservationLine.findMany({
        where: {
          inventoryItemId: {
            in: itemIds,
          },
          status: {
            in: [
              ProductionMaterialReservationLineStatus.OPEN,
              ProductionMaterialReservationLineStatus.PARTIAL,
              ProductionMaterialReservationLineStatus.SHORTAGE,
            ],
          },
        },
        select: {
          inventoryItemId: true,
          warehouseId: true,
          reservedQty: true,
          issuedQty: true,
          returnedQty: true,
        },
      }),
      this.prisma.projectTaskMaterialAllocation.findMany({
        where: {
          inventoryItemId: {
            in: itemIds,
          },
        },
        select: {
          inventoryItemId: true,
          plannedQty: true,
          issuedQty: true,
          usedQty: true,
          returnedQty: true,
          remainingQty: true,
        },
      }),
      this.prisma.returnRequestItem.findMany({
        where: {
          inventoryItemId: {
            in: itemIds,
          },
        },
        include: {
          returnRequest: {
            select: {
              status: true,
            },
          },
        },
      }),
      this.prisma.attachment.groupBy({
        by: ['entityId'],
        where: {
          module: 'inventory',
          entityType: 'material',
          entityId: {
            in: itemIds,
          },
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
    const attachmentCount = new Map(
      attachments.map((row) => [row.entityId ?? '', row._count._all]),
    );
    const rows: InventoryMaterialSnapshotPayload[] = [];

    for (const item of items) {
      const itemStocks = stocks.filter((row) => row.inventoryItemId === item.id);
      const itemLines = transactionItems.filter(
        (row) => row.inventoryItemId === item.id,
      );
      const itemReservations = reservations.filter(
        (row) => row.inventoryItemId === item.id,
      );
      const itemAllocations = allocations.filter(
        (row) => row.inventoryItemId === item.id,
      );
      const itemReturnRows = returnItems.filter(
        (row) => row.inventoryItemId === item.id,
      );
      const inboundLines = itemLines.filter((line) => Number(line.quantity) > 0);
      const outboundLines = itemLines.filter((line) => Number(line.quantity) < 0);
      const currentStock = this.sum(itemLines.map((line) => Number(line.quantity ?? 0)));
      const inboundQuantity = this.sum(inboundLines.map((line) => Number(line.quantity ?? 0)));
      const outboundQuantity = this.sum(outboundLines.map((line) => Math.abs(Number(line.quantity ?? 0))));
      const inboundCost = this.sum(
        inboundLines.map((line) =>
          Number(
            line.totalAmount ??
              (line.unitPrice != null ? Number(line.unitPrice) * Number(line.quantity) : 0),
          ),
        ),
      );
      const averageCost = inboundQuantity > 0 ? inboundCost / inboundQuantity : 0;
      const reservedStock = this.sum(
        itemReservations.map((line) =>
          Math.max(
            0,
            Number(line.reservedQty ?? 0) -
              Number(line.issuedQty ?? 0) -
              Number(line.returnedQty ?? 0),
          ),
        ),
      );
      const allocatedToProjects = this.sum(
        itemAllocations.map((line) => Math.max(0, Number(line.issuedQty ?? 0))),
      );
      const pendingReturn = this.sum(
        itemReturnRows
          .filter((line) =>
            ([
              ReturnRequestStatus.REQUESTED,
              ReturnRequestStatus.APPROVED,
            ] as ReturnRequestStatus[]).includes(line.returnRequest.status),
          )
          .map((line) => Number(line.requestedQuantity ?? 0)),
      );
      const returnedQuantity = this.sum(
        itemReturnRows
          .filter((line) =>
            ([
              ReturnRequestStatus.RECEIVED,
              ReturnRequestStatus.INSPECTED,
              ReturnRequestStatus.DISPOSED,
            ] as ReturnRequestStatus[]).includes(line.returnRequest.status),
          )
          .map((line) =>
            Number(line.receivedQuantity ?? line.requestedQuantity ?? 0),
          ),
      );
      const locationBalances = itemStocks
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
      const detailPayload = {
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
        inboundHistory: inboundLines.map((line) =>
          this.toHistoryLine(line, item, supplierMap),
        ),
        outboundHistory: outboundLines.map((line) =>
          this.toHistoryLine(line, item, supplierMap),
        ),
        supplierHistory: inboundLines.map((line) =>
          this.toHistoryLine(line, item, supplierMap),
        ),
        projectConsumptionHistory: outboundLines.map((line) =>
          this.toHistoryLine(line, item, supplierMap),
        ),
        locationBalances,
      };

      rows.push({
        materialId: item.id,
        warehouseId: null,
        warehouseCode: null,
        scopeKey: 'ALL',
        currentStock,
        availableStock: Math.max(0, currentStock - reservedStock),
        reservedStock,
        allocatedToProjects,
        pendingReturn,
        returnedQuantity,
        inboundQuantity,
        outboundQuantity,
        inventoryValue: currentStock * averageCost,
        attachmentCount: attachmentCount.get(item.id) ?? 0,
        locationCount: locationBalances.length,
        lastInboundAt: inboundLines[0]?.transaction.transactionDate ?? null,
        lastOutboundAt: outboundLines[0]?.transaction.transactionDate ?? null,
        detailPayload: detailPayload as Prisma.InputJsonValue,
        locationPayload: locationBalances as Prisma.InputJsonValue,
        transactionPayload: {
          inboundCount: inboundLines.length,
          outboundCount: outboundLines.length,
          transactionCount: itemLines.length,
        },
      });

      const stocksByWarehouse = new Map<string, typeof itemStocks>();
      for (const stock of itemStocks) {
        const warehouseId = stock.warehouseId ?? stock.zone?.warehouseId;
        if (!warehouseId) {
          continue;
        }
        stocksByWarehouse.set(warehouseId, [
          ...(stocksByWarehouse.get(warehouseId) ?? []),
          stock,
        ]);
      }

      for (const [warehouseId, warehouseStocks] of stocksByWarehouse.entries()) {
        const warehouseCode = warehouseStocks[0]?.zone?.warehouse?.code ?? null;
        const warehouseCurrentStock = this.sum(
          warehouseStocks.map((stock) => Number(stock.quantity ?? 0)),
        );
        const warehouseReservedStock = this.sum(
          itemReservations
            .filter((line) => line.warehouseId === warehouseId)
            .map((line) =>
              Math.max(
                0,
                Number(line.reservedQty ?? 0) -
                  Number(line.issuedQty ?? 0) -
                  Number(line.returnedQty ?? 0),
              ),
            ),
        );
        const warehouseLocations = locationBalances.filter(
          (row) => row.warehouseCode === warehouseCode,
        );

        rows.push({
          materialId: item.id,
          warehouseId,
          warehouseCode,
          scopeKey: `warehouse:${warehouseId}`,
          currentStock: warehouseCurrentStock,
          availableStock: Math.max(
            0,
            warehouseCurrentStock - warehouseReservedStock,
          ),
          reservedStock: warehouseReservedStock,
          allocatedToProjects,
          pendingReturn,
          returnedQuantity,
          inboundQuantity: this.sum(
            inboundLines
              .filter((line) => line.warehouseId === warehouseId)
              .map((line) => Number(line.quantity ?? 0)),
          ),
          outboundQuantity: this.sum(
            outboundLines
              .filter((line) => line.warehouseId === warehouseId)
              .map((line) => Math.abs(Number(line.quantity ?? 0))),
          ),
          inventoryValue: warehouseCurrentStock * averageCost,
          attachmentCount: attachmentCount.get(item.id) ?? 0,
          locationCount: warehouseLocations.length,
          lastInboundAt:
            inboundLines.find((line) => line.warehouseId === warehouseId)
              ?.transaction.transactionDate ?? null,
          lastOutboundAt:
            outboundLines.find((line) => line.warehouseId === warehouseId)
              ?.transaction.transactionDate ?? null,
          detailPayload: undefined,
          locationPayload: warehouseLocations as Prisma.InputJsonValue,
          transactionPayload: {
            inboundCount: inboundLines.filter(
              (line) => line.warehouseId === warehouseId,
            ).length,
            outboundCount: outboundLines.filter(
              (line) => line.warehouseId === warehouseId,
            ).length,
          },
        });
      }
    }

    return rows;
  }

  async calculateLocationSnapshots(): Promise<InventoryLocationSnapshotPayload[]> {
    const stocks = await this.prisma.inventoryLocationStock.findMany({
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
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const grouped = new Map<
      string,
      {
        location: InventoryLocationSnapshotPayload;
        materials: Array<{
          id: string;
          code: string;
          name: string;
          quantity: number;
          unit?: string | null;
        }>;
      }
    >();

    for (const stock of stocks) {
      const key = this.locationKey({
        warehouseId: stock.warehouseId ?? stock.zone?.warehouseId ?? null,
        zoneId: stock.zoneId,
        slotId: stock.slotId,
        level: stock.level,
      });
      const current =
        grouped.get(key) ??
        {
          location: {
            locationKey: key,
            warehouseId: stock.warehouseId ?? stock.zone?.warehouseId ?? null,
            warehouseCode: stock.zone?.warehouse?.code ?? null,
            warehouseName: stock.zone?.warehouse?.name ?? null,
            zoneId: stock.zoneId,
            zoneCode: stock.zone?.code ?? null,
            zoneName: stock.zone?.name ?? null,
            slotId: stock.slotId,
            level: stock.level,
            quantity: 0,
            occupied: false,
            materialCount: 0,
            materialPayload: [],
          },
          materials: [],
        };

      current.location.quantity += Number(stock.quantity ?? 0);
      current.materials.push({
        id: stock.inventoryItem.id,
        code: stock.inventoryItem.code,
        name: stock.inventoryItem.name,
        quantity: Number(stock.quantity ?? 0),
        unit: stock.inventoryItem.unit,
      });
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).map((entry) => ({
      ...entry.location,
      occupied: entry.location.quantity > 0,
      materialCount: entry.materials.length,
      materialPayload: entry.materials as Prisma.InputJsonValue,
    }));
  }

  private toHistoryLine(
    line: {
      transactionId: string;
      transaction?: any;
      quantity: number;
      unitPrice?: number | null;
      totalAmount?: number | null;
      unit?: { code: string } | null;
      zoneId?: string | null;
      zone?: { code: string; name: string } | null;
    },
    item: {
      unit?: string | null;
      unitMaster?: { code: string } | null;
      zone?: {
        code: string;
        name: string;
      } | null;
    },
    supplierMap: Map<string, { name: string }>,
  ) {
    const supplierId = line.transaction?.supplierId ?? null;
    const zone = line.zone ?? line.transaction?.zone ?? item.zone ?? null;

    return {
      transactionId: line.transactionId,
      type: this.toBusinessType(line.transaction?.type),
      transactionNo: line.transaction?.transactionNo ?? line.transaction?.code,
      referenceModule: line.transaction?.referenceModule,
      referenceId: line.transaction?.referenceId,
      note: line.transaction?.note,
      remarks: line.transaction?.remarks,
      transactionDate:
        line.transaction?.transactionDate instanceof Date
          ? line.transaction.transactionDate.toISOString()
          : line.transaction?.transactionDate,
      quantity: Number(line.quantity),
      unitPrice: line.unitPrice != null ? Number(line.unitPrice) : null,
      totalAmount: line.totalAmount != null ? Number(line.totalAmount) : null,
      signedQuantity: Number(line.quantity),
      unit: line.unit?.code ?? item.unit ?? item.unitMaster?.code ?? 'PCS',
      supplierId,
      supplierName: supplierId
        ? supplierMap.get(supplierId)?.name ?? supplierId
        : null,
      projectId: line.transaction?.projectId,
      projectName: line.transaction?.project?.name ?? null,
      projectCode: line.transaction?.project?.code ?? null,
      zoneId: line.zoneId ?? line.transaction?.zoneId ?? null,
      zoneCode: zone?.code ?? null,
      zoneName: zone ? `${zone.code} - ${zone.name}` : null,
      zoneRawName: zone?.name ?? null,
      attachmentName: null,
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

  private locationKey(input: {
    warehouseId?: string | null;
    zoneId?: string | null;
    slotId?: string | null;
    level?: string | null;
  }) {
    return [
      input.warehouseId ?? 'no-warehouse',
      input.zoneId ?? 'no-zone',
      input.slotId ?? 'no-slot',
      input.level ?? 'no-level',
    ].join(':');
  }

  private findMovementItems(from: Date, to: Date) {
    return this.prisma.inventoryTransactionItem.findMany({
      where: {
        transaction: {
          transactionDate: {
            gte: from,
            lt: to,
          },
        },
      },
      include: {
        transaction: {
          select: {
            type: true,
            warehouseId: true,
          },
        },
      },
    });
  }

  private movementTotal(
    rows: Awaited<ReturnType<InventorySnapshotRepository['findMovementItems']>>,
    warehouseId: string,
  ) {
    return this.sum(
      rows
        .filter(
          (row) =>
            (row.warehouseId ?? row.transaction.warehouseId) === warehouseId,
        )
        .map((row) => {
          const sign =
            row.transaction.type === TransactionType.EXPORT ? -1 : 1;
          return Math.abs(Number(row.quantity ?? 0) * sign);
        }),
    );
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private sum(values: number[]) {
    return values.reduce((total, value) => total + value, 0);
  }
}
