-- Component DOMAIN.5A QC physical ComponentInstance lineage foundation.
-- Additive only: no DROP, TRUNCATE, DELETE, backfill, or fabricated lineage.

ALTER TABLE "qc_inspections"
  ADD COLUMN "componentInstanceId" TEXT;

ALTER TABLE "non_conformance_reports"
  ADD COLUMN "componentInstanceId" TEXT;

ALTER TABLE "qc_inspection_snapshots"
  ADD COLUMN "componentInstanceId" TEXT;

CREATE INDEX "qc_inspections_componentInstanceId_idx"
  ON "qc_inspections"("componentInstanceId");
CREATE INDEX "non_conformance_reports_componentInstanceId_idx"
  ON "non_conformance_reports"("componentInstanceId");
CREATE INDEX "qc_inspection_snapshots_componentInstanceId_idx"
  ON "qc_inspection_snapshots"("componentInstanceId");

ALTER TABLE "qc_inspections"
  ADD CONSTRAINT "qc_inspections_componentInstanceId_fkey"
  FOREIGN KEY ("componentInstanceId") REFERENCES "component_instances"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "non_conformance_reports"
  ADD CONSTRAINT "non_conformance_reports_componentInstanceId_fkey"
  FOREIGN KEY ("componentInstanceId") REFERENCES "component_instances"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
