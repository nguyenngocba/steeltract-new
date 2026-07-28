-- COMPONENT DOMAIN.3 additive typed engineering attributes.
-- Existing legacy rows intentionally keep NULL values and retain description JSON unchanged.

ALTER TABLE "components"
ADD COLUMN "componentType" TEXT,
ADD COLUMN "profile" TEXT;

CREATE INDEX "components_componentType_idx" ON "components"("componentType");
