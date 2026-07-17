-- Add the canonical Components domain alongside the legacy operational status.
CREATE TYPE "ComponentLifecycleState" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');
CREATE TYPE "ComponentRevisionState" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'RELEASED', 'SUPERSEDED', 'ARCHIVED');
CREATE TYPE "ComponentBomDefinitionState" AS ENUM ('DRAFT', 'VALIDATED', 'RELEASED', 'SUPERSEDED', 'ARCHIVED');

ALTER TABLE "components"
  ADD COLUMN "lifecycleState" "ComponentLifecycleState",
  ADD COLUMN "aggregateVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "currentRevisionId" TEXT;

CREATE TABLE "component_revisions" (
  "id" TEXT NOT NULL,
  "componentId" TEXT NOT NULL,
  "revisionNo" TEXT NOT NULL,
  "state" "ComponentRevisionState" NOT NULL DEFAULT 'DRAFT',
  "baseRevisionId" TEXT,
  "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL DEFAULT '{}',
  "contentHash" TEXT,
  "createdBy" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "releasedBy" TEXT,
  "releasedAt" TIMESTAMP(3),
  "supersededAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "archiveReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "component_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "component_bom_definitions" (
  "id" TEXT NOT NULL,
  "componentRevisionId" TEXT NOT NULL,
  "state" "ComponentBomDefinitionState" NOT NULL DEFAULT 'DRAFT',
  "lines" JSONB NOT NULL DEFAULT '[]',
  "routing" JSONB NOT NULL DEFAULT '[]',
  "contentHash" TEXT,
  "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
  "validatedBy" TEXT,
  "validatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "component_bom_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "component_release_evidence" (
  "id" TEXT NOT NULL,
  "componentId" TEXT NOT NULL,
  "revisionId" TEXT NOT NULL,
  "previousRevisionId" TEXT,
  "contentHash" TEXT NOT NULL,
  "releasedBy" TEXT,
  "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "component_release_evidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "components_currentRevisionId_key" ON "components"("currentRevisionId");
CREATE INDEX "components_lifecycleState_idx" ON "components"("lifecycleState");
CREATE UNIQUE INDEX "component_revisions_componentId_revisionNo_key" ON "component_revisions"("componentId", "revisionNo");
CREATE INDEX "component_revisions_componentId_state_idx" ON "component_revisions"("componentId", "state");
CREATE INDEX "component_revisions_baseRevisionId_idx" ON "component_revisions"("baseRevisionId");
CREATE UNIQUE INDEX "component_bom_definitions_componentRevisionId_key" ON "component_bom_definitions"("componentRevisionId");
CREATE INDEX "component_bom_definitions_state_idx" ON "component_bom_definitions"("state");
CREATE UNIQUE INDEX "component_release_evidence_revisionId_key" ON "component_release_evidence"("revisionId");
CREATE INDEX "component_release_evidence_componentId_releasedAt_idx" ON "component_release_evidence"("componentId", "releasedAt");
CREATE INDEX "component_release_evidence_previousRevisionId_idx" ON "component_release_evidence"("previousRevisionId");

ALTER TABLE "component_revisions" ADD CONSTRAINT "component_revisions_componentId_fkey"
  FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "component_revisions" ADD CONSTRAINT "component_revisions_baseRevisionId_fkey"
  FOREIGN KEY ("baseRevisionId") REFERENCES "component_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "component_bom_definitions" ADD CONSTRAINT "component_bom_definitions_componentRevisionId_fkey"
  FOREIGN KEY ("componentRevisionId") REFERENCES "component_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "component_release_evidence" ADD CONSTRAINT "component_release_evidence_componentId_fkey"
  FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "component_release_evidence" ADD CONSTRAINT "component_release_evidence_revisionId_fkey"
  FOREIGN KEY ("revisionId") REFERENCES "component_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "component_release_evidence" ADD CONSTRAINT "component_release_evidence_previousRevisionId_fkey"
  FOREIGN KEY ("previousRevisionId") REFERENCES "component_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "components" ADD CONSTRAINT "components_currentRevisionId_fkey"
  FOREIGN KEY ("currentRevisionId") REFERENCES "component_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
