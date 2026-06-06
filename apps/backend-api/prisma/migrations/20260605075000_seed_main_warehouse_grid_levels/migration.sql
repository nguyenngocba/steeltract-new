DO $$
DECLARE
  main_warehouse_id TEXT;
  row_code TEXT;
  column_code TEXT;
  zone_code TEXT;
BEGIN
  SELECT "id" INTO main_warehouse_id
  FROM "master_warehouses"
  WHERE "code" = 'MAIN'
  LIMIT 1;

  IF main_warehouse_id IS NULL THEN
    INSERT INTO "master_warehouses" ("id", "code", "name", "description", "active", "color", "createdAt", "updatedAt")
    VALUES ('wh-main-steeltrack', 'MAIN', 'Kho chính', 'Kho vật tư chính dùng cho nhập kho, tồn kho và xuất vật tư cho công trình/sản xuất.', true, '#22d3ee', NOW(), NOW())
    RETURNING "id" INTO main_warehouse_id;
  END IF;

  FOREACH row_code IN ARRAY ARRAY['A','B','C','D','E','F']
  LOOP
    FOR column_index IN 1..6
    LOOP
      column_code := LPAD(column_index::TEXT, 2, '0');
      zone_code := row_code || column_code;

      INSERT INTO "warehouse_zones" ("id", "code", "name", "description", "color", "active", "row", "column", "level", "capacity", "warehouseId", "createdAt", "updatedAt")
      VALUES (
        'wh-zone-main-' || LOWER(zone_code) || '-l1',
        zone_code,
        'Kho chính ' || zone_code || ' - Tầng L1',
        'Ô vị trí ' || zone_code || ' thuộc Kho chính, tầng L1.',
        '#22d3ee',
        true,
        row_code,
        column_code,
        'L1',
        100,
        main_warehouse_id,
        NOW(),
        NOW()
      )
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "active" = true,
        "row" = EXCLUDED."row",
        "column" = EXCLUDED."column",
        "level" = COALESCE(NULLIF("warehouse_zones"."level", ''), EXCLUDED."level"),
        "capacity" = CASE WHEN "warehouse_zones"."capacity" <= 0 THEN EXCLUDED."capacity" ELSE "warehouse_zones"."capacity" END,
        "warehouseId" = main_warehouse_id,
        "updatedAt" = NOW();
    END LOOP;
  END LOOP;

  INSERT INTO "warehouse_zones" ("id", "code", "name", "description", "color", "active", "row", "column", "level", "capacity", "warehouseId", "createdAt", "updatedAt")
  VALUES
    ('wh-zone-main-a01-l2', 'A01-L2', 'Kho chính A01 - Tầng L2', 'Ô vị trí A01 thuộc Kho chính, tầng L2.', '#38bdf8', true, 'A', '01', 'L2', 100, main_warehouse_id, NOW(), NOW()),
    ('wh-zone-main-a01-l3', 'A01-L3', 'Kho chính A01 - Tầng L3', 'Ô vị trí A01 thuộc Kho chính, tầng L3.', '#60a5fa', true, 'A', '01', 'L3', 100, main_warehouse_id, NOW(), NOW())
  ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "active" = true,
    "row" = EXCLUDED."row",
    "column" = EXCLUDED."column",
    "level" = EXCLUDED."level",
    "capacity" = CASE WHEN "warehouse_zones"."capacity" <= 0 THEN EXCLUDED."capacity" ELSE "warehouse_zones"."capacity" END,
    "warehouseId" = main_warehouse_id,
    "updatedAt" = NOW();
END $$;
