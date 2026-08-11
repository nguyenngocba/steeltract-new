# SYSTEM.REWORK.1 - Canonical Rework Aggregate Repair

Date: 2026-08-11  
Status: **PASS - P0 CLOSED**

## Root Cause

`ProductionCommandService.recordReworkEvent()` emitted a canonical
`ProductionRework` event with `ProductionRework.id` as the aggregate identity.
That identity is correct for Outbox ordering and aggregate versioning, but the
generic `recordEvent()` helper also used it as a fallback for
`ProductionLog.productionOrderId` when the payload did not contain an explicit
Production Order identity.

The resulting insert attempted:

```text
ProductionLog.productionOrderId = ProductionRework.id
```

PostgreSQL rejected it through `production_logs_productionOrderId_fkey` because
`ProductionRework` and `ProductionOrder` are separate aggregates. The complete
accept transaction rolled back, including the newly created rework Production
Order.

The audit found no other repository, projection or event publisher path that
intentionally maps `ProductionRework.id` to `ProductionOrder.id`:

- instance eligibility correctly compares `reworkProductionOrderId`;
- rework completion loads the real `reworkProductionOrderId`;
- Production projections scope timeline events from payload
  `productionOrderId`;
- Outbox metadata correctly retains `ProductionRework.id` as `aggregateId`.

## Aggregate Diagram

```text
ComponentInstance
  -> FINAL QC FAIL
  -> NCR
  -> ProductionRework (aggregateId = ProductionRework.id)
  -> Rework ProductionOrder (ProductionLog FK = ProductionOrder.id)
  -> ProductionExecution
  -> FINAL QC PASS
  -> Finished Goods eligibility
  -> Yard
```

## Before

```text
recordReworkEvent
  aggregateId = ProductionRework.id
  payload.productionOrderId = missing

recordEvent
  productionOrderId = payload.productionOrderId ?? aggregateId

ProductionLog
  productionOrderId = ProductionRework.id  // invalid FK
```

## After

`recordReworkEvent()` now resolves the canonical log parent explicitly:

- ACCEPTED and COMPLETED: `reworkProductionOrderId`;
- REJECTED: `originalProductionOrderId`, because no rework PO exists.

`recordEvent()` now requires `payload.productionOrderId: string` at compile
time. The aggregate-id fallback was removed completely. Therefore a future
non-PO aggregate cannot silently become a `ProductionLog` foreign key.

Identity remains intentionally separated:

| Concern | Canonical identity |
| --- | --- |
| ProductionLog FK | Rework `ProductionOrder.id` |
| Rejected rework log FK | Original `ProductionOrder.id` |
| Outbox aggregate | `ProductionRework.id` |
| ActivityLog entity | `ProductionRework.id` |
| ActivityLog PO lineage | Rework/original `ProductionOrder.id` in metadata |

## REST

Retained fixture: `SYSTEM-QC-CERT1-1786430974526`.

The authenticated runtime completed 155 REST calls/checkpoints and 42/42
assertions:

```text
QC FAIL
-> NCR REWORK
-> POST /production/commands/rework/accept (201)
-> Rework PO release/ready/start
-> same ComponentInstance assigned to execution
-> operation and execution completion
-> Rework PO complete/close
-> ProductionRework complete
-> second FINAL inspection PASS
-> Finished Goods eligible
-> Yard stage
```

Final regression reads succeeded for Inventory, Production, QC, Finished
Goods, Yard and Logistics. Logistics remained unchanged and no QC fixture was
dispatched.

## Database

Database certification passed 29/29 checks.

Canonical identities for the retained fixture:

```text
Original ProductionOrder : cmsoavmzd009opvpou1nji0d4
Rework ProductionOrder   : cmsoavp9w00ikpvporpwhu64r
ProductionRework         : e4b62dd8-0e8b-4254-a132-5b3ae9710280
```

Both rework ProductionLog rows use the rework Production Order FK:

| Message | ProductionLog.productionOrderId | metadata.aggregateId |
| --- | --- | --- |
| `production.rework.accepted` | `cmsoavp9w00ikpvporpwhu64r` | `e4b62dd8-0e8b-4254-a132-5b3ae9710280` |
| `production.rework.completed` | `cmsoavp9w00ikpvporpwhu64r` | `e4b62dd8-0e8b-4254-a132-5b3ae9710280` |

Additional evidence:

- one completed `ProductionRework` linked to one closed rework PO;
- the same physical instance has original and rework executions;
- six FINAL inspections and four NCRs are fully projected;
- three eligible instances are in Yard; FAIL remains `QC_FAILED`; SCRAP remains
  `SCRAPPED`;
- material quantity, location-stock sum and signed movements all equal `175`;
- no duplicate Inventory transaction item identity;
- no duplicate QC ActivityLog action/entity pair;
- no orphan or rolled-back rework aggregate remains in the certified fixture.

The asynchronous projection worker required a short convergence window after
the REST workflow. The delayed database check passed with 10/10 expected QC
projection documents.

## FK

`ProductionLog.productionOrderId` is now always supplied from an explicit
Production Order identity. Unit tests cover:

1. ACCEPTED logs against the rework PO.
2. COMPLETED logs against the closed rework PO.
3. REJECTED logs against the original PO.
4. Outbox/ActivityLog retain the distinct `ProductionRework.id` aggregate.

## Runtime

Final physical states:

| Scenario | State |
| --- | --- |
| PASS | `IN_YARD` |
| FAIL | `QC_FAILED` |
| REWORK -> PASS | `IN_YARD` |
| USE-AS-IS | `IN_YARD` |
| SCRAP | `SCRAPPED` |

The REWORK timeline contains both production cycles and ends with
`QC_FINAL_PASSED`. No new ComponentInstance was created for rework.

## Regression

- Targeted Production command tests: 12/12 PASS.
- Full backend tests: 96 suites / 330 tests PASS.
- Frontend tests: 4 files / 12 tests PASS.
- Playwright: 1/1 PASS; no page errors or failed requests.
- Backend build: PASS.
- Frontend build: PASS.
- Frontend typecheck: PASS.
- `git diff --check`: PASS.
- No staged files and no commit.

Browser evidence:

- `test-results/qc-cert1/qc-final.png`
- `test-results/qc-cert1/components-qc.png`
- `test-results/qc-cert1/finished-goods.png`
- `test-results/qc-cert1/yard-components.png`

## Scope Confirmation

No schema, migration, API contract, UI, repository contract or business
semantics changed. The repair only separates Production Rework aggregate
identity from the Production Order foreign key used by operational logs.

## Recommendation

**GO.** The SYSTEM.QC.CERT.1 REWORK P0 blocker is closed. The canonical
FAIL -> REWORK -> Production -> FINAL PASS -> Finished Goods -> Yard path is
runtime-certified.
