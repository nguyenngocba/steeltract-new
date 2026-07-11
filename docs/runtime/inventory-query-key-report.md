# Inventory Query Key Report

Date: 2026-07-10

Status: PASS

## Fixed Key Gaps

| Previous state | Issue | Fix |
|---|---|---|
| Some mutation hooks invalidated `['materials']` | Active Materials list uses `['inventory', 'materials', query]` | Mutation hooks now call `invalidateInventoryReadState` |
| One transaction hook invalidated `['zones']` | Active location query uses `['inventory-zones']` | Helper invalidates `['inventory-zones']` and `['inventory-zone-detail']` |
| Material history key was not explicitly covered | Active history uses `['inventory', 'material-transactions', materialId, page, pageSize]` | Helper invalidates and refetches `['inventory', 'material-transactions']` |
| Return request page was not invalidated from Project material return | Open Inventory Return Requests could stay stale | Project material return mutation now calls Inventory invalidation helper |

## Current Invalidation Strategy

`invalidateInventoryReadState` now maintains a concrete list of Inventory read families instead of relying on one broad root invalidation:

- `['inventory', 'overview']`
- `['inventory', 'materials']`
- `['inventory', 'material-transactions']`
- `['inventory-transactions']`
- `['inventory-items']`
- `['inventory-zones']`
- `['inventory-zone-detail']`
- `['inventory-audit']`
- `['inventory-return-requests']`
- `['inventory-return-requests-overview']`
- `['material-detail']`
- `['inventory-material-detail']`
- `['dashboard']`

## Read-after-write Refetch

After invalidation, the helper explicitly refetches active matching queries immediately, then schedules targeted active-only refetches at:

- 1.5 seconds
- 4 seconds

This is not global polling. It only runs after a stock-affecting mutation and only targets active Inventory/Dashboard query families.

## Result

No active Inventory workspace query key is orphaned from mutation invalidation.
