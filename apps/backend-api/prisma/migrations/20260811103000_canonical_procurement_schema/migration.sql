-- Extend the existing lifecycle without invalidating legacy PENDING rows.
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_RECEIVED';

CREATE TYPE "ProcurementActivityEvent" AS ENUM (
  'PURCHASE_REQUEST_CREATED',
  'PURCHASE_REQUEST_APPROVED',
  'PURCHASE_ORDER_CREATED',
  'PURCHASE_ORDER_APPROVED',
  'PURCHASE_ORDER_CANCELLED',
  'PURCHASE_RECEIVED',
  'SUPPLIER_RETURN'
);

ALTER TABLE "material_request_items"
  ADD COLUMN "materialId" TEXT;

ALTER TABLE "purchase_orders"
  ADD COLUMN "supplierId" TEXT,
  ADD COLUMN "materialRequestId" TEXT,
  ADD COLUMN "requestedById" TEXT,
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "expectedDeliveryDate" TIMESTAMP(3);

ALTER TABLE "purchase_order_items"
  ADD COLUMN "materialId" TEXT,
  ADD COLUMN "uomId" TEXT,
  ADD COLUMN "warehouseId" TEXT,
  ADD COLUMN "requestedQty" DOUBLE PRECISION,
  ADD COLUMN "orderedQty" DOUBLE PRECISION,
  ADD COLUMN "receivedQty" DOUBLE PRECISION,
  ADD COLUMN "rejectedQty" DOUBLE PRECISION,
  ADD COLUMN "remainingQty" DOUBLE PRECISION,
  ADD COLUMN "discount" DOUBLE PRECISION,
  ADD COLUMN "tax" DOUBLE PRECISION,
  ADD COLUMN "amount" DOUBLE PRECISION,
  ADD COLUMN "expectedDate" TIMESTAMP(3);

ALTER TABLE "activity_logs"
  ADD COLUMN "procurementEvent" "ProcurementActivityEvent";

-- These mappings are direct aliases of existing PO-line values. Historical
-- receipt/rejection quantities and master identities are intentionally not
-- inferred from names or polymorphic references.
UPDATE "purchase_order_items"
SET
  "orderedQty" = "quantity",
  "amount" = "totalPrice"
WHERE "orderedQty" IS NULL OR "amount" IS NULL;

CREATE INDEX "material_request_items_requestId_idx"
  ON "material_request_items"("requestId");
CREATE INDEX "material_request_items_materialId_idx"
  ON "material_request_items"("materialId");

CREATE INDEX "purchase_orders_supplierId_idx"
  ON "purchase_orders"("supplierId");
CREATE INDEX "purchase_orders_materialRequestId_idx"
  ON "purchase_orders"("materialRequestId");
CREATE INDEX "purchase_orders_requestedById_idx"
  ON "purchase_orders"("requestedById");
CREATE INDEX "purchase_orders_approvedById_idx"
  ON "purchase_orders"("approvedById");
CREATE INDEX "purchase_orders_status_expectedDeliveryDate_idx"
  ON "purchase_orders"("status", "expectedDeliveryDate");

CREATE INDEX "purchase_order_items_purchaseOrderId_idx"
  ON "purchase_order_items"("purchaseOrderId");
CREATE INDEX "purchase_order_items_materialId_idx"
  ON "purchase_order_items"("materialId");
CREATE INDEX "purchase_order_items_uomId_idx"
  ON "purchase_order_items"("uomId");
CREATE INDEX "purchase_order_items_warehouseId_idx"
  ON "purchase_order_items"("warehouseId");
CREATE INDEX "purchase_order_items_purchaseOrderId_materialId_idx"
  ON "purchase_order_items"("purchaseOrderId", "materialId");

CREATE INDEX "activity_logs_procurementEvent_createdAt_idx"
  ON "activity_logs"("procurementEvent", "createdAt" DESC);

ALTER TABLE "material_request_items"
  ADD CONSTRAINT "material_request_items_materialId_fkey"
  FOREIGN KEY ("materialId") REFERENCES "inventory_items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "purchase_orders_materialRequestId_fkey"
  FOREIGN KEY ("materialRequestId") REFERENCES "material_requests"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "purchase_orders_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "purchase_orders_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchase_order_items"
  ADD CONSTRAINT "purchase_order_items_materialId_fkey"
  FOREIGN KEY ("materialId") REFERENCES "inventory_items"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "purchase_order_items_uomId_fkey"
  FOREIGN KEY ("uomId") REFERENCES "master_units"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "purchase_order_items_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "master_warehouses"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
