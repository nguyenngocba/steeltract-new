/*
  Warnings:

  - A unique constraint covering the columns `[employeeCode]` on the table `workers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "skill" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workers_employeeCode_key" ON "workers"("employeeCode");
