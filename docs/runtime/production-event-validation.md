# Production Event Validation

Date: 2026-07-11

Status: **PASS**

## Atomic Write Path

```text
ProductionService command
  -> ProductionOrderRepository transaction
     -> read and validate current status
     -> update ProductionOrder
     -> create ActivityLog
     -> upsert OutboxEvent by idempotency key
  -> commit
```

No Production Order lifecycle command calls `EventBusService.emit()` after
commit. The repository writes the Outbox row with the same transaction client as
the order and activity mutations.

## Canonical Routing

All nine `production.order.*` events are registered in `EventConsumerService`
and resolve `orderId`/`productionOrderId` into a `ProductionOrderSnapshot`
update request. `SnapshotWriterService` then recalculates Production dashboard,
order, and work-center snapshots in Background Engine.

Legacy `production.started`, `production.completed`, and `production.delayed`
subscriptions remain consumer-only so previously persisted Outbox rows can
drain. New lifecycle code does not emit them.

## Runtime Evidence

The target database migration is deployed. The current real dataset contains
one `COMPLETED` Production Order and no canonical lifecycle Outbox row because no
real operator transition was executed during verification. Existing production
data was intentionally not mutated for a smoke test. Runtime snapshot hit/miss,
lag, job, and Operations Center telemetry continue through the EPIC132/133
shared path once a real command is executed.
