-- CreateEnum
CREATE TYPE "AnalyticsDomain" AS ENUM ('PRODUCTION', 'QC', 'INVENTORY', 'YARD', 'WORKFLOW', 'MACHINE', 'WORKER', 'ERP');

-- CreateEnum
CREATE TYPE "AnalyticsMetricType" AS ENUM ('KPI', 'COUNT', 'RATE', 'DURATION', 'UTILIZATION', 'COST', 'TREND');

-- CreateEnum
CREATE TYPE "AnalyticsAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AnalyticsAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AnalyticsPredictionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'EXPIRED');

-- AlterTable
ALTER TABLE "analytics_snapshots"
ADD COLUMN "domain" "AnalyticsDomain" NOT NULL DEFAULT 'ERP',
ADD COLUMN "snapshotType" TEXT NOT NULL DEFAULT 'operational',
ADD COLUMN "periodStart" TIMESTAMP(3),
ADD COLUMN "periodEnd" TIMESTAMP(3),
ADD COLUMN "metrics" JSONB,
ADD COLUMN "trends" JSONB,
ADD COLUMN "bottlenecks" JSONB,
ADD COLUMN "slaViolations" JSONB,
ADD COLUMN "anomalies" JSONB,
ADD COLUMN "generatedByJobId" TEXT;

-- CreateTable
CREATE TABLE "analytics_metrics" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "domain" "AnalyticsDomain" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "AnalyticsMetricType" NOT NULL DEFAULT 'KPI',
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "target" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "trend" DOUBLE PRECISION,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_aggregations" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "domain" "AnalyticsDomain" NOT NULL,
    "key" TEXT NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'realtime',
    "value" JSONB NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_aggregations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_alerts" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "domain" "AnalyticsDomain" NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AnalyticsAlertSeverity" NOT NULL DEFAULT 'WARNING',
    "status" "AnalyticsAlertStatus" NOT NULL DEFAULT 'OPEN',
    "threshold" DOUBLE PRECISION,
    "actualValue" DOUBLE PRECISION,
    "metadata" JSONB,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_predictions" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "domain" "AnalyticsDomain" NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prediction" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "horizon" TEXT,
    "status" "AnalyticsPredictionStatus" NOT NULL DEFAULT 'DRAFT',
    "modelName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "analytics_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_snapshots_domain_idx" ON "analytics_snapshots"("domain");

-- CreateIndex
CREATE INDEX "analytics_snapshots_snapshotType_idx" ON "analytics_snapshots"("snapshotType");

-- CreateIndex
CREATE INDEX "analytics_snapshots_periodStart_periodEnd_idx" ON "analytics_snapshots"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "analytics_metrics_snapshotId_idx" ON "analytics_metrics"("snapshotId");

-- CreateIndex
CREATE INDEX "analytics_metrics_domain_key_idx" ON "analytics_metrics"("domain", "key");

-- CreateIndex
CREATE INDEX "analytics_metrics_recordedAt_idx" ON "analytics_metrics"("recordedAt");

-- CreateIndex
CREATE INDEX "analytics_aggregations_snapshotId_idx" ON "analytics_aggregations"("snapshotId");

-- CreateIndex
CREATE INDEX "analytics_aggregations_domain_key_idx" ON "analytics_aggregations"("domain", "key");

-- CreateIndex
CREATE INDEX "analytics_aggregations_periodStart_periodEnd_idx" ON "analytics_aggregations"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "analytics_alerts_snapshotId_idx" ON "analytics_alerts"("snapshotId");

-- CreateIndex
CREATE INDEX "analytics_alerts_domain_idx" ON "analytics_alerts"("domain");

-- CreateIndex
CREATE INDEX "analytics_alerts_severity_idx" ON "analytics_alerts"("severity");

-- CreateIndex
CREATE INDEX "analytics_alerts_status_idx" ON "analytics_alerts"("status");

-- CreateIndex
CREATE INDEX "analytics_alerts_createdAt_idx" ON "analytics_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_predictions_snapshotId_idx" ON "analytics_predictions"("snapshotId");

-- CreateIndex
CREATE INDEX "analytics_predictions_domain_key_idx" ON "analytics_predictions"("domain", "key");

-- CreateIndex
CREATE INDEX "analytics_predictions_status_idx" ON "analytics_predictions"("status");

-- CreateIndex
CREATE INDEX "analytics_predictions_createdAt_idx" ON "analytics_predictions"("createdAt");

-- AddForeignKey
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "analytics_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_aggregations" ADD CONSTRAINT "analytics_aggregations_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "analytics_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_alerts" ADD CONSTRAINT "analytics_alerts_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "analytics_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_predictions" ADD CONSTRAINT "analytics_predictions_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "analytics_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
