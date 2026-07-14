# Production Material Event Validation

Date: 2026-07-11

## Canonical Events

| Event | Atomic source | Snapshot route | Result |
|---|---|---|---|
| `production.material.reserved` | Reservation transaction | ProductionOrderSnapshot | PASS |
| `production.material.released` | Reservation transaction | ProductionOrderSnapshot | PASS |
| `production.material.issued` | Issue + Inventory posting transaction | ProductionOrderSnapshot | PASS |
| `production.material.consumed` | Consumption transaction | ProductionOrderSnapshot | PASS |
| `production.material.returned` | Return + Inventory posting transaction | ProductionOrderSnapshot | PASS |

`ProductionMaterialLedgerService.createMaterialEvent()` delegates the Outbox
write to `ProductionMaterialLedgerRepository` and requires a transaction client.
The idempotency key combines event name, domain aggregate, and source version.
No material event is published after commit.

The existing Outbox worker dispatches these events to `EventConsumerService`.
Each canonical event requests an asynchronous Production Order snapshot update.
Issue and Return also emit Inventory-owned `inventory.transaction.created` and
`inventory.stock.changed` rows, which independently route Inventory snapshots.
Reservation and Consumption do not mutate Inventory stock, so they do not cause
an unnecessary Inventory stock snapshot rebuild.

Automated routing validation: 5/5 canonical event mappings PASS.

