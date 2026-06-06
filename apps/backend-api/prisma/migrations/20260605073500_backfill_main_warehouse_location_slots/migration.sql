UPDATE "warehouse_zones"
SET "row" = 'A',
    "column" = '01',
    "level" = 'L1',
    "capacity" = CASE WHEN "capacity" <= 0 THEN 100 ELSE "capacity" END,
    "updatedAt" = NOW()
WHERE "code" = 'A01'
  AND ("row" IS NULL OR "row" = '' OR "column" IS NULL OR "column" = '' OR "level" IS NULL OR "level" = '');

UPDATE "warehouse_zones"
SET "row" = 'A',
    "column" = '02',
    "level" = 'L1',
    "capacity" = CASE WHEN "capacity" <= 0 THEN 100 ELSE "capacity" END,
    "updatedAt" = NOW()
WHERE "code" = 'A02'
  AND ("row" IS NULL OR "row" = '' OR "column" IS NULL OR "column" = '' OR "level" IS NULL OR "level" = '');

UPDATE "warehouse_zones"
SET "row" = 'B',
    "column" = '01',
    "level" = 'L1',
    "capacity" = CASE WHEN "capacity" <= 0 THEN 100 ELSE "capacity" END,
    "updatedAt" = NOW()
WHERE "code" = 'B01'
  AND ("row" IS NULL OR "row" = '' OR "column" IS NULL OR "column" = '' OR "level" IS NULL OR "level" = '');
