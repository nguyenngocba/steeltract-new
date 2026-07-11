# Inventory Query Invalidation Report

Date: 2026-07-10

Status: PASS

## Query Key Matrix

| UI surface | Hook | Query key | Mutation invalidation |
|---|---|---|---|
| Overview | `useInventoryOverview` | `['inventory', 'overview', query]` | `['inventory']` |
| Materials list | `useInventoryMaterials` | `['inventory', 'materials', query]` | `['inventory']` |
| Material history | `useMaterialTransactions` | `['inventory', 'material-transactions', materialId, page, pageSize]` | `['inventory']` |
| Legacy transactions | `useInventoryTransactions` | `['inventory-transactions', filters]` | `['inventory-transactions']` |
| Material Detail | `useMaterialDetail` | `['material-detail', id]` | `['material-detail']` |
| Locations | `useZones` | `['inventory-zones']` | `['inventory-zones']` |
| Zone Detail | `InventoryLocationsPage` | `['inventory-zone-detail', id]` | `['inventory-zone-detail']` |
| Return Requests | `InventoryReturnRequestsPage` | `['inventory-return-requests']` | `['inventory-return-requests']` |
| Dashboard | shared dashboard queries | `['dashboard', ...]` | `['dashboard']` |

## Fixed Mismatches

- `['materials']` was not the active server-side Materials workspace key after EPIC118.1.
- `['zones']` did not match `['inventory-zones']`.
- Material transaction history used `['inventory', 'material-transactions', ...]` and was not covered by older mutation invalidation.
- Project material return creation did not invalidate the Inventory Return Request workspace.

## Mutation Coverage

| Mutation source | Covered now |
|---|---|
| `POST /inventory/transactions` through shared modal hook | Yes |
| Inbound wizard hook | Yes |
| Outbound wizard hook | Yes |
| Transaction engine create mutation | Yes |
| Return request create mutation | Yes |
| Return receive/reject mutation | Yes |
| Project material return creation | Yes |

## Notes

The helper invalidates both current read-model keys and legacy keys because both generations still exist in the frontend. This avoids stale UI while preserving API and workflow compatibility.
