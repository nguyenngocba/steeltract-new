ALTER TABLE "warehouse_zones"
  ADD COLUMN IF NOT EXISTS "row" TEXT,
  ADD COLUMN IF NOT EXISTS "column" TEXT,
  ADD COLUMN IF NOT EXISTS "level" TEXT,
  ADD COLUMN IF NOT EXISTS "capacity" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "warehouse_zones_row_idx" ON "warehouse_zones"("row");
CREATE INDEX IF NOT EXISTS "warehouse_zones_column_idx" ON "warehouse_zones"("column");
CREATE INDEX IF NOT EXISTS "warehouse_zones_level_idx" ON "warehouse_zones"("level");
