import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { InventoryRepository } from './inventory.repository';

type InventoryEventPayload = {
  id: string;
  inventoryItemId?: string | null;
  warehouseId?: string | null;
  transactionNo?: string | null;
  returnNo?: string | null;
  type?: string | null;
  status?: string | null;
  itemCount?: number;
  projectId?: string | null;
  referenceId?: string | null;
};

type InventoryStockEventName =
  | 'inventory.received'
  | 'inventory.issued'
  | 'inventory.returned'
  | 'inventory.adjusted';

export type InventoryStockFact = {
  inventoryTransactionId: string;
  transactionCode: string;
  materialId: string;
  quantity: number;
  unit: string;
  warehouseId: string;
  zoneId: string | null;
  slotId: string | null;
  level: string | null;
  referenceModule: string | null;
  referenceId: string | null;
  postingKind: string;
  postedAt: string;
  resultingStock: number;
  resultingLocationBalance: number;
  aggregateVersion: number;
};

export type InventoryTransferFact = {
  inventoryTransactionId: string;
  transactionCode: string;
  materialId: string;
  quantity: number;
  unit: string;
  source: InventoryLocationFact;
  destination: InventoryLocationFact;
  referenceModule: string | null;
  referenceId: string | null;
  postingKind: 'TRANSFER';
  postedAt: string;
  resultingStock: number;
  aggregateVersion: number;
};

type InventoryLocationFact = {
  warehouseId: string;
  zoneId: string | null;
  slotId: string | null;
  level: string | null;
  resultingBalance: number;
};

type InventoryStocktakeFact = {
  stocktakeId: string;
  warehouseId: string | null;
  zoneId: string | null;
  countedLineCount: number;
  varianceLineCount: number;
  completedAt: string;
  aggregateVersion: number;
};

@Injectable()
export class InventoryEventService {
  constructor(private readonly repository: InventoryRepository) {}

  transactionCreated(
    payload: InventoryEventPayload,
    tx: Prisma.TransactionClient,
  ) {
    return this.publish('inventory.transaction.created', payload, tx);
  }

  stockBucketUpdated(
    payload: InventoryEventPayload,
    tx: Prisma.TransactionClient,
  ) {
    return this.publish('inventory.stock_bucket.updated', payload, tx);
  }

  returnRequested(
    payload: InventoryEventPayload,
    tx: Prisma.TransactionClient,
  ) {
    return this.publish('inventory.return.requested', payload, tx);
  }

  returnReceived(payload: InventoryEventPayload, tx: Prisma.TransactionClient) {
    return this.publish('inventory.return.received', payload, tx);
  }

  returnRejected(payload: InventoryEventPayload, tx: Prisma.TransactionClient) {
    return this.publish('inventory.return.rejected', payload, tx);
  }

  returnAccepted(payload: InventoryEventPayload, tx: Prisma.TransactionClient) {
    return this.publish('inventory.return.accepted', payload, tx);
  }

  stocktakeCompleted(
    payload: InventoryStocktakeFact,
    tx: Prisma.TransactionClient,
  ) {
    return this.publishCanonical(
      'inventory.stocktake.completed',
      payload.stocktakeId,
      payload.aggregateVersion,
      payload,
      payload.completedAt,
      `stocktake:${payload.stocktakeId}`,
      tx,
    );
  }

  stockPosted(
    eventName: InventoryStockEventName,
    payload: InventoryStockFact,
    tx: Prisma.TransactionClient,
  ) {
    const locationKey = [
      payload.warehouseId,
      payload.zoneId,
      payload.slotId,
      payload.level,
    ]
      .map((value) => value ?? 'none')
      .join(':');
    return this.publishCanonical(
      eventName,
      payload.materialId,
      payload.aggregateVersion,
      payload,
      payload.postedAt,
      `inventory-item:${payload.materialId}`,
      tx,
      `${payload.inventoryTransactionId}:${payload.materialId}:${locationKey}`,
    );
  }

  transferred(payload: InventoryTransferFact, tx: Prisma.TransactionClient) {
    return this.publishCanonical(
      'inventory.transferred',
      payload.materialId,
      payload.aggregateVersion,
      payload,
      payload.postedAt,
      `inventory-item:${payload.materialId}`,
      tx,
      `${payload.inventoryTransactionId}:${payload.materialId}`,
    );
  }

  adjustmentPosted(
    payload: InventoryEventPayload,
    tx: Prisma.TransactionClient,
  ) {
    return this.publish('inventory.adjustment.posted', payload, tx);
  }

  materialUpdated(
    payload: InventoryEventPayload,
    tx: Prisma.TransactionClient,
  ) {
    return this.publish('inventory.material.updated', payload, tx);
  }

  private publish(
    eventName: string,
    payload: InventoryEventPayload,
    tx: Prisma.TransactionClient,
  ) {
    const idempotencyKey = `${eventName}:${payload.id}:${payload.status ?? payload.type ?? 'default'}`;
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: payload,
        metadata: {
          module: 'inventory',
          persistToOutbox: true,
          idempotencyKey,
        },
        idempotencyKey,
      },
      tx,
    );
  }

  private publishCanonical(
    eventName: string,
    aggregateId: string,
    aggregateVersion: number,
    payload: object,
    occurredAt: string,
    orderingKey: string,
    tx: Prisma.TransactionClient,
    identity = aggregateId,
  ) {
    const idempotencyKey = `${eventName}:${identity}`;
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: payload,
        metadata: {
          eventId: randomUUID(),
          eventName,
          eventVersion: 1,
          occurredAt,
          producer: 'inventory',
          aggregateType: 'InventoryItem',
          aggregateId,
          aggregateVersion,
          correlationId: identity,
          causationId: null,
          idempotencyKey,
          actorId: null,
          tenantId: null,
          orderingKey,
          persistToOutbox: true,
        },
        idempotencyKey,
      },
      tx,
    );
  }
}
