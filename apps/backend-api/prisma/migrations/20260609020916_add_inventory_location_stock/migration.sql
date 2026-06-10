-- CreateTable
CREATE TABLE "inventory_location_stocks" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "zoneId" TEXT,
    "slotId" TEXT,
    "level" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_location_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_location_stocks_inventoryItemId_idx" ON "inventory_location_stocks"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_location_stocks_zoneId_slotId_level_idx" ON "inventory_location_stocks"("zoneId", "slotId", "level");

-- AddForeignKey
ALTER TABLE "inventory_location_stocks" ADD CONSTRAINT "inventory_location_stocks_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
