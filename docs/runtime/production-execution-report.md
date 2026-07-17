# Production Execution Report

Date: 2026-07-17  
Status: **PASS - AD-017 EXECUTION AGGREGATE IMPLEMENTED**

## Lifecycle

| From | Command | To |
| --- | --- | --- |
| `CREATED` | Start | `RUNNING` |
| `RUNNING` | Pause | `PAUSED` |
| `PAUSED` | Resume | `RUNNING` |
| `RUNNING` | Complete | `COMPLETED` |
| `CREATED`, `RUNNING`, `PAUSED` | Abort | `ABORTED` |

Terminal runs reject further transitions. Pause and abort require reasons.
Starting a run requires both parent Order and Work Order to be `IN_PROGRESS`.
Completion and Scrap references are validated against the run's Order/Work
Order scope.

## Consistency

- Aggregate updates compare `id + aggregateVersion` and increment atomically.
- Durable Outbox replay provides command idempotency.
- A partial unique index prevents concurrent active runs for one Work Order.
- Mutation, ProductionLog timeline, ActivityLog, audit Outbox and domain Outbox
  share one repository transaction.
- `production.execution.*` payloads carry run/order/work-order ids, state,
  work-center/machine references, timestamps and typed reasons.

## Boundary

No public API, UI, Inventory, Components or Projection Engine code changed.
The existing `ProductionExecution` projection already consumes these events.

## Replay Evidence

Real retained-Outbox replay scanned 90 events for both `ProductionExecution`
and `ProductionTimeline`. The retained stream contains no
`production.execution.*` or other canonical Production facts, so both matched
zero and produced zero documents. Replay infrastructure and deterministic
resume passed; authoritative runtime document parity remains an operator-data
gate and no synthetic event was inserted.
