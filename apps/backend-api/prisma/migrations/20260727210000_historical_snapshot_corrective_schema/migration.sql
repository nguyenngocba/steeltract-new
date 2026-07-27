-- STABILITY.4 corrective migration.
-- Creates the Historical Snapshot tables/enums already defined in schema.prisma.
-- This migration is intentionally create-only and does not touch legacy snapshot tables.

CREATE TYPE "HistoricalDashboardModule" AS ENUM (
  'ERP',
  'INVENTORY',
  'COMPONENTS',
  'PRODUCTION',
  'PROJECTS',
  'SUPPLIERS',
  'QC',
  'DISPATCH',
  'LOGISTICS',
  'YARD'
);

CREATE TYPE "HistoricalSnapshotScopeType" AS ENUM (
  'GLOBAL',
  'MODULE',
  'WAREHOUSE',
  'PROJECT',
  'SUPPLIER',
  'PRODUCTION_AREA',
  'QUALITY_AREA',
  'DISPATCH_AREA',
  'CUSTOM'
);

CREATE TYPE "HistoricalSnapshotGranularity" AS ENUM (
  'DAY',
  'MONTH',
  'RANGE'
);

CREATE TYPE "HistoricalSnapshotSource" AS ENUM (
  'SNAPSHOT',
  'ROLLUP',
  'REPLAY',
  'READ_MODEL',
  'MANUAL_REBUILD'
);

CREATE TYPE "HistoricalSnapshotStockStatus" AS ENUM (
  'NORMAL',
  'LOW',
  'OUT_OF_STOCK',
  'NEGATIVE',
  'OVERSTOCK'
);

CREATE TYPE "SnapshotJobType" AS ENUM (
  'DAILY_SNAPSHOT',
  'MONTHLY_ROLLUP',
  'REBUILD',
  'VALIDATION',
  'ARCHIVE',
  'RETENTION'
);

CREATE TYPE "SnapshotJobStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "SnapshotJobLogLevel" AS ENUM (
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR'
);

CREATE TYPE "SnapshotFrequency" AS ENUM (
  'HOURLY',
  'DAILY',
  'MONTHLY',
  'MANUAL'
);

CREATE TYPE "SnapshotReadinessStatus" AS ENUM (
  'READY',
  'WARNING',
  'STALE',
  'REBUILD_REQUIRED',
  'DISABLED'
);

CREATE TABLE "snapshot_rebuild_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "request_no" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "requested_by" TEXT,
  "modules" "HistoricalDashboardModule"[] NOT NULL,
  "from_date" DATE NOT NULL,
  "to_date" DATE NOT NULL,
  "status" "SnapshotJobStatus" NOT NULL DEFAULT 'PENDING',
  "priority" INTEGER NOT NULL DEFAULT 50,
  "approved_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "error_message" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "snapshot_rebuild_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "snapshot_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "job_type" "SnapshotJobType" NOT NULL,
  "module" "HistoricalDashboardModule",
  "scope_key" TEXT NOT NULL DEFAULT 'ALL',
  "snapshot_date" DATE,
  "from_date" DATE,
  "to_date" DATE,
  "status" "SnapshotJobStatus" NOT NULL DEFAULT 'PENDING',
  "priority" INTEGER NOT NULL DEFAULT 50,
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 3,
  "requested_by" TEXT,
  "rebuild_request_id" UUID,
  "lease_owner" TEXT,
  "lease_expires_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "error_code" TEXT,
  "error_message" TEXT,
  "rows_read" BIGINT NOT NULL DEFAULT 0,
  "rows_written" BIGINT NOT NULL DEFAULT 0,
  "source_watermark_start" TEXT,
  "source_watermark_end" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "snapshot_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dashboard_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "snapshot_date" DATE NOT NULL,
  "module" "HistoricalDashboardModule" NOT NULL,
  "scope_key" TEXT NOT NULL DEFAULT 'ALL',
  "scope_type" "HistoricalSnapshotScopeType" NOT NULL DEFAULT 'GLOBAL',
  "scope_id" TEXT,
  "granularity" "HistoricalSnapshotGranularity" NOT NULL DEFAULT 'DAY',
  "source" "HistoricalSnapshotSource" NOT NULL DEFAULT 'SNAPSHOT',
  "authoritative" BOOLEAN NOT NULL DEFAULT true,
  "kpis" JSONB NOT NULL DEFAULT '{}',
  "charts" JSONB NOT NULL DEFAULT '{}',
  "tables" JSONB NOT NULL DEFAULT '{}',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "source_watermark" TEXT,
  "source_min_at" TIMESTAMP(3),
  "source_max_at" TIMESTAMP(3),
  "row_count" INTEGER NOT NULL DEFAULT 0,
  "warning_count" INTEGER NOT NULL DEFAULT 0,
  "stale" BOOLEAN NOT NULL DEFAULT false,
  "generated_by_job_id" UUID,
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_balance_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "snapshot_date" DATE NOT NULL,
  "material_id" TEXT NOT NULL,
  "material_code" TEXT NOT NULL,
  "material_name" TEXT NOT NULL,
  "material_type_id" TEXT,
  "material_type_name" TEXT,
  "category_id" TEXT,
  "category_name" TEXT,
  "warehouse_id" TEXT,
  "warehouse_code" TEXT,
  "zone_id" TEXT,
  "zone_code" TEXT,
  "slot_id" TEXT,
  "level" TEXT,
  "unit" TEXT,
  "quantity_on_hand" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "available_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "reserved_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "minimum_stock" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "unit_cost" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "inventory_value" DECIMAL(20,2) NOT NULL DEFAULT 0,
  "stock_status" "HistoricalSnapshotStockStatus" NOT NULL DEFAULT 'NORMAL',
  "source" "HistoricalSnapshotSource" NOT NULL DEFAULT 'SNAPSHOT',
  "location_bucket_key" TEXT NOT NULL DEFAULT 'ALL',
  "source_watermark" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "generated_by_job_id" UUID,
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "inventory_balance_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dashboard_monthly_rollups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "month_start" DATE NOT NULL,
  "module" "HistoricalDashboardModule" NOT NULL,
  "scope_key" TEXT NOT NULL DEFAULT 'ALL',
  "scope_type" "HistoricalSnapshotScopeType" NOT NULL DEFAULT 'GLOBAL',
  "scope_id" TEXT,
  "kpi_open" JSONB NOT NULL DEFAULT '{}',
  "kpi_close" JSONB NOT NULL DEFAULT '{}',
  "kpi_min" JSONB NOT NULL DEFAULT '{}',
  "kpi_max" JSONB NOT NULL DEFAULT '{}',
  "kpi_avg" JSONB NOT NULL DEFAULT '{}',
  "charts" JSONB NOT NULL DEFAULT '{}',
  "warnings" JSONB NOT NULL DEFAULT '[]',
  "days_covered" INTEGER NOT NULL DEFAULT 0,
  "authoritative" BOOLEAN NOT NULL DEFAULT true,
  "source_watermark" TEXT,
  "generated_by_job_id" UUID,
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dashboard_monthly_rollups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_monthly_rollups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "month_start" DATE NOT NULL,
  "material_id" TEXT NOT NULL,
  "material_code" TEXT NOT NULL,
  "material_name" TEXT NOT NULL,
  "material_type_id" TEXT,
  "material_type_name" TEXT,
  "category_id" TEXT,
  "category_name" TEXT,
  "warehouse_id" TEXT,
  "warehouse_code" TEXT,
  "warehouse_key" TEXT NOT NULL DEFAULT 'ALL',
  "opening_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "closing_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "min_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "max_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "avg_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "opening_value" DECIMAL(20,2) NOT NULL DEFAULT 0,
  "closing_value" DECIMAL(20,2) NOT NULL DEFAULT 0,
  "min_value" DECIMAL(20,2) NOT NULL DEFAULT 0,
  "max_value" DECIMAL(20,2) NOT NULL DEFAULT 0,
  "avg_value" DECIMAL(20,2) NOT NULL DEFAULT 0,
  "low_stock_days" INTEGER NOT NULL DEFAULT 0,
  "out_stock_days" INTEGER NOT NULL DEFAULT 0,
  "negative_stock_days" INTEGER NOT NULL DEFAULT 0,
  "days_covered" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "generated_by_job_id" UUID,
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "inventory_monthly_rollups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "snapshot_job_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "job_id" UUID NOT NULL,
  "level" "SnapshotJobLogLevel" NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "step" TEXT,
  "module" "HistoricalDashboardModule",
  "details" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "snapshot_job_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "snapshot_metadata" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "module" "HistoricalDashboardModule" NOT NULL,
  "snapshot_type" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "frequency" "SnapshotFrequency" NOT NULL DEFAULT 'DAILY',
  "retention_days" INTEGER NOT NULL DEFAULT 730,
  "archive_after_days" INTEGER NOT NULL DEFAULT 730,
  "rollup_after_days" INTEGER NOT NULL DEFAULT 730,
  "last_successful_snapshot_date" DATE,
  "last_successful_job_id" UUID,
  "last_source_watermark" TEXT,
  "stale_from_date" DATE,
  "readiness_status" "SnapshotReadinessStatus" NOT NULL DEFAULT 'READY',
  "settings" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "snapshot_metadata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "snapshot_rebuild_requests_request_no_key" ON "snapshot_rebuild_requests"("request_no");
CREATE INDEX "snapshot_rebuild_requests_queue_idx" ON "snapshot_rebuild_requests"("status", "priority" DESC, "created_at");
CREATE INDEX "snapshot_rebuild_requests_range_idx" ON "snapshot_rebuild_requests"("from_date", "to_date");

CREATE INDEX "snapshot_jobs_queue_idx" ON "snapshot_jobs"("status", "priority" DESC, "created_at");
CREATE INDEX "snapshot_jobs_lease_expires_idx" ON "snapshot_jobs"("lease_expires_at");
CREATE INDEX "snapshot_jobs_type_module_date_idx" ON "snapshot_jobs"("job_type", "module", "snapshot_date");
CREATE INDEX "snapshot_jobs_rebuild_request_idx" ON "snapshot_jobs"("rebuild_request_id");
CREATE INDEX "snapshot_jobs_created_at_idx" ON "snapshot_jobs"("created_at" DESC);

CREATE UNIQUE INDEX "dashboard_snapshots_module_scope_date_key" ON "dashboard_snapshots"("module", "scope_key", "snapshot_date");
CREATE INDEX "dashboard_snapshots_snapshot_date_idx" ON "dashboard_snapshots"("snapshot_date");
CREATE INDEX "dashboard_snapshots_module_date_idx" ON "dashboard_snapshots"("module", "snapshot_date" DESC);
CREATE INDEX "dashboard_snapshots_module_scope_date_idx" ON "dashboard_snapshots"("module", "scope_key", "snapshot_date" DESC);
CREATE INDEX "dashboard_snapshots_authoritative_date_idx" ON "dashboard_snapshots"("authoritative", "snapshot_date");
CREATE INDEX "dashboard_snapshots_generated_by_job_idx" ON "dashboard_snapshots"("generated_by_job_id");

CREATE UNIQUE INDEX "inventory_balance_snapshots_bucket_key" ON "inventory_balance_snapshots"("snapshot_date", "material_id", "location_bucket_key");
CREATE INDEX "inventory_balance_snapshots_date_warehouse_idx" ON "inventory_balance_snapshots"("snapshot_date", "warehouse_id");
CREATE INDEX "inventory_balance_snapshots_date_material_type_idx" ON "inventory_balance_snapshots"("snapshot_date", "material_type_id");
CREATE INDEX "inventory_balance_snapshots_material_date_idx" ON "inventory_balance_snapshots"("material_id", "snapshot_date" DESC);
CREATE INDEX "inventory_balance_snapshots_location_date_idx" ON "inventory_balance_snapshots"("warehouse_id", "zone_id", "snapshot_date");
CREATE INDEX "inventory_balance_snapshots_bucket_date_idx" ON "inventory_balance_snapshots"("location_bucket_key", "snapshot_date" DESC);
CREATE INDEX "inventory_balance_snapshots_date_stock_status_idx" ON "inventory_balance_snapshots"("snapshot_date", "stock_status");
CREATE INDEX "inventory_balance_snapshots_generated_by_job_idx" ON "inventory_balance_snapshots"("generated_by_job_id");

CREATE UNIQUE INDEX "dashboard_monthly_rollups_module_scope_month_key" ON "dashboard_monthly_rollups"("module", "scope_key", "month_start");
CREATE INDEX "dashboard_monthly_rollups_module_month_idx" ON "dashboard_monthly_rollups"("module", "month_start" DESC);
CREATE INDEX "dashboard_monthly_rollups_month_start_idx" ON "dashboard_monthly_rollups"("month_start");
CREATE INDEX "dashboard_monthly_rollups_generated_by_job_idx" ON "dashboard_monthly_rollups"("generated_by_job_id");

CREATE UNIQUE INDEX "inventory_monthly_rollups_material_warehouse_month_key" ON "inventory_monthly_rollups"("month_start", "material_id", "warehouse_key");
CREATE INDEX "inventory_monthly_rollups_month_warehouse_idx" ON "inventory_monthly_rollups"("month_start", "warehouse_id");
CREATE INDEX "inventory_monthly_rollups_month_warehouse_key_idx" ON "inventory_monthly_rollups"("month_start", "warehouse_key");
CREATE INDEX "inventory_monthly_rollups_month_material_type_idx" ON "inventory_monthly_rollups"("month_start", "material_type_id");
CREATE INDEX "inventory_monthly_rollups_material_month_idx" ON "inventory_monthly_rollups"("material_id", "month_start" DESC);
CREATE INDEX "inventory_monthly_rollups_generated_by_job_idx" ON "inventory_monthly_rollups"("generated_by_job_id");

CREATE INDEX "snapshot_job_logs_job_created_at_idx" ON "snapshot_job_logs"("job_id", "created_at");
CREATE INDEX "snapshot_job_logs_level_created_at_idx" ON "snapshot_job_logs"("level", "created_at" DESC);

CREATE UNIQUE INDEX "snapshot_metadata_module_type_key" ON "snapshot_metadata"("module", "snapshot_type");
CREATE INDEX "snapshot_metadata_readiness_status_idx" ON "snapshot_metadata"("readiness_status");
CREATE INDEX "snapshot_metadata_stale_from_date_idx" ON "snapshot_metadata"("stale_from_date");
CREATE INDEX "snapshot_metadata_last_successful_job_idx" ON "snapshot_metadata"("last_successful_job_id");

ALTER TABLE "snapshot_jobs"
ADD CONSTRAINT "snapshot_jobs_rebuild_request_id_fkey"
FOREIGN KEY ("rebuild_request_id") REFERENCES "snapshot_rebuild_requests"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dashboard_snapshots"
ADD CONSTRAINT "dashboard_snapshots_generated_by_job_id_fkey"
FOREIGN KEY ("generated_by_job_id") REFERENCES "snapshot_jobs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_balance_snapshots"
ADD CONSTRAINT "inventory_balance_snapshots_generated_by_job_id_fkey"
FOREIGN KEY ("generated_by_job_id") REFERENCES "snapshot_jobs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dashboard_monthly_rollups"
ADD CONSTRAINT "dashboard_monthly_rollups_generated_by_job_id_fkey"
FOREIGN KEY ("generated_by_job_id") REFERENCES "snapshot_jobs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_monthly_rollups"
ADD CONSTRAINT "inventory_monthly_rollups_generated_by_job_id_fkey"
FOREIGN KEY ("generated_by_job_id") REFERENCES "snapshot_jobs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "snapshot_job_logs"
ADD CONSTRAINT "snapshot_job_logs_job_id_fkey"
FOREIGN KEY ("job_id") REFERENCES "snapshot_jobs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "snapshot_metadata"
ADD CONSTRAINT "snapshot_metadata_last_successful_job_id_fkey"
FOREIGN KEY ("last_successful_job_id") REFERENCES "snapshot_jobs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
