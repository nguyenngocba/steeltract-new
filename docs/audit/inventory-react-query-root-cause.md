# EPIC118.5.1 - Inventory React Query Root Cause

Date: 2026-07-11

## Conclusion

Root cause: **Materials list row mapping returned stale snapshot stock values after successful mutations.**

This was not a React Query key mismatch, inactive-query issue, or component-local stale state. The active Materials query could be invalidated/refetched, but `GET /inventory/materials` still mapped table rows from `InventoryMaterialSnapshot` while the Background Engine had not yet written the next snapshot.

## Exact Cause

File:

- `apps/backend-api/src/modules/inventory/inventory-read-model.service.ts`

Method:

- `InventoryReadModelService.toMaterialListRow()`

Previous behavior:

- If an `InventoryMaterialSnapshot` row existed and passed the age-based freshness check, the mapper used:
  - `allSnapshot.locationPayload`
  - `allSnapshot.currentStock`
- That made the Materials table depend on background snapshot freshness for row-level stock after writes.

Impact:

- Operator creates outbound transaction.
- Mutation succeeds.
- React Query invalidates/refetches Materials.
- HTTP request returns.
- Cache updates with a new response.
- Component rerenders.
- Table still shows old stock because the response itself used stale snapshot values.
- Clicking Refresh or switching tabs later works because the snapshot/read path eventually catches up.

## Fixed Behavior

Materials list rows now use live `inventory_location_stocks` included by the repository-backed material page query for:

- `locationBalances`
- `currentStock`
- row warehouse/location quantities
- table inventory value calculation based on current live stock and snapshot average cost

The snapshot remains useful for valuation metadata and movement dates, but it is no longer the source of truth for row-level Materials stock immediately after a stock-affecting mutation.

## React Query Findings

`InventoryMaterialsPage` does not keep a persistent local row copy:

- rows derive from `materialsData?.items ?? []`
- display rows derive from current query data

The query hook uses:

- key: `['inventory', 'materials', query]`
- endpoint: `GET /inventory/materials`
- `placeholderData: keepPreviousData`
- `staleTime: 10_000`

`invalidateInventoryReadState()` now targets the query family with partial key `['inventory', 'materials']` and actively refetches active Materials reads.

## Rejected Hypotheses

| Hypothesis | Result | Evidence |
| --- | --- | --- |
| Query key mismatch | Rejected | Materials hook key starts with `['inventory', 'materials']`, and invalidation targets that family. |
| Component local stale state | Rejected | Table rows derive directly from React Query data; no persistent copy owns table stock. |
| Derived memo dependency bug | Rejected | The relevant row source is `materialsData.items`; stale stock was present in API payload. |
| React Query config blocks refetch | Rejected for root cause | `staleTime` affects freshness, but explicit invalidation/refetch can still fire. |
| Snapshot read path stale | Confirmed | Mapper preferred snapshot stock/location payload whenever snapshot age was fresh. |

## Root Cause Statement

**Root Cause ->** `InventoryReadModelService.toMaterialListRow()` selected `InventoryMaterialSnapshot` stock/location data for Materials table rows during the snapshot lag window.

**Fix ->** Use repository-included live `locationStocks` for Materials row quantities and locations, while preserving snapshot metadata for valuation/movement context.

**Result ->** Active Materials refetch after mutation can now receive row stock that reflects the write immediately, without polling, retry, page reload, or global refetch.
