CREATE TYPE "MaterialUsageType" AS ENUM ('PRIMARY', 'SECONDARY', 'CONSUMABLE');

ALTER TABLE "inventory_items"
ADD COLUMN "materialUsageType" "MaterialUsageType" NOT NULL DEFAULT 'PRIMARY';

CREATE INDEX "inventory_items_materialUsageType_idx"
ON "inventory_items"("materialUsageType");
