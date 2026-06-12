-- CreateEnum
CREATE TYPE "ProductionMaterialLedgerEventType" AS ENUM ('RESERVE', 'RELEASE', 'ISSUE', 'RETURN', 'CONSUME', 'ADJUST');

-- CreateTable
CREATE TABLE "ProductionMaterialLedger" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "reservationId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "zoneId" TEXT,
    "slotId" TEXT,
    "level" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "eventType" "ProductionMaterialLedgerEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionMaterialLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionMaterialLedger_productionOrderId_idx" ON "ProductionMaterialLedger"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionMaterialLedger_reservationId_idx" ON "ProductionMaterialLedger"("reservationId");

-- CreateIndex
CREATE INDEX "ProductionMaterialLedger_inventoryItemId_idx" ON "ProductionMaterialLedger"("inventoryItemId");

-- CreateIndex
CREATE INDEX "ProductionMaterialLedger_eventType_idx" ON "ProductionMaterialLedger"("eventType");

-- CreateIndex
CREATE INDEX "ProductionMaterialLedger_eventDate_idx" ON "ProductionMaterialLedger"("eventDate");

-- CreateIndex
CREATE INDEX "ProductionMaterialLedger_warehouseId_zoneId_slotId_level_idx" ON "ProductionMaterialLedger"("warehouseId", "zoneId", "slotId", "level");

-- AddForeignKey
ALTER TABLE "ProductionMaterialLedger" ADD CONSTRAINT "ProductionMaterialLedger_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialLedger" ADD CONSTRAINT "ProductionMaterialLedger_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ProductionMaterialReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialLedger" ADD CONSTRAINT "ProductionMaterialLedger_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialLedger" ADD CONSTRAINT "ProductionMaterialLedger_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialLedger" ADD CONSTRAINT "ProductionMaterialLedger_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "warehouse_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

