ALTER TABLE "inventory_dashboard_snapshots"
  ADD COLUMN "scopeKey" TEXT,
  ADD COLUMN "outOfStockCount" INTEGER,
  ADD COLUMN "primaryMaterialCount" INTEGER,
  ADD COLUMN "primaryStock" DOUBLE PRECISION,
  ADD COLUMN "secondaryMaterialCount" INTEGER,
  ADD COLUMN "secondaryStock" DOUBLE PRECISION,
  ADD COLUMN "consumableMaterialCount" INTEGER,
  ADD COLUMN "consumableStock" DOUBLE PRECISION;

UPDATE "inventory_dashboard_snapshots"
SET "scopeKey" = CASE
  WHEN "warehouseId" IS NOT NULL THEN 'WAREHOUSE:' || "warehouseId"
  ELSE 'LEGACY:' || id
END;

ALTER TABLE "inventory_dashboard_snapshots"
  ALTER COLUMN "scopeKey" SET NOT NULL;

CREATE UNIQUE INDEX "inventory_dashboard_snapshots_scopeKey_snapshotDate_key"
  ON "inventory_dashboard_snapshots"("scopeKey", "snapshotDate");

CREATE INDEX "inventory_dashboard_snapshots_scopeKey_snapshotDate_idx"
  ON "inventory_dashboard_snapshots"("scopeKey", "snapshotDate");
