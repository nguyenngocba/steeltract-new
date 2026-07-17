-- Add AD-017 Production aggregates without rewriting legacy orders/work orders.
CREATE TYPE "ProductionOrderKind" AS ENUM ('STANDARD', 'REWORK');
CREATE TYPE "ProductionWorkOrderState" AS ENUM ('PLANNED', 'READY', 'IN_PROGRESS', 'PAUSED', 'BLOCKED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProductionCompletionState" AS ENUM ('RECORDED', 'REVERSED');
CREATE TYPE "ProductionScrapState" AS ENUM ('DRAFT', 'POSTED', 'REVERSED', 'CANCELLED');
CREATE TYPE "ProductionReworkState" AS ENUM ('ACCEPTED', 'REJECTED', 'COMPLETED');

ALTER TYPE "ProductionMaterialLedgerEventType" ADD VALUE IF NOT EXISTS 'SCRAP';
ALTER TYPE "ProductionMaterialLedgerEventType" ADD VALUE IF NOT EXISTS 'SCRAP_REVERSAL';

ALTER TABLE "production_orders"
  ADD COLUMN "orderKind" "ProductionOrderKind" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "aggregateVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "componentRevisionId" TEXT,
  ADD COLUMN "bomDefinitionId" TEXT,
  ADD COLUMN "reworkOfProductionOrderId" TEXT,
  ADD COLUMN "releasedAt" TIMESTAMP(3),
  ADD COLUMN "readyAt" TIMESTAMP(3),
  ADD COLUMN "pausedAt" TIMESTAMP(3),
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

ALTER TABLE "WorkOrder"
  ADD COLUMN "productionOrderId" TEXT,
  ADD COLUMN "routingOperationId" TEXT,
  ADD COLUMN "sequence" INTEGER,
  ADD COLUMN "lifecycleState" "ProductionWorkOrderState",
  ADD COLUMN "aggregateVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "pausedAt" TIMESTAMP(3),
  ADD COLUMN "blockedReason" TEXT,
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "ProductionCompletion" (
  "id" TEXT NOT NULL,
  "productionOrderId" TEXT NOT NULL,
  "workOrderId" TEXT,
  "executionRunId" TEXT,
  "state" "ProductionCompletionState" NOT NULL DEFAULT 'RECORDED',
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "completedQty" DOUBLE PRECISION NOT NULL,
  "rejectedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "scrapQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remainingQty" DOUBLE PRECISION NOT NULL,
  "reversalOfCompletionId" TEXT,
  "evidence" JSONB,
  "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
  "recordedBy" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductionCompletion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductionScrap" (
  "id" TEXT NOT NULL,
  "productionOrderId" TEXT NOT NULL,
  "workOrderId" TEXT,
  "executionRunId" TEXT,
  "inventoryItemId" TEXT,
  "state" "ProductionScrapState" NOT NULL DEFAULT 'DRAFT',
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "disposition" TEXT NOT NULL,
  "recoverable" BOOLEAN NOT NULL DEFAULT false,
  "inventoryTransactionId" TEXT,
  "reversalOfScrapId" TEXT,
  "commandIdempotencyKey" TEXT,
  "commandHash" TEXT,
  "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
  "createdBy" TEXT,
  "postedBy" TEXT,
  "postedAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionScrap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductionRework" (
  "id" TEXT NOT NULL,
  "reworkRequestId" TEXT NOT NULL,
  "qcNcrId" TEXT NOT NULL,
  "originalProductionOrderId" TEXT NOT NULL,
  "reworkProductionOrderId" TEXT,
  "state" "ProductionReworkState" NOT NULL,
  "routingScope" JSONB,
  "reason" TEXT,
  "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
  "decidedBy" TEXT,
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ProductionRework_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "production_orders_orderKind_idx" ON "production_orders"("orderKind");
CREATE INDEX "production_orders_componentRevisionId_idx" ON "production_orders"("componentRevisionId");
CREATE INDEX "production_orders_bomDefinitionId_idx" ON "production_orders"("bomDefinitionId");
CREATE INDEX "production_orders_reworkOfProductionOrderId_idx" ON "production_orders"("reworkOfProductionOrderId");
CREATE UNIQUE INDEX "WorkOrder_productionOrderId_sequence_key" ON "WorkOrder"("productionOrderId", "sequence");
CREATE INDEX "WorkOrder_productionOrderId_lifecycleState_idx" ON "WorkOrder"("productionOrderId", "lifecycleState");
CREATE INDEX "WorkOrder_routingOperationId_idx" ON "WorkOrder"("routingOperationId");
CREATE INDEX "ProductionCompletion_productionOrderId_recordedAt_idx" ON "ProductionCompletion"("productionOrderId", "recordedAt");
CREATE INDEX "ProductionCompletion_workOrderId_idx" ON "ProductionCompletion"("workOrderId");
CREATE INDEX "ProductionCompletion_reversalOfCompletionId_idx" ON "ProductionCompletion"("reversalOfCompletionId");
CREATE INDEX "ProductionScrap_productionOrderId_state_idx" ON "ProductionScrap"("productionOrderId", "state");
CREATE INDEX "ProductionScrap_workOrderId_idx" ON "ProductionScrap"("workOrderId");
CREATE INDEX "ProductionScrap_inventoryItemId_idx" ON "ProductionScrap"("inventoryItemId");
CREATE INDEX "ProductionScrap_reversalOfScrapId_idx" ON "ProductionScrap"("reversalOfScrapId");
CREATE UNIQUE INDEX "ProductionScrap_commandIdempotencyKey_key" ON "ProductionScrap"("commandIdempotencyKey");
CREATE UNIQUE INDEX "ProductionRework_reworkRequestId_key" ON "ProductionRework"("reworkRequestId");
CREATE UNIQUE INDEX "ProductionRework_reworkProductionOrderId_key" ON "ProductionRework"("reworkProductionOrderId");
CREATE INDEX "ProductionRework_qcNcrId_idx" ON "ProductionRework"("qcNcrId");
CREATE INDEX "ProductionRework_originalProductionOrderId_state_idx" ON "ProductionRework"("originalProductionOrderId", "state");

ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_reworkOfProductionOrderId_fkey"
  FOREIGN KEY ("reworkOfProductionOrderId") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_productionOrderId_fkey"
  FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionCompletion" ADD CONSTRAINT "ProductionCompletion_productionOrderId_fkey"
  FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionCompletion" ADD CONSTRAINT "ProductionCompletion_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionCompletion" ADD CONSTRAINT "ProductionCompletion_reversalOfCompletionId_fkey"
  FOREIGN KEY ("reversalOfCompletionId") REFERENCES "ProductionCompletion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionScrap" ADD CONSTRAINT "ProductionScrap_productionOrderId_fkey"
  FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionScrap" ADD CONSTRAINT "ProductionScrap_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionScrap" ADD CONSTRAINT "ProductionScrap_reversalOfScrapId_fkey"
  FOREIGN KEY ("reversalOfScrapId") REFERENCES "ProductionScrap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductionRework" ADD CONSTRAINT "ProductionRework_originalProductionOrderId_fkey"
  FOREIGN KEY ("originalProductionOrderId") REFERENCES "production_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionRework" ADD CONSTRAINT "ProductionRework_reworkProductionOrderId_fkey"
  FOREIGN KEY ("reworkProductionOrderId") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
