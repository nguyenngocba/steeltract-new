# Operations Center Module

## Scope

Operations Center is the system administration cockpit for SteelTrack runtime operations.

Audience:

- IT Manager.
- System Admin.
- DevOps.
- CTO.

It is separate from the business Dashboard and does not create or mutate business workflows.

## Implemented Features

OPS.1 adds:

- System Health overview.
- Runtime metrics summary.
- Performance score by module.
- Architecture score by module.
- API ranking.
- Query ranking.
- Background job counts and recent jobs.
- Snapshot freshness and hit/miss/fallback runtime signals.
- Cache/read-model effectiveness.
- Database size and high-growth table counts.
- Storage root filesystem usage.
- Outbox event status and recent events.
- Rule-based operational alerts.

## API Endpoints

- `GET /operations-center/overview`

The endpoint aggregates existing runtime foundations and is JWT-protected.

## Routes

- `/operations-center`
- `/operations-center?tab=runtime`
- `/operations-center?tab=database`
- `/operations-center?tab=jobs`
- `/operations-center?tab=snapshot`
- `/operations-center?tab=cache`
- `/operations-center?tab=storage`
- `/operations-center?tab=api`
- `/operations-center?tab=events`
- `/operations-center?tab=performance`
- `/operations-center?tab=alerts`

## Data Sources

- Runtime metrics from `PerformanceMetricsService`.
- Cache stats from `CacheService`.
- Background jobs from `background_jobs`.
- Outbox events from `outbox_events`.
- Snapshots from `inventory_dashboard_snapshots`, `project_dashboard_snapshots`, and `dispatch_dashboard_snapshots`.
- Database size from PostgreSQL `pg_database_size`.
- Storage stats from `STORAGE_ROOT` or `/data/steeltrack-storage`.

## Remaining Tasks

- OPS.2 Database Center with table growth trends, index health, bloat signals, partition/archive readiness, and migration drift visibility.
- OPS.3 Runtime Explorer with request/query drill-down.
- OPS.4 Event Explorer with outbox replay inspection and dead-letter management.
- OPS.5 Backup Center with backup status, retention, restore readiness, and storage usage.
- Add admin-only RBAC permissions once the permissions seed and System settings flow are hardened.
