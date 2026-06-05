ALTER TABLE "inventory_items"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "inventory_items_deletedAt_idx"
ON "inventory_items"("deletedAt");
