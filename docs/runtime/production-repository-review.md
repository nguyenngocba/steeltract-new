# Production Repository Review

Date: 2026-07-17  
Status: **PASS FOR RFC002 BOUNDARY**

## Boundary

`ProductionCommandService` has no `PrismaService`, transaction-client model
access or foreign repository write. `ProductionOrderRepository` owns aggregate
queries, persistence, optimistic updates, transaction scope, timeline, audit
and Outbox persistence.

## Concurrency And Idempotency

- Order, Work Order, Scrap and Rework mutations compare expected version.
- Canonical Outbox keys are unique and command hashes detect conflicting reuse.
- Scrap draft stores a durable command key/hash because draft creation has no
  canonical domain event.
- Rework request id is unique and is the cross-module idempotency anchor.
- Execution mutations use aggregate versions and Outbox replay; a database
  partial unique index closes the concurrent-start race for active runs.

## Cross-module Safety

The canonical path stores Component/QC/Inventory identifiers as bounded owner
references. It does not mutate foreign tables. Inventory changes are delegated
to `InventoryPostingService` and its bounded posting receipt is persisted.

## Legacy Surface

Older Production services still contain compatibility reads through exported
Inventory repository queries. RFC002 did not rewrite those services or their
API because that would exceed the approved aggregate implementation and risk
Inventory/API regression. No new canonical command depends on those reads.

## RFC003 Execution Persistence

`ProductionOrderRepository` now owns execution lookup, active-run lookup,
create and optimistic update. `ProductionCommandService` remains orchestration
only and has no Prisma access. The aggregate row, logs and Outbox records use
the same transaction client. Repository boundary: **PASS**.
