-- CreateEnum
CREATE TYPE "DispatchOrderStatus" AS ENUM ('DRAFT', 'PLANNED', 'LOADING', 'IN_TRANSIT', 'ARRIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED');

CREATE TYPE "DispatchItemType" AS ENUM ('MATERIAL', 'COMPONENT');

CREATE TYPE "DispatchEventType" AS ENUM ('CREATED', 'LOADING', 'DEPARTED', 'ARRIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "dispatch_orders" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "projectTaskId" TEXT,
  "status" "DispatchOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "plannedAt" TIMESTAMP(3),
  "departedAt" TIMESTAMP(3),
  "arrivedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "vehicle" TEXT,
  "driver" TEXT,
  "notes" TEXT,
  "loadingChecklist" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dispatch_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_items" (
  "id" TEXT NOT NULL,
  "dispatchOrderId" TEXT NOT NULL,
  "type" "DispatchItemType" NOT NULL,
  "inventoryItemId" TEXT,
  "componentId" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispatch_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_events" (
  "id" TEXT NOT NULL,
  "dispatchOrderId" TEXT NOT NULL,
  "type" "DispatchEventType" NOT NULL,
  "message" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispatch_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_orders_code_key" ON "dispatch_orders"("code");
CREATE INDEX "dispatch_orders_projectId_idx" ON "dispatch_orders"("projectId");
CREATE INDEX "dispatch_orders_projectTaskId_idx" ON "dispatch_orders"("projectTaskId");
CREATE INDEX "dispatch_orders_status_idx" ON "dispatch_orders"("status");
CREATE INDEX "dispatch_orders_plannedAt_idx" ON "dispatch_orders"("plannedAt");
CREATE INDEX "dispatch_items_dispatchOrderId_idx" ON "dispatch_items"("dispatchOrderId");
CREATE INDEX "dispatch_items_inventoryItemId_idx" ON "dispatch_items"("inventoryItemId");
CREATE INDEX "dispatch_items_componentId_idx" ON "dispatch_items"("componentId");
CREATE INDEX "dispatch_events_dispatchOrderId_idx" ON "dispatch_events"("dispatchOrderId");
CREATE INDEX "dispatch_events_type_idx" ON "dispatch_events"("type");
CREATE INDEX "dispatch_events_createdAt_idx" ON "dispatch_events"("createdAt");

-- AddForeignKey
ALTER TABLE "dispatch_orders" ADD CONSTRAINT "dispatch_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_orders" ADD CONSTRAINT "dispatch_orders_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_dispatchOrderId_fkey" FOREIGN KEY ("dispatchOrderId") REFERENCES "dispatch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispatch_events" ADD CONSTRAINT "dispatch_events_dispatchOrderId_fkey" FOREIGN KEY ("dispatchOrderId") REFERENCES "dispatch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
