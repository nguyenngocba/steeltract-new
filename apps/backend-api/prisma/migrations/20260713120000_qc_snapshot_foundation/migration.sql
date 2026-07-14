CREATE TABLE "qc_dashboard_snapshots" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "totalInspections" INTEGER NOT NULL DEFAULT 0,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "inProgressCount" INTEGER NOT NULL DEFAULT 0,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "reworkCount" INTEGER NOT NULL DEFAULT 0,
    "openIssueCount" INTEGER NOT NULL DEFAULT 0,
    "openNcrCount" INTEGER NOT NULL DEFAULT 0,
    "waitingProductionCount" INTEGER NOT NULL DEFAULT 0,
    "passRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qc_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qc_inspection_snapshots" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "inspectionNo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checklistId" TEXT,
    "productionOrderId" TEXT,
    "componentId" TEXT,
    "projectId" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "ncrCount" INTEGER NOT NULL DEFAULT 0,
    "passRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qc_inspection_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qc_dashboard_snapshots_scopeKey_snapshotDate_key"
ON "qc_dashboard_snapshots"("scopeKey", "snapshotDate");
CREATE INDEX "qc_dashboard_snapshots_snapshotDate_idx"
ON "qc_dashboard_snapshots"("snapshotDate");
CREATE INDEX "qc_dashboard_snapshots_scopeKey_snapshotDate_idx"
ON "qc_dashboard_snapshots"("scopeKey", "snapshotDate");
CREATE INDEX "qc_dashboard_snapshots_updatedAt_idx"
ON "qc_dashboard_snapshots"("updatedAt");

CREATE UNIQUE INDEX "qc_inspection_snapshots_inspectionId_key"
ON "qc_inspection_snapshots"("inspectionId");
CREATE INDEX "qc_inspection_snapshots_status_idx"
ON "qc_inspection_snapshots"("status");
CREATE INDEX "qc_inspection_snapshots_productionOrderId_idx"
ON "qc_inspection_snapshots"("productionOrderId");
CREATE INDEX "qc_inspection_snapshots_componentId_idx"
ON "qc_inspection_snapshots"("componentId");
CREATE INDEX "qc_inspection_snapshots_projectId_idx"
ON "qc_inspection_snapshots"("projectId");
CREATE INDEX "qc_inspection_snapshots_updatedAt_idx"
ON "qc_inspection_snapshots"("updatedAt");

ALTER TABLE "qc_inspection_snapshots"
ADD CONSTRAINT "qc_inspection_snapshots_inspectionId_fkey"
FOREIGN KEY ("inspectionId") REFERENCES "qc_inspections"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
