# Inventory Data Consistency Report

Date: 2026-07-08

## Method

Read-only database audit using Prisma Client.

No data was modified.

Compared:

```text
inventory_transactions
inventory_transaction_items
inventory_location_stocks
inventory_items.quantity
inventory_material_snapshots
inventory_location_snapshots
inventory_dashboard_snapshots
return_requests
```

## Summary

| Check | Result |
| --- | --- |
| `inventory_items.quantity` equals location stock total by item | PASS |
| Transaction-derived location bucket equals `inventory_location_stocks` | PASS |
| Negative location stock rows | PASS |
| Transaction item valuation present | PASS |
| Location snapshot total equals live location stock total | PASS |
| Material snapshot stock equals live location stock total | FAIL |

## Counts

```text
Inventory items: 23
Inventory transactions: 74
Inventory transaction items: 78
Location stocks: 51
Material snapshots: 48
Location snapshots: 50
Dashboard snapshots: 4
```

Transaction types:

```text
IMPORT: 48
EXPORT: 20
TRANSFER: 4
ADJUSTMENT: 1
RETURN: 1
```

## Passing Checks

```text
itemSnapshotMismatchCount: 0
locationBucketMismatchCount: 0
negativeLocationStocks: 0
transactionItemsMissingValuation: 0
transactionItemsZeroValuation: 0
totalLocationStockQuantity: 21473.4
totalLocationSnapshotQuantity: 21473.4
```

## Failing Check

```text
materialSnapshotMismatchOrMissingCount: 3
```

Sample:

| Material | Snapshot stock | Location stock |
| --- | ---: | ---: |
| VT-NEW-00015 | 44 | 54 |
| VT-NEW-00001 | 28.9 | 5763.9 |
| VT-NEW-00010 | 100 | 200 |

Latest snapshot timestamps:

```text
latestDashboardSnapshotAt: 2026-07-08T11:06:13.457Z
latestMaterialSnapshotAt: 2026-07-08T11:06:13.719Z
latestLocationSnapshotAt: 2026-07-08T11:06:13.824Z
```

## Root Cause Hypothesis

The most likely cause is stale or incomplete material snapshot rebuild coverage after later Inventory movements.

Evidence:

* Live transaction/location data is internally consistent.
* Location snapshot aggregate is consistent with live location stock.
* Only material-level snapshots differ.

No automatic repair was run in this sprint because the task requires reporting warnings rather than silently fixing data.

## Required Follow-Up

P0:

1. Run controlled snapshot parity validation for affected materials.
2. Verify whether background worker processed the latest `InventoryMaterialSnapshot` jobs.
3. Rebuild material snapshots through the approved background path, then re-run this consistency audit.
4. Add regression check so material snapshot stock must equal live location stock before Business Freeze.

## Freeze Result

Inventory Business Freeze: BLOCKED.
