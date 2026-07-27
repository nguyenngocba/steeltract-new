# Historical Snapshot Corrective Migration Report

## 1. Backup

Status: PASS

Existing STABILITY.2 backup was preserved:

| Backup | Result |
| --- | --- |
| `/tmp/steeltrack-stability2-20260727-101220.dump` | Exists, 686K |

New pre-STABILITY.4 backup was created before any database modification:

| Backup | Result |
| --- | --- |
| `/tmp/steeltrack-stability4-20260727-104307.dump` | Exists, 695K |

Database identity:

| Field | Value |
| --- | --- |
| Database | `steeltrack` |
| Schema | `public` |
| Host | `localhost` |
| Port | `5432` |

Pre-migration Prisma status: PASS, 78 migrations found and database schema up to date relative to migration history.

## 2. Corrective Migration Design

Created one forward-only migration:

```text
apps/backend-api/prisma/migrations/20260727210000_historical_snapshot_corrective_schema/migration.sql
```

The migration creates only the Historical Snapshot objects already defined in `schema.prisma`.

Created enum types:

- `HistoricalDashboardModule`
- `HistoricalSnapshotScopeType`
- `HistoricalSnapshotGranularity`
- `HistoricalSnapshotSource`
- `HistoricalSnapshotStockStatus`
- `SnapshotJobType`
- `SnapshotJobStatus`
- `SnapshotJobLogLevel`
- `SnapshotFrequency`
- `SnapshotReadinessStatus`

Created tables:

- `dashboard_snapshots`
- `inventory_balance_snapshots`
- `dashboard_monthly_rollups`
- `inventory_monthly_rollups`
- `snapshot_jobs`
- `snapshot_job_logs`
- `snapshot_rebuild_requests`
- `snapshot_metadata`

No legacy snapshot table is recreated, renamed, truncated, backfilled, or dropped.

## 3. Migration SQL Inspection

Status: PASS

Statement classification:

| Statement type | Count |
| --- | ---: |
| `CREATE TYPE` | 10 |
| `CREATE TABLE` | 8 |
| `CREATE INDEX` / `CREATE UNIQUE INDEX` | 38 |
| `ALTER TABLE ADD CONSTRAINT` | 7 |
| Other | Comments/defaults only |

Destructive SQL inspection:

| Pattern | Result |
| --- | --- |
| `DROP TABLE` | Not present |
| `DROP COLUMN` | Not present |
| `TRUNCATE` | Not present |
| `DELETE` data statement | Not present |
| Destructive `ALTER` | Not present |
| Rename legacy table/index | Not present |

The only `DELETE` text present is FK behavior such as `ON DELETE SET NULL` and `ON DELETE CASCADE`.

## 4. Deployment Result

Status: PASS

Deployment command:

```bash
pnpm -C apps/backend-api exec prisma migrate deploy
```

Result:

```text
Applying migration `20260727210000_historical_snapshot_corrective_schema`
All migrations have been successfully applied.
```

Post-migration Prisma status:

```text
79 migrations found in prisma/migrations
Database schema is up to date!
```

## 5. Schema Verification

Status: PASS

Post-migration checks:

| Check | Result |
| --- | --- |
| `prisma validate` | PASS |
| `prisma generate` | PASS |
| Expected tables exist | PASS |
| Expected enum types exist | PASS |
| Expected indexes exist | PASS |
| Expected PK/FK constraints exist | PASS |

Verified tables:

```text
dashboard_monthly_rollups
dashboard_snapshots
inventory_balance_snapshots
inventory_monthly_rollups
snapshot_job_logs
snapshot_jobs
snapshot_metadata
snapshot_rebuild_requests
```

Verified enum types:

```text
HistoricalDashboardModule
HistoricalSnapshotGranularity
HistoricalSnapshotScopeType
HistoricalSnapshotSource
HistoricalSnapshotStockStatus
SnapshotFrequency
SnapshotJobLogLevel
SnapshotJobStatus
SnapshotJobType
SnapshotReadinessStatus
```

## 6. Drift Verification

Status: WARNING

Historical Snapshot drift is resolved. The schema-vs-database diff no longer reports missing Historical Snapshot tables or enums.

Remaining drift is pre-existing and unrelated to this corrective migration:

| Drift | Classification |
| --- | --- |
| `inventory_location_stocks_backup` exists in DB but not Prisma schema | Pre-existing backup table drift |
| `WorkOrder.updatedAt` DB default differs from schema | Pre-existing unrelated drift |
| `project_tasks.updatedAt` DB default differs from schema | Pre-existing unrelated drift |
| `project_templates.updatedAt` DB default differs from schema | Pre-existing unrelated drift |
| `project_task_dependencies` index name differs by truncated suffix | Pre-existing unrelated drift |

No remediation was performed for these unrelated drift items in STABILITY.4.

## 7. Legacy Data Preservation

Status: PASS

Legacy snapshot row counts before and after the migration match:

| Table | Pre | Post |
| --- | ---: | ---: |
| `component_dashboard_snapshots` | 0 | 0 |
| `dispatch_dashboard_snapshots` | 0 | 0 |
| `inventory_dashboard_snapshots` | 27 | 27 |
| `production_dashboard_snapshots` | 1 | 1 |
| `project_dashboard_snapshots` | 2 | 2 |
| `qc_dashboard_snapshots` | 0 | 0 |
| `yard_dashboard_snapshots` | 0 | 0 |

No legacy snapshot data was deleted, renamed, backfilled, or altered.

## 8. Snapshot Engine Runtime

Status: PASS

Backend runtime loaded the current build and registered:

- `HistoricalSnapshotEngineModule`
- `HistoricalDashboardModule`
- `/history/dashboard`
- `/history/dashboard/latest`
- `/history/dashboard/monthly`
- `/history/inventory`
- `/history/inventory/monthly`
- `/history/jobs`

The previous runtime error:

```text
The table public.snapshot_metadata does not exist
```

did not recur during the observed runtime window after migration.

Health checks:

| Endpoint | Result |
| --- | --- |
| `/health/live` | `200 OK` |
| `/health/ready` | `200 OK`, database up |

Note: a sandboxed runtime start failed to connect to PostgreSQL because localhost DB access was sandbox-restricted. The escalated/runtime path was used for real DB verification.

## 9. Historical API Runtime

Status: PASS with empty-data behavior

Authenticated smoke tests used the existing dev seed auth flow:

```text
POST /auth/login
username=admin
password=123
```

Historical API results:

| Endpoint | Result |
| --- | --- |
| `GET /history/jobs?page=1&pageSize=10` | `200`, empty paginated response |
| `GET /history/dashboard/latest?module=INVENTORY` | `404`, controlled not-found response |
| `GET /history/dashboard?date=2026-07-27&module=INVENTORY` | `404`, controlled not-found response |
| `GET /history/dashboard/monthly?module=INVENTORY&page=1&pageSize=10` | `200`, empty paginated response |
| `GET /history/inventory?date=2026-07-27&page=1&pageSize=10` | `200`, empty paginated response |
| `GET /history/inventory/monthly?page=1&pageSize=10` | `200`, empty paginated response |

No `/history/*` endpoint returned `500`.

## 10. Regression Results

Status: PASS

Targeted read-only smoke tests:

| Area | Endpoint | Result |
| --- | --- | --- |
| Inventory realtime | `GET /inventory/overview` | `200` |
| Components | `GET /components/read-model/overview` | `200` |
| Production Orders | `GET /production?page=1&pageSize=5` | `200` |

Automated verification:

| Command | Result |
| --- | --- |
| `pnpm -C apps/backend-api test` | PASS, 75 suites / 210 tests |
| `pnpm -C apps/backend-api build` | PASS |
| `pnpm -C apps/frontend build` | PASS |

## 11. Remaining Risks

P0: none for the Historical Snapshot missing-table blocker.

P1:

- `snapshot_metadata` is structurally available but not seeded. Scheduler will not create jobs until metadata rows are configured.
- Historical snapshot tables are empty; this is expected because the sprint did not backfill or rebuild historical datasets.
- Schema-vs-database diff still reports unrelated pre-existing drift outside Historical Snapshot scope.
- Runtime smoke confirmed API safety, not a production-scale snapshot rebuild.

## 12. Migration Process Technical Debt

STABILITY.2 discovered that migration `20260717190000_enterprise_data_scalability_indexes` contained `CREATE INDEX CONCURRENTLY`, which Prisma `migrate deploy` attempted inside a transaction and failed.

This migration was not modified in STABILITY.4.

Future process rule:

- Do not place `CREATE INDEX CONCURRENTLY` inside a normal Prisma migration intended for `migrate deploy`.
- Use a reviewed out-of-band SQL deployment step for concurrent indexes, or split migration strategy explicitly.
- Document manual/resolved migration operations with backup, SQL evidence and `migrate resolve` rationale.

## 13. Go / No-Go

Recommendation: GO for resolving the Historical Snapshot schema drift blocker.

The corrective migration is deployed, expected Historical Snapshot schema objects exist, legacy snapshot data is preserved, Snapshot Engine startup no longer fails on missing `snapshot_metadata`, Historical API read paths return controlled responses, and regression/build checks passed.

Do not treat Historical Dashboard data as populated yet. The next operational step is controlled `snapshot_metadata` seeding and a minimum snapshot job workflow verification.
