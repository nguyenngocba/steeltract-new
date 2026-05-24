-- CreateEnum
CREATE TYPE "QcInspectionStatus" AS ENUM ('DRAFT', 'READY', 'IN_PROGRESS', 'PASSED', 'FAILED', 'REWORK_REQUIRED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QcChecklistType" AS ENUM ('DIMENSIONAL', 'WELDING', 'PAINTING', 'COATING', 'MATERIAL', 'FINAL');

-- CreateEnum
CREATE TYPE "QcResultStatus" AS ENUM ('PENDING', 'PASS', 'FAIL', 'NA');

-- CreateEnum
CREATE TYPE "QcIssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "QcIssueStatus" AS ENUM ('OPEN', 'CORRECTIVE_ACTION_ASSIGNED', 'RESOLVED', 'VERIFIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NcrStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'REWORK_REQUIRED', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "qc_checklists" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "QcChecklistType" NOT NULL DEFAULT 'FINAL',
    "revision" TEXT NOT NULL DEFAULT 'A',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_checklist_items" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "expectedValue" TEXT,
    "tolerance" TEXT,
    "unit" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspections" (
    "id" TEXT NOT NULL,
    "inspectionNo" TEXT NOT NULL,
    "checklistId" TEXT,
    "productionOrderId" TEXT,
    "productionStageId" TEXT,
    "componentId" TEXT,
    "projectId" TEXT,
    "status" "QcInspectionStatus" NOT NULL DEFAULT 'DRAFT',
    "inspectorId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "workflowInstanceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_results" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "checklistItemId" TEXT,
    "category" "QcChecklistType" NOT NULL DEFAULT 'FINAL',
    "status" "QcResultStatus" NOT NULL DEFAULT 'PENDING',
    "measuredValue" TEXT,
    "expectedValue" TEXT,
    "tolerance" TEXT,
    "unit" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_issues" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "resultId" TEXT,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "QcIssueSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "QcIssueStatus" NOT NULL DEFAULT 'OPEN',
    "correctiveAction" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_attachments" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT,
    "issueId" TEXT,
    "ncrId" TEXT,
    "attachmentId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_conformance_reports" (
    "id" TEXT NOT NULL,
    "ncrNo" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "issueId" TEXT,
    "productionOrderId" TEXT,
    "componentId" TEXT,
    "status" "NcrStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "QcIssueSeverity" NOT NULL DEFAULT 'HIGH',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "disposition" TEXT,
    "raisedById" TEXT,
    "approvedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_conformance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qc_checklists_code_key" ON "qc_checklists"("code");

-- CreateIndex
CREATE INDEX "qc_checklists_type_idx" ON "qc_checklists"("type");

-- CreateIndex
CREATE INDEX "qc_checklists_isActive_idx" ON "qc_checklists"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "qc_checklist_items_checklistId_sequence_key" ON "qc_checklist_items"("checklistId", "sequence");

-- CreateIndex
CREATE INDEX "qc_checklist_items_checklistId_idx" ON "qc_checklist_items"("checklistId");

-- CreateIndex
CREATE UNIQUE INDEX "qc_inspections_inspectionNo_key" ON "qc_inspections"("inspectionNo");

-- CreateIndex
CREATE INDEX "qc_inspections_status_idx" ON "qc_inspections"("status");

-- CreateIndex
CREATE INDEX "qc_inspections_productionOrderId_idx" ON "qc_inspections"("productionOrderId");

-- CreateIndex
CREATE INDEX "qc_inspections_productionStageId_idx" ON "qc_inspections"("productionStageId");

-- CreateIndex
CREATE INDEX "qc_inspections_componentId_idx" ON "qc_inspections"("componentId");

-- CreateIndex
CREATE INDEX "qc_inspections_projectId_idx" ON "qc_inspections"("projectId");

-- CreateIndex
CREATE INDEX "qc_inspections_checklistId_idx" ON "qc_inspections"("checklistId");

-- CreateIndex
CREATE INDEX "qc_results_inspectionId_idx" ON "qc_results"("inspectionId");

-- CreateIndex
CREATE INDEX "qc_results_checklistItemId_idx" ON "qc_results"("checklistItemId");

-- CreateIndex
CREATE INDEX "qc_results_category_idx" ON "qc_results"("category");

-- CreateIndex
CREATE INDEX "qc_results_status_idx" ON "qc_results"("status");

-- CreateIndex
CREATE INDEX "qc_issues_inspectionId_idx" ON "qc_issues"("inspectionId");

-- CreateIndex
CREATE INDEX "qc_issues_resultId_idx" ON "qc_issues"("resultId");

-- CreateIndex
CREATE INDEX "qc_issues_severity_idx" ON "qc_issues"("severity");

-- CreateIndex
CREATE INDEX "qc_issues_status_idx" ON "qc_issues"("status");

-- CreateIndex
CREATE INDEX "qc_attachments_inspectionId_idx" ON "qc_attachments"("inspectionId");

-- CreateIndex
CREATE INDEX "qc_attachments_issueId_idx" ON "qc_attachments"("issueId");

-- CreateIndex
CREATE INDEX "qc_attachments_ncrId_idx" ON "qc_attachments"("ncrId");

-- CreateIndex
CREATE INDEX "qc_attachments_attachmentId_idx" ON "qc_attachments"("attachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "non_conformance_reports_ncrNo_key" ON "non_conformance_reports"("ncrNo");

-- CreateIndex
CREATE INDEX "non_conformance_reports_inspectionId_idx" ON "non_conformance_reports"("inspectionId");

-- CreateIndex
CREATE INDEX "non_conformance_reports_issueId_idx" ON "non_conformance_reports"("issueId");

-- CreateIndex
CREATE INDEX "non_conformance_reports_productionOrderId_idx" ON "non_conformance_reports"("productionOrderId");

-- CreateIndex
CREATE INDEX "non_conformance_reports_componentId_idx" ON "non_conformance_reports"("componentId");

-- CreateIndex
CREATE INDEX "non_conformance_reports_status_idx" ON "non_conformance_reports"("status");

-- CreateIndex
CREATE INDEX "non_conformance_reports_severity_idx" ON "non_conformance_reports"("severity");

-- AddForeignKey
ALTER TABLE "qc_checklist_items" ADD CONSTRAINT "qc_checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "qc_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "qc_checklists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "qc_checklist_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_issues" ADD CONSTRAINT "qc_issues_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_issues" ADD CONSTRAINT "qc_issues_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "qc_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_attachments" ADD CONSTRAINT "qc_attachments_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_attachments" ADD CONSTRAINT "qc_attachments_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "qc_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_attachments" ADD CONSTRAINT "qc_attachments_ncrId_fkey" FOREIGN KEY ("ncrId") REFERENCES "non_conformance_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_attachments" ADD CONSTRAINT "qc_attachments_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformance_reports" ADD CONSTRAINT "non_conformance_reports_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformance_reports" ADD CONSTRAINT "non_conformance_reports_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "qc_issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
