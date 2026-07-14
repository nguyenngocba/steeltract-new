# Inventory React Component Audit

Date: 2026-07-11

## Scope

Active Inventory tabs from `inventory-tabs.ts`: Overview, Materials, Locations,
Inbound, Outbound, Transfer, Stock Take, Adjustments, Transactions, Returns, and
Alerts. Material Detail and transaction drawers were included as shared surfaces.

## Shared Primitive Coverage

| Surface | Current foundation | Assessment |
|---|---|---|
| KPI | `CockpitKpiCard`, legacy local wrappers | PARTIAL |
| Chart frame | `CockpitChartCard`, `InventoryChartCard`, local `ChartCard` | PARTIAL |
| Table shell | `CockpitTableShell`, legacy Inventory shell classes | PARTIAL |
| Filter | `ModuleFilterBar` on Inbound/Outbound; local filters elsewhere | PARTIAL |
| Pagination | `DataTablePagination` plus `InventoryPagination` | STANDARDIZED |
| Drawer | `ModuleDetailDrawer` across operational detail surfaces | PASS |
| Loading/empty | Module and Cockpit shared states on newer tabs | PARTIAL |
| Status | generic and domain-local badges | INTENTIONAL PARTIAL |

## Duplicate Findings

### Removed In EPIC136

- Six active page-local pagination algorithms were replaced by
  `InventoryPagination`.
- Three unused local pagination copies were deleted from Overview, Inbound, and
  Outbound.
- Two unused `OverviewMetricCard` wrappers were deleted from Inbound/Outbound.
- Per-page wrapper density remains byte-for-byte equivalent through
  `containerClassName`; no visual redesign was performed.

### Retained Intentionally

- Overview/Materials/Locations chart and KPI wrappers have different approved
  headers, heights, secondary values, and interactions. Replacing them now would
  alter presentation.
- `ReturnStatusBadge`, stock-status labels, transaction-type badges, and aging
  badges encode different domain semantics and must not be merged by string name.
- Detail drawer components are domain compositions over `ModuleDetailDrawer`,
  not duplicate drawer foundations.

## Legacy/Dead-Code Candidates

The repository contains parallel `features/`, `tabs/`, `tables/`, `analytics/`,
and `maps/` component trees, including several one-line placeholder exports.
They are not deleted in this sprint because filename/content matching alone is
not sufficient proof that lazy routes or future imports are absent. Removal must
be a separate dead-code sprint with import-graph and route verification.

High-priority candidates include duplicate Inventory table entry points,
parallel WarehouseMap2D/3D implementations, placeholder analytics widgets, and
alternate Overview/Stock/Transaction feature trees.

## Result

The active Inventory presentation foundation is clearer and pagination logic is
centralized. Full component consolidation is not yet safe without presentation
golden screenshots and import-graph validation.

