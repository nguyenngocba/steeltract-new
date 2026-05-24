-- CreateEnum
CREATE TYPE "YardZoneStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "YardSlotStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "YardItemType" AS ENUM ('COMPONENT', 'MATERIAL', 'INVENTORY', 'PRODUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "YardMovementType" AS ENUM ('PLACE', 'MOVE', 'REMOVE', 'ADJUST');

-- CreateEnum
CREATE TYPE "CraneStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'OFFLINE');

-- CreateTable
CREATE TABLE "yard_zones" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "YardZoneStatus" NOT NULL DEFAULT 'ACTIVE',
    "originX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#06b6d4',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yard_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yard_rows" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "index" INTEGER NOT NULL,
    "originX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yard_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yard_slots" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "rowId" TEXT,
    "code" TEXT NOT NULL,
    "status" "YardSlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "maxStackLevel" INTEGER NOT NULL DEFAULT 1,
    "currentStackLevel" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yard_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yard_item_placements" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "itemType" "YardItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "stackLevel" INTEGER NOT NULL DEFAULT 1,
    "weight" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "placedById" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yard_item_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yard_movements" (
    "id" TEXT NOT NULL,
    "placementId" TEXT,
    "type" "YardMovementType" NOT NULL,
    "itemType" "YardItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "fromSlotId" TEXT,
    "toSlotId" TEXT,
    "craneId" TEXT,
    "movedById" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yard_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cranes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CraneStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "utilization" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cranes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yard_snapshots" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT,
    "name" TEXT NOT NULL,
    "occupancyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSlots" INTEGER NOT NULL DEFAULT 0,
    "occupiedSlots" INTEGER NOT NULL DEFAULT 0,
    "heatmap" JSONB,
    "congestion" JSONB,
    "payload" JSONB NOT NULL,
    "generatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "yard_zones_code_key" ON "yard_zones"("code");

-- CreateIndex
CREATE INDEX "yard_zones_status_idx" ON "yard_zones"("status");

-- CreateIndex
CREATE UNIQUE INDEX "yard_rows_zoneId_code_key" ON "yard_rows"("zoneId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "yard_rows_zoneId_index_key" ON "yard_rows"("zoneId", "index");

-- CreateIndex
CREATE INDEX "yard_rows_zoneId_idx" ON "yard_rows"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "yard_slots_zoneId_code_key" ON "yard_slots"("zoneId", "code");

-- CreateIndex
CREATE INDEX "yard_slots_zoneId_idx" ON "yard_slots"("zoneId");

-- CreateIndex
CREATE INDEX "yard_slots_rowId_idx" ON "yard_slots"("rowId");

-- CreateIndex
CREATE INDEX "yard_slots_status_idx" ON "yard_slots"("status");

-- CreateIndex
CREATE INDEX "yard_item_placements_slotId_idx" ON "yard_item_placements"("slotId");

-- CreateIndex
CREATE INDEX "yard_item_placements_itemType_itemId_idx" ON "yard_item_placements"("itemType", "itemId");

-- CreateIndex
CREATE INDEX "yard_item_placements_itemCode_idx" ON "yard_item_placements"("itemCode");

-- CreateIndex
CREATE INDEX "yard_item_placements_removedAt_idx" ON "yard_item_placements"("removedAt");

-- CreateIndex
CREATE INDEX "yard_movements_itemType_itemId_idx" ON "yard_movements"("itemType", "itemId");

-- CreateIndex
CREATE INDEX "yard_movements_fromSlotId_idx" ON "yard_movements"("fromSlotId");

-- CreateIndex
CREATE INDEX "yard_movements_toSlotId_idx" ON "yard_movements"("toSlotId");

-- CreateIndex
CREATE INDEX "yard_movements_craneId_idx" ON "yard_movements"("craneId");

-- CreateIndex
CREATE INDEX "yard_movements_createdAt_idx" ON "yard_movements"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cranes_code_key" ON "cranes"("code");

-- CreateIndex
CREATE INDEX "cranes_status_idx" ON "cranes"("status");

-- CreateIndex
CREATE INDEX "yard_snapshots_zoneId_idx" ON "yard_snapshots"("zoneId");

-- CreateIndex
CREATE INDEX "yard_snapshots_createdAt_idx" ON "yard_snapshots"("createdAt");

-- AddForeignKey
ALTER TABLE "yard_rows" ADD CONSTRAINT "yard_rows_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "yard_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_slots" ADD CONSTRAINT "yard_slots_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "yard_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_slots" ADD CONSTRAINT "yard_slots_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "yard_rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_item_placements" ADD CONSTRAINT "yard_item_placements_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "yard_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_movements" ADD CONSTRAINT "yard_movements_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "yard_item_placements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_movements" ADD CONSTRAINT "yard_movements_fromSlotId_fkey" FOREIGN KEY ("fromSlotId") REFERENCES "yard_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_movements" ADD CONSTRAINT "yard_movements_toSlotId_fkey" FOREIGN KEY ("toSlotId") REFERENCES "yard_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_movements" ADD CONSTRAINT "yard_movements_craneId_fkey" FOREIGN KEY ("craneId") REFERENCES "cranes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_snapshots" ADD CONSTRAINT "yard_snapshots_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "yard_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
