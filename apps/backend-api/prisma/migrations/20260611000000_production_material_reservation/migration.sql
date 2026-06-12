-- CreateEnum
CREATE TYPE "ProductionMaterialReservationStatus" AS ENUM ('DRAFT', 'RESERVED', 'PARTIALLY_ISSUED', 'ISSUED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProductionMaterialReservationLineStatus" AS ENUM ('OPEN', 'PARTIAL', 'FULFILLED', 'RELEASED', 'SHORTAGE');

-- CreateTable
CREATE TABLE "ProductionMaterialReservation" (
    "id" TEXT NOT NULL,
    "reservationNo" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "bomId" TEXT,
    "status" "ProductionMaterialReservationStatus" NOT NULL DEFAULT 'DRAFT',
    "reservedBy" TEXT,
    "reservedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionMaterialReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionMaterialReservationLine" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "bomItemId" TEXT,
    "warehouseId" TEXT,
    "zoneId" TEXT,
    "slotId" TEXT,
    "level" TEXT,
    "requiredQty" DOUBLE PRECISION NOT NULL,
    "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issuedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ProductionMaterialReservationLineStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionMaterialReservationLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionMaterialReservation_reservationNo_key" ON "ProductionMaterialReservation"("reservationNo");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservation_productionOrderId_idx" ON "ProductionMaterialReservation"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservation_bomId_idx" ON "ProductionMaterialReservation"("bomId");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservation_status_idx" ON "ProductionMaterialReservation"("status");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservation_reservedAt_idx" ON "ProductionMaterialReservation"("reservedAt");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservationLine_reservationId_idx" ON "ProductionMaterialReservationLine"("reservationId");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservationLine_inventoryItemId_idx" ON "ProductionMaterialReservationLine"("inventoryItemId");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservationLine_bomItemId_idx" ON "ProductionMaterialReservationLine"("bomItemId");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservationLine_warehouseId_zoneId_slotId_idx" ON "ProductionMaterialReservationLine"("warehouseId", "zoneId", "slotId", "level");

-- CreateIndex
CREATE INDEX "ProductionMaterialReservationLine_status_idx" ON "ProductionMaterialReservationLine"("status");

-- AddForeignKey
ALTER TABLE "inventory_location_stocks" ADD CONSTRAINT "inventory_location_stocks_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "warehouse_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialReservation" ADD CONSTRAINT "ProductionMaterialReservation_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialReservation" ADD CONSTRAINT "ProductionMaterialReservation_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BOM"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialReservationLine" ADD CONSTRAINT "ProductionMaterialReservationLine_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ProductionMaterialReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialReservationLine" ADD CONSTRAINT "ProductionMaterialReservationLine_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialReservationLine" ADD CONSTRAINT "ProductionMaterialReservationLine_bomItemId_fkey" FOREIGN KEY ("bomItemId") REFERENCES "BOMItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialReservationLine" ADD CONSTRAINT "ProductionMaterialReservationLine_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialReservationLine" ADD CONSTRAINT "ProductionMaterialReservationLine_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "warehouse_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

