import { Injectable } from '@nestjs/common';

import { DomainEvent } from '../events/domain-event.interface';
import {
  WebsocketDomainEventPayload,
  websocketEventNames,
} from './websocket-events';

interface EntityPayload {
  id?: string;
  entityId?: string | null;
  transactionId?: string;
  changedFields?: string[];
  items?: {
    inventoryItemId?: string;
  }[];
}

@Injectable()
export class WebsocketEventMapper {
  toWebsocketPayload(event: DomainEvent): WebsocketDomainEventPayload {
    const payload = this.getEntityPayload(event.payload);

    return {
      event: event.name,
      entityId: this.getEntityId(payload),
      relatedIds: this.getRelatedIds(payload),
      changedFields: payload.changedFields ?? this.getChangedFields(event.name),
      occurredAt: event.occurredAt.toISOString(),
    };
  }

  private getEntityPayload(payload: unknown): EntityPayload {
    if (payload && typeof payload === 'object') {
      return payload;
    }

    return {};
  }

  private getEntityId(payload: EntityPayload) {
    return payload.entityId ?? payload.id ?? payload.transactionId ?? undefined;
  }

  private getRelatedIds(payload: EntityPayload) {
    const ids = payload.items
      ?.map((item) => item.inventoryItemId)
      .filter((id): id is string => Boolean(id));

    return ids && ids.length > 0 ? ids : undefined;
  }

  private getChangedFields(eventName: string) {
    if (eventName.startsWith('inventory.stock.')) {
      return ['quantity'];
    }

    if (eventName === websocketEventNames.inventoryItemCreated) {
      return ['id', 'code', 'name'];
    }

    if (eventName === websocketEventNames.componentUpdated) {
      return ['status'];
    }

    if (eventName === websocketEventNames.auditActivityCreated) {
      return ['activityLog'];
    }

    return undefined;
  }
}
