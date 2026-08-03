# SYSTEM.E2E.1 - End-to-End Business Workflow Certification

Date: 2026-08-03

Mode: runtime certification with one narrowly scoped blocker fix. No schema,
migration, direct database mutation, staging or commit was performed.

## Executive Result

Overall result: **CONDITIONALLY READY FOR CONTROLLED INTERNAL PILOT / NOT READY
FOR V1 FREEZE**

The canonical happy path was completed through authenticated REST commands:

`Material Master -> MAIN receipt -> PRODUCTION transfer -> Project ->
Requirement -> Component Definition -> Revision/BOM -> Production Order ->
Reservation/Issue -> physical execution -> FINAL QC -> Finished Goods -> Yard ->
Dispatch -> Delivery -> Installation`.

Runtime fixture: `SYSTEM-E2E1-1785732305546`.

The run created exactly 2 materials, 1 project, 2 component definitions, 2
requirements, 1 production order, 2 physical ComponentInstances, 2 FINAL QC
inspections, 1 NCR, 1 Yard placement and 1 physical DispatchItem. These
fixtures were retained for traceability.

Certification remains conditional because:

1. delivered/installed ComponentInstances retain active Yard placements;
2. multiple Enterprise projections are degraded by millisecond epoch
   `aggregateVersion` values that cannot fit the PostgreSQL `INT4` columns;
3. valid `GET /projects?limit=3` input reaches Prisma as a string and returns
   HTTP 500;
4. Inventory idempotency replays a prior transaction for the same key even
   when the new payload differs, instead of rejecting the mismatch;
5. three required reverse flows do not have canonical physical contracts;
6. browser/chart rendering was not executable in this environment.

## Blocker Fixed During Certification

Initial runtime failure:

- `POST /yard/stage` created a canonical placement but left the physical
  instance in `QC_PASSED`.
- Logistics requires `ComponentInstance.state = IN_YARD` plus an active Yard
  placement, so `POST /logistics/dispatch-orders` returned HTTP 400,
  `chưa ở trạng thái staged tại Yard`.

Minimal correction:

- Yard now conditionally transitions `QC_PASSED` / `USE_AS_IS` to `IN_YARD`
  inside the same Serializable transaction that creates placement, movement,
  ActivityLog and Outbox records.
- A failed transition rolls back the placement.
- No API, DTO, schema, Logistics behavior or frontend was changed.

After the correction, a fresh fixture completed Yard, Dispatch, Delivery and
Installation successfully.

## Business Workflow

| Scenario | Result | Runtime evidence |
| --- | --- | --- |
| Material creation and MAIN receipt | PASS | Two materials created; receipt returned HTTP 201; totals became PLATE 100 and BEAM 80. |
| MAIN -> PRODUCTION transfer | PASS | Each material transferred 60; PLATE `MAIN=40/PRODUCTION=60`, BEAM `MAIN=20/PRODUCTION=60`; totals unchanged. |
| Project and requirements | PASS | One Project, two Component Definitions and two ProjectComponentRequirements persisted. Each requirement quantity is 2. |
| Engineering revision/BOM/release | PASS | Revision R1, two BOM lines, validation, review, approval and release all returned HTTP 201. BOM identity uses Material Master; reservation later checked PRODUCTION stock. |
| Production | PASS | PO quantity 2 produced exactly two ComponentInstances. Reservation, issue, execution assignments and operation completion succeeded. |
| QC | PASS | Two FINAL inspections: one PASS and one FAIL. Failed instance created one OPEN NCR. |
| Finished Goods gate | PASS | Finished Goods API returned only the PASS instance; failed instance was excluded. |
| Yard | PASS with downstream warning | One placement/movement created and duplicate stage rejected. State transitioned to `IN_YARD`. Placement is not removed after dispatch. |
| Logistics | PASS with downstream warning | One physical DispatchItem created. Duplicate dispatch rejected. Loading, depart, arrive, receive and complete succeeded. Instance became `DELIVERED` and `installedAt` was set. |
| Project progress/completion | PARTIAL | Execution read model returned real counts, but only 2 of 4 required units were ordered and one failed QC. Completion was therefore correctly not achieved. It incorrectly retained `yardStagedQty=1` after delivery. |
| Reverse: PRODUCTION -> MAIN | PASS | BEAM changed `MAIN 20 -> 25`, `PRODUCTION 54 -> 49`, total remained 74. |
| Reverse: QC FAIL -> REWORK | PARTIAL | NCR became `REWORK_REQUIRED`; physical instance became `REWORK`. Rework execution through a second FINAL PASS was not completed. |
| Reverse: QC FAIL -> SCRAP | PASS | Controlled prior NCR became `APPROVED`; physical instance became `SCRAPPED`. |
| Reverse: Project dismantle -> Yard -> FG | FAILED | Existing project return endpoint accepts Component definition identity, not installed ComponentInstance identity. No canonical physical dismantle command exists. |
| Reverse: Project surplus -> PRODUCTION | FAILED | No authoritative project-surplus-to-production-stock command was found. |
| Reverse: MAIN -> Return Vendor | FAILED | `SUPPLIER_RETURN` request workflow models receive/inspect/dispose and does not authoritatively issue stock from MAIN to a supplier. |

## API Evidence

All happy-path commands used JWT-authenticated REST APIs and canonical command
routes. Representative results:

| API | Result |
| --- | --- |
| `POST /inventory/items` | 201 x2 |
| `POST /inventory/transactions` receipt/transfers | 201 |
| `POST /components/foundation/definition-requirements` | 201 x2 |
| Component revision/BOM command chain | 201 |
| Production create/release/ready/start/execution commands | 201 |
| QC inspection/result/PASS/FAIL/NCR commands | 201 |
| `GET /components/instances/finished-goods` | 200, exactly one eligible row |
| `POST /yard/stage` | 201; second call rejected |
| `POST /logistics/dispatch-orders` | 201; duplicate rejected with 400 |
| Logistics loading/depart/arrive/receive/complete | 200 |
| `GET /projects/:id/execution` | 200 |
| `GET /dashboard/executive-cockpit` | 200 |

API defect evidence:

- `GET /projects?limit=3` returned HTTP 500. Prisma reported `take: "3"`,
  expected `Int`.
- Reusing Inventory idempotency key/reference
  `SYSTEM-E2E1-1785732305546:reverse-transfer` with a different quantity
  returned HTTP 201 and replayed transaction `DC-260803-00018` with the old
  `+5/-5` lines. Payload mismatch is not rejected.

## Database Reconciliation

Read-only PostgreSQL checks were used only after REST commands completed.

| Entity | Fixture rows |
| --- | ---: |
| InventoryItem | 2 |
| Project | 1 |
| Component Definition | 2 |
| ProjectComponentRequirement | 2 |
| ProductionOrder | 1 |
| ComponentInstance | 2 |
| QCInspection | 2 |
| NCR | 1 |
| YardItemPlacement | 1 |
| DispatchItem | 1 |

Physical lineage was preserved by IDs from Project/Requirement through PO,
ComponentInstance, QC, Yard and Dispatch. Final physical states after the
reverse-flow checks:

- PASS instance: `DELIVERED`, `qcPassedAt` present, `installedAt` present,
  one DispatchItem.
- FAIL instance: `REWORK`, no Finished Goods/Yard/Dispatch row.

Inventory reconciliation after production consumption and reverse transfer:

| Material | Total | MAIN | PRODUCTION |
| --- | ---: | ---: | ---: |
| BEAM | 74 | 25 | 49 |
| PLATE | 90 | 40 | 50 |

Starting stock was 180 total units. Production consumed 16 units matching BOM
requirements (`PLATE 5 x 2`, `BEAM 3 x 2`), leaving 164. Warehouse transfers
did not change the total. No material loss or quantity inflation was observed.

## Read Models And Dashboards

| Surface | Result | Evidence |
| --- | --- | --- |
| Inventory overview | PASS | `totalStock` changed from 82,916.4 to 83,080.4 after fixture net receipt/consumption. |
| Executive cockpit inventory forecast | PASS for tested stock metric | `currentStock` reconciled to 83,080.4. |
| Production cockpit | PASS/PARTIAL | Fixture PO returned with two ComponentInstances; PO remains `IN_PROGRESS` because order-level completion was not invoked. |
| QC canonical workspace | PASS | Physical instance rows and authoritative QC summary returned. |
| Logistics dashboard | PASS | One completed dispatch and one DELIVERED physical instance returned. |
| Project execution | FAILED for downstream location | Real quantities returned, but delivered instance still contributes `yardStagedQty=1`. |
| Enterprise Projection Platform | FAILED | ProductionTimeline, MaterialAvailability, QcInspectionSummary, QcNcrSummary, QcTimeline and YardItemSummary are DEGRADED. |

Projection root evidence:

- `production-material-ledger.service.ts` uses `occurredAt.getTime()` as
  `aggregateVersion`.
- Values such as `1785732307896` are written to projection
  `sourceAggregateVersion` / receipt aggregate version columns backed by
  PostgreSQL `INT4`, causing repeated conversion failures.
- Projection health reported 37 active ProductionTimeline failures, 97 active
  MaterialAvailability failures and additional QC/Yard active failures at the
  time of certification.

Dashboard data verdict: **REAL/PARTIAL**. Tested Inventory, Production, QC,
Logistics and Executive endpoints changed from runtime facts. This does not
certify every dashboard widget: legacy Component status metrics remain in
other dashboard/snapshot paths, and degraded projections make projection-backed
widgets non-authoritative.

Chart verdict: **NOT FULLY VERIFIED**. Backend datasets/KPIs changed, but no
browser automation was available to prove rendered chart updates. Any chart
fed by a degraded projection is FAILED until projection health is restored.

## Audit And History

- `GET /system/activity-logs` returned 19 records containing the fixture ID.
- Inventory transaction query returned the receipt, transfer and production
  issue lineage for the fixture material.
- Yard placement and movement endpoints returned the physical instance code.
- QC inspection, NCR and ComponentInstance state history were traceable.
- Projection failures are logged and visible through projection health, but
  poison retries remain active.

ActivityLog result: **PASS/PARTIAL**. Core operational actions are present;
cross-module completeness per every command was not proven one-for-one.

## RBAC Runtime Matrix

Controlled roles/users were created from the canonical permission catalog and
retained for audit traceability.

| Role | Authorized API | Unauthorized API | Result |
| --- | ---: | ---: | --- |
| Admin | 200/201 | n/a | PASS |
| Planner | 200 Production | 403 Logistics | PASS |
| Warehouse | 200 Inventory | 403 Production | PASS |
| QC | 200 QC | 403 Inventory | PASS |
| Project | 200 Projects | 403 QC | PASS |
| Logistics | 200 Logistics | 403 Inventory | PASS |

No-token Inventory mutation returned 401. Legacy Inventory dictionary and
Material Movement reads also returned 401 under current global enforcement.

## Integrity Findings

### P0

1. Close active Yard placement when physical custody leaves Yard. Current DB
   simultaneously says the instance is `DELIVERED/installed` and actively
   occupies a Yard slot.
2. Replace epoch-millisecond aggregate versions or widen the projection version
   storage contract; rebuild failed projections after correction.
3. Reject idempotency-key reuse with a different normalized request payload.
4. Coerce/validate Projects pagination query values before repository calls.

### P1

1. Add canonical physical reverse commands for installed-component dismantle,
   project surplus return and supplier outbound return.
2. Complete and certify `REWORK -> Production -> FINAL QC -> PASS`.
3. Update Project execution counts to distinguish active Yard, in transit,
   delivered and installed states.
4. Complete authenticated browser certification for operational pages and
   rendered charts.
5. Remove remaining dashboard/snapshot dependencies on legacy
   `Component.status` inventory semantics.

### P2

1. Add automated disposable-fixture cleanup through approved APIs.
2. Add a durable E2E test runner to CI with per-step correlation IDs and
   payload-hash evidence.

## Verification

| Check | Result |
| --- | --- |
| Yard targeted tests | PASS, 10/10 |
| Backend tests | PASS, 91/91 suites and 296/296 tests |
| Frontend tests | PASS, 2/2 files and 4/4 tests |
| Backend build | PASS |
| Frontend build | PASS |
| Runtime REST happy path | PASS, 80 recorded steps, no harness failure |
| Reverse/RBAC runtime | PASS for executed cases, 37 recorded calls, no harness failure |
| Read-only DB reconciliation | PASS |
| Browser visual/chart certification | NOT VERIFIED |
| Schema/migration | UNCHANGED |
| Stage/commit | NOT PERFORMED |

## Required Final Answers

1. Workflows PASS: receipt, warehouse transfer, Project/Requirement,
   engineering release/BOM, Production physical execution, QC PASS/FAIL/NCR,
   Finished Goods gate, Yard stage, Dispatch/Delivery/Installation, reverse
   warehouse transfer, QC rework disposition, QC scrap disposition and RBAC.
2. Workflows FAIL/PARTIAL: Project completion, rework-through-new-QC-PASS,
   installed dismantle, project surplus return and supplier outbound return.
3. Database recording: correct for the tested canonical chain, except active
   Yard placement remains after delivery.
4. API responses: correct for the happy path; Projects pagination and
   idempotency payload mismatch are defects.
5. Dashboard data: real for tested runtime metrics, but not universally
   authoritative because legacy semantics and degraded projections remain.
6. Charts: API datasets changed; rendered charts were not browser-certified.
7. Logs: operational evidence exists, but every command was not reconciled
   one-for-one.
8. Material loss: none observed. Receipt 180 minus consumption 16 equals final
   164.
9. Quantity errors: none in tested stock/instance creation; Project downstream
   location count is semantically wrong.
10. Duplicate ComponentInstance: none; PO quantity 2 produced exactly 2 unique
    physical instances.
11. Duplicate Yard placement: none; second stage was rejected and DB count is 1.
12. Duplicate Dispatch: none; second dispatch was rejected and DB count is 1.
13. Traceability loss: identity lineage is preserved, but custody truth is
    contradictory because Yard placement stays active after delivery.
14. Internal deployment: **only a controlled pilot with explicit monitoring
    and acceptance of the P0 risks; not ready for V1 freeze or production
    approval**.
