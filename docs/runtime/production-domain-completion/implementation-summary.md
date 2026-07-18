# RFC004 - Production Domain Completion

## Status

**APPROVED**

## Implementation

- Production Order, Work Order, Execution, Completion, Close, Cancel, Scrap, and Rework continue through the existing canonical aggregate command boundary with optimistic concurrency, durable idempotency, timeline, activity, audit, and atomic domain outbox.
- Reservation now requires the parent order to be `RELEASED`, `READY`, `IN_PROGRESS`, or `PAUSED`. Reservation availability reads and writes execute in a serializable repository transaction.
- Issue now requires `READY`, `IN_PROGRESS`, or `PAUSED`; it posts stock only through `InventoryPostingService`. Reservation balance validation, Inventory posting, Production ledger, audit records, and canonical outbox remain atomic.
- Consumption now requires `IN_PROGRESS` or `PAUSED`. Issued, returned, consumed, and remaining quantities are recomputed inside the same serializable transaction. Consumption does not mutate Inventory.
- Return now requires `IN_PROGRESS`, `PAUSED`, or `COMPLETED`; returnable quantity and destination are resolved inside the transaction before `InventoryPostingService` posts the return.
- Material event replay checks the canonical Outbox idempotency key before writing timeline, activity, audit outbox, or domain outbox, preventing duplicate operational records.
- Existing canonical Production events remain the only projection input. Projection Engine code was not changed.

## Compatibility

- Public API, controllers, routes, DTO shapes, event names, event versions, schema, and migrations are unchanged.
- Inventory, Components, QC, Projects, Yard, Logistics, frontend, and Projection Engine were not modified by RFC004.
- The existing `scrapQty` consumption field remains accepted for backward compatibility. Canonical new scrap operations continue through the separate Production Scrap aggregate and do not cause a second Inventory consumption posting.

## Verification

| Check | Result |
| --- | --- |
| Prisma validate | PASS |
| Migration status (76 migrations, database up to date) | PASS |
| Production tests (13 suites, 39 tests) | PASS |
| Projection replay/idempotency tests (4 suites, 5 tests) | PASS |
| Backend build | PASS |
| Frontend build | PASS |
| Breaking API/schema change | NONE |

