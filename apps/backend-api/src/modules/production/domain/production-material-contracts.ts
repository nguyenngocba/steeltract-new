export const productionMaterialEvents = {
  reserved: 'production.material.reserved',
  released: 'production.material.released',
  issued: 'production.material.issued',
  consumed: 'production.material.consumed',
  returned: 'production.material.returned',
} as const;

export type ProductionMaterialEventName =
  (typeof productionMaterialEvents)[keyof typeof productionMaterialEvents];

export type ReserveMaterialCommand = {
  productionOrderId: string;
  reservationId: string;
  actorId?: string;
};

export type ReleaseMaterialCommand = ReserveMaterialCommand & {
  reason?: string;
};

export type IssueMaterialCommand = ReserveMaterialCommand & {
  lines: Array<{ reservationLineId: string; quantity: number }>;
};

export type ConsumeMaterialCommand = {
  productionOrderId: string;
  inventoryItemId: string;
  quantity: number;
  actorId?: string;
};

export type ReturnMaterialCommand = {
  productionOrderId: string;
  materialIssueId: string;
  quantity: number;
  actorId?: string;
};
