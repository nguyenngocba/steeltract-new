# Production UI Migration Plan

Date: 2026-06-27

Scope:

- `apps/frontend/src/modules/production/**`
- Read-only audit. No Production code changes were made.

Target visual system:

- Inventory cockpit
- Components cockpit
- Shared cockpit primitives:
  - `CockpitKpiCard`
  - `CockpitChartCard`
  - `CockpitTableShell`
  - `DataTablePagination`
  - `COCKPIT_HEIGHTS`

## Screenshot Checklist

Runtime screenshots were not captured in this audit pass. Required screenshot set before implementation approval:

| Viewport | Sidebar | Production route |
| --- | --- | --- |
| 1366x768 | Expanded | `/production` |
| 1366x768 | Expanded | `/production/orders` |
| 1366x768 | Expanded | `/production/material-issues` |
| 1920x1080 | Expanded | `/production/execution` |
| 1920x1080 | Collapsed | `/production/warehouse` |
| 2560x1440 | Expanded | `/production/boms`, `/production/reservations`, `/production/material-ledger`, `/production/consumptions`, `/production/logs` |

Each screenshot should compare against:

- Inventory Overview
- Inventory Materials
- Components List
- Components Production

## Current Route Inventory

Active routes are defined in `apps/frontend/src/modules/production/config/production-tabs.ts`:

| Route | Rendered section | Primary file/function |
| --- | --- | --- |
| `/production` | Overview cockpit | `ProductionCockpitPage.tsx` / `Overview` |
| `/production/boms` | Production BOM registry | `ProductionCockpitPage.tsx` / `Boms` |
| `/production/orders` | Work Order cockpit | `ProductionCockpitPage.tsx` / `Orders` |
| `/production/execution` | Execution board | `ProductionExecutionBoard.tsx` |
| `/production/reservations` | Reservation list | `ProductionCockpitPage.tsx` / `Reservations` |
| `/production/warehouse` | Production Warehouse cockpit | `ProductionCockpitPage.tsx` / `ProductionWarehouseCockpit` |
| `/production/material-ledger` | Material ledger | `ProductionCockpitPage.tsx` / `MaterialLedger` |
| `/production/material-issues` | Material Issue control center | `ProductionCockpitPage.tsx` / `Issues` |
| `/production/consumptions` | Consumption workflow | `ProductionCockpitPage.tsx` / `Consumptions` |
| `/production/logs` | Production logs | `ProductionCockpitPage.tsx` / `Logs` |

Other files found:

| File | Status |
| --- | --- |
| `ProductionPage.tsx` | Re-export to `ProductionCockpitPage`; active |
| `ProductionWorkspacePage.tsx` | Placeholder returning `null` |
| `ProductionOverviewPage.tsx` | Placeholder returning `<div />` |
| `workspaces/ProductionWorkspace.tsx` | Placeholder returning `<div />` |
| `features/ProductionOverview.tsx` | Placeholder returning `<div />` |
| `components/ProductionOrderTable.tsx` | Placeholder returning `<div />` |
| `components/AIBottleneckPanel.tsx` | Placeholder returning `<div />` |
| `components/MachineTelemetryPanel.tsx` | Placeholder returning `<div />` |
| `telemetry/ProductionTelemetry.tsx` | Placeholder returning `<div />` |
| `components/ProductionTelemetry.tsx` | Standalone hardcoded metric card set; not aligned |
| `components/ProductionWorkOrders.tsx` | Standalone old zinc/orange UI; not aligned |
| `components/WorkCenterRuntime.tsx` | Standalone old zinc/orange UI; not aligned |

## High-Level Findings

Production has strong real data coverage but does not yet visually behave like Inventory + Components.

Main issues:

- The root shell still uses `mx-auto max-w-[1800px]`, not `w-full min-w-0 flex-1 space-y-1`.
- The page starts with `ModulePageHeader` and a descriptive hero-like block.
- KPI cards use `ModuleKpiCard`, `ModuleKpiStrip`, and `InventoryKpi`, not `CockpitKpiCard`.
- Tables use `ModuleDataGrid`, `InventoryChartCard`, and `text-xs` rather than `CockpitTableShell`, `CockpitChartCard`, `text-[13px]`, and `DataTablePagination`.
- Many sections use `gap-3`, `space-y-3`, and older panel shells.
- Some list views hard-slice rows (`slice(0,10)`, `slice(0,12)`, `slice(0,15)`, `slice(0,20)`, `slice(0,50)`) instead of a consistent pagination component.
- Several empty states are plain text inside bordered boxes rather than standardized icon/title/description empty states.
- Some analytics values are real aggregates, but several cards use proxy/fallback values because backend data is missing.

## Page Audit

### Production Shell / Navigation

File:

- `apps/frontend/src/modules/production/pages/ProductionCockpitPage.tsx`

Current layout:

- Wrapped in `OperationalShell`.
- Uses a custom full-page `main` background.
- Uses `mx-auto max-w-[1800px]`.
- Starts with `ModulePageHeader`:
  - eyebrow: `Steel fabrication execution`
  - title: `Trung tâm điều hành sản xuất`
  - description: `Inventory → BOM → Manufacturing Order → Execution → QC → Yard`
- Navigation tabs are custom rounded buttons inside a bordered nav container.

Gaps:

- Does not start immediately with KPI/filter/workspace like Inventory and Components.
- Root layout does not match target `w-full min-w-0 flex-1 space-y-1`.
- Uses `mb-3`, `my-3`, `max-w-*`, and descriptive header text.

Migration:

- Remove `ModulePageHeader`.
- Move actions to a compact right-aligned toolbar above or beside tabs:
  - `+ Tạo lệnh sản xuất`
  - `+ Tạo BOM`
  - `Xuất báo cáo` only if export is wired.
- Replace root wrapper with the same fluid structure used by Components.
- Keep nav if needed, but reduce to `gap-1`, no decorative description.

### `/production` Overview

Function:

- `Overview`

Layout:

- `Orders` table first.
- Analytics below in 2-column grids.
- Secondary row contains activity and quick actions.

KPI cards:

- Inherited from top-level `ModuleKpiStrip`.
- Uses `ModuleKpiCard` for overview mode.

Tables:

- Uses `Orders` embedded table.
- Table is primary, which matches the target principle.
- Current table is inside `InventoryChartCard` + `ModuleDataGrid`.

Charts:

- Production progress donut.
- Stage mini bars.
- Material issue/reservation donut.
- Active components list.
- Activity list.

Empty states:

- Active components empty state is plain text in a rounded box.
- Activity list has no standardized empty state.

Action toolbar:

- Top shell action exists, but mixed with decorative header.
- Quick action cards are visual-only buttons and are not clearly wired.

Duplicate wrappers:

- `InventoryChartCard`, `ProductionPanel`, `ModuleDataGrid`.

Spacing / typography:

- Uses `inventoryPageStack`, `inventoryGridGap`, and inner `gap-3`/`space-y-2`.
- Tables use `text-xs`.

Mock/demo data:

- No obvious hardcoded totals in the main Overview calculations.
- `ActionCards` shortcuts appear static.

Real aggregates:

- Production order status counts.
- Stage distribution from `currentStageCode` / stage records.
- Material allocation status from reservations/issues.
- Active components from linked production orders.
- Logs from `useProductionLogs`.

Migration target:

```text
KPI strip
Filter/action toolbar
Grid 12 columns:
  Production Orders table: xl:col-span-9
  Right sidebar: xl:col-span-3
    Tiến độ
    Theo dự án
    Gần đây
```

### `/production/orders`

Function:

- `Orders`

Layout:

- Main Work Order table.
- Analytics panels below in 5-column layout.
- Warning banner below analytics.

KPI cards:

- Top-level Work Order mode uses `InventoryKpi`.

Tables:

- Uses `InventoryChartCard` and `ModuleDataGrid`.
- Uses `text-xs`.
- Hard slices `enriched.slice(0, 10)`.
- No `DataTablePagination`.

Charts:

- Top WO by material value proxy.
- Top WO shortages.
- WO due soon.
- Production progress donut.
- Material readiness distribution.

Empty states:

- `RankList` returns plain rounded text block, not Module empty state.

Action toolbar:

- No page-specific create action in the table header.
- Top shell has `+ Tạo lệnh sản xuất`.

Mock/demo data:

- Material value is explicitly a proxy using required quantity because frontend data lacks unit cost.
- Stage progress falls back based on status when stage data is missing.

Real aggregates:

- Work Order list and statuses from `useProductionOrders`.
- Readiness from BOM + issue data via `calculateComponentMaterialReadiness`.
- Delay from planned end date/status.

Backend TODO:

- Expose WO material value with unit cost/line totals.
- Expose canonical release readiness status if workflow should lock below 100%.

Migration target:

- Use `CockpitKpiCard` for 6 Work Order KPIs.
- Use `CockpitChartCard` + `CockpitTableShell` for table.
- Replace hard slice with `DataTablePagination`, page size 14.
- Move the 5 analytics into right-sidebar/secondary rows after table priority is accepted.

### `/production/boms`

Function:

- `Boms`

Layout:

- KPI strip.
- Main BOM registry table + right sidebar with classification and quick actions.

KPI cards:

- Uses `InventoryKpi` inside `ModuleKpiStrip`.

Tables:

- Uses `InventoryChartCard` + `ModuleDataGrid`.
- Uses `text-xs`.
- Hard slices `rows.slice(0,10)`.

Charts:

- BOM classification donut uses hardcoded segments:
  - Dầm chính = 42
  - Cột thép = 28
  - Bản mã = 18
  - Giằng = 12

Empty states:

- No standardized empty state for empty BOM list.

Action toolbar:

- `+ Tạo BOM` in table card action.

Duplicate wrappers:

- `ProductionPanel` and `InventoryChartCard`.

Mock/demo data:

- BOM classification donut is fully hardcoded.

Real aggregates:

- BOM count.
- Active vs archived.
- BOM item line count.
- Estimated weight.

Backend TODO:

- Either derive BOM category distribution from `structureType`, `routingSteps`, or explicit component type, or hide classification chart when unavailable.

Migration target:

- Keep BOM table as primary for `/production/boms`.
- Right sidebar:
  - BOM status distribution.
  - Structure type distribution from real rows.
  - Recent BOM changes.

### `/production/execution`

File:

- `components/ProductionExecutionBoard.tsx`

Layout:

- KPI strip across 7 stage cards.
- Top analytics row: bottleneck + stage distribution.
- Horizontal Kanban board with min width `1680px`.
- Drawer with detailed sections.

KPI cards:

- Uses `InventoryKpi`, not `CockpitKpiCard`.
- 7 KPIs may crowd laptop view.

Tables:

- No primary table, by design this is Kanban.
- Drawer issue history table uses `ModuleDataGrid` and `text-xs`.

Charts:

- Stage distribution donut.
- Bottleneck summary cards.

Empty states:

- Kanban columns do not show a formal empty state when a stage has no cards.
- Drawer sections use plain layouts.

Action toolbar:

- No top actions.

Duplicate wrappers:

- `InventoryChartCard`, `InventoryKpi`, `ModuleKpiStrip`.

Spacing / responsive:

- Uses `gap-3`.
- Horizontal board uses `min-w-[1680px]`, which is acceptable for TV/shopfloor mode but needs a cockpit-responsive variant.

Mock/demo data:

- Stage mapping is partly UI fallback until backend exposes canonical stage.
- Progress defaults by stage when stage rows are absent.

Real aggregates:

- Cards are built from real Production Orders.
- Readiness from BOM/issues.
- Delay from due date.
- Reservation and issue history from existing data.

Backend TODO:

- Canonical stage transition history.
- Work center/stage queue API.
- Shopfloor TV preferences if this board becomes a shopfloor display.

Migration target:

- Keep Kanban as special view.
- Use `CockpitKpiCard` for stage counts.
- Use `CockpitChartCard` for bottleneck and stage distribution.
- Add per-column centered empty states.
- Keep 7-column board, but make desktop/laptop fallback scroll intentional and documented.

### `/production/reservations`

Function:

- `Reservations`

Layout:

- KPI strip.
- Reservation table + right sidebar.

KPI cards:

- Uses `InventoryKpi`.

Tables:

- Uses `InventoryChartCard` + `ModuleDataGrid`.
- Uses `text-xs`.
- Hard slices `rows.slice(0,12)`.
- No pagination.

Charts:

- Reservation state donut.

Empty states:

- No standardized empty state for empty reservation list.

Action toolbar:

- Per-row actions:
  - Reserve
  - Issue
  - Release
  - Expire

Mock/demo data:

- No obvious fake metrics.

Real aggregates:

- Reservation count.
- Required/reserved/issued totals.
- Reservation locations from line buckets.

Migration target:

- Primary table in `CockpitTableShell`, page size 14.
- Right sidebar:
  - Reservation status.
  - Required vs reserved vs issued.
  - Recent actions.

### `/production/warehouse`

Function:

- `ProductionWarehouseCockpit`

Layout:

- KPI strip.
- Full-width material grid.
- Four analytics cards.
- Full-width location detail table.
- Drawer.

KPI cards:

- Uses `InventoryKpi`.

Tables:

- Uses `InventoryChartCard`, `ModuleDataGrid`, `text-xs`.
- Material grid hard slices `rows.slice(0,20)`.
- Location detail has no pagination.

Charts:

- Top WO consumption.
- Material readiness.
- Production locations.
- Shortage board.

Empty states:

- Main grid empty state is plain text.
- RankList empty states are plain text blocks.

Action toolbar:

- No top action; acceptable for read-only warehouse cockpit.

Mock/demo data:

- Inventory value depends on average cost availability.
- Status and availability are real derivations.

Real aggregates:

- Production stock from `locationBalances` filtered to `PRODUCTION`.
- Required from active BOM/order demand.
- Reserved from reservation lines.
- Consumption by WO from production consumptions.

Backend TODO:

- Persisted production warehouse ledger if auditability beyond Inventory balances is required.
- Formal material readiness API if the calculation spreads further.

Migration target:

- Main material grid gets 9-column primary area.
- Right sidebar:
  - Shortage risk.
  - Readiness.
  - Recent production locations.
- Location detail can be secondary row with pagination.

### `/production/material-ledger`

Function:

- `MaterialLedger`

Layout:

- Filter panel + ledger table on left.
- Right sidebar with ledger overview and event distribution.

KPI cards:

- No top KPI strip.
- Sidebar uses `ProductionPanel`.

Tables:

- Uses `InventoryChartCard` and `ModuleDataGrid`.
- Uses `text-xs`.
- Hard slices `rows.slice(0,50)`.

Charts:

- Event distribution donut.

Empty states:

- No standardized empty state.

Action toolbar:

- Filter controls exist, but not `ModuleFilterBar` style.

Mock/demo data:

- No obvious fake numbers.

Real aggregates:

- Ledger event rows.
- Reserve/release/net quantities.
- Event type distribution.

Migration target:

- Use sticky `ModuleFilterBar` or cockpit filter row.
- Add KPI strip:
  - Rows
  - Reserve
  - Release
  - Issue
  - Return
  - Consume
- Table page size 14-16.

### `/production/material-issues`

Function:

- `Issues`

Layout:

- KPI strip.
- Main issue table.
- Analytics grid.
- Readiness/business indicators.
- Detail drawer.

KPI cards:

- Uses `InventoryKpi`.
- `Giá trị cấp phát` displays `--`.

Tables:

- Uses `InventoryChartCard`, `ModuleDataGrid`, `text-xs`.
- Main table hard slices `issueRows.slice(0,15)`.

Charts:

- Top issued materials.
- Top returned materials.
- WO shortages.
- Readiness by WO.
- Source locations.
- Readiness distribution.

Empty states:

- RankList plain text.
- Main issue table has no standardized empty state.

Action toolbar:

- `+ Tạo phiếu cấp` button exists but appears inert in current code.
- Row action handles return workflow.

Mock/demo data:

- `Giá trị cấp phát = --` because current issue API lacks cost.
- Business indicators note explicitly says value cannot be calculated from frontend.

Real aggregates:

- Issue count.
- Issued/returned/remaining/readiness.
- Work Orders with issues.
- Returnable material.
- Source location from issue bucket.

Backend TODO:

- Material issue API should expose `unitCost`, `totalAmount`, and issue document value.
- Formal issue document header/approval workflow if operators need create/approve issue documents.

Migration target:

- Keep table primary.
- Move analytics to right sidebar + secondary row.
- Disable or hide `+ Tạo phiếu cấp` until wired.
- Replace `--` with unavailable empty state or backend-backed value.

### `/production/consumptions`

Function:

- `Consumptions`

Layout:

- KPI mini-grid.
- Consumption table left.
- Right sidebar panels.

KPI cards:

- Uses `InventoryKpi` in a local grid, not `CockpitKpiCard`.

Tables:

- Uses `InventoryChartCard`, `ModuleDataGrid`, `text-xs`.
- Hard slices `rows.slice(0,50)`.

Charts:

- Consumption distribution donut.

Empty states:

- No standardized empty state.

Action toolbar:

- Row action `Consume` opens prompt-based input.

Mock/demo data:

- No fake totals, but prompt-based interaction is not production-grade UI.

Real aggregates:

- Issued/returned/consumed/scrap/remaining by MO/material.

Backend TODO:

- None required for display; UI needs modal/drawer entry pattern.

Migration target:

- Replace prompt UX with cockpit drawer/modal.
- Use primary table + right sidebar:
  - Balance equation.
  - Consumption split.
  - Recent consume entries.

### `/production/logs`

Function:

- `Logs`

Layout:

- Single full-width log table.

KPI cards:

- None.

Tables:

- Uses `InventoryChartCard`, `ModuleDataGrid`, `text-xs`.
- Hard slices `(rows ?? []).slice(0,20)`.

Charts:

- None.

Empty states:

- No standardized empty state.

Mock/demo data:

- No fake values.

Real aggregates:

- Production logs from `useProductionLogs`.

Migration target:

- Add compact KPI strip:
  - Total logs
  - Today
  - Stage updates
  - Errors/warnings if type supports it
- Add table pagination and right sidebar with activity type distribution.

## Modal / Drawer Audit

### ManufacturingOrderModal

File:

- `components/ManufacturingOrderModal.tsx`

Findings:

- Custom fixed modal.
- Uses `max-w-3xl`, `gap-4`, `text-xs`, and local input classes.
- Uses frontend-generated `nextLocalCode('MO')`.
- Good: date-time fields refresh current local time on focus.
- Good: filters BOMs by selected component.

Migration:

- Use `ModuleDetailDrawer` or a shared cockpit modal shell.
- Replace local code generation with backend-owned numbering when available.
- Keep current form behavior until backend changes are planned.

### ProductionBomModal

File:

- `components/ProductionBomModal.tsx`

Findings:

- Custom fixed modal.
- Uses `mx-auto max-w-7xl`, `gap-4`, `space-y-4`.
- Has strong real workflow: production material selection by category and production warehouse stock warnings.
- Contains descriptive header text that is useful inside a modal, not decorative page text.

Migration:

- Convert shell to shared drawer/modal tokens.
- Preserve workflow logic.
- Move right summary/warnings into `CockpitChartCard` style panels.

### OrderWorkspace / BomWorkspace

Functions:

- `OrderWorkspace`
- `BomWorkspace`

Findings:

- Deep operational drawers are useful.
- Still use `InventoryKpi`, `InventoryChartCard`, `ProductionPanel`, `gap-3`, `max-w-*`.
- Some sections are labeled `Section A/B/C`, which reads like implementation notes rather than operator-facing labels.
- Some missing backend values are displayed as plain text (`Chưa có unit cost`).

Migration:

- Keep drawer UX.
- Replace internal KPI/cards with cockpit primitives.
- Rename section labels to operator language:
  - `Thông tin lệnh`
  - `Tình trạng vật tư`
  - `Tiến độ sản xuất`
  - `Phiếu cấp phát`
  - `Giữ chỗ vật tư`

## Duplicate Wrapper Audit

Current wrappers still used heavily:

- `ModuleKpiStrip`
- `ModuleKpiCard`
- `InventoryKpi`
- `InventoryChartCard`
- `ModuleDataGrid`
- `ProductionPanel`
- `ProductionKpi`
- `ProductionDonut`
- `ProductionMiniBars`

Recommended shared cockpit replacements:

| Current | Replace with |
| --- | --- |
| `InventoryKpi` / `ModuleKpiCard` / `ProductionKpi` | `CockpitKpiCard` |
| `InventoryChartCard` / `ProductionPanel` | `CockpitChartCard` |
| `ModuleDataGrid` shell | `CockpitTableShell` |
| hard `slice()` table windows | `DataTablePagination` |
| plain empty text blocks | `ModuleEmptyState` |

Keep temporarily:

- `ProductionDonut`
- `ProductionMiniBars`
- `Meter`
- `StatusChip`

These can remain as chart/primitive renderers inside `CockpitChartCard` until a broader chart foundation exists.

## Mock / Demo Data Inventory

| Location | Mock/demo/proxy | Recommendation |
| --- | --- | --- |
| `Boms` classification donut | Hardcoded 42 / 28 / 18 / 12 | Derive from `structureType` or remove chart |
| `Orders` material value ranking | Uses required quantity as proxy | Backend should expose material cost per WO |
| `ProductionExecutionBoard` fallback stages/progress | UI fallback mapping from status/readiness | Backend should expose canonical current stage and stage transition history |
| `Issues` value KPI | Displays `--` | API should expose issue line value |
| `OrderWorkspace` issue value | Displays `Chưa có unit cost` | API should expose issue valuation |
| `ProductionTelemetry.tsx` | Hardcoded metrics 24 / 18 / 6 / 482 | Replace or archive if unused |
| `ProductionWorkOrders.tsx` | Old card layout and limited slice | Replace with active `/production/orders` cockpit or archive if unused |
| Placeholder files | Return `<div />` or `null` | Remove/archive after import audit |

## Real Aggregate Inventory

Production has useful real aggregates already:

- Order status counts.
- Completed today.
- Delay detection.
- BOM estimated production weight.
- BOM material line count.
- Material readiness via BOM required vs issue net issued.
- Reservation required/reserved/issued totals.
- Production warehouse stock, available, reserved, shortage, readiness.
- Production material ledger event counts and quantities.
- Material issue issued/returned/remaining/readiness.
- Consumption issued/returned/consumed/scrap/remaining.
- Execution board bottleneck and stage distribution from orders.
- Logs from production log API.

## Migration Plan

### Phase 1: Shell + Top KPI Foundation

Files:

- `ProductionCockpitPage.tsx`
- `ProductionCockpitShared.tsx`

Tasks:

1. Remove `ModulePageHeader`.
2. Replace root wrapper with `w-full min-w-0 flex-1 space-y-1`.
3. Remove `mx-auto max-w-[1800px]`.
4. Convert top KPI strip to `CockpitKpiCard` `h-[128px]`.
5. Keep existing query hooks and calculations unchanged.

Acceptance:

- `/production` starts with action toolbar, tabs/filter, or KPI strip.
- No decorative text before operational controls.

### Phase 2: Production Orders Primary Layout

Files:

- `ProductionCockpitPage.tsx` / `Overview`
- `ProductionCockpitPage.tsx` / `Orders`

Tasks:

1. Make Production Orders table the primary `xl:col-span-9`.
2. Add right sidebar `xl:col-span-3`:
   - `Tiến độ`
   - `Theo dự án`
   - `Gần đây`
3. Replace table shell with `CockpitTableShell`.
4. Replace hard `slice(0,10)` with `DataTablePagination`, page size 14.
5. Set table class to `w-full min-w-[...] table-fixed text-[13px]`.

Acceptance:

- 14-16 visible rows at 1080p.
- Right sidebar uses exactly 170px cockpit widgets.

### Phase 3: Tab-by-Tab Table Standardization

Migrate:

- `Boms`
- `Reservations`
- `ProductionWarehouseCockpit`
- `MaterialLedger`
- `Issues`
- `Consumptions`
- `Logs`

Tasks:

1. Replace `InventoryChartCard` table wrappers with `CockpitChartCard`.
2. Replace `ModuleDataGrid` wrappers with `CockpitTableShell`.
3. Add `DataTablePagination`.
4. Replace plain empty text with `ModuleEmptyState`.
5. Normalize grids to `gap-1`.

Acceptance:

- No hard-coded table slices remain in active tabs.
- All active tables have pagination.

### Phase 4: Execution Board Cockpit Alignment

File:

- `ProductionExecutionBoard.tsx`

Tasks:

1. Convert stage KPI strip to `CockpitKpiCard`.
2. Convert top analytics to `CockpitChartCard`.
3. Add empty state to empty Kanban columns.
4. Preserve horizontal scroll for shopfloor board but reduce `gap-3` to controlled cockpit spacing where possible.
5. Convert drawer internal cards to cockpit primitives.

Acceptance:

- Execution board remains Kanban, but its shell/cards match Inventory/Components.

### Phase 5: Modal / Drawer Polish

Files:

- `ManufacturingOrderModal.tsx`
- `ProductionBomModal.tsx`
- `ProductionCockpitPage.tsx` drawer sections

Tasks:

1. Replace custom modal shells with shared drawer/modal styles.
2. Remove `max-w-*`/`mx-auto` where it breaks fluid workspace.
3. Keep forms and business behavior unchanged.
4. Rename technical section labels.

Acceptance:

- Production create/edit surfaces feel native to Inventory/Components.

### Phase 6: Cleanup Unused / Placeholder Files

Candidates:

- `ProductionWorkspacePage.tsx`
- `ProductionOverviewPage.tsx`
- `workspaces/ProductionWorkspace.tsx`
- `features/ProductionOverview.tsx`
- `components/ProductionOrderTable.tsx`
- `components/AIBottleneckPanel.tsx`
- `components/MachineTelemetryPanel.tsx`
- `telemetry/ProductionTelemetry.tsx`

Tasks:

1. Confirm imports/routes.
2. Archive or delete only after explicit approval.
3. Avoid deleting in the UI migration sprint unless requested.

## Priorities

### P0

- Remove decorative `ModulePageHeader` and `max-w` shell from active Production cockpit.
- Convert top KPIs to `CockpitKpiCard`.
- Convert `/production` and `/production/orders` to the target 9/3 layout.
- Replace hard table slices in primary Production Orders table with `DataTablePagination`.

### P1

- Convert Material Issues, Reservations, Warehouse, Ledger, Consumptions, Logs tables to cockpit table/pagination standard.
- Replace plain empty states with `ModuleEmptyState`.
- Hide or disable inert actions such as `+ Tạo phiếu cấp` until wired.
- Remove hardcoded BOM classification chart.

### P2

- Align Execution Board drawer and analytics cards.
- Normalize Production modals to shared drawer/modal shell.
- Archive placeholder/deprecated files after import audit.
- Replace old zinc/orange standalone components if they are still reachable.

## Backend TODO List

Required to eliminate UI proxies:

1. Work Order material cost:
   - expose required/issued material value by WO.
   - include `unitCost`, `totalAmount`, and cost source.
2. Material Issue valuation:
   - expose line `unitCost` and `totalAmount`.
   - expose document-level total value.
3. Canonical shopfloor stage data:
   - immutable stage transition history.
   - current work-center/stage queue.
   - actual start/end per stage.
4. Production warehouse ledger:
   - optional if operators need auditability independent from Inventory balances.
5. BOM classification:
   - expose structure/component type distribution if BOM analytics are expected.
6. Non-inventory document numbering:
   - move MO/BOM numbering fully backend-side to avoid frontend-generated `nextLocalCode`.

## Implementation Guardrails

- Do not change Production business logic during UI migration.
- Do not change API contracts during UI migration.
- Do not create migrations.
- Do not modify Production reservation/issue/consume workflows while changing visuals.
- Keep real aggregate calculations intact until a backend endpoint replaces them.

