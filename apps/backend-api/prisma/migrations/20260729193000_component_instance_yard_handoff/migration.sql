-- COMPONENT DOMAIN / PROJECTS.3
-- Add canonical physical ComponentInstance identity to Yard placement history.
-- This migration is additive and intentionally does not backfill legacy
-- component-level placements because existing rows may represent aggregate
-- Component definitions rather than individual fabricated instances.

ALTER TABLE "yard_item_placements"
  ADD COLUMN "componentInstanceId" TEXT;

ALTER TABLE "yard_movements"
  ADD COLUMN "componentInstanceId" TEXT;

ALTER TABLE "yard_item_placements"
  ADD CONSTRAINT "yard_item_placements_componentInstanceId_fkey"
  FOREIGN KEY ("componentInstanceId")
  REFERENCES "component_instances"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "yard_movements"
  ADD CONSTRAINT "yard_movements_componentInstanceId_fkey"
  FOREIGN KEY ("componentInstanceId")
  REFERENCES "component_instances"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "yard_item_placements_componentInstanceId_idx"
  ON "yard_item_placements"("componentInstanceId");

CREATE INDEX "yard_movements_componentInstanceId_idx"
  ON "yard_movements"("componentInstanceId");

-- PostgreSQL partial unique index: one active Yard placement per physical
-- ComponentInstance, while allowing multiple historical rows after removedAt.
-- Prisma schema cannot safely represent this filtered uniqueness for all
-- supported migration paths, so it is maintained as raw SQL.
CREATE UNIQUE INDEX "yard_item_placements_componentInstance_active_uidx"
  ON "yard_item_placements"("componentInstanceId")
  WHERE "componentInstanceId" IS NOT NULL AND "removedAt" IS NULL;
