-- PROCUREMENT.GATE.1 is additive and preserves every legacy Purchasing field.
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

CREATE TYPE "PurchaseRequestStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

ALTER TABLE "material_requests"
  ADD COLUMN "requesterId" TEXT,
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "departmentId" TEXT,
  ADD COLUMN "requiredDate" TIMESTAMP(3),
  ADD COLUMN "priority" "TaskPriority",
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "lifecycleStatus" "PurchaseRequestStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

ALTER TABLE "purchase_orders"
  ADD COLUMN "rejectedById" TEXT,
  ADD COLUMN "cancelledById" TEXT,
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "cancellationReason" TEXT;

ALTER TABLE "inventory_transactions"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "commandHash" TEXT;

ALTER TABLE "return_requests"
  ADD COLUMN "purchaseOrderId" TEXT,
  ADD COLUMN "receiptTransactionId" TEXT;

CREATE UNIQUE INDEX "inventory_transactions_idempotencyKey_key"
  ON "inventory_transactions"("idempotencyKey");
CREATE INDEX "inventory_transactions_reference_date_idx"
  ON "inventory_transactions"("referenceModule", "referenceId", "transactionDate" DESC);

CREATE INDEX "material_requests_lifecycleStatus_idx"
  ON "material_requests"("lifecycleStatus");
CREATE INDEX "material_requests_requesterId_idx"
  ON "material_requests"("requesterId");
CREATE INDEX "material_requests_approvedById_idx"
  ON "material_requests"("approvedById");
CREATE INDEX "material_requests_departmentId_idx"
  ON "material_requests"("departmentId");
CREATE INDEX "material_requests_requiredDate_idx"
  ON "material_requests"("requiredDate");

CREATE INDEX "purchase_orders_rejectedById_idx"
  ON "purchase_orders"("rejectedById");
CREATE INDEX "purchase_orders_cancelledById_idx"
  ON "purchase_orders"("cancelledById");

CREATE INDEX "return_requests_supplierId_idx"
  ON "return_requests"("supplierId");
CREATE INDEX "return_requests_purchaseOrderId_idx"
  ON "return_requests"("purchaseOrderId");
CREATE INDEX "return_requests_receiptTransactionId_idx"
  ON "return_requests"("receiptTransactionId");

ALTER TABLE "material_requests"
  ADD CONSTRAINT "material_requests_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "material_requests_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_rejectedById_fkey"
  FOREIGN KEY ("rejectedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "purchase_orders_cancelledById_fkey"
  FOREIGN KEY ("cancelledById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "return_requests"
  ADD CONSTRAINT "return_requests_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "return_requests_purchaseOrderId_fkey"
  FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "return_requests_receiptTransactionId_fkey"
  FOREIGN KEY ("receiptTransactionId") REFERENCES "inventory_transactions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
