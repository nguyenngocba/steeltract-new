# SYSTEM.E2E.2 - Canonical Enterprise Workflow Certification

Date: 2026-08-11  
Mode: runtime certification, no business/API/schema/migration change  
Decision: **NO-GO**

## Executive Result

The canonical forward path and one reverse logistics path run successfully on
the real REST API and PostgreSQL database. The retained certification fixture
`SYSTEM-E2E2-1786426978857` completed 91 API steps and 15 assertions with no
failure. Inventory conservation, physical instance lineage, QC PASS, Finished
Goods, Yard, Dispatch, Delivery, Installation and return-to-Yard were confirmed
directly in PostgreSQL.

This sprint cannot issue final enterprise certification. QC FAIL dispositions,
the complete project-return repair/scrap branch, a browser-command workflow,
authoritative Historical Snapshot availability and Project snapshot parity are
not all proven. The system is therefore **NO-GO for the E2E.2 final gate**, even
though the certified core path is operational.

## Workflow Graph

```text
Supplier -> Purchase Request -> Purchase Order -> Approval
         -> Receipt 40 -> Receipt 40 -> Receipt 20
         -> Material Warehouse -> Production Warehouse
         -> Reservation -> Issue -> Production Order -> Execution
         -> ComponentInstance -> FINAL QC PASS -> Finished Goods
         -> Yard -> Dispatch -> Delivery -> Installation
         -> Return request -> Return transit -> Yard quarantine

Supplier Return: PO receipt -> Return Request -> Approve -> Receive
               -> Inspect DAMAGED -> Dispose -> Inventory -5
```

## Timeline

| Time (UTC) | Evidence |
|---|---|
| 05:42:58 | Retained REST fixture started |
| 05:43:03 | 91 REST steps and 15 assertions completed |
| 05:43:24 | PostgreSQL parity check completed, 15/15 PASS |
| 05:48:39 | Browser fixture `SYSTEM-E2E2-BROWSER-1786427319173` started |
| 05:48:43 | 92 REST setup steps and 16 assertions completed |
| 05:49:39 | 18 browser workspaces and logout completed |

Before the successful runs, certification exposed two environment blockers:

- the old credential file returned a correct `401`; the restored Administrator
  account was then used;
- reset data contained no FINAL checklist and repeated fixtures exhausted Yard
  capacity. The harness created the missing checklist and Yard slots through
  authenticated canonical APIs. It never mutated PostgreSQL directly.

## Scenario Status

| Scenario | Status | Runtime evidence |
|---|---|---|
| A Purchasing | GREEN | Supplier, PR submit/approve, PO submit/approve, receipts 40/40/20; PO reached `COMPLETED` |
| B Warehouse | YELLOW | Receipt, transfer, +1 count adjustment, Production return and Supplier Return passed; a separate same-warehouse location move was not executed |
| C Production | GREEN | BOM/revision release, PO, reservation, issue, instance execution, consumption and completion passed |
| D QC | RED | FINAL QC PASS passed; FAIL, REWORK, USE-AS-IS and SCRAP were not executed in this certification run |
| E Finished Goods | YELLOW | QC PASS produced canonical Finished Goods and Yard staging; an explicit Yard-to-Yard move was not executed |
| F Logistics | GREEN | Dispatch, loading, departure, arrival, receipt, installation and reverse return-to-Yard passed |
| G Reverse | RED | Logistics return, Production material return and Supplier Return passed; Project Return -> QC -> Repair/Scrap was not completed |

## REST Evidence

Evidence file: `/tmp/system-e2e2-business-evidence.json`

- Steps: `91`
- Assertions: `15`, failed: `0`
- Maximum API duration: `339.43 ms`
- APIs at or above 500 ms: `0`
- Procurement idempotent replay returned the original receipt.
- Reusing the same idempotency key with a different payload returned `409`.
- Receipt statuses: `PARTIALLY_RECEIVED`, `PARTIALLY_RECEIVED`, `COMPLETED`.
- Inventory signed movement: `100 + 1 - 5 - 5 = 91`.
- Inventory, Production, QC, Yard, Logistics and Executive response payloads all
  changed between the before and after reads.

## Database Evidence

Evidence file: `/tmp/system-e2e2-database-evidence.json`

All 15 checks passed:

- `InventoryItem.quantity = 91`;
- sum of `InventoryLocationStock.quantity = 91`;
- no loss of Requirement -> Project/Component -> ProductionOrder lineage;
- exactly one physical ComponentInstance for the retained order;
- WorkOrder, ProductionExecution and instance execution are `COMPLETED`;
- FINAL inspection and PASS result are persisted against ComponentInstance;
- DispatchItem references ComponentInstance;
- original Yard placement has `removedAt` and its slot is released;
- reverse logistics created one active return placement;
- final ComponentInstance state is `PRODUCED_WAITING_QC` and Dispatch is
  `RETURNED`.

Runtime integrity probes after all certification fixtures reported:

- Inventory: 45 transactions / 54 items, quantity 778, zero negative stocks,
  zero location mismatch and zero item snapshot mismatch;
- Production: five reservations/issues/consumptions, zero over-issue,
  over-return, costing or reservation-bucket violations;
- Project integrity endpoint still reports five legacy `Component` rows as
  `lifecycleState=STOCK`. This endpoint does not reflect the canonical physical
  ComponentInstance vocabulary and remains a semantic warning.

## ActivityLog Evidence

The retained run produced 56 ActivityLog rows in its time window and 23 rows
directly linked by fixture identity. Events cover Procurement creation and
approval, three receipts, inventory posting, Production reservation/issue/
execution/completion, QC inspection/result/PASS, Finished Goods Yard placement,
Dispatch/Delivery/Installation, reverse Logistics and Supplier Return.

No duplicate ActivityLog event was observed by the retained fixture query. The
generic `INVENTORY_TRANSACTION_POSTED` action represents count, transfer and
return postings; this sprint did not add event vocabulary.

## Playwright Evidence

Command result: `1 passed (1.1m)`.

Evidence: `test-results/e2e2/browser-evidence.json` and 18 PNG screenshots in
`test-results/e2e2/`.

- Login and logout passed.
- Dashboard plus 17 operational workspaces rendered.
- Browser page errors: `0`.
- Real failed requests: `0`.
- Fixture visible in 14 workspaces.
- Procurement, Supplier Return and BOM views rendered but did not expose the
  fixture text after search. These are browser traceability gaps.
- Browser actions did not create the business records. Playwright invokes the
  authenticated REST harness and then validates resulting workspaces. Therefore
  this is not certification of every form/button command path.

## RBAC

- Unauthenticated `GET /inventory/overview`: `401`.
- Administrator login: `201`; all runtime commands authorized.
- Backend RBAC regression tests pass in the full suite.
- A restricted user `403` matrix was not re-executed in this sprint; rely on
  SYSTEM.RBAC.2 only as prior evidence. E2E.2 RBAC status is YELLOW.

## Dashboard, Chart, Snapshot And Projection

- Six dashboard/read-model payloads changed after the workflow: PASS at payload
  level.
- Individual KPI and chart series were not reconciled value-by-value: NOT
  CERTIFIED.
- Runtime emitted `ProjectDashboardSnapshot: 1 mismatch(es)`: FAIL.
- `GET /history/dashboard/latest` returned `404` because no authoritative latest
  snapshot exists: FAIL for this sprint's Snapshot criterion.
- `GET /history/jobs` returned `200` with paginated data.
- Projection health endpoint returned `200`, but this run did not retain a
  field-level projection health body. Projection correctness is PARTIAL.

## Verification

| Check | Result |
|---|---|
| Backend tests | PASS - 96 suites, 327 tests |
| Frontend tests | PASS - 4 files, 12 tests |
| Playwright E2E.2 | PASS - 1 test, 18 screenshots |
| Backend build | PASS |
| Frontend typecheck | PASS |
| Frontend build | PASS |
| `git diff --check` | PASS after documentation update |
| Staged files / commit | None created by this sprint |

Build warnings retained:

- Vite ignores `NODE_ENV=production` from `.env`;
- `vendor-react-three` is 964.42 kB minified.

## Remaining Issues

### P0

1. Execute physical-instance QC FAIL, NCR, REWORK, second FINAL QC, USE-AS-IS
   and SCRAP branches on the current runtime.
2. Complete Project Return -> Yard -> QC -> Repair/Scrap certification.
3. Resolve `ProjectDashboardSnapshot` parity mismatch and prove all Project KPI
   values against the canonical execution read model.
4. Generate/read an authoritative current Historical Dashboard snapshot or
   explicitly remove Snapshot from the E2E.2 release gate.
5. Implement a true browser-command path for the complete workflow; current
   Playwright validates REST-created state rather than every mutation form.

### P1

1. Expose searchable PO/receipt/Supplier Return identity in Procurement and
   Inventory Return workspaces.
2. Execute same-warehouse location move and Yard-to-Yard move in one retained
   fixture.
3. Re-run runtime `403` checks with restricted Procurement, Warehouse, QC and
   Logistics users.
4. Reconcile every dashboard KPI/chart value, not only response changes.
5. Add a canonical fixture cleanup/archive command. Aborted runs leave valid
   operational records because direct DB cleanup is prohibited.

## Release Recommendation

**NO-GO for SYSTEM.E2E.2 final certification.**

The Supplier-to-installation forward workflow, partial purchasing receipts,
inventory conservation and one reverse Logistics/Supplier path are runtime
proven. SteelTrack should not claim full canonical enterprise certification
until the P0 branches and snapshot/dashboard parity gaps above have concrete
runtime and browser evidence.
