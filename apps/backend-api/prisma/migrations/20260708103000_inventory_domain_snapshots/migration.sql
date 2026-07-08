-- EPIC112 / INV.CORE.2
-- Inventory domain snapshots for Material Detail and warehouse locations.

CREATE TABLE "inventory_material_snapshots" (
  "id" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "warehouseId" TEXT,
  "warehouseCode" TEXT,
  "scopeKey" TEXT NOT NULL,
  "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "availableStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reservedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "allocatedToProjects" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pendingReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "returnedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "inboundQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "outboundQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "inventoryValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "attachmentCount" INTEGER NOT NULL DEFAULT 0,
  "locationCount" INTEGER NOT NULL DEFAULT 0,
  "lastInboundAt" TIMESTAMP(3),
  "lastOutboundAt" TIMESTAMP(3),
  "detailPayload" JSONB,
  "locationPayload" JSONB,
  "transactionPayload" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_material_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_location_snapshots" (
  "id" TEXT NOT NULL,
  "locationKey" TEXT NOT NULL,
  "warehouseId" TEXT,
  "warehouseCode" TEXT,
  "warehouseName" TEXT,
  "zoneId" TEXT,
  "zoneCode" TEXT,
  "zoneName" TEXT,
  "slotId" TEXT,
  "level" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "occupied" BOOLEAN NOT NULL DEFAULT false,
  "materialCount" INTEGER NOT NULL DEFAULT 0,
  "materialPayload" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_location_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_material_snapshots_materialId_scopeKey_key"
  ON "inventory_material_snapshots"("materialId", "scopeKey");
CREATE INDEX "inventory_material_snapshots_materialId_idx"
  ON "inventory_material_snapshots"("materialId");
CREATE INDEX "inventory_material_snapshots_warehouseId_idx"
  ON "inventory_material_snapshots"("warehouseId");
CREATE INDEX "inventory_material_snapshots_warehouseCode_idx"
  ON "inventory_material_snapshots"("warehouseCode");
CREATE INDEX "inventory_material_snapshots_updatedAt_idx"
  ON "inventory_material_snapshots"("updatedAt");

CREATE UNIQUE INDEX "inventory_location_snapshots_locationKey_key"
  ON "inventory_location_snapshots"("locationKey");
CREATE INDEX "inventory_location_snapshots_warehouseId_idx"
  ON "inventory_location_snapshots"("warehouseId");
CREATE INDEX "inventory_location_snapshots_warehouseCode_idx"
  ON "inventory_location_snapshots"("warehouseCode");
CREATE INDEX "inventory_location_snapshots_zoneId_slotId_level_idx"
  ON "inventory_location_snapshots"("zoneId", "slotId", "level");
CREATE INDEX "inventory_location_snapshots_occupied_idx"
  ON "inventory_location_snapshots"("occupied");
CREATE INDEX "inventory_location_snapshots_updatedAt_idx"
  ON "inventory_location_snapshots"("updatedAt");

ALTER TABLE "inventory_material_snapshots"
  ADD CONSTRAINT "inventory_material_snapshots_materialId_fkey"
  FOREIGN KEY ("materialId") REFERENCES "inventory_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_material_snapshots"
  ADD CONSTRAINT "inventory_material_snapshots_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_location_snapshots"
  ADD CONSTRAINT "inventory_location_snapshots_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_location_snapshots"
  ADD CONSTRAINT "inventory_location_snapshots_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "warehouse_zones"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
