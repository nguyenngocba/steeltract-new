-- Components dashboard and domain summary snapshot foundation.
CREATE TABLE "component_dashboard_snapshots" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "totalComponents" INTEGER NOT NULL DEFAULT 0,
    "stockCount" INTEGER NOT NULL DEFAULT 0,
    "producingCount" INTEGER NOT NULL DEFAULT 0,
    "readyCount" INTEGER NOT NULL DEFAULT 0,
    "shippedCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "installedCount" INTEGER NOT NULL DEFAULT 0,
    "totalEstimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalActualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "component_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "component_summary_snapshots" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "projectId" TEXT,
    "productionOrderCount" INTEGER NOT NULL DEFAULT 0,
    "timelineCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentLocation" TEXT,
    "payload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "component_summary_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "component_dashboard_snapshots_scopeKey_snapshotDate_key"
ON "component_dashboard_snapshots"("scopeKey", "snapshotDate");
CREATE INDEX "component_dashboard_snapshots_snapshotDate_idx"
ON "component_dashboard_snapshots"("snapshotDate");
CREATE INDEX "component_dashboard_snapshots_scopeKey_snapshotDate_idx"
ON "component_dashboard_snapshots"("scopeKey", "snapshotDate");
CREATE INDEX "component_dashboard_snapshots_updatedAt_idx"
ON "component_dashboard_snapshots"("updatedAt");

CREATE UNIQUE INDEX "component_summary_snapshots_componentId_key"
ON "component_summary_snapshots"("componentId");
CREATE INDEX "component_summary_snapshots_status_idx"
ON "component_summary_snapshots"("status");
CREATE INDEX "component_summary_snapshots_projectId_idx"
ON "component_summary_snapshots"("projectId");
CREATE INDEX "component_summary_snapshots_updatedAt_idx"
ON "component_summary_snapshots"("updatedAt");

ALTER TABLE "component_summary_snapshots"
ADD CONSTRAINT "component_summary_snapshots_componentId_fkey"
FOREIGN KEY ("componentId") REFERENCES "components"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
