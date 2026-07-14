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
    payload: InventoryEventPayload,
    tx: Prisma.TransactionClient,
  ) {
    return this.publish('inventory.stocktake.completed', payload, tx);
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
        payload: payload as Prisma.InputJsonObject,
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
}
