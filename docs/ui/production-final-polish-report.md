# Production Final Polish Report

Date: 2026-06-27

Scope: `apps/frontend/src/modules/production/pages/ProductionCockpitPage.tsx`

Views audited:

- overview
- work-orders
- boms
- reservations
- material-ledger
- material-issues
- warehouse
- logs

Source of truth:

- `InventoryOverviewPage.tsx`
- `InventoryMaterialsPage.tsx`
- `ComponentsListPage.tsx`

This audit is documentation-only. No application code, backend, API, Prisma, database schema, workflow, or commit changes are included.

## Screenshots Checklist

Screenshots still need to be captured manually in browser after this audit.

- [ ] 1440px, sidebar expanded: `/production`
- [ ] 1440px, sidebar collapsed: `/production`
- [ ] 1920px, sidebar expanded: `/production/orders`
- [ ] 1920px, sidebar collapsed: `/production/orders`
- [ ] 2560px, sidebar expanded: `/production/boms`
- [ ] 2560px, sidebar collapsed: `/production/material-issues`
- [ ] 1920px: `/production/reservations`
- [ ] 1920px: `/production/material-ledger`
- [ ] 1920px: `/production/warehouse`
- [ ] 1920px: `/production/logs`

Expected visual checks:

- KPI strip height matches Inventory cockpit cards.
- Main table visually dominates the page.
- Right widgets stay compact at about 170px.
- No decorative hero/header block appears before operational content.
- Empty states show icon, title, and description.
- Table rows fit 14-16 visible rows on a 1920x1080 viewport where data volume allows.

## Density Findings

### Root Layout

The top-level production shell now uses:

- `w-full`
- `min-w-0`
- `flex-1`
- `space-y-1`

The audited main views generally follow the current cockpit density.

Remaining density exceptions are mostly outside the page-level views:

- Detail drawers still use older spacing such as `gap-3`, `space-y-3`, and `max-w-*`.
- `OrderWorkspace`, `BomWorkspace`, `ProductionWarehouseDrawer`, and `IssueDetailDrawer` are not yet migrated to the same compact cockpit density.
- `Consumptions` is not in this sprint target, but still has legacy `gap-3`, `space-y-3`, and old panel layout.

Assessment:

- Page-level production tabs: mostly aligned.
- Drawer/workspace internals: still visually older and denser than Inventory cockpit.

### Table Density

Main tables in the audited tabs use:

- `COCKPIT_HEIGHTS.TABLE_MD`
- `CockpitTableShell`
- `DataTablePagination`
- `table-fixed`
- `text-[13px]`
- page size 14

Views aligned:

- Work Orders
- BOMs
- Reservations
- Material Ledger
- Material Issues
- Production Warehouse
- Logs

Notes:

- Overview embeds the Work Orders table, so table density follows the Work Orders implementation.
- Production Warehouse also has a secondary location detail table using `COCKPIT_HEIGHTS.TABLE_SM`, which is acceptable because it is not the primary table.
- At 1920x1080, visible row count should be close to 14 rows, but browser screenshot verification is still required.

### Right Widgets

Right rail widgets in the audited tabs mostly use:

- `CockpitChartCard`
- `COCKPIT_HEIGHTS.CHART_SM`
- `xl:col-span-3`
- `space-y-1`

Aligned views:

- Overview
- Work Orders
- BOMs
- Reservations
- Material Ledger
- Material Issues
- Production Warehouse
- Logs

Remaining issue:

- Secondary analytics below the main table often use `COCKPIT_HEIGHTS.CHART_LG`. This is acceptable for lower analytics rows, but they should not appear in the right rail.

## Inconsistent Widgets

### Shared Small Widgets Missing

The right rail widgets repeat the same small patterns across Production:

- mini stat stack
- recent list
- status list
- compact empty state

Recommended shared additions:

- `shared/ui/cockpit/CockpitSidebarStats.tsx`
- `shared/ui/cockpit/CockpitRecentList.tsx`
- `shared/ui/cockpit/CockpitStatusList.tsx`
- `shared/ui/cockpit/CockpitEmptyState.tsx`

Why this matters:

- Inventory, Components, Production, and Dashboard now all depend on the cockpit design language.
- The next modules, such as Purchasing, Projects, Suppliers, QC, and Logistics, will repeat these right-rail widgets unless they are centralized.
- Centralizing the small widgets would reduce visual drift and remove repeated `RankList`, `Info`, and ad hoc empty state patterns.

### Existing Local Helpers

Production still uses local helper components/patterns:

- `RankList`
- `Info`
- `ActivityList`
- `StatusChip`
- `ProductionDonut`
- `ProductionMiniBars`
- `ActionCards`

Some are domain-specific and can remain local. However, `RankList`, `Info`, and empty-state wrappers are good candidates for shared cockpit widgets.

## Typography Findings

### KPI

KPI cards use `CockpitKpiCard` with `state="normal"`, which provides:

- label `text-[12px]`
- value `text-[38px] xl:text-[42px]`
- bold tabular numeric style
- delta/note `text-[11px]`

No large KPI icons or status chips were found in the page-level KPI strip.

### Tables

Primary tables use `text-[13px]`, matching the Components and Inventory cockpit density.

Potential polish:

- Some table headers are English mixed with Vietnamese: `Work Order Cockpit`, `Production Material Ledger`, `Production Warehouse Material Grid`.
- This is functional but less polished than Inventory, which is more consistently Vietnamese in user-facing labels.

Recommendation:

- Standardize user-facing Production labels in Vietnamese while keeping backend/domain labels in tooltips or notes if needed.

## Responsive Findings

The intended responsive structure is present:

- main content: `xl:col-span-9`
- right rail: `xl:col-span-3`
- mobile/tablet: single-column grid
- tables have `min-w-*` and live inside `CockpitTableShell`

Potential risk:

- There will still be horizontal scroll inside tables by design due to dense operational columns.
- The checklist says "No horizontal scroll", but for dense ERP tables this should mean no page-level horizontal scroll. Table-level horizontal scroll is still expected and consistent with Inventory.
- Detail drawers with `max-w-*` may clip on smaller laptop widths if opened from these tabs.

Browser verification still required:

- 1440px expanded sidebar
- 1920px expanded/collapsed sidebar
- 2560px ultrawide

## Empty State Findings

Page-level empty states are now standardized with:

- icon
- title
- description

Validated examples:

- Work Orders: `Chưa có lệnh sản xuất`
- BOMs: `Chưa có dữ liệu BOM`
- Warehouse: `Chưa có dữ liệu vật tư`
- Material Issues: `Chưa có dữ liệu vật tư`
- Reservations: `Chưa có dữ liệu vật tư`
- Material Ledger: `Chưa có dữ liệu vật tư`
- Logs: `Chưa có nhật ký`

Remaining risk:

- Drawer/workspace sub-sections still include older plain text empty rows or panels.

## Data Quality Audit

### REAL Widgets

These widgets use current frontend/backend data:

- Production status counts
- Work order status counts
- Delayed order count
- Completed order count
- Reservation required/reserved/issued quantities
- Reservation status distribution
- Material issue required/issued/returned/remaining/readiness
- Material issue shortage by work order
- Production warehouse stock/reserved/available/required/shortage
- Production warehouse status distribution
- Ledger quantity movement by event and warehouse
- Logs today/type/recent counts
- BOM active/archive counts
- BOM material line count
- BOM estimated weight total
- BOM `structureType` classification

### PROXY Widgets

These are not fake, but not full financial truth:

- Work Orders "Top WO theo giá trị vật tư" uses required quantity as a proxy because unit cost is not present in the work-order view.
- Production weight uses `BOM estimatedWeight × order quantity`, so it is an estimated production load, not actual shopfloor weight.

### TODO Widgets

These explicitly need backend/API support:

- Material Ledger `Giá trị xuất`: needs ledger cost or linked issue/transaction total amount.
- Material Issues `Theo ưu tiên`: needs issue priority or WO priority exposed to the issue list.
- Logs `Operator`: needs user profile/operator details in production logs.

No fabricated percentages were found in the audited page-level widgets.

## Recommendations

### P0

- Capture browser screenshots for all audited routes at 1440px, 1920px, and 2560px with sidebar expanded/collapsed.
- Verify no page-level horizontal scroll appears. Table-level horizontal scroll is acceptable for ERP grids.
- Confirm page density visually shows 14-16 rows on 1920x1080 for main tables with enough data.

### P1

- Create shared cockpit micro-widgets:
  - `CockpitSidebarStats`
  - `CockpitRecentList`
  - `CockpitStatusList`
  - `CockpitEmptyState`
- Migrate Production right rails to these shared widgets first.
- Then reuse the same widgets in Inventory, Components, Dashboard, Projects, Suppliers, QC, and Logistics.
- Normalize Production user-facing titles to Vietnamese for cockpit consistency.

### P2

- Migrate drawer/workspace internals:
  - `OrderWorkspace`
  - `BomWorkspace`
  - `ProductionWarehouseDrawer`
  - `IssueDetailDrawer`
- Remove legacy `gap-3`, `space-y-3`, and broad `max-w-*` from drawer internals where they affect visual consistency.
- Consider extracting common table header/body classes for Production detail drawers after the page-level cockpit is stable.

## Overall Assessment

Production page-level views now mostly feel native to the SteelTrack cockpit system used by Inventory and Components.

The largest remaining visual debt is not the main tabs anymore. It is the nested drawer/workspace experience and repeated right-rail widget patterns. The proposed shared cockpit micro-widgets are the right next move before rolling this design language into Purchasing, Projects, Suppliers, QC, and Logistics.
