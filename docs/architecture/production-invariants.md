# Production Domain Invariants

Date: 2026-07-17  
Status: **APPROVED - ADS003**

## Production Order Invariants

1. Every Order references the exact released Component Revision/BOM basis used
   at release; later Component revisions never rewrite it.
2. `READY` is entered only through an admission command and Start revalidates
   volatile gates.
3. Production starts exactly once at the first successful
   `StartProductionOrder` commit.
4. One Order owns one or more Work Orders generated from a frozen routing basis.
5. `COMPLETED` never automatically means `CLOSED`.
6. `CLOSED` and `CANCELLED` are terminal.
7. Delay is a derived condition, not a lifecycle transition.

## Work Order And Execution Invariants

1. Each Work Order belongs to exactly one Production Order and one routing
   operation/work package.
2. Work Order dependencies are acyclic and deterministic.
3. At most one Execution Run is active (`RUNNING` or `PAUSED`) per Work Order.
4. A Work Order cannot start unless its parent Order is `IN_PROGRESS`.
5. A Work Order can complete only from `IN_PROGRESS` with required evidence.
6. Individual Work Order pause/block does not silently change parent state.

## Quantity Invariants

1. All quantities carry an explicit unit and use one normalized unit per Order.
2. Completion and scrap evidence is append-only; correction uses reversal.
3. `remainingQty = max(plannedQty - completedQty - postedScrapQty, 0)`.
4. Cumulative completed plus posted scrap cannot exceed planned quantity without
   an explicit approved quantity-change command.
5. QC `rejectedQty` is a projection/subset of completed output, not an
   independently writable Production quantity.
6. Rework quantity is a subset linked to QC disposition and does not double
   count completion or remaining quantity.

## Material Invariants

1. Draft Reservation records demand only; ledger/event allocation begins when
   it becomes `RESERVED`.
2. Reservation does not move stock and cannot begin before Order release.
3. Inventory stock changes only through Inventory-owned posting at Issue/Return.
4. Consumption records Production usage after Issue and never reduces Inventory
   stock again.
5. Scrap is separate from Consumption and requires its own ledger/event fact.
6. Close requires issued-material reconciliation and no unaccounted balance.

## Scrap And Rework Invariants

1. Posted Scrap is immutable and corrected only by reversal.
2. Production owns Scrap disposition; Inventory owns any recovered-stock post.
3. QC owns NCR/rework request; Production owns accepted rework execution.
4. Rework never rewinds the original Order. It creates a linked `REWORK` Order.
5. QC owns re-inspection and final quality result.

## Consistency Invariants

1. Aggregate mutation, ActivityLog/audit and domain Outbox commit atomically.
2. Commands use expected aggregate version and stable idempotency key.
3. Snapshots/read models are projections and cannot authorize transitions.
4. Cross-context references do not grant foreign write ownership.
