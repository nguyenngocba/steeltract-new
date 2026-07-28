import { ProductionOrderKind } from '@prisma/client';

export interface ProductionCommandContext {
  actorId: string;
  idempotencyKey: string;
  correlationId?: string;
  causationId?: string;
}

export interface ReleasedEngineeringBasis {
  componentId: string;
  componentRevisionId: string;
  bomDefinitionId: string;
  contentHash: string;
  verifiedAt: string;
}

export interface CreateProductionOrderCommand extends ProductionCommandContext {
  orderNo: string;
  title: string;
  description?: string;
  projectId?: string;
  componentRequirementId?: string;
  quantity: number;
  unit: string;
  orderKind?: ProductionOrderKind;
  reworkOfProductionOrderId?: string;
  engineeringBasis: ReleasedEngineeringBasis;
}

export interface VersionedProductionOrderCommand extends ProductionCommandContext {
  productionOrderId: string;
  expectedVersion: number;
  reason?: string;
}

export interface ReleaseProductionOrderCommand extends VersionedProductionOrderCommand {
  workOrders: Array<{
    routingOperationId: string;
    productCode: string;
    quantity: number;
    sequence: number;
    plannedStart?: string;
    plannedEnd?: string;
  }>;
}

export interface ReadyProductionOrderCommand extends VersionedProductionOrderCommand {
  routingGatePassed: boolean;
  materialGatePassed: boolean;
  blockingGatePassed: boolean;
}

export interface StartProductionOrderCommand extends VersionedProductionOrderCommand {
  volatileGatesPassed: boolean;
}

export interface CloseProductionOrderCommand extends VersionedProductionOrderCommand {
  qcDispositionCleared: boolean;
  reworkCleared: boolean;
  materialReconciled: boolean;
}

export interface VersionedWorkOrderCommand extends ProductionCommandContext {
  productionOrderId: string;
  workOrderId: string;
  expectedVersion: number;
  reason?: string;
}

export interface StartProductionExecutionCommand extends ProductionCommandContext {
  productionOrderId: string;
  workOrderId: string;
  workCenterId?: string;
  machineId?: string;
}

export interface VersionedProductionExecutionCommand extends ProductionCommandContext {
  productionOrderId: string;
  workOrderId: string;
  executionRunId: string;
  expectedVersion: number;
  reason?: string;
}

export interface RecordProductionCompletionCommand extends ProductionCommandContext {
  productionOrderId: string;
  expectedVersion: number;
  workOrderId?: string;
  executionRunId?: string;
  quantity: number;
  unit: string;
  completedQty: number;
  rejectedQty: number;
  scrapQty: number;
  remainingQty: number;
  evidence?: unknown;
}

export interface ReverseProductionCompletionCommand extends ProductionCommandContext {
  completionId: string;
  expectedVersion: number;
  reason: string;
}

export interface CreateProductionScrapCommand extends ProductionCommandContext {
  productionOrderId: string;
  expectedVersion: number;
  workOrderId?: string;
  executionRunId?: string;
  inventoryItemId?: string;
  quantity: number;
  unit: string;
  reasonCode: string;
  disposition: string;
  recoverable?: boolean;
}

export interface InventoryReceiptLocation {
  inventoryItemId: string;
  warehouseId: string;
  zoneId?: string;
  slotId?: string;
  level?: string;
}

export interface PostProductionScrapCommand extends ProductionCommandContext {
  scrapId: string;
  expectedVersion: number;
  recoverableReceipt?: InventoryReceiptLocation;
}

export interface ReverseProductionScrapCommand extends ProductionCommandContext {
  scrapId: string;
  expectedVersion: number;
  reason: string;
}

export interface CancelProductionScrapCommand extends ProductionCommandContext {
  scrapId: string;
  expectedVersion: number;
  reason: string;
}

export interface AcceptProductionReworkCommand extends ProductionCommandContext {
  reworkRequestId: string;
  qcNcrId: string;
  originalProductionOrderId: string;
  expectedVersion: number;
  orderNo: string;
  title: string;
  reason: string;
  routingScope?: unknown;
  engineeringBasis: ReleasedEngineeringBasis;
}

export interface RejectProductionReworkCommand extends ProductionCommandContext {
  reworkRequestId: string;
  qcNcrId: string;
  originalProductionOrderId: string;
  expectedVersion: number;
  reason: string;
}

export interface CompleteProductionReworkCommand extends ProductionCommandContext {
  reworkRequestId: string;
  expectedVersion: number;
}
