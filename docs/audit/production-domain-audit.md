# EPIC186 Production Domain Audit

Date: 2026-07-17  
Status: **AUDIT COMPLETE - IMPLEMENTATION BLOCKED ON DOMAIN ALIGNMENT**

## Scope

This is a read-only architecture assessment. No application code, API, Prisma
schema, migration, workflow, or data was changed.

## Executive Result

Production is not an empty foundation. The canonical Production Order
lifecycle, repository boundary, material reservation/issue/consume/return,
atomic Outbox, snapshots, runtime metrics, and Cockpit live read model already
exist. EPIC186 must extend those approved foundations rather than replace them.

| Domain area | Current evidence | Result |
| --- | --- | --- |
| Production Order lifecycle | Explicit state machine and command endpoints | PASS |
| Atomic lifecycle Outbox | Order mutation, ActivityLog and `production.order.*` event share a repository transaction | PASS |
| Production material flow | Reservation, Issue, Consumption, Return and immutable ledger exist | PASS WITH OPERATOR GATE |
| Inventory ownership | Issue/Return use Inventory-owned posting; Consumption does not mutate stock twice | PASS |
| Work Order aggregate | Standalone CRUD model; no Production Order relationship or active controller/service registration | FAIL |
| Completion quantities | No canonical completed/rejected/remaining fields on Production Order, Stage or Work Order | FAIL |
| WIP tracking | Stage/current-stage status exists; quantity-based WIP does not | PARTIAL |
| Scrap domain | `scrapQty` is stored in Consumption, but approved decision says canonical scrap command/event remains future work | BLOCKED |
| Cockpit workspace read | Repository live read model | PASS |
| Dashboard read | Persisted snapshot with repository fallback | PASS |
| Runtime operation | Code complete; real operator/snapshot/runtime evidence remains pending | BLOCKED CERTIFICATION |

## Source-of-truth Conflicts

1. EPIC186's abbreviated lifecycle omits `READY` and `CANCELLED`. The approved
   lifecycle in PROD-014 remains canonical and must not be reduced.
2. Requested `production.started`, `production.paused`, and similar names are
   not the canonical namespace. New lifecycle publishers use
   `production.order.*`; legacy names are compatibility inputs only.
3. PROD-011 and PROD-015 state that Inventory stock is reduced at Issue.
   Consumption records actual use in Production and must not post Inventory
   stock a second time.
4. PROD-015 explicitly reserves Scrap for a separate future command/event.
   `production.scrapped` cannot be introduced without a Blueprint/decision
   alignment sprint.

## Schema-to-Blueprint Gaps

The architecture document describes `WorkOrder 1 -> N ProductionOrder`, but the
active Prisma schema does not implement it:

- `WorkOrder` has only number, product code, quantity, dates and string status.
- `ProductionOrder` has no `workOrderId`.
- `WorkOrder` has no project, routing, work-center, progress or quantity result
  relations.
- `WorkOrderService` is not registered as a provider and no Work Order routes
  are exposed by `ProductionController`.

The Blueprint also mentions `actualHours`, `scrapWeight`, Shift, Capacity,
Rework, Scrap and Downtime entities that are absent or not represented as
described in the active schema. They are not safe implementation assumptions.

## Repository and Transaction Audit

- Production services contain no direct `PrismaService` access.
- Production repositories own persistence and transactions.
- Inventory stock mutation is routed through `InventoryPostingService` for
  Issue and Return.
- Some Production repository methods query QC/Yard/Component data and perform
  compatibility writes. This is repository-contained but remains a
  cross-module ownership debt, not a Service -> Prisma violation.
- Lifecycle and material canonical Outbox writes are idempotent and atomic.

## Required Decisions Before Code

1. Approve the Work Order aggregate relationship and additive schema contract.
2. Define quantity semantics and unit for planned, started, completed, rejected,
   scrap and remaining quantities at Work Order, Production Order and Stage.
3. Define whether rejected quantity is QC-owned, Production-owned, or a
   projection of QC inspections.
4. Align Scrap command, ledger type, event name, Inventory consequence and
   idempotency contract.
5. Decide whether existing `ProductionStage` is the execution child of a
   Production Order while `WorkOrder` remains a parent batch, avoiding a second
   competing routing model.

## Recommendation

Run a focused **Production Domain Alignment** sprint, then implement in bounded
increments. Do not implement EPIC186 as one broad code change. Estimated need:
three implementation sprints after one specification/alignment sprint.

