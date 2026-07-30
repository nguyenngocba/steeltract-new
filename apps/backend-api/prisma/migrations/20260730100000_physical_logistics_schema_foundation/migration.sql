-- LOGISTICS.2A physical logistics schema foundation.
-- Add canonical ComponentInstance logistics states and nullable DispatchItem
-- physical identity. This migration is additive and intentionally performs no
-- historical backfill, no Component.status reinterpretation, and no synthetic
-- Dispatch/Yard/Inventory record creation.

ALTER TYPE "ComponentInstanceState" ADD VALUE IF NOT EXISTS 'IN_YARD';
ALTER TYPE "ComponentInstanceState" ADD VALUE IF NOT EXISTS 'IN_TRANSIT';
ALTER TYPE "ComponentInstanceState" ADD VALUE IF NOT EXISTS 'DELIVERED';

ALTER TABLE "dispatch_items"
  ADD COLUMN "componentInstanceId" TEXT;

ALTER TABLE "dispatch_items"
  ADD CONSTRAINT "dispatch_items_componentInstanceId_fkey"
  FOREIGN KEY ("componentInstanceId")
  REFERENCES "component_instances"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "dispatch_items_componentInstanceId_idx"
  ON "dispatch_items"("componentInstanceId");
