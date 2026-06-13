import { Controller, Get } from '@nestjs/common';

import {
  ComponentStatus,
  ProductionMaterialReservationStatus,
  TransactionType,
} from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

const EPSILON = 0.000001;
const activeReservationStatuses: ProductionMaterialReservationStatus[] = [
  ProductionMaterialReservationStatus.RESERVED,
  ProductionMaterialReservationStatus.PARTIALLY_ISSUED,
];

type LocationKey = {
  inventoryItemId: string;
  warehouseId?: string | null;
  zoneId?: string | null;
  slotId?: string | null;
  level?: string | null;
};

@Controller('runtime/integrity')
export class RuntimeIntegrityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('inventory-summary')
  async inventorySummary() {
    const [transactions, transactionItems, locationStocks, inventoryItems] =
      await Promise.all([
        this.prisma.inventoryTransaction.findMany({
          select: {
            id: true,
            type: true,
            items: {
              select: {
                inventoryItemId: true,
                warehouseId: true,
                zoneId: true,
                slotId: true,
                level: true,
                quantity: true,
              },
            },
          },
        }),
        this.prisma.inventoryTransactionItem.count(),
        this.prisma.inventoryLocationStock.findMany(),
        this.prisma.inventoryItem.findMany({
          select: {
            id: true,
            quantity: true,
          },
        }),
      ]);

    const derived = new Map<string, number>();
    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const key = this.locationKey(item);
        derived.set(
          key,
          (derived.get(key) ?? 0) + Number(item.quantity ?? 0),
        );
      }
    }

    const stock = new Map<string, number>();
    for (const row of locationStocks) {
      stock.set(this.locationKey(row), Number(row.quantity ?? 0));
    }

    const locationMismatchCount = Array.from(
      new Set([...derived.keys(), ...stock.keys()]),
    ).filter((key) => Math.abs((derived.get(key) ?? 0) - (stock.get(key) ?? 0)) > EPSILON)
      .length;

    const stockByItem = new Map<string, number>();
    for (const row of locationStocks) {
      stockByItem.set(
        row.inventoryItemId,
        (stockByItem.get(row.inventoryItemId) ?? 0) + Number(row.quantity ?? 0),
      );
    }

    const itemSnapshotMismatchCount = inventoryItems.filter(
      (item) =>
        Math.abs(Number(item.quantity ?? 0) - (stockByItem.get(item.id) ?? 0)) >
        EPSILON,
    ).length;

    const transactionTypeCounts = transactions.reduce(
      (map, transaction) => {
        map[transaction.type] = (map[transaction.type] ?? 0) + 1;
        return map;
      },
      {} as Record<TransactionType, number>,
    );

    return {
      transactions: transactions.length,
      transactionItems,
      locationStocks: locationStocks.length,
      locationStockQuantity: locationStocks.reduce(
        (sum, row) => sum + Number(row.quantity ?? 0),
        0,
      ),
      negativeLocationStocks: locationStocks.filter(
        (row) => Number(row.quantity ?? 0) < 0,
      ).length,
      locationMismatchCount,
      itemSnapshotMismatchCount,
      transactionTypeCounts,
    };
  }

  @Get('production-summary')
  async productionSummary() {
    const [
      reservations,
      reservationLines,
      issues,
      consumptions,
      ledgers,
      locationStocks,
    ] =
      await Promise.all([
        this.prisma.productionMaterialReservation.findMany({
          select: {
            status: true,
          },
        }),
        this.prisma.productionMaterialReservationLine.findMany({
          include: {
            reservation: {
              select: {
                status: true,
              },
            },
          },
        }),
        this.prisma.productionMaterialIssue.findMany(),
        this.prisma.productionMaterialConsumption.findMany(),
        this.prisma.productionMaterialLedger.findMany({
          select: {
            eventType: true,
          },
        }),
        this.prisma.inventoryLocationStock.findMany({
          where: {
            quantity: { gt: EPSILON },
          },
          select: {
            inventoryItemId: true,
            warehouseId: true,
            zoneId: true,
            slotId: true,
            level: true,
            quantity: true,
          },
        }),
      ]);

    const issueBalance = this.productionIssueBalances(issues, consumptions);
    const consumptionBalanceViolations = issueBalance.filter(
      (row) =>
        row.returnedQty + row.consumedQty + row.scrapQty >
        row.issuedQty + EPSILON,
    );

    const exactCostingBalanceViolations = issueBalance.filter(
      (row) =>
        Math.abs(row.issuedQty - row.returnedQty - row.consumedQty - row.scrapQty) >
        EPSILON,
    );

    const activeReservationLines = reservationLines.filter((line) =>
      activeReservationStatuses.includes(line.reservation.status),
    );
    const activeStockBuckets = new Map(
      locationStocks.map((stock) => [this.locationKey(stock), Number(stock.quantity ?? 0)]),
    );
    const invalidReservationBuckets = activeReservationLines.filter(
      (line) => {
        const openQty = Math.max(
          Number(line.reservedQty ?? 0) - Number(line.issuedQty ?? 0),
          0,
        );
        if (openQty <= EPSILON) return false;
        const stockQty = activeStockBuckets.get(this.locationKey(line)) ?? 0;
        return stockQty <= EPSILON;
      },
    );

    return {
      reservations: reservations.length,
      reservationStatusCounts: this.countBy(reservations, 'status'),
      reservationLines: reservationLines.length,
      overIssuedReservationLines: reservationLines.filter(
        (line) => Number(line.issuedQty ?? 0) > Number(line.reservedQty ?? 0) + EPSILON,
      ).length,
      overReturnedReservationLines: reservationLines.filter(
        (line) => Number(line.returnedQty ?? 0) > Number(line.issuedQty ?? 0) + EPSILON,
      ).length,
      openReservedQuantity: reservationLines.reduce(
        (sum, line) =>
          sum +
          Math.max(
            Number(line.reservedQty ?? 0) - Number(line.issuedQty ?? 0),
            0,
          ),
        0,
      ),
      issues: issues.length,
      issuedQty: issues.reduce((sum, issue) => sum + Number(issue.issuedQty ?? 0), 0),
      returnedQty: issues.reduce((sum, issue) => sum + Number(issue.returnedQty ?? 0), 0),
      consumptions: consumptions.length,
      consumedQty: consumptions.reduce(
        (sum, row) => sum + Number(row.consumedQty ?? 0),
        0,
      ),
      scrapQty: consumptions.reduce((sum, row) => sum + Number(row.scrapQty ?? 0), 0),
      ledgers: ledgers.length,
      ledgerEventCounts: this.countBy(ledgers, 'eventType'),
      consumptionBalanceViolations: consumptionBalanceViolations.length,
      exactCostingBalanceViolations: exactCostingBalanceViolations.length,
      invalidReservationBuckets: invalidReservationBuckets.length,
    };
  }

  @Get('project-summary')
  async projectSummary() {
    const components = await this.prisma.component.findMany({
      select: {
        status: true,
        projectId: true,
        installZone: true,
        installAxis: true,
        installLevel: true,
        installPosition: true,
      },
    });

    const installed = components.filter(
      (component) => component.status === ComponentStatus.INSTALLED,
    );

    return {
      components: components.length,
      lifecycleCounts: this.countBy(components, 'status'),
      ready: components.filter((row) => row.status === ComponentStatus.READY).length,
      shipped: components.filter((row) => row.status === ComponentStatus.SHIPPED)
        .length,
      delivered: components.filter((row) => row.status === ComponentStatus.DELIVERED)
        .length,
      installed: installed.length,
      installedWithoutProject: installed.filter((row) => !row.projectId).length,
      installedMissingLocation: installed.filter(
        (row) =>
          !row.installZone ||
          !row.installAxis ||
          !row.installLevel ||
          !row.installPosition,
      ).length,
    };
  }

  private locationKey(row: LocationKey) {
    return [
      row.inventoryItemId,
      row.warehouseId ?? '',
      row.zoneId ?? '',
      row.slotId ?? '',
      row.level ?? '',
    ].join('|');
  }

  private countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
    return rows.reduce(
      (map, row) => {
        const value = String(row[key] ?? 'UNKNOWN');
        map[value] = (map[value] ?? 0) + 1;
        return map;
      },
      {} as Record<string, number>,
    );
  }

  private productionIssueBalances(
    issues: Array<{
      productionOrderId: string;
      inventoryItemId: string;
      issuedQty: number;
      returnedQty: number;
    }>,
    consumptions: Array<{
      productionOrderId: string;
      inventoryItemId: string;
      consumedQty: number;
      scrapQty: number;
    }>,
  ) {
    const balances = new Map<
      string,
      {
        issuedQty: number;
        returnedQty: number;
        consumedQty: number;
        scrapQty: number;
      }
    >();

    for (const issue of issues) {
      const key = `${issue.productionOrderId}|${issue.inventoryItemId}`;
      const current = balances.get(key) ?? {
        issuedQty: 0,
        returnedQty: 0,
        consumedQty: 0,
        scrapQty: 0,
      };
      current.issuedQty += Number(issue.issuedQty ?? 0);
      current.returnedQty += Number(issue.returnedQty ?? 0);
      balances.set(key, current);
    }

    for (const consumption of consumptions) {
      const key = `${consumption.productionOrderId}|${consumption.inventoryItemId}`;
      const current = balances.get(key) ?? {
        issuedQty: 0,
        returnedQty: 0,
        consumedQty: 0,
        scrapQty: 0,
      };
      current.consumedQty += Number(consumption.consumedQty ?? 0);
      current.scrapQty += Number(consumption.scrapQty ?? 0);
      balances.set(key, current);
    }

    return Array.from(balances.values());
  }
}
