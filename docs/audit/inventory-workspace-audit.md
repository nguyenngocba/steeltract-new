# Inventory Workspace Audit

Date: 2026-07-02

Scope: audit-only. No application code was changed.

## Summary

Inventory currently shows only five sidebar workspaces because the active sidebar configuration was intentionally reduced to:

- `Tổng quan kho` -> `/inventory`
- `Giao dịch` -> `/inventory/transactions`
- `Phiếu trả vật tư` -> `/inventory/returns`
- `Vật tư & Tồn kho` -> `/inventory/materials`
- `Vị trí kho` -> `/inventory/locations`

The repository still contains many inventory page components and most of them still have direct routes in `AppRouter.tsx`. They are not deleted and are not all orphaned. Most are hidden operational routes: reachable by URL, but no longer exposed in the main Inventory sidebar.

The main inconsistency is that `apps/frontend/src/modules/inventory/config/inventory-tabs.ts` still lists more tabs than the visible sidebar, while the active navigation sources are:

- `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
- `apps/frontend/src/app/config/navigation.config.ts`
- direct route declarations in `apps/frontend/src/app/router/AppRouter.tsx`

`InventoryPage.tsx` and `InventoryWorkspacePage.tsx` are not the active Inventory workspace router. Current Inventory navigation is route-per-page, not a central `InventoryPage` tab switch.

## Files Audited

- `apps/frontend/src/modules/inventory/config/inventory-tabs.ts`
- `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
- `apps/frontend/src/app/config/navigation.config.ts`
- `apps/frontend/src/app/router/AppRouter.tsx`
- `apps/frontend/src/modules/inventory/pages/InventoryPage.tsx`
- `apps/frontend/src/modules/inventory/pages/InventoryWorkspacePage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/*`

## Findings

### Route Model

`AppRouter.tsx` directly registers Inventory pages as separate routes:

- `/inventory`
- `/inventory/materials`
- `/inventory/materials/:id`
- `/inventory/locations`
- `/inventory/inbound`
- `/inventory/transactions`
- `/inventory/returns`
- `/inventory/outbound`
- `/inventory/transfer`
- `/inventory/stock-take`
- `/inventory/adjustments`
- `/inventory/alerts`
- `/inventory/master-data`
- `/inventory/audit`

This means hidden pages are still deep-linkable unless redirected.

### Sidebar Model

Both navigation config files expose only five Inventory entries. This explains why the user sees five tabs even though more page files and routes exist.

### `inventory-tabs.ts`

`inventory-tabs.ts` still lists:

- overview
- stock
- locations
- inbound
- outbound
- transfer
- stock-take
- adjustments
- transactions
- returns
- alerts

However, this file does not currently determine the visible Inventory sidebar. It is stale or secondary compared with the active sidebar navigation config.

### Legacy Workspace Files

`InventoryPage.tsx` appears to be a legacy runtime page with older operational shell widgets. It is not imported by the active `AppRouter.tsx`.

`InventoryWorkspacePage.tsx` is a stub returning `<div />`. It is not the active workspace switch.

## Workspace Matrix

| Page | Route | Sidebar | Status | Recommendation |
| --- | --- | --- | --- | --- |
| `InventoryOverviewPage` | `/inventory` | Yes: `Tổng quan kho` | Active | Keep as primary Inventory cockpit. |
| `InventoryMaterialsPage` | `/inventory/materials` | Yes: `Vật tư & Tồn kho` | Active | Keep as the single material stock workspace after removing the old `Vật tư` split. |
| `InventoryTransactionsPage` | `/inventory/transactions` | Yes: `Giao dịch` | Active | Keep as the consolidated transaction history workspace. |
| `InventoryReturnRequestsPage` | `/inventory/returns` | Yes: `Phiếu trả vật tư` | Active | Keep as a first-class workspace because pending returns need operational handling. |
| `InventoryLocationsPage` | `/inventory/locations` | Yes: `Vị trí kho` | Active | Keep as warehouse location workspace. |
| `InventoryInboundPage` | `/inventory/inbound` | No | Hidden route, not orphaned | Keep route if used by quick actions. Decide whether inbound should remain a standalone deep-link page or become a drawer/action inside `Giao dịch`. |
| `InventoryOutboundPage` | `/inventory/outbound` | No | Hidden route, not orphaned | Keep route if used by outbound actions. Consider exposing through transaction actions rather than top-level sidebar. |
| `InventoryTransferPage` | `/inventory/transfer` | No | Hidden route, not orphaned | Keep route if transfer dashboard is still needed. Otherwise merge entry point under `Giao dịch`. |
| `InventoryAdjustmentsPage` | `/inventory/adjustments` | No | Hidden route, not orphaned | Keep as operational route. If adjustment remains frequent, expose via action menu or secondary navigation. |
| `InventoryStockTakePage` | `/inventory/stock-take` | No | Hidden route, not orphaned | Keep route. Recommend exposing via Inventory actions or adding a secondary operations menu if stock take is a regular workflow. |
| `InventoryAlertsPage` | `/inventory/alerts` | No | Hidden route, not orphaned | Decide whether alerts belong as a dedicated route or should be merged into Overview/Materials warning panels. |
| `InventoryAuditPage` | `/inventory/audit` | No | Diagnostic/admin route | Keep as admin-only or audit-only deep link. It is not listed in `inventory-tabs.ts`. |
| `InventoryMasterDataPage` | `/inventory/master-data` redirects to `/inventory/materials` | No | Retired/orphaned page file | Confirm master data functions moved elsewhere. If confirmed, archive/remove file in a cleanup sprint. |
| `InventoryPage` | No active route | No | Legacy orphan | Archive or remove after confirming no imports. |
| `InventoryWorkspacePage` | No active route | No | Stub orphan | Either implement as the real workspace switch or remove. Current active routing does not use it. |

## Orphan / Hidden Classification

### Active and Visible

- `InventoryOverviewPage`
- `InventoryMaterialsPage`
- `InventoryTransactionsPage`
- `InventoryReturnRequestsPage`
- `InventoryLocationsPage`

### Hidden but Routed

- `InventoryInboundPage`
- `InventoryOutboundPage`
- `InventoryTransferPage`
- `InventoryAdjustmentsPage`
- `InventoryStockTakePage`
- `InventoryAlertsPage`
- `InventoryAuditPage`

These are not true orphans because `AppRouter.tsx` still exposes routes for them.

### Retired or Orphaned

- `InventoryMasterDataPage`: page file remains, but `/inventory/master-data` redirects to `/inventory/materials`.
- `InventoryPage`: legacy page not used by current router.
- `InventoryWorkspacePage`: empty stub not used by current router.

## Why Inventory Only Shows Five Tabs

The visible Inventory sidebar is not generated from `inventory-tabs.ts`. It comes from the application navigation config, where Inventory was reduced to five operator-facing entries.

That change aligns with the recent UX decision to remove the duplicate `Vật tư` workspace and consolidate material detail under `Vật tư & Tồn kho`.

The remaining operational pages were left as direct routes, so the codebase has more Inventory pages than the sidebar exposes.

## Recommendations

### P0

- Decide whether Inventory should use direct route-per-page navigation or a central `InventoryPage` workspace switch. Do not keep both patterns indefinitely.
- Update or retire `inventory-tabs.ts` so it matches the actual navigation model.
- Keep the five visible sidebar entries as the current operator-facing Inventory workspace unless business users explicitly need direct sidebar access to inbound/outbound/transfer/stock take/adjustments.

### P1

- Add an Inventory operations action menu for hidden routes:
  - Nhập kho
  - Xuất kho
  - Điều chuyển
  - Kiểm kê
  - Điều chỉnh
- Keep `/inventory/inbound`, `/inventory/outbound`, `/inventory/transfer`, `/inventory/stock-take`, and `/inventory/adjustments` as deep links for now.

### P2

- Archive or delete `InventoryPage.tsx`, `InventoryWorkspacePage.tsx`, and `InventoryMasterDataPage.tsx` in a cleanup sprint after verifying no external links or tests depend on them.
- If audit pages are admin-only, move `/inventory/audit` into an admin/diagnostics route group instead of Inventory operator navigation.

## Verification

No build was run because this sprint requested documentation-only audit output and no application files were modified.
