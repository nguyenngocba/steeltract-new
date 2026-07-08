# EPIC109 OPS.1 - Operations Center System Health

Date: 2026-07-08

## Scope

OPS.1 creates the first read-only SteelTrack Operations Center for IT, System Admin, DevOps, and CTO users.

This is not the business Dashboard. It is a system operations cockpit that summarizes runtime, database, jobs, snapshots, cache, storage, events, API performance, and alerts.

## Backend

Added `GET /operations-center/overview`.

The endpoint is JWT-protected and aggregates existing runtime foundations:

- `PerformanceMetricsService` for request, query, memory, cache/read-model, snapshot, performance score, architecture score, endpoint ranking, and query ranking metrics.
- `CacheService` for process-local cache size and adapter.
- Background job tables for queue status and recent job records.
- Outbox tables for event pipeline status and recent events.
- Persisted snapshot tables for Inventory, Projects, and Dispatch freshness.
- PostgreSQL database size via `pg_database_size(current_database())`.
- Operational table row counts for high-growth tables.
- Filesystem stats for `STORAGE_ROOT` or `/data/steeltrack-storage`.

No business workflow, schema, or existing API contract was changed.

## Frontend

Added route:

- `/operations-center`

Navigation:

- Operations Center
  - Tổng quan
  - Runtime
  - Database
  - Background Jobs
  - Snapshot
  - Cache
  - Storage
  - API
  - Events
  - Performance
  - Alerts

The page uses existing cockpit primitives:

- `CockpitKpiCard`
- `CockpitChartCard`
- `CockpitTableShell`
- `DataTablePagination`
- `CockpitStatusList`
- `CockpitRecentList`
- `CockpitEmptyState`

## System Health Rules

CPU:

- Uses one-minute load average divided by CPU core count.
- Warning at load/core >= 0.9.
- Critical at load/core >= 1.5.

RAM:

- Uses host memory from Node `os.totalmem()` and `os.freemem()`.
- Warning at >= 85%.
- Critical at >= 95%.

Disk:

- Uses `statfsSync()` on the configured storage root.
- Warning at >= 85%.
- Critical at >= 95%.
- If storage root is unavailable, the UI shows unknown/N/A instead of fake values.

Database:

- Shows current PostgreSQL database size.
- Healthy means the query succeeded.

Worker:

- Warning when failed or dead-letter jobs exist.

Snapshot:

- Critical when a module has zero persisted snapshot rows.
- Warning when the newest snapshot is older than one hour.

Cache:

- Displays read-model/cache/snapshot hit signals from runtime analytics.

Event:

- Warning when failed or dead-letter outbox events exist.

## Alerts

Generated alerts are rule-based:

- Missing snapshot.
- Stale snapshot.
- Failed/dead-letter jobs.
- Failed/dead-letter outbox events.
- Low read-model/cache hit rate.
- Slow query observations.
- High storage use.
- High memory use.

No AI, mock data, or random values are used.

## Limitations

- Metrics are still process-local unless backed by persisted runtime metrics in a later sprint.
- CPU percentage is represented by normalized load average, not kernel CPU utilization.
- Attachment storage size currently reports filesystem usage at `STORAGE_ROOT`, not recursive file-only attachment bytes.
- OPS.1 does not add drill-down mutation actions for retrying jobs, replaying events, or rebuilding snapshots.

## Verification

- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed.
- `git diff --check` must pass before closeout.
