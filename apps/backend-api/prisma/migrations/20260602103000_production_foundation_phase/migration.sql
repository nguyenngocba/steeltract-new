ALTER TABLE "production_orders" ADD COLUMN "bomId" TEXT;

ALTER TABLE "BOM"
ADD COLUMN "structureType" TEXT,
ADD COLUMN "projectId" TEXT,
ADD COLUMN "unit" TEXT,
ADD COLUMN "estimatedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "BOMItem"
ADD COLUMN "wastePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'MAIN_MATERIAL';

CREATE TABLE "BOMRoutingStep" (
  "id" TEXT NOT NULL,
  "bomId" TEXT NOT NULL,
  "stepNo" INTEGER NOT NULL,
  "stepName" TEXT NOT NULL,
  "workshop" TEXT,
  "expectedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "qcRequired" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "BOMRoutingStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductionMaterialIssue" (
  "id" TEXT NOT NULL,
  "issueNo" TEXT NOT NULL,
  "productionOrderId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "warehouseId" TEXT,
  "zoneId" TEXT,
  "issuedQty" DOUBLE PRECISION NOT NULL,
  "issuedBy" TEXT,
  "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "remarks" TEXT,
  CONSTRAINT "ProductionMaterialIssue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "production_orders_bomId_idx" ON "production_orders"("bomId");
CREATE INDEX "BOMItem_bomId_idx" ON "BOMItem"("bomId");
CREATE INDEX "BOMItem_materialId_idx" ON "BOMItem"("materialId");
CREATE UNIQUE INDEX "BOMRoutingStep_bomId_stepNo_key" ON "BOMRoutingStep"("bomId", "stepNo");
CREATE INDEX "BOMRoutingStep_bomId_idx" ON "BOMRoutingStep"("bomId");
CREATE UNIQUE INDEX "ProductionMaterialIssue_issueNo_key" ON "ProductionMaterialIssue"("issueNo");
CREATE INDEX "ProductionMaterialIssue_productionOrderId_idx" ON "ProductionMaterialIssue"("productionOrderId");
CREATE INDEX "ProductionMaterialIssue_inventoryItemId_idx" ON "ProductionMaterialIssue"("inventoryItemId");
CREATE INDEX "ProductionMaterialIssue_issuedDate_idx" ON "ProductionMaterialIssue"("issuedDate");

ALTER TABLE "production_orders"
ADD CONSTRAINT "production_orders_bomId_fkey"
FOREIGN KEY ("bomId") REFERENCES "BOM"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "production_orders"
SET "componentId" = NULL
WHERE "componentId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "components"
    WHERE "components"."id" = "production_orders"."componentId"
  );

ALTER TABLE "production_orders"
ADD CONSTRAINT "production_orders_componentId_fkey"
FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BOMItem"
ADD CONSTRAINT "BOMItem_materialId_fkey"
FOREIGN KEY ("materialId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BOMRoutingStep"
ADD CONSTRAINT "BOMRoutingStep_bomId_fkey"
FOREIGN KEY ("bomId") REFERENCES "BOM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductionMaterialIssue"
ADD CONSTRAINT "ProductionMaterialIssue_productionOrderId_fkey"
FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductionMaterialIssue"
ADD CONSTRAINT "ProductionMaterialIssue_inventoryItemId_fkey"
FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
