# EPIC118.5.1 - Inventory React Query Trace Report

Date: 2026-07-11

## Target Flow

Observed operator issue:

```text
Outbound transaction SUCCESS
-> Overview chart updates
-> Inventory Materials table remains stale
-> Browser Refresh or tab switch
-> Materials table updates
```

## Lifecycle Trace

| Step | Expected | Trace Result |
| --- | --- | --- |
| Mutation success | Stock-affecting mutation resolves successfully. | PASS. Existing inbound/outbound/transfer/adjustment/return flows call the shared invalidation helper. |
| Invalidate queries | Materials query family is invalidated. | PASS. Helper targets `['inventory', 'materials']`. |
| Query key match | Active Materials key should be matched by partial key. | PASS. Hook key is `['inventory', 'materials', query]`. |
| Active query refetch | Active Materials query should issue `GET /inventory/materials`. | PASS by configuration. Helper actively refetches active query families. |
| HTTP response | Endpoint should return updated row stock. | FAIL before fix. Endpoint could return stale snapshot stock because row mapper preferred `InventoryMaterialSnapshot`. |
| Cache update | React Query cache receives response. | PASS, but previous response payload could still contain stale stock. |
| Component rerender | Materials table rerenders from `materialsData.items`. | PASS. No table-local stock copy was found. |
| Table update | Visible Materials row stock changes without F5. | BLOCKED before fix by stale API payload; fixed by live-stock row mapping. |

## Query Dependency Map

| Surface | Query key | Hook/component | Endpoint | Mutation invalidate source |
| --- | --- | --- | --- | --- |
| Inventory Overview | `['inventory', 'overview', query]` | `useInventoryOverview()` | `GET /inventory/overview` | `invalidateInventoryReadState()` |
| Inventory Materials | `['inventory', 'materials', query]` | `useInventoryMaterials()` | `GET /inventory/materials` | `invalidateInventoryReadState()` |
| Material History | `['inventory', 'material-transactions', materialId, page, pageSize]` | `useMaterialTransactions()` | `GET /inventory/transactions?materialId=...` | `invalidateInventoryReadState()` |
| Legacy transactions | `['inventory-transactions', ...]` | transaction hooks/pages | `GET /inventory/transactions` | `invalidateInventoryReadState()` |
| Locations | `['inventory-zones']`, `['inventory-zone-detail', ...]` | zone/location hooks | Inventory zone APIs | `invalidateInventoryReadState()` |
| Material Detail | `['material-detail', id]`, `['inventory-material-detail', id]` | Material detail hooks | material detail APIs | `invalidateInventoryReadState()` |
| Return Requests | `['inventory-return-requests', ...]` | return request workspace | return request APIs | `invalidateInventoryReadState()` |

## TanStack Query Configuration Notes

- `useInventoryMaterials()` uses `placeholderData: keepPreviousData`; this may keep the previous page visible while a refetch is in flight, but it does not explain stale data after a completed refetch.
- `staleTime: 10_000` does not block explicit invalidation/refetch.
- No global polling or new retry is required for Materials row consistency after this fix.

## Component Render Audit

`InventoryMaterialsPage`:

- derives rows from `materialsData?.items ?? []`;
- uses current query result for pagination metadata;
- does not persist stock rows into independent component state.

Therefore the remaining stale behavior was not a rerender problem. The payload itself had old row quantities.

## Debug Instrumentation

No temporary debug logs remain in application code.

The diagnosis was established through static trace of:

- mutation invalidation helper;
- query keys;
- Materials page row source;
- `GET /inventory/materials` read model mapping.

## Result

The read-after-write path now becomes:

```text
Mutation success
-> invalidate/refetch ['inventory', 'materials']
-> GET /inventory/materials
-> repository query includes live locationStocks
-> toMaterialListRow sums live locationStocks
-> React Query cache updates
-> Materials table rerenders with current stock
```
