INSERT INTO "master_warehouses" ("id", "code", "name", "description", "active", "color", "createdAt", "updatedAt")
VALUES
  ('wh-main-steeltrack', 'MAIN', 'Kho chính', 'Kho vật tư chính dùng cho nhập kho, tồn kho và xuất vật tư cho công trình/sản xuất.', true, '#22d3ee', NOW(), NOW()),
  ('wh-production-steeltrack', 'PRODUCTION', 'Kho sản xuất', 'Kho vật tư sản xuất dùng cho cấu kiện và lệnh sản xuất.', true, '#a78bfa', NOW(), NOW())
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "active" = true,
  "color" = EXCLUDED."color",
  "updatedAt" = NOW();

UPDATE "warehouse_zones"
SET "warehouseId" = 'wh-main-steeltrack',
    "updatedAt" = NOW()
WHERE "code" IN ('A01', 'A02', 'B01', 'C01')
  AND "warehouseId" IS NULL;
