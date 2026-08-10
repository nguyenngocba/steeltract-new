# SYSTEM.RUNTIME.2 - Production Runtime Closure

Date: 2026-08-10  
Decision: **GO FOR STEELTRACK V1 RC1**

## Scope

This sprint closed the final runtime blockers without adding business features,
redesigning UI, or changing the database schema. Certification used real JWTs,
REST domain commands, PostgreSQL state, browser-rendered workspaces and canonical
read models. No fixture state was inserted through Prisma.

## P0-1 Playwright Business Certification

Playwright now orchestrates the canonical authenticated REST workflow and then
opens the corresponding browser workspace at every stage:

`Login -> Receipt -> Transfer -> Project -> Requirement -> BOM -> Production
Order -> Execution -> QC PASS -> Finished Goods -> Yard -> Dispatch -> Delivery
-> Installation -> Logout`.

Result: **PASS**, 1 test in 1.0 minute.

- Fixture: `SYSTEM-RUNTIME2-1786344833517`
- REST steps: 68
- REST assertion failures: 0
- Browser stages/screenshots: 13
- Browser console, page, request and HTTP errors: 0
- Maximum measured business API latency: 458.82 ms
- Screenshots and timings: `test-results/runtime2/`

The browser visibly confirmed the canonical fixture in Project, Requirement,
Production Order, Execution, Finished Goods, Yard, Dispatch, Delivery and
Installation workspaces. Receipt, BOM and QC pages rendered successfully but do
not expose a stable fixture-search contract; those three stages are certified by
their authoritative REST response and database lineage. Extending direct form
interaction for those views remains P1 test coverage, not a runtime blocker.

## P0-2 Health Endpoints

Implemented public production probes:

| Endpoint | Meaning | Runtime result |
| --- | --- | --- |
| `GET /health/live` | Process event-loop availability only | `200`, `live` |
| `GET /health/ready` | Database, writable storage, configured queue and Redis | `200`, `ready` |
| `GET /health/startup` | Nest bootstrap complete plus readiness dependencies | `200`, `started` |

Runtime dependency evidence:

- PostgreSQL: `up`, 1.37 ms
- Runtime storage: `up`, read/write probe 0.42 ms
- Database-backed background queue: `up`, 1.44 ms
- Redis: `not_configured`, non-required

Required dependency failure returns HTTP 503. Liveness deliberately does not
query dependencies, preventing an overloaded database from triggering process
restart loops.

## P0-3 Yard Dashboard Parity

The snapshot-first Yard reader now compares snapshot time with the latest Yard
source mutation watermark. A stale snapshot is never served as current; the
reader falls back to the live repository and schedules snapshot refresh.

Runtime comparison of `GET /yard/dashboard` and
`GET /yard/read-model/workspace`: **11/11 exact matches**.

| KPI | Dashboard | Live read model |
| --- | ---: | ---: |
| Zones | 8 | 8 |
| Slots | 93 | 93 |
| Occupied slots | 4 | 4 |
| Available slots | 89 | 89 |
| Active placements | 4 | 4 |
| Total weight | 0 | 0 |
| Today movements | 22 | 22 |
| Month movements | 24 | 24 |
| Overloaded slots | 0 | 0 |
| Cranes | 2 | 2 |
| Available cranes | 2 | 2 |

## Runtime Correctness

### REST and Database

The forward workflow completed with 68 authenticated REST operations. Database
certification passed **15/15** invariants:

- MAIN/PRODUCTION inventory reconciled to 95 units with four immutable
  transactions and two location balances.
- One Project requirement produced one Production Order and one physical
  ComponentInstance.
- Work order, execution and Production Order reached `COMPLETED`.
- FINAL QC reached `PASSED`; Finished Goods eligibility was authoritative.
- Dispatch referenced the physical ComponentInstance.
- Final physical state was `INSTALLED`.
- The active Yard placement was closed and the slot released at dispatch.
- No active Yard placement remained after installation.

### Dashboard

Before/after assertions detected authoritative changes in all required surfaces:

- Inventory: PASS
- Production: PASS
- QC: PASS
- Yard: PASS
- Logistics: PASS
- Executive BI: PASS

### RBAC and Authentication

Identity/RBAC certification passed **54/54** checks across System Administrator,
Inventory, Production Planner, Production Operator, QC Inspector, Warehouse,
Logistics and Project Manager accounts.

Evidence includes no-token `401`, insufficient-permission `403`, authorized
success, refresh-token rotation, reused refresh-token rejection, disabled-user
rejection and expired-JWT rejection.

### ActivityLog

Activity logging produced 39 workflow-visible events, including receipt,
transfer, requirement/BOM release, Production release/start/completion, material
reservation/issue/consumption, QC inspection/result, Yard placement/dispatch,
Logistics create/depart/receive and Project installation. Database lineage found
19 fixture-linked ActivityLog rows and no duplicate business mutation caused by
the certification runner.

## Runtime Defects Fixed

1. Health routes previously exposed only shallow application status. Dedicated
   lifecycle-aware probes now distinguish live, ready and startup state.
2. Yard snapshot freshness could lag current placements and movements. Source
   watermark validation now forces live fallback for stale snapshots.
3. Concurrent projection workers could race on the unique projection receipt
   and emit Prisma `P2002`. The losing transaction now rolls back, re-reads the
   receipt and returns an idempotent replay result. No partial projection or
   duplicate receipt is visible.
4. Runtime scripts were fixed to support deterministic run prefixes,
   forward-only certification, portable evidence paths and final-state database
   assertions.

## Remaining Warnings

### P1

- Browser form automation is still hybrid: Playwright runs all canonical writes
  through authenticated REST and verifies each browser workspace. Direct field
  entry should be added for Receipt, BOM and QC when stable test selectors are
  available.
- Under concurrent runtime load, background snapshot workers can log safe
  `lease ownership lost` warnings and snapshot inserts reached 2.7 seconds. The
  ownership guard prevents stale workers from committing; monitor contention and
  tune worker concurrency before high-volume production.
- Login and several list endpoints exceeded their local warning budgets
  (roughly 300-685 ms), although the certified business workflow had no request
  above the 500 ms slow-API threshold.

### P2

- Add a persistent CI artifact publisher for screenshots, timing JSON and REST/
  DB evidence instead of retaining them only in local `test-results` and `/tmp`.

## Verification

| Gate | Result |
| --- | --- |
| Prisma validate | PASS |
| Prisma generate | PASS |
| Prisma migrate status | PASS, 90 migrations up to date |
| Backend tests | PASS, 94 suites / 313 tests |
| Frontend tests | PASS, 2 files / 4 tests |
| Backend build | PASS |
| Frontend typecheck | PASS |
| Frontend build | PASS |
| Playwright runtime certification | PASS |
| Yard runtime parity | PASS, 11/11 |
| Database invariants | PASS, 15/15 |
| RBAC/authentication | PASS, 54/54 |
| `git diff --check` | PASS |
| Staged files / commit | NONE |

## RC1 Recommendation

**GO.** The P0 runtime closure criteria are met: the canonical forward business
workflow executes through authenticated services, physical lineage is preserved,
Yard custody closes correctly, dashboards change with runtime state, health
probes are deployment-ready, RBAC is enforced, ActivityLog is present and the
database/read-model/browser evidence agrees. Remaining items are observable P1
automation and performance hardening work suitable for the RC validation cycle;
none invalidates business correctness or source-of-truth integrity.
