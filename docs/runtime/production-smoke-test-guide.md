# Production Smoke Test Guide

## Execution Order

1. Create a disposable test order and record baseline stock/snapshots.
2. Execute Create -> Release -> Ready -> Start -> Pause -> Resume.
3. Create Draft Reservation and prove it has no ledger/event side effect.
4. Reserve, Issue, Consume, and Return controlled partial quantities.
5. Complete and Close the order.
6. After each command, inspect API response, domain row, ledger, Inventory
   transaction/location stock, Outbox, background job, snapshot, runtime metrics,
   and Operations Center.

## Evidence Commands/Surfaces

- Production Order, Reservations, Material Issues, Consumptions and Material Ledger workspaces.
- Inventory Transactions, Materials and Locations workspaces.
- `outbox_events`: event name, idempotency key, status, retry count.
- `background_jobs`: name, status, retries, error, completion time.
- `production_dashboard_snapshots`, `production_order_snapshots`, `work_center_snapshots`.
- Inventory material/location/dashboard snapshots for Issue and Return.
- Operations Center Production Platform Health.

## Pass Rules

- Exactly one canonical Outbox row per command source version.
- Outbox reaches `DISPATCHED`; snapshot job reaches `COMPLETED`.
- Snapshot `updatedAt` is later than command time and values match live rows.
- No negative exact-location stock.
- No Inventory stock change at Reserve or Consume.
- No lifecycle transition bypasses the canonical state machine.
- Legacy consumers remain registered, but new commands publish canonical names only.

## Current Environment

Runtime inspection on 2026-07-12 found one existing `COMPLETED` order, one
`ISSUED` material issue, no reservations/consumptions, no Production snapshots,
no canonical Production Outbox rows, and no Production snapshot jobs. This is
not a safe disposable fixture; smoke execution remains pending.

