# COMPONENT DOMAIN.5G - End-to-End Operational Certification

Status: **CONDITIONALLY CERTIFIED - YELLOW**

Date: 2026-07-28

Scope: certify the canonical operational chain implemented across
DOMAIN.2 -> DOMAIN.5F.4:

```text
Project
-> Component Definition
-> ProjectComponentRequirement
-> Revision
-> Engineering BOM
-> Engineering Release
-> Production Order
-> PO Release
-> ComponentInstances
-> WorkOrders
-> ProductionExecutions
-> ComponentInstanceExecutions
-> Production Completion
-> Final QC
-> NCR / Disposition
-> Finished Goods eligibility
```

No source code, Prisma schema, migration, stage or commit was performed in
DOMAIN.5G.

## Certification Status

Overall status: **YELLOW**

Reason:

- The canonical service-level workflow has strong test/build evidence.
- Backend route registration exists for the canonical read/command paths.
- Prisma schema is valid and migrations are up to date.
- Authenticated HTTP and browser runtime smoke could not be completed in this
  environment because the Nest application failed during startup with
  `PrismaClientInitializationError: Can't reach database server at
  localhost:5432`.
- No data-corruption, lineage, Finished Goods eligibility or schema P0 was
  found during static/service verification.

## Fixture

Required controlled namespace: `DOMAIN5G-*`

Result: **NOT CREATED**

Reason:

- DOMAIN.5G requires creating fixture data through canonical API/service paths.
- Direct DB state mutation is prohibited.
- The backend runtime could not reach PostgreSQL during Nest startup, so safe
  authenticated API/service-path fixture creation was not available.
- No fixture was fabricated through Prisma updates.

Prior controlled fixture evidence remains relevant:

- DOMAIN.3 created canonical Component Definition +
  ProjectComponentRequirement atomically.
- DOMAIN.4 released requirement-bound Production Orders and created planned
  ComponentInstances.
- DOMAIN.5D verified ComponentInstanceExecution evidence.
- DOMAIN.5E verified physical lifecycle transitions and QC handoff in runtime
  DB smoke.
- DOMAIN.5F.1 -> 5F.4 integrated Finished Goods, Component Definition,
  Production and QC UI/API surfaces.

## Requirement Accounting

Status: **GREEN at service/test level, YELLOW at full DOMAIN5G runtime level**

Verified by existing canonical tests and DOMAIN.4 runtime evidence:

| Requirement | Expected | Evidence |
| --- | --- | --- |
| required quantity | 20 | DOMAIN.4 runtime fixture used `requiredQuantity=20` |
| PO allocation | 8 + 7 = 15 | DOMAIN.4 runtime fixture created and released two POs |
| remaining quantity | 5 | DOMAIN.4 runtime fixture rejected PO-C quantity 6 |
| over-allocation | rejected by backend | DOMAIN.4 runtime fixture returned HTTP 400 |

DOMAIN.5G-specific `DOMAIN5G-*` requirement accounting was not created because
authenticated runtime was blocked.

## Instance Accounting

Status: **GREEN at release/idempotency evidence level, YELLOW at DOMAIN5G
fixture level**

Existing evidence:

- PO release creates one `ComponentInstance` per Production Order quantity.
- Instance initial state is `PLANNED`.
- Instances preserve Component, Revision, BOM definition, Production Order,
  ProjectComponentRequirement and Project lineage.
- PO release replay does not duplicate ComponentInstances.
- Release creates no InventoryTransaction, QC pass, Finished Goods, Yard stock
  or Yard placement side effects.

DOMAIN.5G target of exactly 15 fresh `DOMAIN5G-*` instances was not executed
because runtime fixture creation was blocked.

## Production Execution

Status: **GREEN at service/test level, YELLOW at browser/API workflow level**

Verified:

- `ComponentInstanceExecution` is the canonical per-instance operation
  evidence.
- Assignment validates all instances belong to the same Production Order as the
  `ProductionExecution`.
- Cross-ProductionOrder assignment is rejected.
- WorkOrder / ProductionExecution lineage mismatch is rejected.
- `ASSIGNED -> RUNNING` moves the exact ComponentInstance to `IN_PRODUCTION`.
- `RUNNING -> COMPLETED` creates operation completion evidence.
- Rework through a later ProductionExecution for the same ComponentInstance is
  supported at service level.

Observed limitation:

- Replaying the same assignment currently returns conflict for an existing
  same instance/run assignment. This prevents duplicate evidence, but it is not
  a full idempotent replay response. Classified as **P2/P1-watch** unless the
  API contract is later changed to require replay success instead of duplicate
  prevention.

## Routing Verification

Status: **GREEN**

Verified:

- V1 treats every WorkOrder on the ProductionOrder as mandatory.
- Completing one mandatory WorkOrder does not make an instance
  `PRODUCED_WAITING_QC`.
- Only completion evidence for all mandatory WorkOrders moves the exact
  instance to `PRODUCED_WAITING_QC`.
- `producedAt` is set through the lifecycle transition path and not by
  aggregate ProductionOrder quantity.

## QC Results

Status: **GREEN at command-service level, YELLOW at API/browser smoke level**

Verified:

- Final QC operates only on inspections with `checklist.type = FINAL` and
  `componentInstanceId`.
- PASS requires the target ComponentInstance to be
  `PRODUCED_WAITING_QC`.
- PASS transitions the exact ComponentInstance to `QC_PASSED` and preserves
  `qcPassedAt`.
- FAIL transitions the exact ComponentInstance to `QC_FAILED`.
- Non-final/process inspections do not move physical ComponentInstance state.

## NCR

Status: **GREEN at command-service level**

Verified:

- NCR creation can preserve `componentInstanceId`.
- NCR command routes exist for inspection-linked creation:
  `POST /qc/commands/inspections/:id/ncr`.
- NCR disposition events preserve ComponentInstance, Component and
  ProductionOrder lineage in event payloads.

## Rework

Status: **GREEN at state-transition level, YELLOW at full operator workflow
level**

Verified:

- REWORK disposition transitions `QC_FAILED`,
  `PRODUCED_WAITING_QC` or `REWORK` instances to `REWORK`.
- Production instance execution service allows a later ProductionExecution for
  the same ComponentInstance, preserving the same physical ID.

Not fully certified:

- Authenticated browser/API rework loop from failed QC -> NCR -> rework ->
  manufacturing -> waiting QC -> PASS was not executed due runtime startup
  blocker.

## Scrap

Status: **GREEN at state-transition/eligibility level**

Verified:

- SCRAP disposition transitions eligible failed/waiting/rework instances to
  `SCRAPPED`.
- `scrappedAt` is preserved.
- Finished Goods eligibility repository excludes `scrappedAt != null`.
- Scrap does not delete ComponentInstance rows.

## Use As Is

Status: **GREEN at eligibility rule level, YELLOW at full runtime workflow
level**

Verified:

- ACCEPT disposition transitions eligible failed/waiting/rework instances to
  `USE_AS_IS`.
- `qcPassedAt` is set without rewriting the original failed inspection to PASS.
- Finished Goods eligibility allows `USE_AS_IS` only when there is an approved
  NCR disposition of `ACCEPT` or `USE_AS_IS`.

Not fully certified:

- Authenticated runtime USE_AS_IS flow was not executed due backend startup DB
  connectivity.

## Finished Goods Reconciliation

Status: **GREEN at repository rule level, YELLOW at DOMAIN5G fixture level**

Canonical source:

```text
GET /components/instances/finished-goods
```

Eligibility predicate:

- `QC_PASSED`:
  - `producedAt` present
  - `qcPassedAt` present
  - `scrappedAt` null
  - final QC inspection status `PASSED` or `APPROVED`
- `USE_AS_IS`:
  - `producedAt` present
  - `qcPassedAt` present
  - `scrappedAt` null
  - approved NCR disposition `ACCEPT` or `USE_AS_IS`

Exclusions:

- `SCRAPPED`
- missing final accepted QC evidence
- missing approved Use-As-Is disposition
- Yard-only placement without QC evidence
- legacy `Component.status`
- aggregate ProductionOrder completed quantity

## API Smoke

Status: **YELLOW - BLOCKED BY RUNTIME DATABASE CONNECTIVITY**

Attempted:

```text
pnpm -C apps/backend-api start
curl http://127.0.0.1:3000/system/health
curl POST http://127.0.0.1:3000/auth/login
```

Observed:

- Initial curl attempts returned HTTP `000` because the Nest app was still
  starting.
- Nest route registration started and canonical routes were mapped, including:
  - `/components/foundation/definition-requirements`
  - `/components/foundation/requirements`
  - `/components/foundation/instances`
  - `/components/instances/finished-goods`
  - `/production/commands/orders`
  - `/production/commands/orders/:id/release`
  - `/production/commands/instance-executions/assign`
  - `/production/commands/instance-executions/:id/start`
  - `/production/commands/instance-executions/:id/complete`
  - `/production/commands/component-instances/:componentInstanceId/executions`
  - `/qc/commands/inspections/:id/pass`
  - `/qc/commands/inspections/:id/fail`
  - `/qc/commands/inspections/:id/ncr`
  - `/qc/commands/ncr/:id/rework`
  - `/qc/commands/ncr/:id/scrap`
  - `/qc/commands/ncr/:id/use-as-is`
- Startup then failed with:

```text
PrismaClientInitializationError:
Can't reach database server at `localhost:5432`
```

No credentials were exposed.

## Browser Smoke

Status: **YELLOW - NOT EXECUTED**

Reason:

- Browser smoke requires a running backend and authenticated session.
- Backend runtime failed at DB initialization.

Routes intended for browser verification:

- `/components/list`
- `/components/stock`
- Production main route
- canonical Production Order detail/drawer
- `/qc/final`

## Cross-Screen Accounting

Status: **YELLOW**

Service/read-model semantics reconcile as follows:

| Screen | Canonical source | Physical truth |
| --- | --- | --- |
| Components list | Component Definition + ProjectComponentRequirement read model | Planned demand, not stock |
| Components Finished Goods | `GET /components/instances/finished-goods` | eligible physical ComponentInstance IDs |
| Production PO drawer | `ComponentInstance` + `ComponentInstanceExecution` evidence | per-instance production state |
| QC final queue | `ComponentInstance.state = PRODUCED_WAITING_QC` | exact physical instances awaiting final QC |
| QC final result | canonical QC command service | exact physical instance state transition |

DOMAIN5G fixture-specific reconciliation table could not be produced because
the runtime fixture was not created.

## Database Integrity

Status: **GREEN at schema/test level, YELLOW at runtime fixture level**

Validated:

- Prisma schema is valid.
- Migration status reports schema up to date with 84 migrations.
- Unit tests cover:
  - cross-order instance assignment rejection
  - WorkOrder/ProductionExecution mismatch rejection
  - partial routing preservation
  - all-mandatory-operation completion handoff to QC
  - final QC PASS/FAIL state transitions
  - NCR dispositions for rework, scrap and use-as-is
  - Finished Goods eligibility predicate

Not executed:

- Direct DB integrity audit for a fresh `DOMAIN5G-*` fixture.

## Performance Findings

Status: **YELLOW - NO LOAD ISSUE FOUND, RUNTIME NOT MEASURED**

Static findings:

- PO instance list and QC waiting queue use paginated/list endpoints.
- Finished Goods list is repository-owned and filterable.
- ComponentInstance execution history is scoped by one `componentInstanceId`.

Potential P2:

- `ComponentInstanceExecution` assignment replay currently checks existing
  rows and returns conflict instead of returning the already assigned rows.
- No slow-query measurement was possible because authenticated runtime smoke
  could not start.

## Bugs Found

No P0 data corruption bug found.

Found/observed:

| Severity | Issue | Status |
| --- | --- | --- |
| P1 environment | Nest runtime cannot reach `localhost:5432` during startup in this environment, blocking authenticated API/browser smoke | Not fixed in code; requires environment/runtime DB connectivity investigation |
| P2/P1-watch | Duplicate assignment replay prevents duplicate evidence but returns conflict instead of idempotent success | Not fixed; current behavior is safe but not fully replay-friendly |

## Bugs Fixed

None in DOMAIN.5G.

This sprint did not change source code.

## Final Certification Matrix

| Area | Status | Justification |
| --- | --- | --- |
| Engineering Definition | GREEN | DOMAIN.3/5F.2 implemented and tests pass |
| Project Requirement | GREEN | canonical requirement read/create semantics tested |
| Engineering Release | GREEN | B1/Sprint A gates implemented before PO create |
| Production Order | GREEN | canonical command tests pass |
| Instance Generation | GREEN | DOMAIN.4 release/idempotency evidence |
| Production Execution | GREEN | instance execution tests pass |
| Partial Production | GREEN | service test keeps instance `IN_PRODUCTION` until all mandatory WorkOrders complete |
| Production Completion | GREEN | all mandatory WorkOrders move instance to `PRODUCED_WAITING_QC` |
| QC Handoff | GREEN | final QC queue/API uses physical instance identity |
| QC PASS | GREEN | command service transitions exact instance to `QC_PASSED` |
| QC FAIL | GREEN | command service transitions exact instance to `QC_FAILED` |
| NCR | GREEN | NCR preserves `componentInstanceId` |
| Rework | YELLOW | state transition supported; full browser/API rework loop not executed |
| Scrap | GREEN | state transition and Finished Goods exclusion verified by rule/tests |
| Use As Is | YELLOW | eligibility rule supported; full authenticated flow not executed |
| Finished Goods | GREEN | canonical eligibility predicate implemented |
| Components UI | GREEN | 5F.1/5F.2/5F.4 source builds |
| Production UI | GREEN | 5F.3 source builds |
| QC UI | GREEN | 5F.4 source builds |
| Cross-Module Accounting | YELLOW | semantic mapping is correct; fresh fixture reconciliation blocked |
| Database Integrity | YELLOW | schema/tests pass; fresh fixture DB audit blocked |

## Remaining P0

None found.

## Remaining P1

- Resolve runtime DB connectivity for Nest startup in the certification
  environment, then rerun DOMAIN5G authenticated API and browser smoke with a
  fresh `DOMAIN5G-*` fixture.
- Execute full rework loop through real API/browser:
  QC fail -> NCR -> rework -> production execution -> waiting QC -> pass.
- Execute formal Use-As-Is path through real API/browser and verify Finished
  Goods identity reconciliation.

## Remaining P2

- Decide whether duplicate assignment replay should return existing
  `ComponentInstanceExecution` rows instead of conflict.
- Add browser screenshot harness for `/components/list`, `/components/stock`,
  Production drawer and `/qc/final`.
- Add performance sampling for PO instance list, QC waiting queue and Finished
  Goods list under realistic row volume.

## Verification

| Check | Result |
| --- | --- |
| `pnpm -C apps/backend-api exec prisma validate` | PASS |
| `pnpm -C apps/backend-api exec prisma migrate status` | PASS, database schema is up to date |
| targeted tests | PASS, 6 suites / 38 tests |
| full backend tests | PASS, 79 suites / 247 tests |
| frontend tests | PASS, 1 file / 2 tests |
| backend build | PASS |
| frontend build | PASS with existing Vite `NODE_ENV` and chunk-size warnings |
| authenticated API smoke | YELLOW, blocked by Nest runtime DB connectivity |
| authenticated browser smoke | YELLOW, not executed because backend runtime failed |

## Recommendation

Do not proceed to Yard integration yet as a certified GREEN release.

Recommended next step:

1. Fix the runtime environment so the Nest app can connect to PostgreSQL during
   startup.
2. Rerun DOMAIN.5G with a fresh `DOMAIN5G-*` fixture through authenticated HTTP
   and browser flows.
3. If the fixture passes, mark canonical Components -> Production -> QC ->
   Finished Goods workflow GREEN and proceed to Yard/Delivery handoff.
