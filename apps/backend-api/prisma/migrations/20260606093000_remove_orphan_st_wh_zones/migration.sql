UPDATE "inventory_items" SET "zoneId" = NULL WHERE "zoneId" IN (SELECT "id" FROM "warehouse_zones" WHERE "code" IN ('ST-WH-RAW', 'ST-WH-FAB'));
UPDATE "inventory_transactions" SET "zoneId" = NULL WHERE "zoneId" IN (SELECT "id" FROM "warehouse_zones" WHERE "code" IN ('ST-WH-RAW', 'ST-WH-FAB'));
UPDATE "inventory_transaction_items" SET "zoneId" = NULL WHERE "zoneId" IN (SELECT "id" FROM "warehouse_zones" WHERE "code" IN ('ST-WH-RAW', 'ST-WH-FAB'));
UPDATE "return_request_items" SET "zoneId" = NULL WHERE "zoneId" IN (SELECT "id" FROM "warehouse_zones" WHERE "code" IN ('ST-WH-RAW', 'ST-WH-FAB'));
DELETE FROM "warehouse_zones" WHERE "code" IN ('ST-WH-RAW', 'ST-WH-FAB');
