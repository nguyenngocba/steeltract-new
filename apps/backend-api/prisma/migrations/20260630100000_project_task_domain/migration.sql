-- Project execution domain persistence.
-- Migrates the former Task.description JSON WBS bridge into first-class
-- project task tables while preserving existing task ids for hierarchy and
-- dependency references.

CREATE TYPE "ProjectTaskStatus" AS ENUM ('DRAFT', 'PLANNED', 'READY', 'IN_PROGRESS', 'BLOCKED', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProjectTaskDependencyType" AS ENUM ('FS', 'SS', 'FF');
CREATE TYPE "ProjectTaskResourceType" AS ENUM ('WORKER', 'MACHINE', 'OTHER');
CREATE TYPE "ProjectTaskInspectionStatus" AS ENUM ('PENDING_INSPECTION', 'INSPECTION_FAILED', 'INSPECTION_PASSED', 'ACCEPTED', 'HANDED_OVER');
CREATE TYPE "ProjectTaskComponentStatus" AS ENUM ('NOT_STARTED', 'IN_PRODUCTION', 'IN_TRANSIT', 'INSTALLING', 'HANDED_OVER', 'RETURNED');

CREATE TABLE "project_tasks" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "parentTaskId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProjectTaskStatus" NOT NULL DEFAULT 'PLANNED',
  "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "plannedStartAt" TIMESTAMP(3),
  "plannedFinishAt" TIMESTAMP(3),
  "actualStartAt" TIMESTAMP(3),
  "actualFinishAt" TIMESTAMP(3),
  "scheduledStartAt" TIMESTAMP(3),
  "scheduledFinishAt" TIMESTAMP(3),
  "forecastFinishAt" TIMESTAMP(3),
  "baselineStartAt" TIMESTAMP(3),
  "baselineFinishAt" TIMESTAMP(3),
  "cascadeDelayDays" INTEGER NOT NULL DEFAULT 0,
  "baselineVarianceDays" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_task_dependencies" (
  "id" TEXT NOT NULL,
  "projectTaskId" TEXT NOT NULL,
  "dependsOnTaskId" TEXT NOT NULL,
  "type" "ProjectTaskDependencyType" NOT NULL DEFAULT 'FS',
  "lagDays" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "project_task_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_task_material_allocations" (
  "id" TEXT NOT NULL,
  "projectTaskId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "plannedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "issuedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "usedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "returnedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remainingQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "project_task_material_allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_task_component_allocations" (
  "id" TEXT NOT NULL,
  "projectTaskId" TEXT NOT NULL,
  "componentId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3),
  "installedAt" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  "status" "ProjectTaskComponentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "project_task_component_allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_task_resources" (
  "id" TEXT NOT NULL,
  "projectTaskId" TEXT NOT NULL,
  "type" "ProjectTaskResourceType" NOT NULL,
  "name" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "allocatedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "project_task_resources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_task_inspections" (
  "id" TEXT NOT NULL,
  "projectTaskId" TEXT NOT NULL,
  "status" "ProjectTaskInspectionStatus" NOT NULL DEFAULT 'PENDING_INSPECTION',
  "inspectionDate" TIMESTAMP(3),
  "acceptedDate" TIMESTAMP(3),
  "handoverDate" TIMESTAMP(3),
  "remarks" TEXT,
  CONSTRAINT "project_task_inspections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_task_costs" (
  "id" TEXT NOT NULL,
  "projectTaskId" TEXT NOT NULL,
  "materialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "machineCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "otherCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "budgetCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "actualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "forecastCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "project_task_costs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_tasks_projectId_idx" ON "project_tasks"("projectId");
CREATE INDEX "project_tasks_parentTaskId_idx" ON "project_tasks"("parentTaskId");
CREATE INDEX "project_tasks_projectId_sortOrder_idx" ON "project_tasks"("projectId", "sortOrder");
CREATE UNIQUE INDEX "project_task_dependencies_projectTaskId_dependsOnTaskId_type_key" ON "project_task_dependencies"("projectTaskId", "dependsOnTaskId", "type");
CREATE INDEX "project_task_dependencies_projectTaskId_idx" ON "project_task_dependencies"("projectTaskId");
CREATE INDEX "project_task_dependencies_dependsOnTaskId_idx" ON "project_task_dependencies"("dependsOnTaskId");
CREATE INDEX "project_task_material_allocations_projectTaskId_idx" ON "project_task_material_allocations"("projectTaskId");
CREATE INDEX "project_task_material_allocations_inventoryItemId_idx" ON "project_task_material_allocations"("inventoryItemId");
CREATE INDEX "project_task_component_allocations_projectTaskId_idx" ON "project_task_component_allocations"("projectTaskId");
CREATE INDEX "project_task_component_allocations_componentId_idx" ON "project_task_component_allocations"("componentId");
CREATE INDEX "project_task_resources_projectTaskId_idx" ON "project_task_resources"("projectTaskId");
CREATE INDEX "project_task_resources_type_idx" ON "project_task_resources"("type");
CREATE UNIQUE INDEX "project_task_inspections_projectTaskId_key" ON "project_task_inspections"("projectTaskId");
CREATE INDEX "project_task_inspections_status_idx" ON "project_task_inspections"("status");
CREATE UNIQUE INDEX "project_task_costs_projectTaskId_key" ON "project_task_costs"("projectTaskId");

ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_task_dependencies" ADD CONSTRAINT "project_task_dependencies_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_task_dependencies" ADD CONSTRAINT "project_task_dependencies_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_task_material_allocations" ADD CONSTRAINT "project_task_material_allocations_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_task_material_allocations" ADD CONSTRAINT "project_task_material_allocations_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_task_component_allocations" ADD CONSTRAINT "project_task_component_allocations_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_task_component_allocations" ADD CONSTRAINT "project_task_component_allocations_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_task_resources" ADD CONSTRAINT "project_task_resources_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_task_inspections" ADD CONSTRAINT "project_task_inspections_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_task_costs" ADD CONSTRAINT "project_task_costs_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH legacy AS (
  SELECT
    t.*,
    t."description"::jsonb AS meta
  FROM "tasks" t
  WHERE t."description" LIKE '%"steeltrackProjectWbs":true%'
),
valid_legacy AS (
  SELECT legacy.*
  FROM legacy
  JOIN "projects" p ON p."id" = legacy.meta->>'projectId'
)
INSERT INTO "project_tasks" (
  "id",
  "projectId",
  "parentTaskId",
  "name",
  "description",
  "status",
  "progress",
  "plannedStartAt",
  "plannedFinishAt",
  "actualStartAt",
  "actualFinishAt",
  "scheduledStartAt",
  "scheduledFinishAt",
  "forecastFinishAt",
  "baselineStartAt",
  "baselineFinishAt",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  valid_legacy."id",
  valid_legacy.meta->>'projectId',
  NULLIF(valid_legacy.meta->>'parentId', ''),
  valid_legacy."title",
  valid_legacy.meta->>'description',
  CASE
    WHEN valid_legacy.meta->>'status' IN ('DRAFT', 'PLANNED', 'READY', 'IN_PROGRESS', 'BLOCKED', 'PAUSED', 'COMPLETED', 'CANCELLED')
      THEN (valid_legacy.meta->>'status')::"ProjectTaskStatus"
    ELSE 'PLANNED'::"ProjectTaskStatus"
  END,
  COALESCE(NULLIF(valid_legacy.meta->>'progress', '')::DOUBLE PRECISION, 0),
  NULLIF(valid_legacy.meta->>'plannedStartAt', '')::TIMESTAMP,
  NULLIF(valid_legacy.meta->>'plannedFinishAt', '')::TIMESTAMP,
  NULLIF(valid_legacy.meta->>'actualStartAt', '')::TIMESTAMP,
  NULLIF(valid_legacy.meta->>'actualFinishAt', '')::TIMESTAMP,
  NULLIF(valid_legacy.meta->>'plannedStartAt', '')::TIMESTAMP,
  NULLIF(valid_legacy.meta->>'plannedFinishAt', '')::TIMESTAMP,
  COALESCE(NULLIF(valid_legacy.meta->>'actualFinishAt', '')::TIMESTAMP, NULLIF(valid_legacy.meta->>'plannedFinishAt', '')::TIMESTAMP),
  NULLIF(valid_legacy.meta->>'baselineStartAt', '')::TIMESTAMP,
  NULLIF(valid_legacy.meta->>'baselineFinishAt', '')::TIMESTAMP,
  COALESCE(NULLIF(valid_legacy.meta->>'sortOrder', '')::INTEGER, 0),
  valid_legacy."createdAt",
  valid_legacy."updatedAt"
FROM valid_legacy
ON CONFLICT ("id") DO NOTHING;

WITH legacy AS (
  SELECT t."id" AS "projectTaskId", t."description"::jsonb AS meta
  FROM "tasks" t
  WHERE t."description" LIKE '%"steeltrackProjectWbs":true%'
), dependencies AS (
  SELECT
    legacy."projectTaskId",
    dependency->>'taskId' AS "dependsOnTaskId",
    CASE
      WHEN dependency->>'type' IN ('FS', 'SS', 'FF')
        THEN (dependency->>'type')::"ProjectTaskDependencyType"
      ELSE 'FS'::"ProjectTaskDependencyType"
    END AS "type"
  FROM legacy
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(legacy.meta->'predecessors', '[]'::jsonb)) AS dependency
)
INSERT INTO "project_task_dependencies" ("id", "projectTaskId", "dependsOnTaskId", "type", "lagDays")
SELECT
  'ptd_' || md5(dependencies."projectTaskId" || ':' || dependencies."dependsOnTaskId" || ':' || dependencies."type"::TEXT),
  dependencies."projectTaskId",
  dependencies."dependsOnTaskId",
  dependencies."type",
  0
FROM dependencies
JOIN "project_tasks" task ON task."id" = dependencies."projectTaskId"
JOIN "project_tasks" predecessor ON predecessor."id" = dependencies."dependsOnTaskId"
ON CONFLICT ("projectTaskId", "dependsOnTaskId", "type") DO NOTHING;

WITH legacy AS (
  SELECT t."id" AS "projectTaskId", t."description"::jsonb AS meta
  FROM "tasks" t
  WHERE t."description" LIKE '%"steeltrackProjectWbs":true%'
), materials AS (
  SELECT
    legacy."projectTaskId",
    material,
    COALESCE(NULLIF(material->>'planned', '')::DOUBLE PRECISION, 0) AS "plannedQty",
    COALESCE(NULLIF(material->>'issued', '')::DOUBLE PRECISION, 0) AS "issuedQty",
    COALESCE(NULLIF(material->>'used', '')::DOUBLE PRECISION, 0) AS "usedQty",
    COALESCE(NULLIF(material->>'returned', '')::DOUBLE PRECISION, 0) AS "returnedQty",
    COALESCE(NULLIF(material->>'remaining', '')::DOUBLE PRECISION, 0) AS "remainingQty",
    COALESCE(NULLIF(material->>'cost', '')::DOUBLE PRECISION, 0) AS "totalCost"
  FROM legacy
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(legacy.meta->'materials', '[]'::jsonb)) AS material
)
INSERT INTO "project_task_material_allocations" (
  "id",
  "projectTaskId",
  "inventoryItemId",
  "plannedQty",
  "issuedQty",
  "usedQty",
  "returnedQty",
  "remainingQty",
  "unitCost",
  "totalCost"
)
SELECT
  'ptm_' || md5(materials."projectTaskId" || ':' || item."id"),
  materials."projectTaskId",
  item."id",
  materials."plannedQty",
  materials."issuedQty",
  materials."usedQty",
  materials."returnedQty",
  materials."remainingQty",
  CASE WHEN materials."plannedQty" > 0 THEN materials."totalCost" / materials."plannedQty" ELSE 0 END,
  materials."totalCost"
FROM materials
JOIN "project_tasks" task ON task."id" = materials."projectTaskId"
JOIN "inventory_items" item ON item."id" = materials.material->>'id' OR item."code" = materials.material->>'code'
ON CONFLICT DO NOTHING;

WITH legacy AS (
  SELECT t."id" AS "projectTaskId", t."description"::jsonb AS meta
  FROM "tasks" t
  WHERE t."description" LIKE '%"steeltrackProjectWbs":true%'
), legacy_components AS (
  SELECT
    legacy."projectTaskId",
    component,
    COALESCE(NULLIF(component->>'cost', '')::DOUBLE PRECISION, 0) AS "cost"
  FROM legacy
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(legacy.meta->'components', '[]'::jsonb)) AS component
)
INSERT INTO "project_task_component_allocations" ("id", "projectTaskId", "componentId", "status", "cost")
SELECT
  'ptc_' || md5(legacy_components."projectTaskId" || ':' || comp."id"),
  legacy_components."projectTaskId",
  comp."id",
  'NOT_STARTED',
  legacy_components."cost"
FROM legacy_components
JOIN "project_tasks" task ON task."id" = legacy_components."projectTaskId"
JOIN "components" comp ON comp."id" = legacy_components.component->>'id' OR comp."code" = legacy_components.component->>'code'
ON CONFLICT DO NOTHING;

WITH legacy AS (
  SELECT t."id" AS "projectTaskId", t."description"::jsonb AS meta
  FROM "tasks" t
  WHERE t."description" LIKE '%"steeltrackProjectWbs":true%'
), workers AS (
  SELECT
    legacy."projectTaskId",
    worker->>'role' AS "name",
    COALESCE(NULLIF(worker->>'required', '')::DOUBLE PRECISION, 0) AS "quantity",
    COALESCE(NULLIF(worker->>'allocated', '')::DOUBLE PRECISION, 0) AS "allocatedQuantity",
    'WORKER'::"ProjectTaskResourceType" AS "type"
  FROM legacy
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(legacy.meta->'workers', '[]'::jsonb)) AS worker
), machines AS (
  SELECT
    legacy."projectTaskId",
    machine->>'type' AS "name",
    COALESCE(NULLIF(machine->>'required', '')::DOUBLE PRECISION, 0) AS "quantity",
    COALESCE(NULLIF(machine->>'allocated', '')::DOUBLE PRECISION, 0) AS "allocatedQuantity",
    'MACHINE'::"ProjectTaskResourceType" AS "type"
  FROM legacy
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(legacy.meta->'machines', '[]'::jsonb)) AS machine
), resources AS (
  SELECT * FROM workers
  UNION ALL
  SELECT * FROM machines
)
INSERT INTO "project_task_resources" ("id", "projectTaskId", "type", "name", "quantity", "allocatedQuantity", "cost")
SELECT
  'ptr_' || md5(resources."projectTaskId" || ':' || resources."type"::TEXT || ':' || COALESCE(resources."name", '')),
  resources."projectTaskId",
  resources."type",
  resources."name",
  resources."quantity",
  resources."allocatedQuantity",
  0
FROM resources
JOIN "project_tasks" task ON task."id" = resources."projectTaskId"
ON CONFLICT DO NOTHING;

WITH legacy AS (
  SELECT t."id" AS "projectTaskId", t."description"::jsonb AS meta
  FROM "tasks" t
  WHERE t."description" LIKE '%"steeltrackProjectWbs":true%'
), inspections AS (
  SELECT
    legacy."projectTaskId",
    CASE
      WHEN legacy.meta->>'inspectionStatus' IN ('PENDING_INSPECTION', 'INSPECTION_FAILED', 'INSPECTION_PASSED', 'ACCEPTED', 'HANDED_OVER')
        THEN (legacy.meta->>'inspectionStatus')::"ProjectTaskInspectionStatus"
      ELSE 'PENDING_INSPECTION'::"ProjectTaskInspectionStatus"
    END AS "status"
  FROM legacy
  WHERE legacy.meta ? 'inspectionStatus'
)
INSERT INTO "project_task_inspections" ("id", "projectTaskId", "status")
SELECT
  'pti_' || md5(inspections."projectTaskId"),
  inspections."projectTaskId",
  inspections."status"
FROM inspections
JOIN "project_tasks" task ON task."id" = inspections."projectTaskId"
ON CONFLICT ("projectTaskId") DO NOTHING;

WITH legacy AS (
  SELECT t."id" AS "projectTaskId", t."description"::jsonb AS meta
  FROM "tasks" t
  WHERE t."description" LIKE '%"steeltrackProjectWbs":true%'
), cost_rows AS (
  SELECT
    legacy."projectTaskId",
    COALESCE((
      SELECT SUM(COALESCE(NULLIF(material->>'cost', '')::DOUBLE PRECISION, 0))
      FROM jsonb_array_elements(COALESCE(legacy.meta->'materials', '[]'::jsonb)) material
    ), 0) AS "materialCost",
    COALESCE(NULLIF(legacy.meta->>'laborCost', '')::DOUBLE PRECISION, 0) AS "laborCost",
    COALESCE(NULLIF(legacy.meta->>'machineCost', '')::DOUBLE PRECISION, 0) AS "machineCost",
    COALESCE(NULLIF(legacy.meta->>'otherCost', '')::DOUBLE PRECISION, 0) AS "otherCost",
    COALESCE(NULLIF(legacy.meta->>'revenue', '')::DOUBLE PRECISION, 0) AS "budgetCost"
  FROM legacy
)
INSERT INTO "project_task_costs" (
  "id",
  "projectTaskId",
  "materialCost",
  "laborCost",
  "machineCost",
  "otherCost",
  "budgetCost",
  "actualCost",
  "forecastCost"
)
SELECT
  'ptcost_' || md5(cost_rows."projectTaskId"),
  cost_rows."projectTaskId",
  cost_rows."materialCost",
  cost_rows."laborCost",
  cost_rows."machineCost",
  cost_rows."otherCost",
  cost_rows."budgetCost",
  cost_rows."materialCost" + cost_rows."laborCost" + cost_rows."machineCost" + cost_rows."otherCost",
  cost_rows."materialCost" + cost_rows."laborCost" + cost_rows."machineCost" + cost_rows."otherCost"
FROM cost_rows
JOIN "project_tasks" task ON task."id" = cost_rows."projectTaskId"
ON CONFLICT ("projectTaskId") DO NOTHING;
