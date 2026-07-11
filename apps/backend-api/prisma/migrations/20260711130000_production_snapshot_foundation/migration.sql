-- EPIC132 / Production Snapshot Foundation
-- Additive persisted snapshot tables for Production dashboard, order, and work-center summaries.

CREATE TABLE "production_dashboard_snapshots" (
  "id" TEXT NOT NULL,
  "scopeKey" TEXT NOT NULL,
  "snapshotDate" DATE NOT NULL,
  "totalOrders" INTEGER NOT NULL DEFAULT 0,
  "inProgress" INTEGER NOT NULL DEFAULT 0,
  "delayed" INTEGER NOT NULL DEFAULT 0,
  "completed" INTEGER NOT NULL DEFAULT 0,
  "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "throughput" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "activeWorkCenters" INTEGER NOT NULL DEFAULT 0,
  "machineUtilization" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bottleneckCount" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "production_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_order_snapshots" (
  "id" TEXT NOT NULL,
  "productionOrderId" TEXT NOT NULL,
  "orderNo" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "currentStageCode" TEXT,
  "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "stageCount" INTEGER NOT NULL DEFAULT 0,
  "completedStageCount" INTEGER NOT NULL DEFAULT 0,
  "taskCount" INTEGER NOT NULL DEFAULT 0,
  "blockedTaskCount" INTEGER NOT NULL DEFAULT 0,
  "materialIssueCount" INTEGER NOT NULL DEFAULT 0,
  "materialIssuedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "materialReturnedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "materialConsumedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "actualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "payload" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "production_order_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "work_center_snapshots" (
  "id" TEXT NOT NULL,
  "workCenterId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "machineCount" INTEGER NOT NULL DEFAULT 0,
  "activeOrderCount" INTEGER NOT NULL DEFAULT 0,
  "activeTaskCount" INTEGER NOT NULL DEFAULT 0,
  "blockedTaskCount" INTEGER NOT NULL DEFAULT 0,
  "capacityPerDay" DOUBLE PRECISION,
  "utilization" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "payload" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_center_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "production_dashboard_snapshots_scopeKey_snapshotDate_key"
  ON "production_dashboard_snapshots"("scopeKey", "snapshotDate");
CREATE INDEX "production_dashboard_snapshots_snapshotDate_idx"
  ON "production_dashboard_snapshots"("snapshotDate");
CREATE INDEX "production_dashboard_snapshots_scopeKey_snapshotDate_idx"
  ON "production_dashboard_snapshots"("scopeKey", "snapshotDate");
CREATE INDEX "production_dashboard_snapshots_updatedAt_idx"
  ON "production_dashboard_snapshots"("updatedAt");

CREATE UNIQUE INDEX "production_order_snapshots_productionOrderId_key"
  ON "production_order_snapshots"("productionOrderId");
CREATE INDEX "production_order_snapshots_status_idx"
  ON "production_order_snapshots"("status");
CREATE INDEX "production_order_snapshots_currentStageCode_idx"
  ON "production_order_snapshots"("currentStageCode");
CREATE INDEX "production_order_snapshots_updatedAt_idx"
  ON "production_order_snapshots"("updatedAt");

CREATE UNIQUE INDEX "work_center_snapshots_workCenterId_key"
  ON "work_center_snapshots"("workCenterId");
CREATE INDEX "work_center_snapshots_code_idx"
  ON "work_center_snapshots"("code");
CREATE INDEX "work_center_snapshots_status_idx"
  ON "work_center_snapshots"("status");
CREATE INDEX "work_center_snapshots_updatedAt_idx"
  ON "work_center_snapshots"("updatedAt");

ALTER TABLE "production_order_snapshots"
  ADD CONSTRAINT "production_order_snapshots_productionOrderId_fkey"
  FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "work_center_snapshots"
  ADD CONSTRAINT "work_center_snapshots_workCenterId_fkey"
  FOREIGN KEY ("workCenterId") REFERENCES "work_centers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
