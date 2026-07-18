import { DispatchItemType } from '@prisma/client';

export type LogisticsCommandContext = {
  idempotencyKey: string;
  expectedVersion: number;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
};

export type ShipmentLineInput = {
  type: DispatchItemType;
  inventoryItemId?: string;
  componentId?: string;
  quantity: number;
  yardReleaseReference: string;
};

export type CreateShipmentCommand = LogisticsCommandContext & {
  projectId: string;
  projectTaskId?: string;
  plannedAt?: Date;
  notes?: string;
  lines: ShipmentLineInput[];
};

export type ShipmentCommand = LogisticsCommandContext & {
  shipmentId: string;
};

export type AssignShipmentVehicleCommand = ShipmentCommand & {
  vehicle: string;
};

export type AssignShipmentDriverCommand = ShipmentCommand & {
  driver: string;
};

export type ConfirmShipmentLoadingCommand = ShipmentCommand & {
  checklist?: Record<string, unknown>;
};

export type DispatchShipmentCommand = ShipmentCommand;

export type ConfirmShipmentDeliveryCommand = ShipmentCommand & {
  deliveryProofReference: string;
};

export type CompleteShipmentCommand = ShipmentCommand;

export type CancelShipmentCommand = ShipmentCommand & {
  reason: string;
};
