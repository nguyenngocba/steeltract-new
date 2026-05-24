export const websocketEventNames = {
  domainEvent: 'domain.event',
  componentUpdated: 'component.updated',
  inventoryItemCreated: 'inventory.item.created',
  inventoryStockImported: 'inventory.stock.imported',
  inventoryStockExported: 'inventory.stock.exported',
  inventoryStockAdjusted: 'inventory.stock.adjusted',
  auditActivityCreated: 'audit.activity.created',
} as const;

export type WebsocketEventName =
  (typeof websocketEventNames)[keyof typeof websocketEventNames];

export const bridgedDomainEventNames = [
  websocketEventNames.componentUpdated,
  websocketEventNames.inventoryItemCreated,
  websocketEventNames.inventoryStockImported,
  websocketEventNames.inventoryStockExported,
  websocketEventNames.inventoryStockAdjusted,
  websocketEventNames.auditActivityCreated,
] as const;

export interface WebsocketDomainEventPayload {
  event: string;
  entityId?: string;
  relatedIds?: string[];
  changedFields?: string[];
  occurredAt: string;
}
