CREATE TABLE "master_material_usage_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "master_material_usage_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "master_material_usage_types_code_key"
ON "master_material_usage_types"("code");

CREATE INDEX "master_material_usage_types_active_idx"
ON "master_material_usage_types"("active");

CREATE INDEX "master_material_usage_types_sortOrder_idx"
ON "master_material_usage_types"("sortOrder");

ALTER TABLE "inventory_items"
ADD COLUMN "materialUsageTypeId" TEXT;

CREATE INDEX "inventory_items_materialUsageTypeId_idx"
ON "inventory_items"("materialUsageTypeId");

INSERT INTO "master_material_usage_types" (
    "id",
    "code",
    "name",
    "description",
    "active",
    "color",
    "sortOrder",
    "updatedAt"
)
VALUES
    ('master-material-usage-primary', 'PRIMARY', 'Vật tư chính', 'Legacy MaterialUsageType.PRIMARY preserved as canonical material usage taxonomy.', true, '#2563eb', 10, CURRENT_TIMESTAMP),
    ('master-material-usage-secondary', 'SECONDARY', 'Vật tư phụ', 'Legacy MaterialUsageType.SECONDARY preserved as canonical material usage taxonomy.', true, '#0ea5e9', 20, CURRENT_TIMESTAMP),
    ('master-material-usage-consumable', 'CONSUMABLE', 'Vật tư tiêu hao', 'Legacy MaterialUsageType.CONSUMABLE preserved as canonical material usage taxonomy.', true, '#f59e0b', 30, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

UPDATE "inventory_items" item
SET "materialUsageTypeId" = usage_type."id"
FROM "master_material_usage_types" usage_type
WHERE item."materialUsageTypeId" IS NULL
  AND item."materialUsageType"::text = usage_type."code";

ALTER TABLE "inventory_items"
ADD CONSTRAINT "inventory_items_materialUsageTypeId_fkey"
FOREIGN KEY ("materialUsageTypeId")
REFERENCES "master_material_usage_types"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
