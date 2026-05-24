-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'DELAYED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionStageCode" AS ENUM ('CUTTING', 'ASSEMBLY', 'WELDING', 'DRILLING', 'PAINTING', 'GALVANIZING', 'PACKING');

-- CreateEnum
CREATE TYPE "ProductionStageStatus" AS ENUM ('PENDING', 'READY', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ProductionTaskStatus" AS ENUM ('TODO', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('AVAILABLE', 'RUNNING', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "WorkCenterStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProductionLogType" AS ENUM ('NOTE', 'START', 'COMPLETE', 'DELAY', 'QUALITY', 'MACHINE', 'MATERIAL');

-- CreateTable
CREATE TABLE "work_centers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkCenterStatus" NOT NULL DEFAULT 'ACTIVE',
    "capacityPerDay" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "MachineStatus" NOT NULL DEFAULT 'AVAILABLE',
    "workCenterId" TEXT,
    "utilization" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT,
    "componentId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStageCode" "ProductionStageCode",
    "plannedStartAt" TIMESTAMP(3),
    "plannedEndAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "delayedAt" TIMESTAMP(3),
    "delayReason" TEXT,
    "workflowInstanceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_stages" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "code" "ProductionStageCode" NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "ProductionStageStatus" NOT NULL DEFAULT 'PENDING',
    "workCenterId" TEXT,
    "machineId" TEXT,
    "assignedWorkerId" TEXT,
    "plannedStartAt" TIMESTAMP(3),
    "plannedEndAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "qualityStatus" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_tasks" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "stageId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductionTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "workCenterId" TEXT,
    "machineId" TEXT,
    "assignedWorkerId" TEXT,
    "plannedStartAt" TIMESTAMP(3),
    "plannedEndAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_schedules" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "workCenterId" TEXT,
    "machineId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "capacityPlanned" DOUBLE PRECISION,
    "capacityUsed" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "stageId" TEXT,
    "type" "ProductionLogType" NOT NULL DEFAULT 'NOTE',
    "message" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "workerId" TEXT,
    "machineId" TEXT,
    "attachmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_centers_code_key" ON "work_centers"("code");

-- CreateIndex
CREATE INDEX "work_centers_status_idx" ON "work_centers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "machines_code_key" ON "machines"("code");

-- CreateIndex
CREATE INDEX "machines_status_idx" ON "machines"("status");

-- CreateIndex
CREATE INDEX "machines_workCenterId_idx" ON "machines"("workCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_orderNo_key" ON "production_orders"("orderNo");

-- CreateIndex
CREATE INDEX "production_orders_status_idx" ON "production_orders"("status");

-- CreateIndex
CREATE INDEX "production_orders_projectId_idx" ON "production_orders"("projectId");

-- CreateIndex
CREATE INDEX "production_orders_componentId_idx" ON "production_orders"("componentId");

-- CreateIndex
CREATE INDEX "production_orders_currentStageCode_idx" ON "production_orders"("currentStageCode");

-- CreateIndex
CREATE INDEX "production_stages_status_idx" ON "production_stages"("status");

-- CreateIndex
CREATE INDEX "production_stages_workCenterId_idx" ON "production_stages"("workCenterId");

-- CreateIndex
CREATE INDEX "production_stages_machineId_idx" ON "production_stages"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "production_stages_productionOrderId_code_key" ON "production_stages"("productionOrderId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "production_stages_productionOrderId_sequence_key" ON "production_stages"("productionOrderId", "sequence");

-- CreateIndex
CREATE INDEX "production_tasks_status_idx" ON "production_tasks"("status");

-- CreateIndex
CREATE INDEX "production_tasks_productionOrderId_idx" ON "production_tasks"("productionOrderId");

-- CreateIndex
CREATE INDEX "production_tasks_stageId_idx" ON "production_tasks"("stageId");

-- CreateIndex
CREATE INDEX "production_tasks_assignedWorkerId_idx" ON "production_tasks"("assignedWorkerId");

-- CreateIndex
CREATE INDEX "production_schedules_startAt_endAt_idx" ON "production_schedules"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "production_schedules_workCenterId_idx" ON "production_schedules"("workCenterId");

-- CreateIndex
CREATE INDEX "production_schedules_machineId_idx" ON "production_schedules"("machineId");

-- CreateIndex
CREATE INDEX "production_logs_productionOrderId_idx" ON "production_logs"("productionOrderId");

-- CreateIndex
CREATE INDEX "production_logs_stageId_idx" ON "production_logs"("stageId");

-- CreateIndex
CREATE INDEX "production_logs_type_idx" ON "production_logs"("type");

-- CreateIndex
CREATE INDEX "production_logs_createdAt_idx" ON "production_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_stages" ADD CONSTRAINT "production_stages_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_stages" ADD CONSTRAINT "production_stages_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_stages" ADD CONSTRAINT "production_stages_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "production_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_schedules" ADD CONSTRAINT "production_schedules_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "production_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
