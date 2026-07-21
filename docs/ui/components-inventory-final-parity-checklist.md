# Components Inventory Final UI Parity Checklist

Date: 2026-07-21

Scope:
- Reference pair 1: `InventoryInboundPage` -> `ComponentsOverviewPage`
- Reference pair 2: `InventoryMaterialsPage` -> `ComponentsListPage`

Validation method:
- Source-level rendered JSX/Tailwind path comparison.
- Browser screenshot capture was not available in this environment because no
  Chromium/Chrome/Playwright executable is installed.

## Checklist

| Check | Components Overview vs Inventory Inbound | Components List vs Inventory Materials |
| --- | --- | --- |
| Same outer page width | PASS: both use `EnterpriseModulePage` directly | PASS: both use `EnterpriseModulePage` directly |
| Same hero grid width | PASS: `grid grid-cols-1 xl:grid-cols-12` | PASS: `grid grid-cols-1 xl:grid-cols-12` |
| Same hero table width | PASS: `min-w-[1200px]` | PASS: `min-w-[1050px]` |
| Same hero table height | PASS: `h-[430px]` viewport | PASS: `h-[clamp(400px,60vh,520px)] min-h-[400px]` |
| Same right rail width | PASS: `xl:col-span-3` | PASS: `xl:col-span-3` |
| Same right rail card heights | PASS: uses `InventoryChartCard className="p-2"` auto-height like Inbound | PASS: `h-[220px]`, `h-[188px]`, `h-[200px]` |
| Same bottom analytics widths | PASS: `mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2` | PASS: single full-width quick-stat card |
| Same panel padding | PASS: hero `InventoryPanel title={...}` uses the same title/body padding branch | PASS: hero `InventoryPanel` uses the same child-header branch |
| Same panel header height | PASS: `text-sm`, `tracking-[0.14em]`, `InventoryPanel title` path | PASS: `mb-1 flex items-center justify-between`, `text-xs`, `tracking-[0.14em]` |
| Same table header height | PASS: `th px-4 py-2` | PASS: `th px-1.5 py-1` |
| Same pagination height | PASS: no hero pagination on both Overview/Inbound table cards | PASS: same `InventoryPagination` container class |
| Same gaps | PASS: `gap-1`, right rail `space-y-1.5`, bottom `gap-2` | PASS: `gap-1`, right rail `space-y-1` |
| Same margins | PASS: content `space-y-2 text-xs -mt-2`, hero `-mt-1`, bottom `mt-2` | PASS: content `space-y-1 -mt-2` |
| Same border radius | PASS: nested `rounded-lg border border-white/10 overflow-hidden` table viewport and shared panels | PASS: `rounded-lg border border-white/10 overflow-hidden` around `CockpitTableShell` |
| Same scroll viewport height | PASS: `h-[430px] overflow-hidden/auto` table viewport | PASS: `CockpitTableShell` owns overflow with clamp/min height |

## Failures Fixed

### 1. Components Overview hero table width

- Status before fix: FAIL
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsOverviewPage.tsx`
- Cause: table used `min-w-[980px]` while `InventoryInboundPage` uses `min-w-[1200px]`.
- Fix: changed the table to `w-full min-w-[1200px] text-xs table-fixed border-collapse`.

### 2. Components Overview table viewport wrapper

- Status before fix: FAIL
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsOverviewPage.tsx`
- Cause: table viewport used `inventoryTableShell ... h-[430px] overflow-auto`, while Inbound uses a nested `rounded-lg border border-white/10 overflow-hidden` wrapper with an inner `h-[430px]` viewport.
- Fix: replaced the table wrapper with the same nested rounded/bordered viewport used by Inbound.

### 3. Components Overview hero panel header and padding branch

- Status before fix: FAIL
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsOverviewPage.tsx`
- Cause: Components rendered the panel header inside children, so `InventoryPanel` used the no-title `ModuleAnalyticsPanel` branch. Inbound passes a non-string `title`, which uses the `EnterprisePanel` title/body padding branch.
- Fix: moved the header into `InventoryPanel title={...}` and matched `text-sm font-bold uppercase tracking-[0.14em]`.

### 4. Components Overview table header and row density

- Status before fix: FAIL
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsOverviewPage.tsx`
- Cause: header cells used `px-1.5 py-1`, and body cells used `px-1.5 py-0.5`; Inbound uses `px-4 py-2` for header and `px-2.5 py-1` for body.
- Fix: aligned header/body cell padding to the Inbound density.

### 5. Components Overview right rail card primitive

- Status before fix: FAIL
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsOverviewPage.tsx`
- Cause: right rail used `CockpitChartCard` with fixed heights (`h-[220px]`, `h-[178px]`, `h-[200px]`), while Inbound uses `InventoryChartCard className="p-2"` cards.
- Fix: changed the right rail to `InventoryChartCard className="p-2"` and kept two cards in the rail, matching Inbound's visual card primitive.

### 6. Components Overview bottom analytics primitive

- Status before fix: FAIL
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsOverviewPage.tsx`
- Cause: bottom analytics used `CockpitChartCard` with `heightClass="h-[220px]"`; Inbound bottom analytics uses `InventoryChartCard className="p-2"`.
- Fix: changed all four bottom analytics cards to `InventoryChartCard className="p-2"`.

### 7. Components List right rail chart contract

- Status before fix: FAIL
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`
- Cause: local `ChartCard` helper only forwarded `title`, `subtitle` and `className`. Materials' `ChartCard` forwards `value`, `delta`, `deltaColorClass`, action/page props and `chartHeightClass`, which changes header/body height behavior.
- Fix: expanded Components List `ChartCard` helper to match the Materials helper contract and aligned the three right-rail cards to `h-[220px]/h-[188px]/h-[200px]` with `h-[120px]/h-[82px]/h-[140px]` body viewports.

### 8. Components List table typography

- Status before fix: FAIL
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`
- Cause: table used `text-[13px]`; Materials uses `text-sm`.
- Fix: changed the table class to `w-full min-w-[1050px] text-sm table-fixed`.

### 9. Components List bottom summary primitive

- Status: PASS after recheck
- File: `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`
- Reference: `InventoryMaterialsPage` uses `CockpitChartCard title="Thống kê nhanh" className="min-h-0"`.
- Result: Components List now keeps the same `CockpitChartCard` primitive and the same 5-column quick-stat internal structure.

## Remaining Visual QA Note

All checklist items pass by rendered JSX/class path comparison. Final screenshot
evidence at 1366px, 1600px and 1920px remains pending until a browser runner is
available in the workspace.
