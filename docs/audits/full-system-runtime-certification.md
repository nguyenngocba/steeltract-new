# Full System Runtime Certification

## STABILITY.7 Addendum - B1 Runtime Integration Certification

Status: GREEN

The STABILITY.5 P1 B1 runtime integration fixture condition has been resolved.
A controlled namespace fixture `STABILITY7-1785129145020` executed the runtime
path:

```text
Component DRAFT
-> Revision R1
-> Engineering BOM replace/validate
-> Engineering Release
-> Production Order creation
-> Production BOM materialization
-> Production Order BOM binding
```

Key evidence:

| Check | Result |
| --- | --- |
| Component starts DRAFT | PASS |
| Production create before Engineering Release is blocked | PASS |
| Invalid Engineering BOM input is rejected | PASS |
| Engineering BOM validates and releases | PASS |
| Component becomes ACTIVE with current released revision | PASS |
| Production Order binds Component, Revision, Engineering BOM definition and materialized Production BOM | PASS |
| Production BOM lineage preserves `componentId`, `componentRevisionId`, `bomDefinitionId`, `engineeringContentHash` | PASS |
| BOM materialization replay is idempotent | PASS |
| Existing Production Order remains bound to R1 after R2 is released | PASS |
| Legacy business records were not used as fixtures | PASS |

Certification detail:

- Report: `docs/audits/b1-runtime-integration-certification.md`
- Fixture retained for audit under namespace `STABILITY7-1785129145020`.
- No schema migration, reset, db push, staging, commit, or feature
  implementation was performed.

## STABILITY.6 Addendum – Historical Snapshot Date Normalization

Status: GREEN

The STABILITY.5 P1 Historical Snapshot `@db.Date` timezone/date mismatch has
been resolved. Snapshot business dates now use strict `YYYY-MM-DD` semantics:
they are persisted as UTC-midnight Date values, read back by UTC date
components, and serialized by the Historical Dashboard API as `YYYY-MM-DD`.
Technical timestamps remain ISO strings.

Controlled checks:

| Check | Result |
| --- | --- |
| UTC business-date helper | PASS, `2026-07-29` -> `2026-07-29T00:00:00.000Z` |
| Asia/Ho_Chi_Minh helper | PASS, local `2026-07-29 00:00` instant `2026-07-28T17:00:00.000Z` -> `2026-07-29T00:00:00.000Z` |
| Leap-day parse | PASS, `2024-02-29` accepted |
| Invalid non-leap date | PASS, `2026-02-29` rejected |
| Year-boundary previous month | PASS, `2026-01-15` -> `2025-12-01` through `2025-12-31` |
| Controlled scheduler/job/snapshot DB run | PASS, `YARD/stability6_dashboard_daily` stored `2026-07-29` consistently |
| Historical Dashboard read path | PASS, controller/service/repository returned `snapshotDate: "2026-07-29"` |

Verification:

| Check | Result |
| --- | --- |
| Prisma validate | PASS |
| Prisma generate | PASS |
| Prisma migrate status | PASS, schema up to date |
| Backend tests | PASS, 76 suites / 215 tests |
| Backend build | PASS |
| Frontend build | PASS |
| `git diff --check` | PASS |

## 1. Platform Baseline

Status: GREEN

Runtime database identity:

| Field | Value |
| --- | --- |
| Database | `steeltrack` |
| Schema | `public` |
| Server address | `::1` |
| Server port | `5432` |

Platform checks:

| Check | Result |
| --- | --- |
| PostgreSQL connectivity | PASS |
| `prisma migrate status` | PASS, 79 migrations found, schema up to date |
| `prisma validate` | PASS |
| `prisma generate` | PASS |
| Backend process | PASS, `node --enable-source-maps /opt/projects/steeltrack/apps/backend-api/dist/main` |
| `/health/live` | PASS, `200 OK` |
| `/health/ready` | PASS, `200 OK`, database up |
| Backend build | PASS |
| Frontend build | PASS |

No pending migration was detected.

## 2. Database Drift

Status: YELLOW

Schema-vs-database diff no longer reports missing Historical Snapshot objects.
Remaining drift is pre-existing and outside STABILITY.5 remediation scope.

| Drift | Classification | Prevents certification | Notes |
| --- | --- | --- | --- |
| `inventory_location_stocks_backup` exists in DB but not Prisma schema | BENIGN / TECHNICAL DEBT | No | Backup table drift. It should be documented or moved out of `public` in a future DBA cleanup sprint. |
| `WorkOrder.updatedAt` DB default is `now()` but Prisma schema has no default | TECHNICAL DEBT | No | Prisma `@updatedAt` still owns application updates. The DB default may mask missing application values but does not currently break runtime. |
| `project_tasks.updatedAt` DB default is `now()` but Prisma schema has no default | TECHNICAL DEBT | No | Same pattern as above. |
| `project_templates.updatedAt` DB default is `now()` but Prisma schema has no default | TECHNICAL DEBT | No | Same pattern as above. |
| `project_task_dependencies` index name differs by truncated suffix | BENIGN | No | PostgreSQL/Prisma name truncation mismatch only. No functional impact observed. |

No DATA INTEGRITY RISK was found in the remaining drift.

## 3. Module Runtime Matrix

| Module | DB | API | Runtime | Core Flow | Status |
| --- | --- | --- | --- | --- | --- |
| Dashboard / Executive | GREEN | GREEN | GREEN | N/A | GREEN |
| Inventory | GREEN | GREEN | GREEN | Read workflow PASS | GREEN |
| Components | GREEN | GREEN | GREEN | Unit/targeted PASS | GREEN |
| Production | GREEN | GREEN | GREEN | Unit/targeted PASS | GREEN |
| QC | GREEN | GREEN | GREEN | Unit/API PASS | GREEN |
| Projects | GREEN | GREEN | GREEN | Unit/API PASS | GREEN |
| Suppliers | GREEN | GREEN | GREEN | API PASS | GREEN |
| Logistics / Dispatch | GREEN | GREEN | GREEN | Unit/API PASS | GREEN |
| Yard / Component Inventory | GREEN | GREEN | GREEN | API PASS | GREEN |
| Historical Snapshot | GREEN | YELLOW | GREEN | Minimum workflow PASS with date caveat | YELLOW |
| UOM / Master Data | GREEN | GREEN | GREEN | API PASS | GREEN |
| Admin / System | GREEN | GREEN | GREEN | API PASS | GREEN |

Representative authenticated API smoke results:

| Module | Endpoint | Status | Classification |
| --- | --- | ---: | --- |
| Runtime Dashboard | `GET /runtime/overview` | 200 | PASS |
| Inventory | `GET /inventory/overview` | 200 | PASS |
| Inventory | `GET /inventory/materials?page=1&pageSize=5` | 200 | PASS |
| Inventory | `GET /inventory/transactions?page=1&pageSize=5` | 200 | PASS |
| Components | `GET /components/read-model/overview` | 200 | PASS |
| Components | `GET /components/read-model/list?page=1&pageSize=5` | 200 | PASS |
| Production | `GET /production?page=1&pageSize=5` | 200 | PASS |
| Production | `GET /production/reservations?page=1&pageSize=5` | 200 | PASS |
| QC | `GET /qc/dashboard` | 200 | PASS |
| QC | `GET /qc/read-model/workspace` | 200 | PASS |
| Projects | `GET /projects?page=1&pageSize=5` | 200 | PASS |
| Suppliers | `GET /suppliers?page=1&pageSize=5` | 200 | PASS |
| Logistics | `GET /logistics/dispatch-dashboard` | 200 | PASS |
| Yard | `GET /yard/dashboard` | 200 | PASS |
| UOM | `GET /master-data/uom?page=1&pageSize=5` | 200 | PASS |
| Admin | `GET /system/overview` | 200 | PASS |
| Historical Snapshot | `GET /history/jobs?page=1&pageSize=5` | 200 | PASS |
| Historical Snapshot | `GET /history/inventory?date=2026-07-27&page=1&pageSize=5` | 200 | PASS empty |

Expected/not-failure responses:

| Endpoint | Status | Reason |
| --- | ---: | --- |
| `GET /dashboard` | 404 | No backend route registered at `/dashboard`; frontend dashboard uses other read endpoints. |
| `GET /production/queues` | 404 | No backend route registered at this path. Not used as a certified backend contract. |

No unexpected `500` was observed in authenticated API smoke.

## 4. Frontend Route Matrix

Status: YELLOW

Frontend build and Vite preview route shell were verified. Browser-level React
rendering was not certified because no authenticated browser/Playwright harness
was available in this sprint.

| Route | Preview shell | Browser render | Status |
| --- | --- | --- | --- |
| `/` | PASS | NOT TESTED | YELLOW |
| `/components` | PASS | NOT TESTED | YELLOW |
| `/components/list` | PASS | NOT TESTED | YELLOW |
| `/inventory` | PASS | NOT TESTED | YELLOW |
| `/inventory/materials` | PASS | NOT TESTED | YELLOW |
| `/inventory/inbound` | PASS | NOT TESTED | YELLOW |
| `/inventory/outbound` | PASS | NOT TESTED | YELLOW |
| `/production` | PASS | NOT TESTED | YELLOW |
| `/production/orders` | PASS | NOT TESTED | YELLOW |
| `/qc` | PASS | NOT TESTED | YELLOW |
| `/projects/list` | PASS | NOT TESTED | YELLOW |
| `/suppliers/list` | PASS | NOT TESTED | YELLOW |
| `/logistics` | PASS | NOT TESTED | YELLOW |
| `/history` | PASS | NOT TESTED | YELLOW |

Preview route shell evidence:

- every listed route returned `200`
- every listed route served `<div id="root"></div>`
- every listed route served the built app script

## 5. Cross-Module Workflow

Status: GREEN

Current B1 boundary:

```text
Component
→ Revision
→ Engineering BOM
→ Validation
→ Engineering Release
→ Production Order
→ Production BOM materialization
```

Evidence:

- Targeted Components/Production/BOM tests passed.
- `ProductionBomMaterializationService` targeted suite passed.
- STABILITY.7 controlled runtime fixture passed with namespace
  `STABILITY7-1785129145020`.
- The fixture created a DRAFT Component, released revision R1 with a validated
  Engineering BOM, created a Production Order, materialized a Production BOM,
  replayed materialization idempotently, then released R2 and verified the
  existing Production Order remained bound to R1.

Certification:

| Check | Result |
| --- | --- |
| Unit/targeted B1 workflow | PASS |
| Runtime E2E with controlled DB fixture | PASS |

The STABILITY.5 condition is closed. The controlled fixture is retained for
audit traceability and is isolated by namespace.

## 6. Inventory Verification

Status: GREEN

Verified current behavior:

| Area | Result |
| --- | --- |
| Material master read | PASS |
| Inventory overview | PASS |
| Inbound/outbound transaction read | PASS through `/inventory/transactions` |
| Location/warehouse reference | PASS through `/inventory/zones` and overview facets |
| Regression from snapshot migration | No regression observed |

No controlled stock-affecting transaction was created in this sprint.

## 7. Snapshot Workflow

Status: YELLOW

Minimum Snapshot Engine workflow was executed with controlled metadata:

| Step | Result |
| --- | --- |
| Create/upsert `SnapshotMetadata` rows | PASS |
| Scheduler job creation | PASS, 2 jobs scheduled |
| Job processing | PASS, 2 jobs completed |
| Dashboard snapshot generation | PASS, 1 dashboard snapshot |
| Inventory balance snapshot generation | PASS, 77 rows |
| Job logs | PASS, 6 INFO logs |
| `/history/jobs` read | PASS |
| `/history/inventory` read | PASS for actual stored date |

Created metadata:

- `INVENTORY / dashboard_daily`
- `INVENTORY / inventory_balance_daily`

Observed counts after workflow:

| Object | Count |
| --- | ---: |
| `snapshot_metadata` | 2 |
| `snapshot_jobs` | 2 |
| `dashboard_snapshots` | 1 |
| `inventory_balance_snapshots` | 77 |
| `snapshot_job_logs` | 6 |

Important P1 finding:

The minimum workflow exposed a date/timezone mismatch. The scheduler input date
was intended as the current day, but the stored `@db.Date` rows landed on
`2026-07-25`. API reads succeeded for `2026-07-25`, while reads for
`2026-07-26` / `2026-07-27` returned controlled empty/not-found responses.

This does not reintroduce the missing-table P0, but it prevents Historical
Dashboard date semantics from being certified as production-ready.

## 8. Background Services

Status: GREEN

Observed background/runtime services:

- Historical Snapshot Engine
- Projection / Query API services
- Runtime event / WebSocket modules
- Jobs module
- Health/readiness services

Findings:

| Area | Result |
| --- | --- |
| Missing-table errors | None observed after STABILITY.4 |
| Snapshot job logs | INFO only |
| Snapshot jobs | 2 completed / 0 failed |
| Health/readiness | PASS |

No continuous background Prisma error loop was observed during certification.

## 9. Runtime Errors

Status: YELLOW

Observed runtime issues:

| Finding | Severity | Classification | Notes |
| --- | --- | --- | --- |
| Sandbox backend start could not connect to `localhost:5432` | Low | Environment-only | Escalated runtime and active backend process worked. |
| Escalated temporary backend start hit `EADDRINUSE` | Low | Environment/process | Existing backend process already served port `3000`. No production fault. |
| Historical Snapshot date mismatch | Medium | FUNCTIONAL RISK | Needs a date normalization sprint before relying on exact historical day semantics. |

No `P20*`, missing table, unhandled exception, or repeated background failure was observed after the corrective migration.

## 10. Regression Suite

Status: GREEN

Full suites:

| Command | Result |
| --- | --- |
| `pnpm -C apps/backend-api test` | PASS, 75 suites / 210 tests |
| `pnpm -C apps/frontend test` | PASS, 1 file / 2 tests |
| `pnpm -C apps/backend-api build` | PASS |
| `pnpm -C apps/frontend build` | PASS |
| `pnpm -C apps/backend-api exec prisma validate` | PASS |
| `pnpm -C apps/backend-api exec prisma migrate status` | PASS |
| `git diff --check` | PASS |

Targeted backend suites:

| Area | Result |
| --- | --- |
| Historical Dashboard | PASS |
| Snapshot Engine | PASS |
| Components | PASS |
| Engineering/Production BOM | PASS |
| Production Commands | PASS |
| Inventory | PASS |
| QC | PASS |
| Projects | PASS |
| Logistics | PASS |

Targeted command result:

```text
13 suites passed / 63 tests passed
```

## 11. P0 / P1 / P2 Findings

### P0

None.

### P1

| Finding | Recommendation |
| --- | --- |
| Historical Snapshot date/timezone mismatch | Normalize `@db.Date` handling across Snapshot Engine and Historical Dashboard API. Use one canonical date policy and add tests for Asia/Ho_Chi_Minh and UTC boundaries. |
| B1 runtime E2E not certified with existing DB data | Seed controlled engineering release/BOM fixture or create a rollback-capable integration harness. |
| Frontend browser render not certified | Add authenticated Playwright/browser route smoke before full green release certification. |
| Unrelated DB drift remains | Schedule DBA cleanup decision; do not mix with feature sprints. |

### P2

| Finding | Recommendation |
| --- | --- |
| Frontend bundle chunk warnings | Continue code-splitting work in a frontend performance sprint. |
| Historical Snapshot raw SQL hardening not applied | Review partitioning/check/partial/GIN indexes separately after base stability. |
| Snapshot workflow only covers Inventory metadata | Extend staging QA to other dashboard modules after date policy is fixed. |

## 12. Certification Score

| Category | Score |
| --- | ---: |
| Database Integrity | 8 / 10 |
| Backend Runtime | 9 / 10 |
| API Stability | 8 / 10 |
| Frontend Runtime | 6 / 10 |
| Cross-Module Integrity | 7 / 10 |
| Background Services | 8 / 10 |
| Migration Discipline | 8 / 10 |
| Test Coverage | 8 / 10 |

Overall baseline: 78%

The score is intentionally conservative because frontend browser rendering and
B1 runtime E2E were not fully certified, and Historical Snapshot date semantics
need correction.

## 13. Baseline Decision

CERTIFIED WITH CONDITIONS

Rationale:

- No P0 remains.
- Migration status is clean.
- Critical backend APIs smoke without unexpected 500s.
- Historical Snapshot missing-table runtime failure is resolved.
- Snapshot minimum workflow creates jobs and snapshots.
- Backend tests/build and frontend tests/build pass.
- Remaining issues are P1/P2 and do not block baseline development, but they do
  block claiming full production-grade historical date accuracy.

## 14. Recommended Next Work

1. Fix Historical Snapshot date normalization.
2. Add an authenticated browser smoke harness for major frontend routes.
3. Add a controlled B1 integration fixture that can run without polluting persistent business data.
4. Decide cleanup plan for unrelated Prisma/database drift.
5. After those are complete, resume Component Manufacturing Workflow Sprint C.
