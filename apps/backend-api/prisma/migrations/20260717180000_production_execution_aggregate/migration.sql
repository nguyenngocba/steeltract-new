-- Add the AD-017 Production Execution aggregate without changing existing rows.
CREATE TYPE "ProductionExecutionState" AS ENUM (
  'CREATED',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'ABORTED'
);

CREATE TABLE "production_executions" (
  "id" TEXT NOT NULL,
  "productionOrderId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "state" "ProductionExecutionState" NOT NULL DEFAULT 'CREATED',
  "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
  "workCenterId" TEXT,
  "machineId" TEXT,
  "startedAt" TIMESTAMP(3),
  "pausedAt" TIMESTAMP(3),
  "resumedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "abortedAt" TIMESTAMP(3),
  "pauseReason" TEXT,
  "abortReason" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "production_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "production_executions_productionOrderId_state_idx"
  ON "production_executions"("productionOrderId", "state");
CREATE INDEX "production_executions_workOrderId_state_idx"
  ON "production_executions"("workOrderId", "state");
CREATE INDEX "production_executions_workCenterId_idx"
  ON "production_executions"("workCenterId");
CREATE INDEX "production_executions_machineId_idx"
  ON "production_executions"("machineId");

ALTER TABLE "production_executions"
  ADD CONSTRAINT "production_executions_productionOrderId_fkey"
  FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "production_executions"
  ADD CONSTRAINT "production_executions_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
