/*
  Warnings:

  - The `status` column on the `approvals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `components` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `material_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `purchase_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `safety_inspections` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `vehicles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `workers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `approvals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `equipment_bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `material_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `safety_inspections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `site_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `supplier_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `warehouse_zones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `workers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('STOCK', 'CUTTING', 'WELDING', 'PAINTING', 'READY', 'SHIPPED', 'INSTALLED');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('OPEN', 'CLOSED', 'FAILED');

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "module" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "approvals" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "components" DROP COLUMN "status",
ADD COLUMN     "status" "ComponentStatus" NOT NULL DEFAULT 'STOCK';

-- AlterTable
ALTER TABLE "equipment_bookings" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "performedBy" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "referenceModule" TEXT;

-- AlterTable
ALTER TABLE "material_requests" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "link" TEXT,
ADD COLUMN     "severity" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "safety_inspections" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "InspectionStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "site_logs" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "supplier_scores" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "warehouse_zones" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "WorkerStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "approvals_status_idx" ON "approvals"("status");

-- CreateIndex
CREATE INDEX "components_status_idx" ON "components"("status");

-- CreateIndex
CREATE INDEX "components_projectId_idx" ON "components"("projectId");

-- CreateIndex
CREATE INDEX "inventory_items_code_idx" ON "inventory_items"("code");

-- CreateIndex
CREATE INDEX "inventory_items_name_idx" ON "inventory_items"("name");

-- CreateIndex
CREATE INDEX "inventory_transactions_type_idx" ON "inventory_transactions"("type");

-- CreateIndex
CREATE INDEX "material_requests_status_idx" ON "material_requests"("status");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "safety_inspections_status_idx" ON "safety_inspections"("status");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "workers_status_idx" ON "workers"("status");
