# Inventory React Query Dependency Map

Date: 2026-07-10

Status: UPDATED

## Query Dependency Map

| Surface | Query key | Hook/component | Endpoint | Invalidate source |
|---|---|---|---|---|
| Inventory Overview | `['inventory', 'overview', query]` | `useInventoryOverview` / `InventoryOverviewPage`, `InventoryMaterialsPage` | `GET /inventory/overview` | `invalidateInventoryReadState` |
| Inventory Materials | `['inventory', 'materials', query]` | `useInventoryMaterials` / `InventoryMaterialsPage`, Overview stock modal | `GET /inventory/materials` | `invalidateInventoryReadState` |
| Material History | `['inventory', 'material-transactions', materialId, page, pageSize]` | `useMaterialTransactions` | `GET /inventory/transactions?materialId=...` | `invalidateInventoryReadState` |
| Legacy Transactions | `['inventory-transactions', filters]` | `useInventoryTransactions` | `GET /inventory/transactions` | `invalidateInventoryReadState` |
| Material Detail | `['material-detail', id]` | `useMaterialDetail` | `GET /inventory/items/:id/detail` | `invalidateInventoryReadState` |
| Locations | `['inventory-zones']` | `useZones` | `GET /inventory/zones` | `invalidateInventoryReadState` |
| Location Detail | `['inventory-zone-detail', id]` | `InventoryLocationsPage` | `GET /inventory/zones/:id` | `invalidateInventoryReadState` |
| Return Requests | `['inventory-return-requests']` | `InventoryReturnRequestsPage` | `GET /inventory/returns` wrapper via transaction engine API | `invalidateInventoryReadState` |
| Overview Return Requests | `['inventory-return-requests-overview']` | `InventoryOverviewPage` | `GET /inventory/returns` wrapper via transaction engine API | `invalidateInventoryReadState` |
| Inventory Items legacy | `['inventory-items']` | `useInventoryItems` | `GET /inventory/items` | `invalidateInventoryReadState` |
| Audit legacy | `['inventory-audit']` | `useInventoryAudit` | `GET /inventory/audit` | `invalidateInventoryReadState` |
| Dashboard | `['dashboard', ...]` | shared dashboard queries | dashboard endpoints | `invalidateInventoryReadState` |

## Mutation Sources

| Mutation source | Business action | Invalidation |
|---|---|---|
| `useCreateTransaction` | Shared inbound/outbound/transfer/adjustment/stocktake modal path | `invalidateInventoryReadState` |
| `useCreateInbound` | Legacy inbound wizard | `invalidateInventoryReadState` |
| `useCreateOutbound` | Legacy outbound wizard | `invalidateInventoryReadState` |
| `useCreateInventoryTransactionMutation` | Transaction engine create path | `invalidateInventoryReadState` |
| `useCreateReturnRequestMutation` | Return request create path | `invalidateInventoryReadState` |
| `useAdvanceReturnRequestMutation` | Return receive/reject lifecycle | `invalidateInventoryReadState` |
| `InventoryReturnRequestsPage` | Receive/reject buttons | `invalidateInventoryReadState` plus Project runtime keys |
| `ProjectsPage` material return | Project -> Inventory return request | Project keys plus `invalidateInventoryReadState` |

## Local State Audit

- `InventoryMaterialsPage` does not hold a copied table dataset in local state.
- The table reads `rows = materialsData?.items ?? []`.
- Derived arrays such as `filteredRows`, `alerts`, `pagedRows`, and chart rows are recomputed from query data.
- Therefore stale Materials rows after mutation were traced to query refetch timing/key coverage, not to a retained local copy.

## Cache Behavior

- Materials and material transaction history use `placeholderData: keepPreviousData`, so the old page remains visible during a refetch.
- This is acceptable only if a fresh refetch follows mutation completion.
- EPIC118.5 adds immediate active refetch plus short targeted retries for Inventory read families after stock-affecting mutations.
