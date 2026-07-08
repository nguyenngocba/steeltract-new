-- CreateTable
CREATE TABLE "project_detail_snapshots" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tab" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceWatermark" TEXT,
    "parityStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "refreshReason" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_detail_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_detail_snapshots_projectId_tab_key" ON "project_detail_snapshots"("projectId", "tab");
CREATE INDEX "project_detail_snapshots_projectId_idx" ON "project_detail_snapshots"("projectId");
CREATE INDEX "project_detail_snapshots_tab_idx" ON "project_detail_snapshots"("tab");
CREATE INDEX "project_detail_snapshots_stale_idx" ON "project_detail_snapshots"("stale");
CREATE INDEX "project_detail_snapshots_updatedAt_idx" ON "project_detail_snapshots"("updatedAt");

-- AddForeignKey
ALTER TABLE "project_detail_snapshots" ADD CONSTRAINT "project_detail_snapshots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
