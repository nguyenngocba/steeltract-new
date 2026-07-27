-- Additive lineage for Engineering-derived Production BOMs.
-- Legacy/manual BOM rows remain valid because all lineage fields are nullable
-- and `source` defaults to MANUAL.

ALTER TABLE "BOM"
ADD COLUMN "componentId" TEXT,
ADD COLUMN "componentRevisionId" TEXT,
ADD COLUMN "bomDefinitionId" TEXT,
ADD COLUMN "engineeringContentHash" TEXT,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "materializedAt" TIMESTAMP(3),
ADD COLUMN "materializedBy" TEXT;

CREATE UNIQUE INDEX "BOM_bomDefinitionId_key" ON "BOM"("bomDefinitionId");

CREATE INDEX "BOM_componentId_idx" ON "BOM"("componentId");

CREATE INDEX "BOM_componentRevisionId_idx" ON "BOM"("componentRevisionId");

CREATE INDEX "BOM_engineeringContentHash_idx" ON "BOM"("engineeringContentHash");

CREATE INDEX "BOM_componentId_status_idx" ON "BOM"("componentId", "status");

ALTER TABLE "BOM"
ADD CONSTRAINT "BOM_componentId_fkey"
FOREIGN KEY ("componentId") REFERENCES "components"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BOM"
ADD CONSTRAINT "BOM_componentRevisionId_fkey"
FOREIGN KEY ("componentRevisionId") REFERENCES "component_revisions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BOM"
ADD CONSTRAINT "BOM_bomDefinitionId_fkey"
FOREIGN KEY ("bomDefinitionId") REFERENCES "component_bom_definitions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
