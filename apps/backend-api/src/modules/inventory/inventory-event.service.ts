import { Injectable } from '@nestjs/common';

import { EventPublisherService } from '../../core/events/event-publisher.service';
import { SnapshotUpdateDispatcher } from '../../core/jobs/snapshot-update-dispatcher.service';

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
  constructor(
    private readonly events: EventPublisherService,
    private readonly snapshotDispatcher: SnapshotUpdateDispatcher,
  ) {}

  transactionCreated(payload: InventoryEventPayload) {
    return this.publish('inventory.transaction.created', payload);
  }

  stockBucketUpdated(payload: InventoryEventPayload) {
    return this.publish('inventory.stock_bucket.updated', payload);
  }

  returnRequested(payload: InventoryEventPayload) {
    return this.publish('inventory.return.requested', payload);
  }

  returnReceived(payload: InventoryEventPayload) {
    return this.publish('inventory.return.received', payload);
  }

  returnRejected(payload: InventoryEventPayload) {
    return this.publish('inventory.return.rejected', payload);
  }

  returnAccepted(payload: InventoryEventPayload) {
    return this.publish('inventory.return.accepted', payload);
  }

  stocktakeCompleted(payload: InventoryEventPayload) {
    return this.publish('inventory.stocktake.completed', payload);
  }

  adjustmentPosted(payload: InventoryEventPayload) {
    return this.publish('inventory.adjustment.posted', payload);
  }

  materialUpdated(payload: InventoryEventPayload) {
    return this.publish('inventory.material.updated', payload);
  }

  private async publish(eventName: string, payload: InventoryEventPayload) {
    const event = await this.events.publishPersistent(eventName, payload, {
      module: 'inventory',
      idempotencyKey: `${eventName}:${payload.id}:${payload.status ?? payload.type ?? 'default'}`,
    });

    await this.scheduleSnapshotUpdate(eventName, payload);

    return event;
  }

  private async scheduleSnapshotUpdate(
    eventName: string,
    payload: InventoryEventPayload,
  ) {
    const sourceWatermark = `${eventName}:${payload.id}:${Date.now()}`;

    await this.snapshotDispatcher.requestUpdate({
      scope: {
        module: 'inventory',
        snapshotType: 'inventory-domain',
        scopeId: payload.inventoryItemId ?? payload.id,
        inventoryItemId: payload.inventoryItemId ?? undefined,
        warehouseId: payload.warehouseId ?? undefined,
      },
      reason: 'domain-event',
      sourceWatermark,
      priority: 30,
    });
  }
}
