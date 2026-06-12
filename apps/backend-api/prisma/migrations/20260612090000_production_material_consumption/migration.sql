CREATE TABLE "ProductionMaterialConsumption" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "issuedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scrapQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remark" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionMaterialConsumption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductionMaterialConsumption_productionOrderId_idx" ON "ProductionMaterialConsumption"("productionOrderId");

CREATE INDEX "ProductionMaterialConsumption_inventoryItemId_idx" ON "ProductionMaterialConsumption"("inventoryItemId");

CREATE INDEX "ProductionMaterialConsumption_createdAt_idx" ON "ProductionMaterialConsumption"("createdAt");

ALTER TABLE "ProductionMaterialConsumption" ADD CONSTRAINT "ProductionMaterialConsumption_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductionMaterialConsumption" ADD CONSTRAINT "ProductionMaterialConsumption_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
