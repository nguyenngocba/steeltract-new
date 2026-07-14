CREATE TABLE "yard_dashboard_snapshots" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "totalZones" INTEGER NOT NULL DEFAULT 0,
    "totalSlots" INTEGER NOT NULL DEFAULT 0,
    "occupiedSlots" INTEGER NOT NULL DEFAULT 0,
    "availableSlots" INTEGER NOT NULL DEFAULT 0,
    "activePlacementCount" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "movementToday" INTEGER NOT NULL DEFAULT 0,
    "movementMonth" INTEGER NOT NULL DEFAULT 0,
    "overloadedZoneCount" INTEGER NOT NULL DEFAULT 0,
    "craneCount" INTEGER NOT NULL DEFAULT 0,
    "availableCraneCount" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yard_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "yard_workspace_snapshots" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "zoneId" TEXT,
    "totalSlots" INTEGER NOT NULL DEFAULT 0,
    "occupiedSlots" INTEGER NOT NULL DEFAULT 0,
    "availableSlots" INTEGER NOT NULL DEFAULT 0,
    "placementCount" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "yard_workspace_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "yard_dashboard_snapshots_scopeKey_snapshotDate_key" ON "yard_dashboard_snapshots"("scopeKey", "snapshotDate");
CREATE INDEX "yard_dashboard_snapshots_snapshotDate_idx" ON "yard_dashboard_snapshots"("snapshotDate");
CREATE INDEX "yard_dashboard_snapshots_scopeKey_snapshotDate_idx" ON "yard_dashboard_snapshots"("scopeKey", "snapshotDate");
CREATE INDEX "yard_dashboard_snapshots_updatedAt_idx" ON "yard_dashboard_snapshots"("updatedAt");
CREATE UNIQUE INDEX "yard_workspace_snapshots_scopeKey_key" ON "yard_workspace_snapshots"("scopeKey");
CREATE INDEX "yard_workspace_snapshots_zoneId_idx" ON "yard_workspace_snapshots"("zoneId");
CREATE INDEX "yard_workspace_snapshots_updatedAt_idx" ON "yard_workspace_snapshots"("updatedAt");
