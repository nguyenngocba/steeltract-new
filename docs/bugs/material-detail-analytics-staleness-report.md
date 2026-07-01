# Material Detail Analytics Staleness Report

Date: 2026-06-29

## Scope

Investigated stale analytics in `InventoryMaterialDetailModal` after Inventory transactions.

Target flow:

```text
Create Transaction
-> Backend Transaction Write
-> Analytics Recompute
-> API Response
-> React Query Cache
-> useMaterialDetail
-> materialAnalytics
-> transactionRows
-> averageUnitPrice
-> sparkline
```

## Sequence

```text
InventoryTransactionModals
  -> useCreateTransaction()
  -> POST /inventory/transactions
  -> InventoryService.createTransaction()
  -> inventory_transactions + inventory_transaction_items inserted
  -> inventory_items.quantity and inventory_location_stocks updated
  -> useCreateTransaction.onSuccess invalidates:
       inventory-transactions
       inventory-items
       material-detail
       zones
       inventory-audit
  -> refreshInventoryCache() invalidates/refetches active inventory/material queries
  -> useMaterialDetail(['material-detail', materialId])
  -> GET /inventory/items/:id/detail
  -> InventoryService.getItemDetail()
  -> InventoryMaterialDetailModal derives:
       inboundHistory/outboundHistory
       transactionRows
       averageCost
       movementTrend
       materialAnalytics
       KPI sparklines
```

## Evidence

### React Query Behavior

`useMaterialDetail` uses:

```ts
queryKey: ['material-detail', id]
enabled: Boolean(id)
```

No `initialData`, `placeholderData`, `select`, custom `staleTime`, custom `gcTime`, or disabled refetch settings are used.

Transaction mutation invalidates `['material-detail']`, and the transaction modals also run a broad active refetch for query keys containing `inventory` or `material`.

Conclusion: the active material detail query is reachable by the current invalidation path.

### Backend Verification

`GET /inventory/items/:id/detail` recomputes from live transaction rows. A rollback-only SQL reproduction inserted one temporary inbound line for `VT-NEW-00001` and confirmed the detail-source aggregates changed immediately inside the transaction:

```text
BEFORE:
inbound_count = 9
line_count = 11
averageCost = 12,569,006.11

AFTER temporary inbound insert:
inbound_count = 10
line_count = 12
averageCost = 12,565,490.76

ROLLBACK executed.
```

Conclusion: backend transaction data is not stale; detail analytics are recomputed from transaction rows.

## Root Cause

There were two frontend/backend contract defects in the Material Detail analytics path.

### 1. Inventory Value Used Stale Fallback

`InventoryMaterialDetailModal` computed:

```ts
fallback?.inventoryValue ?? detail?.inventoryValue ?? currentStock * averageCost
```

The backend detail endpoint did not return `inventoryValue`, and the modal preferred the old list-row fallback value first. After a transaction, even if `currentStock` and `averageCost` were refreshed, the KPI `Giá trị tồn kho` could keep showing the old fallback value.

### 2. Sparkline Dropped Newest Buckets

`transactionRows` are sorted newest-first, but `buildMovementTrend()` converted them into date buckets and then used:

```ts
Array.from(map.values()).slice(-10)
```

Because the newest bucket was inserted first, `slice(-10)` could keep older buckets and drop the newest transaction date when there were more than 10 buckets. This made sparklines/analytics appear stale after a new transaction.

Additionally, outbound quantities were accumulated as negative numbers, which distorted outbound trends and totals.

## Rejected Hypotheses

- Backend analytics cache stale: rejected. The detail endpoint recomputes from live `inventory_transaction_items`.
- Missing React Query invalidation: rejected. `material-detail` is invalidated and active inventory/material queries are refetched after transaction creation.
- React memo dependency bug: rejected. `transactionRows`, `movementTrend`, `forecast`, and `materialAnalytics` depend on the arrays/values they derive from.
- Auth/client-base mismatch: rejected for this endpoint. Inventory detail endpoints are currently unguarded, and both clients target the same backend host.

## Fix

### Backend

`InventoryService.getItemDetail()` now returns:

```ts
inventoryValue = currentStock * averageCost
```

### Frontend

`InventoryMaterialDetailModal` now:

- Prefers live `detail.inventoryValue`, then computes from `currentStock * averageCost`.
- Builds movement trend buckets by full date key, sorts chronologically, and slices the latest 10 buckets.
- Uses absolute outbound quantities for outbound trends and totals.
- Builds the cost sparkline from recent inbound unit prices instead of a flat repeated average cost.

## Affected Files

- `apps/backend-api/src/modules/inventory/inventory.service.ts`
- `apps/frontend/src/modules/inventory/components/InventoryMaterialDetailModal.tsx`

## Verification Steps

1. Open a material detail drawer.
2. Record:
   - `inboundHistory.length`
   - `outboundHistory.length`
   - `averageCost`
   - transaction row count
   - movement sparkline
3. Create inbound/outbound/transfer/adjustment for the same material.
4. Confirm without manual browser refresh:
   - history count changes when a matching line is added
   - transaction row appears
   - average cost changes when inbound cost changes enough to affect the weighted average
   - inventory value updates from live detail data
   - movement and cost sparklines include the newest bucket

## Notes

Average cost is a weighted all-history inbound average. If the new inbound price is close to the current weighted average or the existing history volume is large, the visible currency value may change only slightly.
