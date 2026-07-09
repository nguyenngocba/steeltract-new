# Inventory Material Snapshot Reconciliation

Date: 2026-07-09

## Before

| Material | Snapshot | Live location stock |
| --- | ---: | ---: |
| VT-NEW-00015 | 44 | 54 |
| VT-NEW-00001 | 28.9 | 5763.9 |
| VT-NEW-00010 | 100 | 200 |

## Root Cause

The `ALL` material snapshot treated transaction history as a stock ledger:

```text
currentStock = SUM(inventory_transaction_items.quantity)
```

SteelTrack's Inventory decision record defines
`inventory_location_stocks` as the authoritative active location balance.
Historical transaction lines are incomplete for opening balances and legacy
stock loads, so they cannot be used to reconstruct current stock.

## Corrected Calculation

```text
currentStock = SUM(inventory_location_stocks.quantity)
```

Transaction rows still provide movement history and weighted inbound cost.
Location rows provide current stock and location count.

## Rebuild Path

```text
InventoryEventService
  -> inventory.material.updated (Persistent Outbox)
  -> SnapshotUpdateDispatcher
  -> snapshot.inventory.update
  -> JobWorkerService
  -> SnapshotRebuilder
  -> InventorySnapshotRepository
  -> InventoryMaterialSnapshot
```

No direct SQL update or manual snapshot mutation was used.

## After

- Active Inventory items: 23.
- `ALL` material snapshots: 23.
- Material snapshot/live mismatches: 0.
- `inventory_items.quantity`/live mismatches: 0.
- Negative location balances: 0.
- Reconciliation event failures: 0.
- Reconciliation job failures: 0.

The three reported materials now read 54, 5763.9, and 200 respectively in both
live location stock and persisted material snapshots.

