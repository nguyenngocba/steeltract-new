# Production Aggregate Report

Date: 2026-07-17  
Status: **IMPLEMENTED - CANONICAL DOMAIN COMPLETE**

## Scope

RFC002 implements AD-015/017/018/019 as additive Production-owned aggregates:

- `ProductionOrder`: canonical kind/state, released engineering references,
  aggregate version and lifecycle timestamps.
- `WorkOrder`: `1:N` child of Production Order with routing sequence,
  independent lifecycle and optimistic version.
- `ProductionCompletion`: append-only recorded/reversal facts.
- `ProductionScrap`: draft/post/cancel/reversal facts; recoverable receipt uses
  Inventory-owned posting.
- `ProductionRework`: idempotent QC request decision and linked `REWORK` order.

Legacy `PLANNED`/`DELAYED` orders and standalone Work Orders remain readable but
cannot enter the canonical command path until explicitly adopted.

## Invariants

- Only AD-017 transitions are accepted.
- Release requires deterministic, positive, unique Work Order sequences.
- Start/Ready/Complete/Close enforce their approved gates.
- Completion quantities reconcile and cannot over-complete the order.
- Completion and Scrap corrections append compensating records.
- Rework creates a new linked order; it never rewinds the original.
- Aggregate updates use `WHERE id + aggregateVersion`, then increment version.

## Persistence

Migration `20260717160000_production_domain_aggregates` is additive and deployed.
It does not rewrite legacy data or add a foreign ORM relation into Inventory.

## Result

Aggregate model: **PASS**. Public API cutover is deliberately deferred because
the compatibility DTOs do not yet carry expected versions/idempotency keys.

## RFC003 Execution Completion

RFC003 adds the missing AD-017 `ProductionExecution` aggregate with
`CREATED -> RUNNING <-> PAUSED -> COMPLETED` and non-terminal abort. Execution
runs are durable, independently versioned and linked to one Production Order
and Work Order. Starting an Order now starts its first Work Order and first run
inside the same repository transaction. A partial unique database guard plus
the repository check enforce at most one active run per Work Order.

Migrations `20260717180000_production_execution_aggregate` and
`20260717181000_production_execution_active_guard` are additive and deployed;
no legacy row was rewritten.
