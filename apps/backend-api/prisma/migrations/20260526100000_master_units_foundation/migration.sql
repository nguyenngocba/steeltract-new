CREATE TABLE "master_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "baseUnitId" TEXT,
    "conversionFactor" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "master_units_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "inventory_items" ADD COLUMN "unitId" TEXT;

CREATE UNIQUE INDEX "master_units_code_key" ON "master_units"("code");
CREATE INDEX "master_units_category_idx" ON "master_units"("category");
CREATE INDEX "master_units_active_idx" ON "master_units"("active");
CREATE INDEX "master_units_baseUnitId_idx" ON "master_units"("baseUnitId");
CREATE INDEX "inventory_items_unitId_idx" ON "inventory_items"("unitId");

ALTER TABLE "master_units" ADD CONSTRAINT "master_units_baseUnitId_fkey" FOREIGN KEY ("baseUnitId") REFERENCES "master_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "master_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "master_units" ("id", "code", "name", "symbol", "category", "precision", "active", "baseUnitId", "conversionFactor", "updatedAt", "createdBy", "updatedBy")
VALUES
  ('uom_kg', 'KG', 'Kilogram', 'kg', 'weight', 3, true, NULL, NULL, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_m', 'M', 'Meter', 'm', 'length', 3, true, NULL, NULL, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_pcs', 'PCS', 'Piece', 'pcs', 'quantity', 0, true, NULL, NULL, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_m2', 'M2', 'Square meter', 'm2', 'area', 3, true, NULL, NULL, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_m3', 'M3', 'Cubic meter', 'm3', 'volume', 3, true, NULL, NULL, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_ton', 'TON', 'Metric ton', 't', 'weight', 3, true, 'uom_kg', 1000, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_mm', 'MM', 'Millimeter', 'mm', 'length', 0, true, 'uom_m', 0.001, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_box', 'BOX', 'Box', 'box', 'quantity', 0, true, 'uom_pcs', NULL, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_plate', 'PLATE', 'Plate', 'plate', 'quantity', 0, true, 'uom_pcs', 1, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_set', 'SET', 'Set', 'set', 'quantity', 0, true, 'uom_pcs', NULL, CURRENT_TIMESTAMP, 'system', 'system'),
  ('uom_bundle', 'BUNDLE', 'Bundle', 'bundle', 'quantity', 0, true, 'uom_pcs', NULL, CURRENT_TIMESTAMP, 'system', 'system');

UPDATE "inventory_items"
SET "unitId" = "master_units"."id"
FROM "master_units"
WHERE UPPER(TRIM("inventory_items"."unit")) = "master_units"."code";
