# SYSTEM.QC.CERT.1 - Canonical Physical QC Runtime Certification

Date: 2026-08-11  
Decision: **NO-GO**  
Fixture: `SYSTEM-QC-CERT1-1786428920066`

## Scope

This sprint changed no business service, API, Prisma model, migration, or UI.
The retained fixture was created exclusively through authenticated REST APIs.
Database access was read-only and was used after the REST run to certify state,
lineage, projections, inventory conservation, Yard exclusion, Dispatch
exclusion, and ActivityLog integrity.

Source-of-truth path:

```text
ComponentInstance
  -> FINAL QcInspection + required QcChecklist result
  -> NonConformanceReport when failed
  -> canonical disposition
  -> FinishedGoodsEligibilityService
  -> Yard handoff when eligible
```

## Runtime Fixture

- One Project, Component definition, Project requirement, released revision,
  released BOM, Production Order, WorkOrder, and ProductionExecution.
- Requirement and Production Order quantity: `5`.
- Physical rows generated: exactly `5 ComponentInstance` records.
- Material received: `200 PCS`; transferred to Production: `100 PCS`;
  consumed: `25 PCS`.
- Dedicated FINAL checklist: one required item, completed for every inspection.
- REST execution: `125` calls/checkpoints, `33` assertions, `2` failed
  assertions caused by the same REWORK blocker.

## PASS Workflow

Status: **PASS**

```text
PRODUCED_WAITING_QC -> FINAL PASS -> QC_PASSED
-> Finished Goods eligible -> Yard stage -> IN_YARD
```

- Inspection `cmso9nmjs01sspv87kngt7pgl`: `PASSED`, result `PASS`.
- Eligibility endpoint returned the physical instance before Yard handoff.
- Yard stage succeeded and created the active placement.
- Timeline includes `QC_FINAL_PASSED`.
- The instance correctly leaves the Finished Goods handoff queue after its
  state becomes `IN_YARD`.

## FAIL Workflow

Status: **PASS**

```text
PRODUCED_WAITING_QC -> FINAL FAIL -> QC_FAILED
-> NCR OPEN -> disposition pending
```

- Instance state: `QC_FAILED`.
- NCR `cmso9nn4601tupv87voyhx0ae`: `OPEN`; `disposition = NULL`, which is the
  current persisted representation of a pending disposition.
- Finished Goods: excluded.
- Active Yard placement: none.
- Dispatch item: none.
- Timeline includes `QC_FINAL_FAILED`.

## REWORK Workflow

Status: **FAIL - P0 runtime blocker**

The QC half is canonical:

- FINAL inspection failed.
- NCR was created and disposition became `REWORK`.
- The same physical instance moved to `REWORK`.
- Timeline includes `QC_FINAL_FAILED` and `QC_REWORK_REQUIRED`.

Production handoff failed:

```text
POST /production/commands/rework/accept
-> HTTP 500
-> Prisma P2003 production_logs_productionOrderId_fkey
-> transaction rollback
```

Root cause:

1. `recordReworkEvent()` passes `rework.id` as aggregate id at
   `production-command.service.ts:1890-1893`.
2. Its payload contains `originalProductionOrderId` and
   `reworkProductionOrderId`, but not `productionOrderId`.
3. `productionOrderId()` therefore uses the aggregate-id fallback at
   `production-command.service.ts:2273-2279`.
4. `recordEvent()` writes that `ProductionRework.id` into
   `ProductionLog.productionOrderId` at lines `1929-1933`.
5. `production-order.repository.ts:530` executes the insert and PostgreSQL
   rejects it because the value is not a `ProductionOrder.id`.

Because the transaction rolled back:

- no `ProductionRework` row exists;
- no rework Production Order or second execution exists;
- the same instance remains `REWORK`;
- no second FINAL inspection/PASS exists;
- no `production.rework.completed` fact exists;
- the instance cannot re-enter Finished Goods.

No domain fix was applied because this sprint is certification-only.

## USE-AS-IS Workflow

Status: **PASS**

```text
FINAL FAIL -> NCR -> ACCEPT -> USE_AS_IS
-> Finished Goods eligible -> Yard stage -> IN_YARD
```

- NCR status: `APPROVED`; disposition: `ACCEPT`.
- Eligibility endpoint returned the instance before Yard handoff.
- Yard stage succeeded; final physical state is `IN_YARD`.
- Timeline includes `QC_USE_AS_IS_ACCEPTED`.

The API names the command `use-as-is`, while the canonical persisted
disposition is `ACCEPT`; `FinishedGoodsEligibilityRepository` explicitly
accepts both `ACCEPT` and legacy-compatible `USE_AS_IS` values.

## SCRAP Workflow

Status: **PASS**

```text
FINAL FAIL -> NCR -> SCRAP_RECOMMENDATION -> SCRAPPED
```

- Instance state: `SCRAPPED`; `scrappedAt` is populated.
- NCR status: `APPROVED`; disposition: `SCRAP_RECOMMENDATION`.
- Finished Goods: excluded.
- Yard placement: none.
- Dispatch item: none.
- Timeline includes `QC_SCRAP_RECOMMENDED`.
- QC scrap did not create a duplicate material transaction. Material
  consumption remains the original Production consumption only.

## Database Evidence

| Check | Result |
| --- | --- |
| Physical instances | 5 exactly |
| Final states | `IN_YARD`, `QC_FAILED`, `REWORK`, `IN_YARD`, `SCRAPPED` |
| Inspections | 5 (second REWORK PASS missing) |
| NCRs | 4 |
| Active Yard placements | 2, PASS and USE-AS-IS only |
| Dispatch items | 0 |
| Material item quantity | 175 |
| Location-stock sum | 175 |
| Signed transaction movement | 175 |
| InventoryTransactionItem duplicate IDs | 0 |
| QC ActivityLog rows | 22 |
| Duplicate QC action/entity log keys | 0 |
| QC projection documents | 9/9 expected inspection/NCR documents |

Inventory conservation: **PASS**.

## ActivityLog And Projection

ActivityLog contains canonical facts for inspection creation/start/completion,
NCR creation, and disposition completion. No duplicate action/entity key was
found for the fixture.

The outbox contains `qc.inspection.completed`, `qc.ncr.created`, and
`qc.disposition.completed`. `QcInspectionSummary` and `QcNcrSummary` contain
all five inspections and four NCRs. Production has no rework completion fact
because the accept command rolled back.

## Dashboard And Read Models

- Components/QC and standalone QC both render the same
  `CanonicalPhysicalQcWorkspace`.
- Their table and KPI strip call
  `GET /components/foundation/instances?qcScope=true`.
- Summary values are grouped in the backend by `ComponentInstance.state`; the
  frontend does not aggregate `runtime.inspections`.
- Yard runtime dashboard changed after PASS and USE-AS-IS staging.
- Browser-rendered QC KPI states matched physical states, including REWORK and
  SCRAP.

Remaining semantic debt outside the canonical QC workspace:

- `ComponentsOverviewPage.tsx` still parses legacy statuses and defaults to
  `STOCK`/`READY` for some Components dashboard widgets.
- `ComponentsReportsPage.tsx` still falls back to `row.status === 'STOCK'` and
  `row.status === 'READY'`.
- Therefore the global condition "no Component.status dependency remains" is
  not certified, even though the canonical QC paths have no such dependency.

## Browser Evidence

Playwright: **PASS, 1/1**.

- Real administrator login.
- Real API state check for all five instance IDs.
- `/qc/final`
- `/components/qc`
- `/components/stock`
- `/yard/components`
- Browser console errors: `0`.
- Failed browser requests: `0`.

Screenshots:

- `test-results/qc-cert1/qc-final.png`
- `test-results/qc-cert1/components-qc.png`
- `test-results/qc-cert1/finished-goods.png`
- `test-results/qc-cert1/yard-components.png`

## Verification

| Command | Result |
| --- | --- |
| Backend tests | PASS, 96 suites / 327 tests |
| Frontend tests | PASS, 4 files / 12 tests |
| Playwright QC certification | PASS, 1/1 |
| Backend build | PASS |
| Frontend typecheck | PASS |
| Frontend build | PASS |
| `git diff --check` | PASS |
| Schema/migration changes | NONE |
| Staged files / commit | NONE |

Known build warnings remain unchanged: Vite ignores `NODE_ENV=production` in
`.env`, and `vendor-react-three` exceeds the configured chunk warning limit.

## GO / NO-GO

**NO-GO** for complete physical QC branch certification.

PASS, FAIL, USE-AS-IS, and SCRAP are runtime-certified. REWORK is blocked by a
deterministic Production logging FK failure before the rework Production Order
can be committed. The P0 closure is to correct rework event logging so it uses
an actual Production Order identity, then rerun this same retained harness and
require all REST and database assertions to pass.
