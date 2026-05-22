-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "zoneId" TEXT;

-- CreateTable
CREATE TABLE "warehouse_zones" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#06b6d4',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_zones_code_key" ON "warehouse_zones"("code");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "warehouse_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
