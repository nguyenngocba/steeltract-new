-- Component DOMAIN.5D additive physical execution evidence foundation.
-- Adds per-ComponentInstance execution participation without legacy backfill.

CREATE TYPE "ComponentInstanceExecutionStatus" AS ENUM (
  'ASSIGNED',
  'RUNNING',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "component_instance_executions" (
  "id" TEXT NOT NULL,
  "componentInstanceId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "productionExecutionId" TEXT NOT NULL,
  "status" "ComponentInstanceExecutionStatus" NOT NULL DEFAULT 'ASSIGNED',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "component_instance_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "component_instance_executions_componentInstanceId_productionExecutionId_key"
  ON "component_instance_executions"("componentInstanceId", "productionExecutionId");

CREATE INDEX "component_instance_executions_componentInstanceId_status_idx"
  ON "component_instance_executions"("componentInstanceId", "status");

CREATE INDEX "component_instance_executions_workOrderId_status_idx"
  ON "component_instance_executions"("workOrderId", "status");

CREATE INDEX "component_instance_executions_productionExecutionId_status_idx"
  ON "component_instance_executions"("productionExecutionId", "status");

CREATE INDEX "component_instance_executions_status_idx"
  ON "component_instance_executions"("status");

ALTER TABLE "component_instance_executions"
  ADD CONSTRAINT "component_instance_executions_componentInstanceId_fkey"
  FOREIGN KEY ("componentInstanceId") REFERENCES "component_instances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "component_instance_executions"
  ADD CONSTRAINT "component_instance_executions_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "component_instance_executions"
  ADD CONSTRAINT "component_instance_executions_productionExecutionId_fkey"
  FOREIGN KEY ("productionExecutionId") REFERENCES "production_executions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
