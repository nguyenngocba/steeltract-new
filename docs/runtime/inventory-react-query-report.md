# Inventory React Query Report

Date: 2026-07-10

Status: PASS

## TanStack Query Policy Applied

Mutation success callbacks now invalidate the complete query families affected by Inventory stock changes. The implementation follows the TanStack Query pattern of returning invalidation promises from `onSuccess` so active queries can refetch before the mutation lifecycle is considered settled.

## Changed Frontend Files

- `apps/frontend/src/modules/inventory/hooks/invalidateInventoryReadState.ts`
- `apps/frontend/src/modules/inventory/hooks/useCreateTransaction.ts`
- `apps/frontend/src/modules/inventory/hooks/mutations/useCreateInbound.ts`
- `apps/frontend/src/modules/inventory/hooks/mutations/useCreateOutbound.ts`
- `apps/frontend/src/modules/inventory/hooks/useTransactionEngineQueries.ts`
- `apps/frontend/src/modules/inventory/hooks/useInventoryReadModels.ts`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryReturnRequestsPage.tsx`
- `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`

## React State Audit

- No local derived stock state was introduced.
- No `setQueryData` optimistic stock mutation was added, because stock truth remains backend/repository/snapshot owned.
- No memo dependency changes were required for Material Detail or Materials list.
- Overview refetches every 5 seconds while mounted to catch snapshot updates without manual reload.
- The Overview refresh control displays `Đang đồng bộ...` during background refetches.

## Stale Time Audit

| Query | Stale time | Read-after-write behavior |
|---|---:|---|
| Materials | 10 seconds | Invalidated by root `['inventory']` after mutation |
| Overview | 10 seconds | Invalidated and additionally refreshed every 5 seconds |
| Material transactions | 10 seconds | Invalidated by root `['inventory']` after mutation |
| Material Detail | default | Invalidated by `['material-detail']` |
| Transactions | default + 4s polling | Invalidated by `['inventory-transactions']` |

## Result

Read-after-write behavior is now aligned with the active query keys. Transaction/detail/location workspaces update immediately via invalidation; Overview follows the snapshot delay model and refreshes automatically.
