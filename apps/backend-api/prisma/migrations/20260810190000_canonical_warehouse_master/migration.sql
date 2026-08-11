-- Canonical Warehouse master and capability metadata.
-- Forward-only: existing warehouses, zones, stock, and movement rows are preserved.

CREATE TABLE "master_warehouse_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "master_warehouse_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "master_warehouse_types_code_key"
    ON "master_warehouse_types"("code");
CREATE INDEX "master_warehouse_types_active_displayOrder_idx"
    ON "master_warehouse_types"("active", "displayOrder");

INSERT INTO "master_warehouse_types"
    ("id", "code", "name", "description", "color", "displayOrder")
VALUES
    ('warehouse-type-main', 'MAIN', 'Kho chính', 'Kho vật tư chính và nguồn cấp vận hành.', '#22d3ee', 10),
    ('warehouse-type-production', 'PRODUCTION', 'Kho sản xuất', 'Kho vật tư thuộc quyền quản lý của sản xuất.', '#10b981', 20),
    ('warehouse-type-qc', 'QC', 'Kho QC', 'Kho chờ hoặc phục vụ kiểm tra chất lượng.', '#8b5cf6', 30),
    ('warehouse-type-quarantine', 'QUARANTINE', 'Kho cách ly', 'Kho cách ly vật tư hoặc hàng hóa cần xử lý.', '#f59e0b', 40),
    ('warehouse-type-scrap', 'SCRAP', 'Kho phế liệu', 'Kho lưu phế liệu và vật tư loại bỏ.', '#ef4444', 50),
    ('warehouse-type-return', 'RETURN', 'Kho trả hàng', 'Kho tiếp nhận hoặc chuẩn bị hàng trả.', '#f97316', 60),
    ('warehouse-type-transit', 'TRANSIT', 'Kho trung chuyển', 'Kho trung chuyển trong luồng logistics.', '#3b82f6', 70),
    ('warehouse-type-custom', 'CUSTOM', 'Kho tùy chỉnh', 'Loại kho do doanh nghiệp cấu hình.', '#64748b', 80);

ALTER TABLE "master_warehouses"
    ADD COLUMN "warehouseTypeId" TEXT,
    ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "allowReceipt" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowIssue" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowProduction" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowQc" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowDispatch" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowInstallation" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowSupplierReturn" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowScrap" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "allowReverse" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "dashboardVisible" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "planningVisible" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "reportingVisible" BOOLEAN NOT NULL DEFAULT true;

UPDATE "master_warehouses"
SET "warehouseTypeId" = CASE UPPER("code")
        WHEN 'MAIN' THEN 'warehouse-type-main'
        WHEN 'PRODUCTION' THEN 'warehouse-type-production'
        WHEN 'QC' THEN 'warehouse-type-qc'
        WHEN 'QUARANTINE' THEN 'warehouse-type-quarantine'
        WHEN 'SCRAP' THEN 'warehouse-type-scrap'
        WHEN 'RETURN' THEN 'warehouse-type-return'
        WHEN 'TRANSIT' THEN 'warehouse-type-transit'
        ELSE 'warehouse-type-custom'
    END,
    "allowReceipt" = CASE UPPER("code")
        WHEN 'MAIN' THEN true
        WHEN 'PRODUCTION' THEN true
        WHEN 'QC' THEN true
        WHEN 'QUARANTINE' THEN true
        WHEN 'RETURN' THEN true
        WHEN 'TRANSIT' THEN true
        ELSE false
    END,
    "allowIssue" = CASE UPPER("code")
        WHEN 'MAIN' THEN true
        WHEN 'PRODUCTION' THEN true
        WHEN 'QC' THEN true
        WHEN 'QUARANTINE' THEN true
        WHEN 'SCRAP' THEN true
        WHEN 'RETURN' THEN true
        WHEN 'TRANSIT' THEN true
        ELSE false
    END,
    "allowProduction" = UPPER("code") = 'PRODUCTION',
    "allowQc" = UPPER("code") IN ('QC', 'QUARANTINE'),
    "allowDispatch" = UPPER("code") IN ('MAIN', 'TRANSIT'),
    "allowInstallation" = UPPER("code") = 'TRANSIT',
    "allowSupplierReturn" = UPPER("code") IN ('MAIN', 'RETURN'),
    "allowScrap" = UPPER("code") = 'SCRAP',
    "allowReverse" = UPPER("code") IN ('MAIN', 'PRODUCTION', 'QC', 'QUARANTINE', 'RETURN', 'TRANSIT'),
    "displayOrder" = CASE UPPER("code")
        WHEN 'MAIN' THEN 10
        WHEN 'PRODUCTION' THEN 20
        WHEN 'QC' THEN 30
        WHEN 'QUARANTINE' THEN 40
        WHEN 'SCRAP' THEN 50
        WHEN 'RETURN' THEN 60
        WHEN 'TRANSIT' THEN 70
        ELSE 80
    END;

ALTER TABLE "master_warehouses"
    ADD CONSTRAINT "master_warehouses_warehouseTypeId_fkey"
    FOREIGN KEY ("warehouseTypeId") REFERENCES "master_warehouse_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_location_stocks"
    ADD CONSTRAINT "inventory_location_stocks_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "master_warehouses_warehouseTypeId_idx"
    ON "master_warehouses"("warehouseTypeId");
CREATE INDEX "master_warehouses_active_displayOrder_idx"
    ON "master_warehouses"("active", "displayOrder");
CREATE INDEX "inventory_location_stocks_warehouseId_idx"
    ON "inventory_location_stocks"("warehouseId");
CREATE INDEX "warehouse_zones_warehouseId_row_column_level_idx"
    ON "warehouse_zones"("warehouseId", "row", "column", "level");
