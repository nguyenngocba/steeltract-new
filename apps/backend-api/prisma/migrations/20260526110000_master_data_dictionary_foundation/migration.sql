ALTER TABLE "inventory_categories"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "color" TEXT,
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

CREATE TABLE "material_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "material_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_transaction_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "direction" TEXT NOT NULL,
    "affectsStock" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "master_transaction_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_warehouses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "master_warehouses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_qc_statuses" (
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
    CONSTRAINT "master_qc_statuses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_priorities" (
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
    CONSTRAINT "master_priorities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_material_statuses" (
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
    CONSTRAINT "master_material_statuses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_supplier_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "master_supplier_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_project_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "master_project_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_workflow_statuses" (
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
    CONSTRAINT "master_workflow_statuses_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "warehouse_zones"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "warehouseId" TEXT,
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

CREATE UNIQUE INDEX "material_types_code_key" ON "material_types"("code");
CREATE INDEX "material_types_categoryId_idx" ON "material_types"("categoryId");
CREATE INDEX "material_types_active_idx" ON "material_types"("active");
CREATE UNIQUE INDEX "master_transaction_types_code_key" ON "master_transaction_types"("code");
CREATE INDEX "master_transaction_types_direction_idx" ON "master_transaction_types"("direction");
CREATE INDEX "master_transaction_types_active_idx" ON "master_transaction_types"("active");
CREATE UNIQUE INDEX "master_warehouses_code_key" ON "master_warehouses"("code");
CREATE INDEX "master_warehouses_active_idx" ON "master_warehouses"("active");
CREATE UNIQUE INDEX "master_qc_statuses_code_key" ON "master_qc_statuses"("code");
CREATE INDEX "master_qc_statuses_active_idx" ON "master_qc_statuses"("active");
CREATE UNIQUE INDEX "master_priorities_code_key" ON "master_priorities"("code");
CREATE INDEX "master_priorities_active_idx" ON "master_priorities"("active");
CREATE UNIQUE INDEX "master_material_statuses_code_key" ON "master_material_statuses"("code");
CREATE INDEX "master_material_statuses_active_idx" ON "master_material_statuses"("active");
CREATE UNIQUE INDEX "master_supplier_categories_code_key" ON "master_supplier_categories"("code");
CREATE INDEX "master_supplier_categories_active_idx" ON "master_supplier_categories"("active");
CREATE UNIQUE INDEX "master_project_categories_code_key" ON "master_project_categories"("code");
CREATE INDEX "master_project_categories_active_idx" ON "master_project_categories"("active");
CREATE UNIQUE INDEX "master_workflow_statuses_code_key" ON "master_workflow_statuses"("code");
CREATE INDEX "master_workflow_statuses_active_idx" ON "master_workflow_statuses"("active");
CREATE INDEX "warehouse_zones_warehouseId_idx" ON "warehouse_zones"("warehouseId");
CREATE INDEX "warehouse_zones_active_idx" ON "warehouse_zones"("active");

ALTER TABLE "material_types" ADD CONSTRAINT "material_types_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inventory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "warehouse_zones" ADD CONSTRAINT "warehouse_zones_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
