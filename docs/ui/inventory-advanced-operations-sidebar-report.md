# Inventory Advanced Operations Sidebar Report

Date: 2026-07-02

## Objective

Restore the Inventory operational pages into the sidebar without changing existing routes, API contracts, database schema, or Inventory workflow behavior.

## Implemented Navigation

Inventory now keeps the five primary operator workspaces visible:

- Tổng quan kho -> `/inventory`
- Vật tư & Tồn kho -> `/inventory/materials`
- Giao dịch -> `/inventory/transactions`
- Phiếu trả vật tư -> `/inventory/returns`
- Vị trí kho -> `/inventory/locations`

It also exposes a nested session-collapsible group:

- Nghiệp vụ nâng cao
  - Nhập kho -> `/inventory/inbound`
  - Xuất kho -> `/inventory/outbound`
  - Điều chuyển -> `/inventory/transfer`
  - Kiểm kê -> `/inventory/stock-take`
  - Điều chỉnh -> `/inventory/adjustments`
  - Cảnh báo -> `/inventory/alerts`
  - Audit -> `/inventory/audit`

## Route Strategy

No routes were changed. The implementation reuses the existing route-per-page Inventory architecture in `AppRouter.tsx`.

## Sidebar Behavior

- The advanced group is collapsed by default when no child route is active.
- Expand/collapse state is remembered for the browser session.
- Direct access to an advanced route auto-opens the group so the active page remains visible.
- Active child routes keep using the existing `SidebarItem` active route behavior.
- The active sidebar config files were kept synchronized:
  - `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
  - `apps/frontend/src/app/config/navigation.config.ts`

## Breadcrumb Behavior

`InventoryTabWorkspace` now renders a lightweight breadcrumb for Inventory routes.

Example:

`Inventory > Nghiệp vụ nâng cao > Nhập kho`

## Permissions

No new permission model was introduced. The Audit sidebar item is marked `adminOnly` and is shown only when the current user has an admin-like role or `admin.read` / `admin.write` / `*` permission. The route and API continue to rely on existing backend permissions.

## Files Changed

- `apps/frontend/src/app/shell/sidebar/SidebarGroup.tsx`
- `apps/frontend/src/app/shell/sidebar/EnterpriseSidebar.tsx`
- `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
- `apps/frontend/src/app/config/navigation.config.ts`
- `apps/frontend/src/modules/inventory/components/InventoryTabWorkspace.tsx`

## Verification Checklist

- `/inventory/inbound` reachable from sidebar.
- `/inventory/outbound` reachable from sidebar.
- `/inventory/transfer` reachable from sidebar.
- `/inventory/stock-take` reachable from sidebar.
- `/inventory/adjustments` reachable from sidebar.
- `/inventory/alerts` reachable from sidebar.
- `/inventory/audit` reachable from sidebar.
- Browser refresh keeps the current route.
- Browser Back/Forward remains route-driven.
- Advanced group remains collapsed by default and remembers expansion in the current session.

## Known Limitations

- The new `adminOnly` sidebar flag is intentionally minimal and used only for Inventory Audit in this sprint. A broader role/permission-driven navigation policy can be added later if more modules need item-level visibility rules.
