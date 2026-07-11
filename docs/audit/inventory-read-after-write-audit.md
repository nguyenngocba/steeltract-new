# Inventory Read-after-Write Audit

Date: 2026-07-10

Status: REMEDIATED

## Scope

EPIC118.4 audits Inventory frontend read-after-write consistency after stock-affecting mutations:

- Nhập kho
- Xuất kho
- Điều chuyển
- Điều chỉnh
- Trả vật tư

Backend Repository, business logic, Event/Outbox, Snapshot Engine, API contract, and database schema were not changed.

## Findings

| Area | Query key in use | Previous invalidation | Finding |
|---|---|---|---|
| Inventory Overview | `['inventory', 'overview', query]` | `['inventory-audit']`, sometimes `['inventory']` | Some mutation paths did not invalidate the new read-model key. |
| Inventory Materials | `['inventory', 'materials', query]` | `['materials']` in legacy hooks | New server-side Materials workspace could remain stale after inbound/outbound wizard hooks. |
| Material Detail | `['material-detail', id]` | `['material-detail']` | Correctly covered by root invalidation. |
| Material transaction history | `['inventory', 'material-transactions', materialId, page, pageSize]` | Not consistently covered | Detail history could remain stale after mutation if only legacy transaction key was invalidated. |
| Transaction workspace | `['inventory-transactions', filters]` | `['inventory-transactions']` | Covered, but not centralized. |
| Locations | `['inventory-zones']`, `['inventory-zone-detail']` | `['zones']` in one hook | `['zones']` did not match the active location query key. |
| Return requests | `['inventory-return-requests']` | Not covered from Project return creation | Creating a project return could leave the Inventory Return workspace stale. |

## Remediation

Added a centralized frontend helper:

`apps/frontend/src/modules/inventory/hooks/invalidateInventoryReadState.ts`

It invalidates all Inventory read families affected by stock mutations:

- `['inventory']`
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

Mutation paths now route through this helper:

- `useCreateTransaction`
- `useCreateInbound`
- `useCreateOutbound`
- `useCreateInventoryTransactionMutation`
- `useCreateReturnRequestMutation`
- `useAdvanceReturnRequestMutation`
- `InventoryReturnRequestsPage` receive/reject actions
- Project material return creation in `ProjectsPage`

## Snapshot Consistency

Workspace reads are invalidated immediately. Inventory Overview remains snapshot-first and may reflect background snapshot completion after a short delay. To avoid requiring a manual page refresh, `useInventoryOverview` now refetches every 5 seconds while mounted.

## Result

The frontend now invalidates the actual active query keys instead of only legacy or mismatched keys.
