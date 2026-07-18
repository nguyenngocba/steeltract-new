import { YardItemType } from '@prisma/client';

export type YardCommandContext = {
  idempotencyKey: string;
  expectedVersion: number;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
};

export type PlaceYardItemCommand = YardCommandContext & {
  slotId: string;
  itemType: YardItemType;
  itemId: string;
  itemCode: string;
  itemName?: string;
  quantity: number;
  stackLevel?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  reason?: string;
  sourceOwnerReference?: string;
};

export type RelocateYardItemCommand = YardCommandContext & {
  placementId: string;
  expectedCurrentSlotId: string;
  toSlotId: string;
  reason?: string;
};

export type HoldYardItemCommand = YardCommandContext & {
  placementId: string;
  reason: string;
};

export type ReleaseYardHoldCommand = YardCommandContext & {
  placementId: string;
  reason?: string;
};

export type PrepareYardLoadingCommand = YardCommandContext & {
  placementId: string;
  loadingTaskId: string;
  loadingPlanReference: string;
  shipmentId?: string;
};

export type MarkYardLoadingReadyCommand = YardCommandContext & {
  placementId: string;
  loadingTaskId: string;
};

export type ReleaseYardItemForLogisticsCommand = YardCommandContext & {
  placementId: string;
  loadingTaskId: string;
  loadingPlanReference: string;
};
