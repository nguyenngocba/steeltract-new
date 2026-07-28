-- Component DOMAIN.2 canonical schema foundation.
-- Additive only: no DROP, TRUNCATE, DELETE, or legacy data mutation.

CREATE TYPE "ProjectComponentRequirementStatus" AS ENUM (
  'DRAFT',
  'ENGINEERING_SELECTED',
  'RELEASED',
  'PRODUCTION_REQUESTED',
  'IN_PRODUCTION',
  'PARTIALLY_FULFILLED',
  'FULFILLED',
  'CANCELLED',
  'LEGACY_UNKNOWN'
);

CREATE TYPE "ComponentInstanceState" AS ENUM (
  'PLANNED',
  'PRODUCED_WAITING_QC',
  'QC_PASSED',
  'QC_FAILED',
  'REWORK',
  'SCRAPPED',
  'USE_AS_IS',
  'LEGACY_UNKNOWN'
);

ALTER TABLE "production_orders"
  ADD COLUMN "componentRequirementId" TEXT;

CREATE TABLE "project_component_requirements" (
  "id" TEXT NOT NULL,
  "requirementNo" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "projectTaskId" TEXT,
  "componentId" TEXT NOT NULL,
  "componentRevisionId" TEXT,
  "bomDefinitionId" TEXT,
  "requiredQuantity" DOUBLE PRECISION NOT NULL,
  "producedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "acceptedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "installedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "ProjectComponentRequirementStatus" NOT NULL DEFAULT 'DRAFT',
  "requiredBy" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "project_component_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "component_instances" (
  "id" TEXT NOT NULL,
  "instanceNo" TEXT NOT NULL,
  "componentId" TEXT NOT NULL,
  "componentRevisionId" TEXT NOT NULL,
  "bomDefinitionId" TEXT,
  "productionOrderId" TEXT,
  "requirementId" TEXT,
  "projectId" TEXT,
  "projectTaskId" TEXT,
  "state" "ComponentInstanceState" NOT NULL DEFAULT 'PLANNED',
  "serialSequence" INTEGER,
  "producedAt" TIMESTAMP(3),
  "qcPassedAt" TIMESTAMP(3),
  "scrappedAt" TIMESTAMP(3),
  "installedAt" TIMESTAMP(3),
  "legacyComponentId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "component_instances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "component_instance_timelines" (
  "id" TEXT NOT NULL,
  "componentInstanceId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "sourceModule" TEXT NOT NULL,
  "sourceId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,

  CONSTRAINT "component_instance_timelines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_component_requirements_requirementNo_key"
  ON "project_component_requirements"("requirementNo");
CREATE INDEX "project_component_requirements_projectId_idx"
  ON "project_component_requirements"("projectId");
CREATE INDEX "project_component_requirements_projectTaskId_idx"
  ON "project_component_requirements"("projectTaskId");
CREATE INDEX "project_component_requirements_componentId_idx"
  ON "project_component_requirements"("componentId");
CREATE INDEX "project_component_requirements_componentRevisionId_idx"
  ON "project_component_requirements"("componentRevisionId");
CREATE INDEX "project_component_requirements_bomDefinitionId_idx"
  ON "project_component_requirements"("bomDefinitionId");
CREATE INDEX "project_component_requirements_status_idx"
  ON "project_component_requirements"("status");
CREATE INDEX "project_component_requirements_projectId_componentId_idx"
  ON "project_component_requirements"("projectId", "componentId");

CREATE UNIQUE INDEX "component_instances_instanceNo_key"
  ON "component_instances"("instanceNo");
CREATE UNIQUE INDEX "component_instances_productionOrderId_serialSequence_key"
  ON "component_instances"("productionOrderId", "serialSequence");
CREATE INDEX "component_instances_componentId_idx"
  ON "component_instances"("componentId");
CREATE INDEX "component_instances_componentRevisionId_idx"
  ON "component_instances"("componentRevisionId");
CREATE INDEX "component_instances_bomDefinitionId_idx"
  ON "component_instances"("bomDefinitionId");
CREATE INDEX "component_instances_productionOrderId_idx"
  ON "component_instances"("productionOrderId");
CREATE INDEX "component_instances_requirementId_idx"
  ON "component_instances"("requirementId");
CREATE INDEX "component_instances_projectId_idx"
  ON "component_instances"("projectId");
CREATE INDEX "component_instances_projectTaskId_idx"
  ON "component_instances"("projectTaskId");
CREATE INDEX "component_instances_state_idx"
  ON "component_instances"("state");
CREATE INDEX "component_instances_createdAt_idx"
  ON "component_instances"("createdAt");

CREATE INDEX "component_instance_timelines_componentInstanceId_occurredAt_idx"
  ON "component_instance_timelines"("componentInstanceId", "occurredAt");
CREATE INDEX "component_instance_timelines_sourceModule_sourceId_idx"
  ON "component_instance_timelines"("sourceModule", "sourceId");

ALTER TABLE "project_component_requirements"
  ADD CONSTRAINT "pcr_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_component_requirements"
  ADD CONSTRAINT "pcr_projectTaskId_fkey"
  FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_component_requirements"
  ADD CONSTRAINT "pcr_componentId_fkey"
  FOREIGN KEY ("componentId") REFERENCES "components"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_component_requirements"
  ADD CONSTRAINT "pcr_componentRevisionId_fkey"
  FOREIGN KEY ("componentRevisionId") REFERENCES "component_revisions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_component_requirements"
  ADD CONSTRAINT "pcr_bomDefinitionId_fkey"
  FOREIGN KEY ("bomDefinitionId") REFERENCES "component_bom_definitions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "production_orders"
  ADD CONSTRAINT "production_orders_componentRequirementId_fkey"
  FOREIGN KEY ("componentRequirementId") REFERENCES "project_component_requirements"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "component_instances"
  ADD CONSTRAINT "ci_componentId_fkey"
  FOREIGN KEY ("componentId") REFERENCES "components"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "component_instances"
  ADD CONSTRAINT "ci_componentRevisionId_fkey"
  FOREIGN KEY ("componentRevisionId") REFERENCES "component_revisions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "component_instances"
  ADD CONSTRAINT "ci_bomDefinitionId_fkey"
  FOREIGN KEY ("bomDefinitionId") REFERENCES "component_bom_definitions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "component_instances"
  ADD CONSTRAINT "ci_productionOrderId_fkey"
  FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "component_instances"
  ADD CONSTRAINT "ci_requirementId_fkey"
  FOREIGN KEY ("requirementId") REFERENCES "project_component_requirements"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "component_instances"
  ADD CONSTRAINT "ci_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "component_instances"
  ADD CONSTRAINT "ci_projectTaskId_fkey"
  FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "component_instances"
  ADD CONSTRAINT "ci_legacyComponentId_fkey"
  FOREIGN KEY ("legacyComponentId") REFERENCES "components"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "component_instance_timelines"
  ADD CONSTRAINT "cit_componentInstanceId_fkey"
  FOREIGN KEY ("componentInstanceId") REFERENCES "component_instances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
