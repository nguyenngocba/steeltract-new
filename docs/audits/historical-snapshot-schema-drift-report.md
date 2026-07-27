# Historical Snapshot Schema Drift Report

## STABILITY.3 AUDIT STATUS

Status: ERROR

The runtime PostgreSQL database does not contain the Historical Snapshot tables and enum types that are defined in the current Prisma schema and used by the Historical Snapshot Engine / Historical Dashboard API.

No database, schema, application code, staged files, or commits were changed during this audit.

## Database Identity

Observed CLI database identity:

| Field | Value |
| --- | --- |
| Database | `steeltrack` |
| Server address | `::1` |
| Server port | `5432` |
| Schema | `public` |

The current backend process on port `3000` is:

| Field | Value |
| --- | --- |
| PID | `1028371` |
| Command | `node --enable-source-maps /opt/projects/steeltrack/apps/backend-api/dist/main` |
| CWD | `/opt/projects/steeltrack/apps/backend-api` |

The process path confirms it is the SteelTrack backend build from this workspace. The process environment did not expose `DATABASE_URL` via the inspected `/proc` output, so the exact runtime connection string could not be proven from process env alone.

## Runtime vs CLI DB

Evidence points to runtime and CLI targeting the same SteelTrack backend/database path:

- CLI Prisma status connects to the configured backend Prisma datasource and reports `Database schema is up to date!`.
- The running port `3000` process is the local backend build under `/opt/projects/steeltrack/apps/backend-api/dist/main`.
- Runtime health endpoints remained healthy after STABILITY.2:
  - `/health/live`: `200 OK`
  - `/health/ready`: `200 OK`, database up
- Runtime background failure references Prisma model `snapshotMetadata`, which exists in generated Prisma client/schema but not in PostgreSQL.

Conclusion: this is not primarily a wrong-database symptom. It is schema drift between `schema.prisma` and the applied migration set.

## Snapshot Objects

Expected by current `apps/backend-api/prisma/schema.prisma`:

### Enums

| Enum |
| --- |
| `HistoricalDashboardModule` |
| `HistoricalSnapshotScopeType` |
| `HistoricalSnapshotGranularity` |
| `HistoricalSnapshotSource` |
| `HistoricalSnapshotStockStatus` |
| `SnapshotJobType` |
| `SnapshotJobStatus` |
| `SnapshotJobLogLevel` |
| `SnapshotFrequency` |
| `SnapshotReadinessStatus` |

Actual PostgreSQL result: none of these enum types exist in `public`.

### Tables

| Prisma model | Mapped PostgreSQL table | Runtime use |
| --- | --- | --- |
| `DashboardSnapshot` | `dashboard_snapshots` | Historical dashboard snapshot queries and snapshot generation |
| `InventoryBalanceSnapshot` | `inventory_balance_snapshots` | Historical inventory queries and snapshot generation |
| `DashboardMonthlyRollup` | `dashboard_monthly_rollups` | Historical dashboard monthly rollups |
| `InventoryMonthlyRollup` | `inventory_monthly_rollups` | Historical inventory monthly rollups |
| `SnapshotJob` | `snapshot_jobs` | Snapshot scheduler/job queue and `/history/jobs` |
| `SnapshotJobLog` | `snapshot_job_logs` | Structured snapshot job logs |
| `SnapshotRebuildRequest` | `snapshot_rebuild_requests` | Rebuild request tracking and job relation |
| `SnapshotMetadata` | `snapshot_metadata` | Scheduler startup metadata |

Actual PostgreSQL result: none of these tables exist in `public`.

Existing older snapshot-like tables do exist:

| Existing table | Rows observed |
| --- | ---: |
| `inventory_dashboard_snapshots` | 27 |
| `production_dashboard_snapshots` | 1 |
| `project_dashboard_snapshots` | 2 |
| `component_dashboard_snapshots` | 0 |
| `dispatch_dashboard_snapshots` | 0 |
| `qc_dashboard_snapshots` | 0 |
| `yard_dashboard_snapshots` | 0 |

These are legacy/module-specific snapshot tables. They do not satisfy the current Historical Snapshot Engine schema, which expects the generic snapshot/job/metadata tables above.

## Migration History

`prisma migrate status` reports:

```text
78 migrations found
Database schema is up to date!
```

Applied snapshot-related migrations found in `_prisma_migrations` include older foundations:

| Migration | Purpose observed |
| --- | --- |
| `20260707133000_persisted_snapshot_foundation` | Created older dashboard snapshot tables |
| `20260708103000_inventory_domain_snapshots` | Inventory domain snapshot support |
| `20260708143000_project_detail_snapshots` | Project detail snapshots |
| `20260709143000_inventory_historical_metrics` | Altered older inventory dashboard snapshots |
| `20260711130000_production_snapshot_foundation` | Production dashboard snapshots |
| `20260712120000_component_snapshot_foundation` | Component dashboard snapshots |
| `20260713120000_qc_snapshot_foundation` | QC dashboard snapshots |
| `20260713180000_yard_snapshot_foundation` | Yard dashboard snapshots |

No migration SQL exists for:

- `snapshot_metadata`
- `snapshot_jobs`
- `snapshot_job_logs`
- `snapshot_rebuild_requests`
- `dashboard_snapshots`
- `inventory_balance_snapshots`
- `dashboard_monthly_rollups`
- `inventory_monthly_rollups`
- the new Historical Snapshot enum types

The backup `/tmp/steeltrack-stability2-20260727-101220.dump` also contains the older snapshot tables, not the new generic Historical Snapshot tables.

## Git History

Git search for `snapshot_metadata` and `model SnapshotMetadata` found only commit:

```text
a8a75b4 backup trước khi giao gemini
```

That commit modified `apps/backend-api/prisma/schema.prisma` and added Historical Dashboard / Snapshot Engine implementation files, but did not add a Prisma migration folder for the new models.

The same commit added `docs/runtime/historical-dashboard-prisma-migration-plan.md`, which states the Prisma schema was implemented and that a migration should be generated/reviewed later. This is the clearest evidence that the schema change was committed without a corresponding database migration.

## Why Migrate Status Says Up To Date

`prisma migrate status` checks the database `_prisma_migrations` table against migration folders on disk.

It does not compare the current Prisma datamodel against the live database.

Therefore:

- All migration folders currently on disk are applied or resolved.
- Prisma correctly reports "up to date" relative to existing migrations.
- The live database is still missing tables because no migration folder exists for the Historical Snapshot models.

`prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema.prisma --exit-code` detects the drift because it compares the actual database schema directly against `schema.prisma`.

That diff reports the Historical Snapshot enums and tables as added.

## Snapshot Runtime Impact

Runtime failure observed:

```text
HistoricalSnapshotEngineService startup tick failed:
The table public.snapshot_metadata does not exist
```

Code path:

```text
HistoricalSnapshotEngineService.executeTick()
  -> scheduleDueJobs()
  -> prisma.snapshotMetadata.findMany(...)
```

Affected runtime behavior:

| Area | Impact |
| --- | --- |
| Backend process | Does not crash immediately; health endpoints can still pass |
| Snapshot scheduler | Fails on first metadata query |
| Snapshot job queue | Cannot create/read jobs because `snapshot_jobs` is missing |
| Snapshot job logs | Cannot write logs because `snapshot_job_logs` is missing |
| Dashboard snapshots | Cannot generate/read generic dashboard snapshots |
| Inventory historical snapshots | Cannot generate/read inventory balance snapshots |
| Monthly rollups | Cannot generate/read dashboard or inventory monthly rollups |
| Historical API | Request paths using these Prisma models will fail at runtime |

## Historical Data Risk

Finding: no evidence of deleted Historical Snapshot data was found.

Reasoning:

- The new generic tables do not exist in the current PostgreSQL database.
- The STABILITY.2 backup does not contain the new generic tables.
- Git history shows schema additions without a migration.
- Existing older snapshot tables still exist and contain some data.

Risk classification:

| Data category | Risk |
| --- | --- |
| New generic Historical Snapshot tables | Low data-loss risk because they appear never physically created |
| Existing legacy snapshot tables | Medium migration risk because they may contain useful historical data |
| Historical Dashboard runtime | High operational risk until corrective migration exists |

Do not drop or overwrite legacy snapshot tables during remediation. If the new generic model replaces them, write a deliberate migration/backfill plan.

## Port 3000 Process

Port `3000` is occupied by:

```text
node --enable-source-maps /opt/projects/steeltrack/apps/backend-api/dist/main
```

This explains earlier restart attempts failing with `EADDRINUSE`. It is an existing backend process, not evidence of another application by itself.

Because the process environment did not expose the database URL in the inspected output, runtime-vs-CLI identity cannot be proven solely through environment inspection. However, the process path, health behavior, and Prisma error shape are consistent with the current SteelTrack backend using a Prisma client generated from the current schema against a database missing those tables.

## Root Cause

Root cause: Historical Snapshot Prisma models and enums were added to `schema.prisma`, and backend code was implemented against them, but no corresponding Prisma migration was created/applied for the live database.

This created three states:

1. Prisma schema contains Historical Snapshot models.
2. Generated Prisma client can call `snapshotMetadata`, `snapshotJob`, `dashboardSnapshot`, and related models.
3. PostgreSQL does not contain the mapped tables or enum types.

That is why build/type generation can pass while runtime fails.

## Recommended Remediation

Recommendation: create a forward-only corrective migration in the next sprint.

The migration should be create-only and narrowly scoped to the missing Historical Snapshot objects:

- 10 enum types listed in this report
- 8 mapped tables listed in this report
- primary keys, unique constraints, foreign keys, and Prisma-supported indexes from `schema.prisma`
- reviewed raw SQL for PostgreSQL-specific constraints/partition readiness where Prisma cannot express them
- seed or configure `snapshot_metadata` rows only after table creation, preferably as a deliberate seed/ops step

Important guardrails:

- Do not use `prisma db push`.
- Do not reset the database.
- Do not apply the raw `migrate diff` output blindly.
- Exclude unrelated drift from the corrective migration unless explicitly approved:
  - `inventory_location_stocks_backup` removal
  - unrelated `updatedAt` default changes
  - unrelated index rename noise
- Preserve existing legacy snapshot tables until a separate backfill/deprecation decision is made.

Rejected remediation options:

| Option | Decision | Reason |
| --- | --- | --- |
| Restore missing migration from git | Not viable | No migration folder exists in git for these models |
| Restore from STABILITY.2 backup | Not useful | Backup also lacks the new generic tables |
| Change database target | Not primary fix | Evidence points to schema drift, not wrong DB |
| Remove schema definitions | Not recommended | Runtime engine/API already depend on them |
| Manual table creation | Not recommended | Would bypass Prisma migration history and worsen drift |

## Remaining P0

1. Create/review/apply a forward-only corrective Prisma migration for the missing Historical Snapshot schema.
2. Ensure `snapshot_metadata` exists before the Snapshot Engine starts scheduling.
3. Validate Historical Dashboard API read paths after migration:
   - `/history/dashboard`
   - `/history/dashboard/latest`
   - `/history/dashboard/monthly`
   - `/history/inventory`
   - `/history/inventory/monthly`
   - `/history/jobs`

## Remaining P1

1. Decide whether legacy snapshot tables should be backfilled into the new generic snapshot schema.
2. Add a deployment check that fails startup or marks readiness degraded when required Historical Snapshot tables are missing.
3. Document operational seed data for `snapshot_metadata`.
4. Add a drift check to CI using `prisma migrate diff` in review mode.

## Recommendation

NO-GO for Historical Snapshot runtime until the corrective migration is created and applied.

The safest next task is:

```text
STABILITY.4 - Historical Snapshot Corrective Migration
```

Scope should be limited to generating and reviewing the missing Historical Snapshot schema migration. No Snapshot Engine redesign, no API changes, no frontend work.

## STABILITY.4 Update

Status: RESOLVED

STABILITY.4 created and deployed one forward-only corrective migration:

```text
apps/backend-api/prisma/migrations/20260727210000_historical_snapshot_corrective_schema/migration.sql
```

The migration created the missing Historical Snapshot enums, tables, indexes,
unique constraints and foreign keys already defined in `schema.prisma`.

Deployment result:

```text
79 migrations found in prisma/migrations
Database schema is up to date!
```

The previous runtime blocker:

```text
The table public.snapshot_metadata does not exist
```

was resolved during runtime smoke testing. `/history/*` read endpoints now
return controlled empty or not-found responses instead of schema-level 500s.

Legacy snapshot tables and row counts were preserved. Remaining schema drift is
limited to unrelated pre-existing items documented in
`docs/audits/historical-snapshot-corrective-migration-report.md`.

## Verification

Commands run or required for this audit:

| Check | Result |
| --- | --- |
| `prisma migrate status` | PASS: existing migrations are up to date |
| `prisma validate` | PASS |
| PostgreSQL snapshot object inventory | ERROR: new Historical Snapshot tables/enums missing |
| Git history inspection | PASS: schema-only addition found, no migration found |
| Runtime dependency inspection | ERROR: Snapshot Engine reads missing `snapshot_metadata` at startup tick |

Final verification commands should be rerun after writing this report:

```bash
pnpm -C apps/backend-api exec prisma migrate status
pnpm -C apps/backend-api exec prisma validate
git diff --check
git status --short
```
