ALTER TABLE "inventory_items"
  ADD COLUMN IF NOT EXISTS "slotId" TEXT,
  ADD COLUMN IF NOT EXISTS "level" TEXT;

CREATE INDEX IF NOT EXISTS "inventory_items_slotId_idx" ON "inventory_items"("slotId");
CREATE INDEX IF NOT EXISTS "inventory_items_level_idx" ON "inventory_items"("level");

UPDATE "inventory_items" ii
SET "slotId" = COALESCE(ii."slotId", wz."row" || wz."column"),
    "level" = COALESCE(ii."level", wz."level"),
    "updatedAt" = NOW()
FROM "warehouse_zones" wz
WHERE ii."zoneId" = wz."id"
  AND ii."deletedAt" IS NULL;

DELETE FROM "warehouse_zones" wz
WHERE (
    wz."code" ~ '^[A-F][0-9]{2}$'
    OR wz."code" ~ '^[A-F][0-9]{2}-L[0-9]+$'
  )
  AND wz."code" NOT IN ('A01', 'A02', 'B01', 'C01')
  AND NOT EXISTS (
    SELECT 1 FROM "inventory_items" ii
    WHERE ii."zoneId" = wz."id"
      AND ii."deletedAt" IS NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM "inventory_transactions" it
    WHERE it."zoneId" = wz."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "inventory_transaction_items" iti
    WHERE iti."zoneId" = wz."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "return_request_items" rri
    WHERE rri."zoneId" = wz."id"
  );
