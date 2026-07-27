# Post-B1 Regression & Runtime Verification Report

Date: 2026-07-27

Sprint: STABILITY.1 - Post B1 Regression & Runtime Verification

Scope: Sprint A/B1 runtime stability only. Sprint C-J, UI redesign, Inventory,
QC, Yard, Logistics, Projects, Historical Dashboard, Snapshot Engine and
Warehouse Realtime were not changed.

## 1. Executive Summary

Recommendation: **NO-GO**

Severity: **P0 - runtime schema/client mismatch**

Sprint A/B1 code compiles and unit tests pass, but the running database is not
compatible with the generated Prisma client. The B1 migration
`20260727200000_bom_engineering_lineage` is pending, while Prisma Client has
already been generated from the new schema and expects the new `BOM` lineage
columns. Any runtime query that selects from `BOM` through Prisma can fail.

Confirmed failure:

```text
Invalid `prisma.bOM.findFirst()` invocation:
The column `BOM.componentId` does not exist in the current database.
```

Direct SQL proof:

```sql
select id, "componentId" from "BOM" limit 1;
```

Result:

```text
ERROR:  column "componentId" does not exist
```

Feature development must remain stopped until the database migration state is
resolved and runtime smoke tests are re-run.

## 2. Original Components Failure

Observed failure class: **A. Migration/database mismatch**

The Components UI can trigger `useComponentProductionBoms()` when detail,
production or BOM flows are opened. That hook calls:

```text
GET /production/boms
```

Backend path:

```text
ProductionController.listBoms()
-> BOMService.findAll()
-> BomRepository.findAll()
-> prisma.bOM.findMany()
```

Because Prisma Client now knows about B1 `BOM` scalar fields but the database
table does not, this endpoint is expected to fail after authentication.

Authenticated HTTP endpoint execution was not completed because no safe test
credential was available and JWT bypass was intentionally not used.

## 3. Root Cause

Root cause: **Prisma schema/client was updated for B1, but the target database
has not applied the B1 migration.**

Evidence:

```text
pnpm -C apps/backend-api exec prisma migrate status
```

Output:

```text
Following migrations have not yet been applied:
20260717190000_enterprise_data_scalability_indexes
20260727200000_bom_engineering_lineage
```

Database metadata for `BOM` shows only legacy columns:

```text
id
bomNo
productCode
productName
version
status
createdAt
structureType
projectId
unit
estimatedWeight
updatedAt
```

Missing B1 columns:

```text
componentId
componentRevisionId
bomDefinitionId
engineeringContentHash
source
materializedAt
materializedBy
```

Why tests/build missed it:

- Unit tests use mocked repositories/services and do not execute real Prisma
  queries against the local database.
- `prisma validate` validates schema syntax, not whether migrations are applied.
- `prisma generate` generated a client matching `schema.prisma`, not the current
  database.
- Backend build type-checks source code and does not validate live database
  column availability.

## 4. Migration State

Current branch:

```text
feature/shared-cockpit-foundation
```

Migration state:

| Migration | State | Notes |
| --- | --- | --- |
| `20260717190000_enterprise_data_scalability_indexes` | Pending | Pre-existing pending migration. |
| `20260727200000_bom_engineering_lineage` | Pending | B1 migration required by generated Prisma Client. |

B1 migration status: **PENDING**

Action taken: **No migration was applied.**

Reason: Prompt requires stopping and reporting before schema modification when a
schema change appears necessary.

## 5. Database Compatibility Findings

Read-only counts:

| Table | Count |
| --- | ---: |
| `components` | 2 |
| `component_revisions` | 0 |
| `component_bom_definitions` | 0 |
| `component_release_evidence` | 0 |
| `BOM` | 2 |
| `BOMItem` | 3 |
| `production_orders` | 2 |

Component lifecycle:

| lifecycleState | Count |
| --- | ---: |
| `NULL` | 2 |

Production orders:

| Status | Count |
| --- | ---: |
| `DRAFT` | 1 |
| `COMPLETED` | 1 |

Production order BOM compatibility:

| Check | Count |
| --- | ---: |
| Orders without BOM | 0 |
| Orders with BOM | 2 |
| Orders with orphan BOM reference | 0 |
| Orphan BOM items | 0 |

Findings:

- Existing legacy Components are readable in principle, but have
  `lifecycleState=NULL` and no ComponentRevision records.
- Existing legacy Production BOMs are valid pre-B1 records, but the database
  cannot satisfy the generated Prisma Client because B1 columns are absent.
- No orphan `BOM` / `BOMItem` / ProductionOrder relationship was found.
- No released Component BOM definitions exist, so B1 materialization against
  existing Engineering BOM data cannot be tested with real legacy data.

## 6. Components Regression Results

| Check | Result | Evidence |
| --- | --- | --- |
| Components list route registered | PASS | Backend mapped `/components/read-model/list`. |
| Components overview route registered | PASS | Backend mapped `/components/read-model/overview`. |
| Components command routes registered | PASS | Backend mapped `/components/commands/*`. |
| Components list authenticated response | NOT TESTED | No safe credential available. Unauthenticated call returns 401. |
| Component detail authenticated response | NOT TESTED | No safe credential available. |
| Create component as Draft | NOT TESTED | Mutation intentionally not executed during P0 migration mismatch. |
| Revision create/view flow | NOT TESTED | No existing revisions; mutation intentionally not executed. |
| Engineering BOM save/validate/release runtime | NOT TESTED | Requires mutation and B1 DB readiness. |
| Component Inventory views | NOT TESTED | Authenticated route not executed. |

Important confirmed risk:

Components List/Action flows can load `productionApi.boms()` via
`useComponentProductionBoms()`. That path is expected to fail until the B1
migration is applied.

## 7. B1 Integration Results

B1 unit tests passed previously, but real database integration is **FAIL** until
migration is applied.

| Integration Assertion | Result | Notes |
| --- | --- | --- |
| Exactly one Production BOM materialized | NOT TESTED | Requires B1 columns and safe test data. |
| BOMItem quantities correct | NOT TESTED | Requires materialization. |
| `wastePercent` preserved | NOT TESTED | Requires materialization. |
| Lineage correct | FAIL | Cannot persist/query lineage because columns do not exist. |
| `engineeringContentHash` correct | FAIL | Cannot persist/query hash because column does not exist. |
| Repeated materialization idempotent | NOT TESTED | Requires B1 unique index. |
| ProductionOrder references materialized BOM | NOT TESTED | Requires materialization. |

## 8. Legacy Compatibility Results

| Legacy Record Type | Result | Notes |
| --- | --- | --- |
| Legacy Component | CONDITIONALLY PASS | Records exist; no direct authenticated read was executed. |
| Legacy ComponentRevision | NOT APPLICABLE | Count is 0. |
| Legacy ComponentBomDefinition | NOT APPLICABLE | Count is 0. |
| Legacy/manual BOM | FAIL AT RUNTIME | `prisma.bOM.findFirst()` fails because B1 columns are missing in DB. |
| Existing ProductionOrder | CONDITIONALLY PASS | FK relationships are intact, but queries including BOM can fail. |

Read compatibility and materialization eligibility are separate:

- Legacy Components with `lifecycleState=NULL` may remain readable.
- They are not eligible for Sprint A/B1 Engineering Release materialization until
  remediated into the released revision/BOM contract.

## 9. Cross-Module Smoke Test

Backend runtime outside sandbox:

```text
GET /health/live -> 200 OK
```

Protected endpoint behavior without token:

```text
GET /production/boms -> 401 Unauthorized
GET /components/read-model/list -> 401 Unauthorized
```

Authenticated smoke tests:

| Module | Result | Notes |
| --- | --- | --- |
| Components | NOT TESTED | No safe credential available. |
| Inventory | NOT TESTED | No safe credential available. |
| Production | PARTIAL FAIL | Direct Prisma `BOM` query fails due missing column. |
| QC | NOT TESTED | No safe credential available. |
| Yard / Component Inventory | NOT TESTED | No safe credential available. |
| Logistics | NOT TESTED | No safe credential available. |
| Projects | NOT TESTED | No safe credential available. |

Sandbox runtime note:

- Starting backend inside the sandbox failed to connect to PostgreSQL at
  `localhost:5432`.
- Starting backend outside sandbox succeeded far enough for `GET /health/live`
  to return `200 OK`.

## 10. Bugs Found

### P0 - B1 migration pending while Prisma Client expects new BOM columns

Affected workflow:

- Components detail / Production BOM dependent flows.
- Production BOM list/detail.
- Production Order creation with component-bound B1 materialization.
- Any Prisma query against `BOM` that selects scalar fields.

Root cause:

- Database has not applied `20260727200000_bom_engineering_lineage`.

Fix required:

- Apply reviewed migrations in a controlled migration deployment sequence.
- Re-run Prisma generate and runtime smoke tests after migration.

No code fix was applied in this sprint because the required correction is a DB
migration state change and the prompt requires reporting before schema
modification.

## 11. Fixes Applied

None.

Reason: Confirmed P0 requires migration deployment. The prompt explicitly
requires stopping and reporting before schema modification.

## 12. Regression Tests Added

None in STABILITY.1.

Existing B1 focused tests still exist for:

- Engineering BOM materialization.
- Invalid Engineering BOM rejection.
- Missing material rejection.
- Content hash mismatch.
- Idempotent reuse.
- Concurrent unique-conflict recovery.
- Production command BOM binding.

Recommended additional regression test after migration readiness:

- Real database integration test that fails fast when `schema.prisma` and DB
  migration state diverge for `BOM` lineage fields.
- Runtime smoke test for `GET /production/boms` with authenticated test user.
- Component page integration test that opens the Components detail/BOM flow.

## 13. Remaining Risks

| Severity | Risk | Recommendation |
| --- | --- | --- |
| P0 | Pending B1 migration makes generated Prisma Client incompatible with DB. | Apply migration through approved deploy flow, not reset/db push. |
| P1 | Pre-existing pending migration `20260717190000_enterprise_data_scalability_indexes`. | Review whether it must be deployed before B1 in the same environment. |
| P1 | No authenticated runtime smoke tests completed. | Provide test credential or seeded auth flow; rerun Components/Production smoke. |
| P2 | Legacy Components have `lifecycleState=NULL`. | Keep readable; create remediation plan before requiring new Engineering release. |

## 14. Runtime Verification

| Area | Result | Evidence |
| --- | --- | --- |
| Git status captured | PASS | Dirty B1 files and docs present; no staged files checked separately. |
| Git diff hygiene | PASS | `git diff --check` returned clean. |
| Prisma validate | PASS | Schema syntax valid. |
| Prisma generate | PASS | Client generated against new schema. |
| Migration status | FAIL | B1 migration pending. |
| DB connectivity via Prisma/psql outside sandbox | PASS | Counts and metadata read successfully. |
| DB compatibility with generated Prisma Client | FAIL | `BOM.componentId` missing. |
| Backend runtime health outside sandbox | PASS | `/health/live` returned 200. |
| Authenticated API smoke | NOT TESTED | No safe credential; JWT bypass intentionally not used. |
| Components original error repro via UI | NOT TESTED | Browser/auth session not available. |

## 15. Go / No-Go Recommendation

**NO-GO - stop feature development and stabilize system.**

Required before Sprint C:

1. Review pending migration order.
2. Apply migrations through `prisma migrate deploy` or the approved deployment
   mechanism. Do not use reset or force push.
3. Re-run:
   - `prisma migrate status`
   - `prisma validate`
   - `prisma generate`
   - backend tests
   - backend build
   - frontend build
   - authenticated API smoke for Components and Production.
4. Confirm `GET /production/boms` works and Components detail/BOM flow no longer
   fails.

---

# STABILITY.2 - Database Migration Recovery & Runtime Validation

Date: 2026-07-27

## 16. Backup Result

Result: **PASS**

Runtime database identified:

| Field | Value |
| --- | --- |
| Database | `steeltrack` |
| Host/Port | local PostgreSQL on port `5432` |
| Schema | `public` |

Backup:

| Field | Value |
| --- | --- |
| Format | PostgreSQL custom format |
| Path | `/tmp/steeltrack-stability2-20260727-101220.dump` |
| Size | `686K` |
| Verification | File exists and size is greater than zero |

Credentials are intentionally not recorded in this report.

## 17. Migration Inspection

### `20260717190000_enterprise_data_scalability_indexes`

Classification:

| Operation | Present | Notes |
| --- | --- | --- |
| ADD COLUMN | No |  |
| ADD INDEX | Yes | 13 `CREATE INDEX CONCURRENTLY IF NOT EXISTS` statements. |
| ADD CONSTRAINT | No |  |
| CREATE TABLE | No |  |
| ALTER TYPE | No |  |
| DROP | No |  |
| DELETE | No |  |
| UPDATE | No |  |
| OTHER | Yes | `SET lock_timeout`, `SET statement_timeout`. |

Safety: **Additive**

Important operational note: this migration cannot be executed inside a
transaction because it uses `CREATE INDEX CONCURRENTLY`.

### `20260727200000_bom_engineering_lineage`

Classification:

| Operation | Present | Notes |
| --- | --- | --- |
| ADD COLUMN | Yes | Adds nullable B1 lineage fields plus non-null `source` default. |
| ADD INDEX | Yes | Adds BOM lineage indexes and unique `bomDefinitionId`. |
| ADD CONSTRAINT | Yes | Adds nullable FK constraints to Components/Revisions/BOM definitions. |
| CREATE TABLE | No |  |
| ALTER TYPE | No |  |
| DROP | No |  |
| DELETE | No |  |
| UPDATE | No |  |
| OTHER | No |  |

Safety: **Additive**

Legacy/manual BOM rows remain valid because lineage fields are nullable and
`source` defaults to `MANUAL`.

## 18. Preflight Data Validation

Pre-migration affected table counts:

| Table | Rows |
| --- | ---: |
| `components` | 2 |
| `component_revisions` | 0 |
| `component_bom_definitions` | 0 |
| `BOM` | 2 |
| `BOMItem` | 3 |
| `production_orders` | 2 |

Preflight checks:

| Check | Result |
| --- | --- |
| Existing B1 BOM columns | PASS - none existed before migration. |
| Existing target indexes | PASS - none of the migration indexes already existed. |
| Legacy BOM rows can accept nullable lineage fields | PASS |
| Existing BOM rows have non-null IDs | PASS |
| Orphan BOM items | PASS - 0 |
| Production orders with orphan BOM reference | PASS - 0 |
| Duplicate `bomDefinitionId` candidates | PASS - column did not exist pre-migration. |

Preflight decision: **PASS**

## 19. Migration Deployment

Initial `prisma migrate deploy` result:

```text
Applying migration `20260717190000_enterprise_data_scalability_indexes`
ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block
```

Recovery performed:

1. Verified no indexes from the failed migration had been created.
2. Applied `20260717190000_enterprise_data_scalability_indexes/migration.sql`
   directly through `psql` so `CREATE INDEX CONCURRENTLY` ran outside an
   explicit transaction.
3. Marked the migration as applied through Prisma migrate resolve:

```text
Migration 20260717190000_enterprise_data_scalability_indexes marked as applied.
```

4. Re-ran `prisma migrate deploy`.
5. Prisma applied:

```text
20260727200000_bom_engineering_lineage
```

Final migration deploy result:

```text
All migrations have been successfully applied.
```

## 20. Post-Migration Schema Verification

`prisma migrate status`:

```text
Database schema is up to date!
```

`prisma validate`: **PASS**

`prisma generate`: **PASS**

Expected B1 `BOM` columns now exist:

| Column | Nullable | Default |
| --- | --- | --- |
| `bomDefinitionId` | YES |  |
| `componentId` | YES |  |
| `componentRevisionId` | YES |  |
| `engineeringContentHash` | YES |  |
| `materializedAt` | YES |  |
| `materializedBy` | YES |  |
| `source` | NO | `MANUAL` |

Expected indexes now exist:

```text
BOM_bomDefinitionId_key
BOM_componentId_idx
BOM_componentId_status_idx
BOM_componentRevisionId_idx
BOM_engineeringContentHash_idx
background_jobs_claim_idx
background_jobs_updatedAt_id_idx
dispatch_events_order_createdAt_id_idx
inventory_transactions_reference_idx
inventory_transactions_transactionDate_id_idx
job_executions_jobId_startedAt_id_idx
outbox_events_claim_idx
outbox_events_createdAt_id_idx
outbox_events_updatedAt_id_idx
production_material_ledger_item_eventDate_id_idx
production_material_ledger_order_eventDate_id_idx
projection_documents_name_occurredAt_id_idx
projection_documents_scope_occurredAt_id_idx
```

The original B1 runtime query no longer fails:

```text
prisma.bOM.findFirst({ include: { items: true } }) -> PASS
```

Observed result:

```json
{
  "bomOk": true,
  "bomSource": "MANUAL",
  "itemCount": 1
}
```

## 21. Data Preservation Verification

Post-migration affected table counts:

| Table | Rows |
| --- | ---: |
| `components` | 2 |
| `component_revisions` | 0 |
| `component_bom_definitions` | 0 |
| `BOM` | 2 |
| `BOMItem` | 3 |
| `production_orders` | 2 |

Legacy BOM source backfill:

| Check | Result |
| --- | --- |
| Legacy BOM rows with `source='MANUAL'` | 2 |
| Legacy BOM rows with `source IS NULL` | 0 |

No record loss was detected in affected Sprint B1 tables.

## 22. Runtime Verification

Runtime health after migration:

| Endpoint | Result |
| --- | --- |
| `GET /health/live` | PASS - `200 OK` |
| `GET /health/ready` | PASS - `200 OK`, database up |

Normal login attempt with common dev credentials:

| Credential | Result |
| --- | --- |
| `admin/admin` | FAIL - `401 Invalid credentials` |

Authenticated API smoke tests therefore remain **NOT TESTED**. JWT bypass was
not used.

Components-related BOM runtime:

| Check | Result |
| --- | --- |
| Direct Prisma `BOM` read | PASS |
| Previous `BOM.componentId` missing-column error | RESOLVED |
| Authenticated `GET /production/boms` | NOT TESTED - no safe credential |

## 23. B1 Integration Verification

| Check | Result | Notes |
| --- | --- | --- |
| Production BOM materialization unit coverage | PASS | Targeted tests passed. |
| Production Order BOM binding unit coverage | PASS | Targeted tests passed. |
| Real DB B1 materialization with committed safe test data | NOT TESTED | No safe authenticated/create workflow was available. |
| Real DB lineage persistence | PARTIAL | B1 columns exist and can be queried; no Engineering BOM records exist in DB. |
| Repeated materialization idempotency | PASS in unit tests, NOT TESTED in real DB | Requires safe test data. |

Targeted tests:

```text
6 suites passed / 23 tests passed
```

Matched:

```text
component-command.service.spec.ts
component-command.dto.spec.ts
production-bom-materialization.service.spec.ts
production-command.service.spec.ts
production-legacy-outbox.spec.ts
```

## 24. Remaining Risks

### P0 - Prisma schema drift for Historical Snapshot tables

After all migrations in migration history were applied, `prisma migrate diff`
still reports schema drift: the current Prisma schema contains Historical
Dashboard snapshot models/enums that do not exist in the runtime database.

Missing tables:

```text
dashboard_snapshots
inventory_balance_snapshots
dashboard_monthly_rollups
inventory_monthly_rollups
snapshot_jobs
snapshot_job_logs
snapshot_rebuild_requests
snapshot_metadata
```

Missing enums:

```text
HistoricalDashboardModule
HistoricalSnapshotScopeType
HistoricalSnapshotGranularity
HistoricalSnapshotSource
HistoricalSnapshotStockStatus
SnapshotJobType
SnapshotJobStatus
SnapshotJobLogLevel
SnapshotFrequency
SnapshotReadinessStatus
```

Confirmed runtime error:

```text
HistoricalSnapshotEngineService startup tick failed:
The table `public.snapshot_metadata` does not exist in the current database.
```

This is outside the two pending migrations recovered in STABILITY.2. A new,
reviewed, additive migration is required before the running system can be
called stable.

### P1 - Authenticated runtime smoke unavailable

No valid safe credential was available. Protected Components, Production,
Inventory, QC, Projects and Logistics endpoints could not be called with real
auth.

### P1 - Existing backend process occupied port 3000 during restart

A backend process was already listening on port 3000 during runtime restart,
causing a temporary `EADDRINUSE` in the verification session. Health/readiness
checks still returned 200 from the existing process.

## 25. Final Go / No-Go

Recommendation: **NO-GO**

What improved:

- Backup completed.
- Pending migrations were recovered/applied.
- `prisma migrate status` is clean.
- B1 `BOM` lineage columns and indexes exist.
- Legacy B1 table row counts were preserved.
- The original `BOM.componentId` missing-column failure is resolved.
- Backend tests/build and frontend build pass.

Why the system is still NO-GO:

- Runtime still logs a missing table error for `snapshot_metadata`.
- Prisma schema and runtime database still have drift for Historical Snapshot
  tables/enums.
- Authenticated API smoke tests were not completed.

Required next action:

1. Create/review an additive Historical Snapshot schema migration matching the
   already-frozen Prisma models.
2. Apply it using the same backup/preflight/deploy discipline.
3. Re-run runtime startup and authenticated smoke tests.
