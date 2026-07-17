# Inventory Projection Read Models

| Projection | Input | Purpose |
| --- | --- | --- |
| `MaterialAvailability` | canonical and current stock events | Latest material stock facts |
| `ReservationProjection` | production reserve/release events | Reservation state projection |
| `LocationBalance` | canonical and current stock events | Latest emitted location facts |
| `StockMovementSummary` | inventory movement events | Append-only movement projection |

Inventory remains source of truth for stock. No Inventory business service,
ledger, snapshot reader or writer was changed.

## Data Contract Limitation

Compatibility events such as `inventory.stock.changed` do not consistently carry
all quantity, zone, slot and level fields needed to reconstruct authoritative
balances. The reducers persist only real emitted facts. They do not synthesize
missing balances. `MaterialAvailability` and `LocationBalance` therefore require
canonical payload completion or a separately approved truth-based bootstrap
before replacing current certified Inventory workspace reads.
