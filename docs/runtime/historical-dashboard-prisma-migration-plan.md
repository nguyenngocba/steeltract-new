# Historical Dashboard Prisma Schema Migration Plan

## Scope

Implemented in Prisma schema only:

- `dashboard_snapshots`
- `inventory_balance_snapshots`
- `dashboard_monthly_rollups`
- `inventory_monthly_rollups`
- `snapshot_jobs`
- `snapshot_job_logs`
- `snapshot_rebuild_requests`
- `snapshot_metadata`

No services, APIs, frontend code or existing business tables are part of this
schema rollout.

## Phase 1 - Create Tables

Generate a Prisma migration from the updated schema and review it before
applying:

```bash
pnpm -C apps/backend-api exec prisma migrate dev --create-only
```

Expected tables:

- `snapshot_rebuild_requests`
- `snapshot_jobs`
- `snapshot_metadata`
- `snapshot_job_logs`
- `dashboard_snapshots`
- `inventory_balance_snapshots`
- `dashboard_monthly_rollups`
- `inventory_monthly_rollups`

## Phase 2 - Prisma-supported Indexes

Prisma schema defines:

- primary keys
- relations between jobs, logs, rebuild requests and generated snapshots
- unique keys for snapshot identity
- enum-backed modules, statuses, scope types, granularities, sources,
  frequencies, readiness states and job log levels
- non-null bucket keys for inventory balance/monthly rollup uniqueness
- composite indexes for date/module/scope lookups
- JSONB fields for flexible KPI/chart/warning payloads
- decimal precision for inventory balance/value data

The Prisma schema intentionally uses single-column UUID primary keys for the
new historical tables. This keeps Prisma Client usage simple and avoids
composite-id coupling in application code. If the physical PostgreSQL migration
creates partitioned tables, review PostgreSQL's requirement that primary and
unique constraints on partitioned tables include the partition key.

## Phase 3 - Raw SQL Required

Prisma cannot fully express the approved PostgreSQL design. Add the following
manually to the generated migration SQL before apply.

### Partitioning

Create monthly range partitions for:

- `dashboard_snapshots` by `snapshot_date`
- `inventory_balance_snapshots` by `snapshot_date`
- `snapshot_job_logs` by `created_at` if log volume requires it

Optional yearly partitions:

- `dashboard_monthly_rollups` by `month_start`
- `inventory_monthly_rollups` by `month_start`
- `snapshot_jobs` by `created_at`
- `snapshot_rebuild_requests` by `created_at`

### Check Constraints

Add CHECK constraints for:

- non-negative row/warning/day counters
- `from_date <= to_date`
- `month_start = date_trunc('month', month_start)::date`
- positive retention values
- job `attempt <= max_attempts`

### Advanced Indexes

Add raw SQL indexes for:

- partial stale dashboard snapshots
- partial non-authoritative dashboard snapshots
- partial low/out/negative inventory balance alerts
- partial running job lease recovery
- partial failed job diagnostics
- partial warning/error job logs
- GIN index on `snapshot_rebuild_requests.modules`
- covering indexes with `INCLUDE` for hot dashboard/inventory reads

## Phase 4 - Seed Metadata

Seed one `snapshot_metadata` row for each enabled snapshot type:

- `inventory / dashboard_daily`
- `inventory / inventory_balance_daily`
- `components / dashboard_daily`
- `production / dashboard_daily`
- `projects / dashboard_daily`
- `suppliers / dashboard_daily`
- `qc / dashboard_daily`
- `dispatch / dashboard_daily`
- `dashboard / monthly_rollup`
- `inventory / monthly_rollup`

Initial values:

- `enabled = true`
- `frequency = daily` for daily rows
- `frequency = monthly` for rollup rows
- `retention_days = 730`
- `archive_after_days = 730`
- `rollup_after_days = 730`
- `readiness_status = REBUILD_REQUIRED`

## Validation

Run after migration review:

```bash
pnpm -C apps/backend-api exec prisma validate
pnpm -C apps/backend-api exec prisma generate
```

No production migration should be deployed until partition DDL and raw SQL
constraints are reviewed against the target PostgreSQL version.
