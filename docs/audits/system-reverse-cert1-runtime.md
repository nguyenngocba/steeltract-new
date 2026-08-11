# SYSTEM.REVERSE.CERT.1 - Canonical Reverse Workflow Runtime Certification

Date: 2026-08-11  
Runtime fixture: `SYSTEM-REVERSE-CERT1-1786431968315`  
Decision: **GO**

## Scope And Method

This sprint certified existing reverse workflows only. It introduced no domain,
API, schema, migration or UI behavior. All mutations used authenticated REST
commands and their authoritative services. Prisma was used only after the REST
run for read-only database reconciliation.

The retained fixture executed 305 REST steps and 71 assertions with zero failed
assertions. Database verification passed 18/18 invariants. Playwright passed
1/1 and captured five real workspaces with no browser console or request error.

## Workflow Graph

```text
Supplier -> PO -> Receipt -> MAIN -> Production Issue -> MAIN Return
                                      |
                                      +-> Supplier Return -> DISPOSED

ComponentInstance -> Finished Goods -> Yard -> Dispatch -> Delivery -> Installed
                                                              |
                                                              v
                                                    RETURN_REQUESTED
                                                              |
                                                    RETURN_IN_TRANSIT
                                                              |
                                                    Yard Quarantine
                                                       /    |    \
                                                    PASS  REWORK  SCRAP
                                                     |      |      |
                                                    Yard  Rework  SCRAPPED
                                                           PO       |
                                                            |     no Yard
                                                         FINAL PASS no Dispatch
                                                            |
                                                           Yard
```

## REST Evidence

### Scenario 1 - Installed Component Return

The physical fixture completed Dispatch, Delivery and Installation, then used:

1. `PATCH /logistics/dispatch-orders/:id/return-request`
2. `PATCH /logistics/dispatch-orders/:id/return-depart`
3. `PATCH /logistics/dispatch-orders/:id/return-to-yard`

Result:

- Dispatch status: `RETURNED`.
- ComponentInstance: `INSTALLED -> IN_TRANSIT -> PRODUCED_WAITING_QC`.
- A new active Yard quarantine placement was created.
- The original pre-dispatch Yard placement remained closed.
- `installedAt` became `NULL`, correctly expressing that the component is no
  longer installed. The former installation remains traceable in Dispatch,
  ComponentInstance timeline and ActivityLog.

### Scenario 2 - Returned Component PASS

The returned physical instance received a new FINAL inspection and complete
checklist through `/qc/inspections`. The canonical PASS command released its
existing quarantine placement without creating a replacement identity.

Result: `ComponentInstance.state = IN_YARD`, exactly one active placement and
the instance appeared in `POST /logistics/dispatch-orders/suggest`.

### Scenario 3 - Returned Component REWORK

A second installed fixture used the Project boundary:

`POST /projects/:projectId/component-instances/:instanceId/return-to-yard`.

FINAL FAIL created an NCR. REWORK disposition closed quarantine and moved the
same physical instance to `REWORK`. Production accepted a dedicated rework PO,
assigned the same ComponentInstance to execution, completed its operation and
returned it to FINAL QC. The second FINAL PASS and Yard stage completed.

Result: same ComponentInstance ID throughout; rework PO, execution, NCR, two
post-return inspections and final `IN_YARD` state are linked.

### Scenario 4 - Returned Component SCRAP

A third installed fixture returned through the Project boundary, failed FINAL
QC and received SCRAP disposition.

Result: `ComponentInstance.state = SCRAPPED`, `scrappedAt` present, zero active
Yard placement and absent from dispatch suggestions.

### Scenario 5 - Material Reverse Flow

The material fixture used the canonical production owner command:

`POST /production/material-issues/:id/return`.

One unused unit returned to the material warehouse before Production Order
reconciliation. The related `ProductionMaterialIssue` became `RETURNED` with
`returnedQty = 1`, and Inventory posted a positive movement with
`referenceModule = production_material_issue`.

The supplier return followed PO/receipt lineage through create, approve,
receive, inspect and dispose commands. It reached `DISPOSED` and posted exactly
one `-5` Inventory movement with:

- `referenceModule = return-workflow`
- `referenceId = <ReturnRequest.id>`
- `idempotencyKey = inventory-command:supplier-return:<ReturnRequest.id>`

## Database Evidence

| Invariant | Result |
| --- | --- |
| PASS instance in Yard, one active placement | PASS |
| Reverse Dispatch status `RETURNED` | PASS |
| REWORK keeps the same physical identity | PASS |
| Rework ProductionLog rows use the rework ProductionOrder ID | PASS |
| SCRAP has no active placement or active dispatch | PASS |
| Production material return has InventoryTransaction lineage | PASS |
| Supplier return has one outbound InventoryTransaction | PASS |
| InventoryItem quantity equals signed movement total (`92`) | PASS |
| InventoryLocationStock total equals signed movement total (`92`) | PASS |
| Reverse ActivityLog rows exist | PASS |

All 18 database checks passed. The three instances ended as:

- PASS return: `IN_YARD`
- REWORK return: `IN_YARD`
- SCRAP return: `SCRAPPED`

Timeline counts were 8, 12 and 8 respectively. There were no orphan aggregate
references in the certified lineage.

## Inventory Conservation

The material fixture reconciled to `92` in all three representations:

```text
InventoryItem.quantity                 92
sum(InventoryLocationStock.quantity)   92
sum(signed InventoryTransactionItem)   92
```

The Production return added one unit through InventoryPosting. Supplier Return
removed five units through the same Inventory transaction boundary. No stock
was directly mutated by the certification harness.

## ActivityLog And Read Models

The run produced 182 ActivityLog rows after its start timestamp. Observed
reverse actions include:

- `production.material.returned`
- `PROJECT_DISPATCH_RETURN_REQUESTED`
- `PROJECT_DISPATCH_RETURN_DEPARTED`
- `YARD_COMPONENT_RETURNED`
- `PROJECT_DISPATCH_RETURNED_TO_YARD`
- `SUPPLIER_MATERIAL_RETURN_REQUESTED`
- `SUPPLIER_MATERIAL_RETURN_DISPOSED`
- `YARD_RETURN_RELEASED`
- `YARD_RETURN_QUARANTINE_RELEASED`
- `qc.disposition.completed`
- `production.rework.accepted`
- `production.rework.completed`

Inventory, QC, Yard and Logistics dashboard payloads all changed between the
certification baseline and final state. Canonical ComponentInstance, Project,
QC, Yard and Logistics read models returned the same fixture identities and
states verified in PostgreSQL.

## Playwright Evidence

Playwright logged in with a real administrator JWT and verified the REST state
before rendering each workspace. All fixture visibility checks passed:

- `qc-returned`
- `yard-returned-pass`
- `yard-returned-rework`
- `logistics-return`
- `project-lineage`

Artifacts:

- `test-results/reverse-cert1/qc-returned.png`
- `test-results/reverse-cert1/yard-returned-pass.png`
- `test-results/reverse-cert1/yard-returned-rework.png`
- `test-results/reverse-cert1/logistics-return.png`
- `test-results/reverse-cert1/project-lineage.png`
- `test-results/reverse-cert1/browser-evidence.json`

Browser result: 1/1 passed in 23.4 seconds, no page error and no failed request.

## Verification

| Check | Result |
| --- | --- |
| REST runtime | PASS - 305 steps, 71 assertions |
| Database reconciliation | PASS - 18/18 |
| Playwright | PASS - 1/1 |
| Backend tests | PASS - 96 suites, 330 tests |
| Frontend tests | PASS - 4 files, 12 tests |
| Frontend typecheck | PASS |
| Backend build | PASS |
| Frontend build | PASS |
| `git diff --check` | PASS |
| Staged files | None |

The first backend test invocation used an invalid extra `--` and matched no
tests; it was immediately rerun correctly with `pnpm -C apps/backend-api test
--runInBand`, producing the complete passing result above.

## Remaining Observations

- The fixture is intentionally retained for traceability and browser evidence.
- Vite still emits the existing `NODE_ENV` `.env` warning and a large
  `vendor-react-three` chunk warning; neither affected this certification.
- ActivityLog evidence is complete for the certified owner commands. A future
  reporting sprint may expose reverse events as dedicated dashboard dimensions;
  this is not a source-of-truth blocker.

## Final Decision

**GO.** SteelTrack now has runtime evidence that the certified forward and
reverse physical workflows preserve Inventory integrity, ComponentInstance
lineage, Yard ownership, QC gates, Production aggregate identity, ActivityLog
and dashboard/read-model consistency without bypassing owner services.
