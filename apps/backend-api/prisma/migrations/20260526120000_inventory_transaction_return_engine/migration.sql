CREATE TYPE "ReturnFlowType" AS ENUM ('SITE_RETURN', 'PRODUCTION_RETURN', 'SUPPLIER_RETURN');
CREATE TYPE "ReturnRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RECEIVED', 'INSPECTED', 'DISPOSED', 'CANCELLED');
CREATE TYPE "ReturnDisposition" AS ENUM ('USABLE_STOCK', 'QC_HOLD', 'DAMAGED', 'SCRAP', 'REPAIR');

ALTER TABLE "inventory_transactions"
  ADD COLUMN "transactionNo" TEXT,
  ADD COLUMN "transactionTypeId" TEXT,
  ADD COLUMN "direction" TEXT,
  ADD COLUMN "approvedBy" TEXT,
  ADD COLUMN "projectId" TEXT,
  ADD COLUMN "supplierId" TEXT,
  ADD COLUMN "warehouseId" TEXT,
  ADD COLUMN "zoneId" TEXT,
  ADD COLUMN "remarks" TEXT,
  ADD COLUMN "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "inventory_transaction_items"
  ADD COLUMN "unitId" TEXT,
  ADD COLUMN "warehouseId" TEXT,
  ADD COLUMN "zoneId" TEXT,
  ADD COLUMN "slotId" TEXT;

CREATE TABLE "return_requests" (
  "id" TEXT NOT NULL,
  "returnNo" TEXT NOT NULL,
  "flowType" "ReturnFlowType" NOT NULL,
  "status" "ReturnRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "projectId" TEXT,
  "supplierId" TEXT,
  "warehouseId" TEXT,
  "requestedBy" TEXT,
  "approvedBy" TEXT,
  "receivedBy" TEXT,
  "inspectedBy" TEXT,
  "remarks" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "inspectedAt" TIMESTAMP(3),
  "disposedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "return_request_items" (
  "id" TEXT NOT NULL,
  "returnRequestId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "requestedQuantity" DOUBLE PRECISION NOT NULL,
  "receivedQuantity" DOUBLE PRECISION,
  "inspectedQuantity" DOUBLE PRECISION,
  "disposition" "ReturnDisposition",
  "unitId" TEXT,
  "zoneId" TEXT,
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "return_request_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_transactions_transactionNo_key" ON "inventory_transactions"("transactionNo");
CREATE INDEX "inventory_transactions_transactionTypeId_idx" ON "inventory_transactions"("transactionTypeId");
CREATE INDEX "inventory_transactions_direction_idx" ON "inventory_transactions"("direction");
CREATE INDEX "inventory_transactions_warehouseId_idx" ON "inventory_transactions"("warehouseId");
CREATE INDEX "inventory_transactions_zoneId_idx" ON "inventory_transactions"("zoneId");
CREATE INDEX "inventory_transactions_projectId_idx" ON "inventory_transactions"("projectId");
CREATE INDEX "inventory_transactions_transactionDate_idx" ON "inventory_transactions"("transactionDate");
CREATE INDEX "inventory_transaction_items_unitId_idx" ON "inventory_transaction_items"("unitId");
CREATE INDEX "inventory_transaction_items_warehouseId_idx" ON "inventory_transaction_items"("warehouseId");
CREATE INDEX "inventory_transaction_items_zoneId_idx" ON "inventory_transaction_items"("zoneId");
CREATE UNIQUE INDEX "return_requests_returnNo_key" ON "return_requests"("returnNo");
CREATE INDEX "return_requests_flowType_idx" ON "return_requests"("flowType");
CREATE INDEX "return_requests_status_idx" ON "return_requests"("status");
CREATE INDEX "return_requests_projectId_idx" ON "return_requests"("projectId");
CREATE INDEX "return_requests_warehouseId_idx" ON "return_requests"("warehouseId");
CREATE INDEX "return_request_items_returnRequestId_idx" ON "return_request_items"("returnRequestId");
CREATE INDEX "return_request_items_inventoryItemId_idx" ON "return_request_items"("inventoryItemId");
CREATE INDEX "return_request_items_disposition_idx" ON "return_request_items"("disposition");

ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_transactionTypeId_fkey" FOREIGN KEY ("transactionTypeId") REFERENCES "master_transaction_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "warehouse_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_transaction_items" ADD CONSTRAINT "inventory_transaction_items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "master_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_transaction_items" ADD CONSTRAINT "inventory_transaction_items_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_transaction_items" ADD CONSTRAINT "inventory_transaction_items_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "warehouse_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "master_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "warehouse_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "inventory_transactions"
SET "transactionNo" = "code",
    "direction" = CASE
      WHEN "type" IN ('IMPORT', 'RETURN') THEN 'inbound'
      WHEN "type" = 'EXPORT' THEN 'outbound'
      ELSE 'internal'
    END;
