import { randomUUID } from 'node:crypto';

import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, ProductionMaterialLedgerEventType } from '@prisma/client';

import { ListProductionMaterialLedgerDto } from '../dto/production.dto';
import { ProductionMaterialEventName } from '../domain/production-material-contracts';
import {
  ProductionLedgerTx,
  ProductionMaterialLedgerRepository,
} from '../repositories/production-material-ledger.repository';

type ProductionTx = ProductionLedgerTx;

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
  constructor(private readonly repository: ProductionMaterialLedgerRepository) {}

  findAll(query: ListProductionMaterialLedgerDto = {}) {
    return this.repository.findMany(this.buildWhere(query), {
      take: query.limit ?? 100,
      skip: query.page && query.limit ? (query.page - 1) * query.limit : undefined,
    });
  }

  async findOne(id: string) {
    const row = await this.repository.findById(id);

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
    tx?: ProductionTx,
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

    return this.repository.createMany(data, tx);
  }

  createMaterialEvent(
    params: {
      eventName: ProductionMaterialEventName;
      productionOrderId: string;
      reservationId?: string;
      materialIssueId?: string;
      consumptionId?: string;
      inventoryItemId?: string;
      inventoryTransactionId?: string;
      quantity: number;
      unit: string;
      warehouseId?: string | null;
      zoneId?: string | null;
      slotId?: string | null;
      level?: string | null;
      resultingBalance?: number;
      actorId?: string;
      occurredAt?: Date;
      sourceVersion: string;
    },
    tx: ProductionTx,
  ) {
    const occurredAt = params.occurredAt ?? new Date();
    const aggregateId =
      params.consumptionId ??
      params.materialIssueId ??
      params.reservationId ??
      params.productionOrderId;
    const idempotencyKey = `${params.eventName}:${aggregateId}:${params.inventoryItemId ?? 'none'}:${params.sourceVersion}`;
    const eventId = randomUUID();
    const orderingKey = params.inventoryItemId
      ? `production-order:${params.productionOrderId}:material:${params.inventoryItemId}`
      : `production-order:${params.productionOrderId}:material`;
    const stateByEvent: Record<ProductionMaterialEventName, string> = {
      'production.material.reserved': 'RESERVED',
      'production.material.released': 'RELEASED',
      'production.material.issued': 'ISSUED',
      'production.material.consumed': 'CONSUMED',
      'production.material.returned': 'RETURNED',
    };
    const aggregateVersion = Math.max(1, occurredAt.getTime());

    return this.repository.createOutboxEvent(
      {
        eventName: params.eventName,
        payload: {
          id: aggregateId,
          aggregateId,
          productionOrderId: params.productionOrderId,
          reservationId: params.reservationId ?? null,
          materialIssueId: params.materialIssueId ?? null,
          consumptionId: params.consumptionId ?? null,
          materialId: params.inventoryItemId ?? null,
          inventoryItemId: params.inventoryItemId ?? null,
          inventoryTransactionId: params.inventoryTransactionId ?? null,
          quantity: params.quantity,
          unit: params.unit,
          warehouseId: params.warehouseId ?? null,
          zoneId: params.zoneId ?? null,
          slotId: params.slotId ?? null,
          level: params.level ?? null,
          resultingBalance: params.resultingBalance ?? null,
          state: stateByEvent[params.eventName],
          actorId: params.actorId ?? null,
          occurredAt: occurredAt.toISOString(),
          sourceVersion: params.sourceVersion,
          aggregateVersion,
        },
        metadata: {
          eventId,
          eventName: params.eventName,
          eventVersion: 1,
          occurredAt: occurredAt.toISOString(),
          producer: 'production',
          aggregateType: 'ProductionMaterial',
          aggregateId,
          aggregateVersion,
          correlationId: params.productionOrderId,
          causationId: null,
          idempotencyKey,
          actorId: params.actorId ?? null,
          tenantId: null,
          orderingKey,
          persistToOutbox: true,
        },
        idempotencyKey,
        maxRetries: 10,
      },
      tx,
    );
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

}
