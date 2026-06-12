import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, ProductionMaterialLedgerEventType } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { ListProductionMaterialLedgerDto } from '../dto/production.dto';

type ProductionTx = Prisma.TransactionClient;

type LedgerSourceLine = {
  inventoryItemId: string;
  warehouseId?: string | null;
  zoneId?: string | null;
  slotId?: string | null;
  level?: string | null;
  quantity: number;
};

@Injectable()
export class ProductionMaterialLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: ListProductionMaterialLedgerDto = {}) {
    return this.prisma.productionMaterialLedger.findMany({
      where: this.buildWhere(query),
      include: this.ledgerInclude(),
      orderBy: { eventDate: 'desc' },
      take: query.limit ?? 100,
      skip: query.page && query.limit ? (query.page - 1) * query.limit : undefined,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.productionMaterialLedger.findUnique({
      where: { id },
      include: this.ledgerInclude(),
    });

    if (!row) {
      throw new NotFoundException('Production material ledger record not found');
    }

    return row;
  }

  findByProductionOrder(productionOrderId: string) {
    return this.findAll({ productionOrderId, limit: 200 });
  }

  createReservationEntries(
    params: {
      productionOrderId: string;
      reservationId?: string;
      eventType: ProductionMaterialLedgerEventType;
      lines: LedgerSourceLine[];
      remark?: string;
      createdBy?: string;
      eventDate?: Date;
    },
    tx: ProductionTx = this.prisma,
  ) {
    const eventDate = params.eventDate ?? new Date();
    const data = params.lines
      .filter((line) => Number.isFinite(line.quantity) && line.quantity !== 0)
      .map((line) => ({
        productionOrderId: params.productionOrderId,
        reservationId: params.reservationId,
        inventoryItemId: line.inventoryItemId,
        warehouseId: line.warehouseId ?? undefined,
        zoneId: line.zoneId ?? undefined,
        slotId: line.slotId ?? undefined,
        level: line.level ?? undefined,
        quantity: line.quantity,
        eventType: params.eventType,
        eventDate,
        remark: params.remark,
        createdBy: params.createdBy,
      }));

    if (!data.length) {
      return Promise.resolve({ count: 0 });
    }

    return tx.productionMaterialLedger.createMany({ data });
  }

  private buildWhere(query: ListProductionMaterialLedgerDto) {
    return {
      productionOrderId: query.productionOrderId,
      reservationId: query.reservationId,
      inventoryItemId: query.inventoryItemId,
      warehouseId: query.warehouseId,
      zoneId: query.zoneId,
      eventType: query.eventType,
      eventDate:
        query.fromDate || query.toDate
          ? {
              gte: query.fromDate,
              lte: query.toDate,
            }
          : undefined,
    } satisfies Prisma.ProductionMaterialLedgerWhereInput;
  }

  private ledgerInclude() {
    return {
      productionOrder: {
        select: { id: true, orderNo: true, title: true, status: true },
      },
      reservation: {
        select: { id: true, reservationNo: true, status: true },
      },
      inventoryItem: {
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          unitMaster: { select: { symbol: true } },
        },
      },
      warehouse: { select: { id: true, code: true, name: true } },
      zone: { select: { id: true, code: true, name: true } },
    } satisfies Prisma.ProductionMaterialLedgerInclude;
  }
}
