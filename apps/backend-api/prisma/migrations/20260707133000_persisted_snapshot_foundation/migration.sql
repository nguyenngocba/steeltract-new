-- EPIC107 / SNAP.1
-- Persisted Snapshot Foundation.

CREATE TABLE "inventory_dashboard_snapshots" (
  "id" TEXT NOT NULL,
  "warehouseId" TEXT,
  "warehouseCode" TEXT,
  "snapshotDate" DATE NOT NULL,
  "totalMaterials" INTEGER NOT NULL DEFAULT 0,
  "totalStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "availableStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reservedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lowStockCount" INTEGER NOT NULL DEFAULT 0,
  "movementToday" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "movementMonth" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "inventoryValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_dashboard_snapshots" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "delayedTaskCount" INTEGER NOT NULL DEFAULT 0,
  "completedTaskCount" INTEGER NOT NULL DEFAULT 0,
  "activeTaskCount" INTEGER NOT NULL DEFAULT 0,
  "materialProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "componentProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "logisticsProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "costProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_dashboard_snapshots" (
  "id" TEXT NOT NULL,
  "dispatchOrderId" TEXT NOT NULL,
  "projectId" TEXT,
  "loadingCount" INTEGER NOT NULL DEFAULT 0,
  "inTransitCount" INTEGER NOT NULL DEFAULT 0,
  "arrivedCount" INTEGER NOT NULL DEFAULT 0,
  "completedCount" INTEGER NOT NULL DEFAULT 0,
  "delayCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispatch_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_dashboard_snapshots_warehouseId_snapshotDate_key"
  ON "inventory_dashboard_snapshots"("warehouseId", "snapshotDate");
CREATE INDEX "inventory_dashboard_snapshots_snapshotDate_idx"
  ON "inventory_dashboard_snapshots"("snapshotDate");
CREATE INDEX "inventory_dashboard_snapshots_warehouseCode_idx"
  ON "inventory_dashboard_snapshots"("warehouseCode");

CREATE UNIQUE INDEX "project_dashboard_snapshots_projectId_key"
  ON "project_dashboard_snapshots"("projectId");
CREATE INDEX "project_dashboard_snapshots_updatedAt_idx"
  ON "project_dashboard_snapshots"("updatedAt");

CREATE UNIQUE INDEX "dispatch_dashboard_snapshots_dispatchOrderId_key"
  ON "dispatch_dashboard_snapshots"("dispatchOrderId");
CREATE INDEX "dispatch_dashboard_snapshots_projectId_idx"
  ON "dispatch_dashboard_snapshots"("projectId");
CREATE INDEX "dispatch_dashboard_snapshots_updatedAt_idx"
  ON "dispatch_dashboard_snapshots"("updatedAt");

ALTER TABLE "inventory_dashboard_snapshots"
  ADD CONSTRAINT "inventory_dashboard_snapshots_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "project_dashboard_snapshots"
  ADD CONSTRAINT "project_dashboard_snapshots_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispatch_dashboard_snapshots"
  ADD CONSTRAINT "dispatch_dashboard_snapshots_dispatchOrderId_fkey"
  FOREIGN KEY ("dispatchOrderId") REFERENCES "dispatch_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispatch_dashboard_snapshots"
  ADD CONSTRAINT "dispatch_dashboard_snapshots_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
