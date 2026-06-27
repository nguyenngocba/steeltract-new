# Components UI Migration Plan

Scope: read-only UI audit for Components module pages.

Target design system:

- `InventoryOverviewPage.tsx`
- `InventoryMaterialsPage.tsx`
- `ComponentsListPage.tsx`

These pages define the cockpit pattern for Components migration: compact KPI strip, `gap-1` grid rhythm, industrial cockpit cards, large operational table, right-side short widgets, shared empty/loading states, and no separate visual language.

## Shared Findings

- Most Components pages still use `ComponentsKpiCard`, `ComponentsPanel`, and `ComponentsFilterBar` from `ComponentsCockpitShared` instead of the newer cockpit foundation used by `ComponentsListPage`.
- Several pages use `space-y-4`, `gap-4`, custom `bg-[#050d18]`, custom modal shells, and custom tables. This creates a looser CRUD/dashboard feel than Inventory.
- Tables often use plain `overflow-auto` plus `text-sm`, not the Inventory table shell pattern: transparent shell, `table-fixed`, tight paddings, consistent header border, and stable cockpit height.
- Loading and empty states are inconsistent. Some are plain text inside table rows; others use `ModuleEmptyState`.
- Responsive layouts vary between `xl:grid-cols-[1fr_390px]`, `xl:grid-cols-[1fr_360px]`, `xl:grid-cols-12`, and custom sidebars. Components should converge on the Inventory pattern: 9/3 or 4/4/4 grid sections depending on page purpose.

## Recommended Migration Order

1. `ComponentsOverviewPage.tsx`
2. `ComponentsProductionPage.tsx`
3. `ComponentsMaterialStockPage.tsx`
4. `ComponentsStockPage.tsx`
5. `ComponentsTransfersPage.tsx`
6. `ComponentsInternalQcPage.tsx`
7. `ComponentsHistoryPage.tsx`

Reason: Overview and Production define the main operational experience; Material Stock has business importance and custom workflow UI; Stock is already closer; Transfers/QC/History are simpler table pages.

## Page Audits

### ComponentsOverviewPage.tsx

Current layout:

- Uses `EnterpriseModulePage` with `space-y-3`.
- KPI strip, filter bar, then main split layout `xl:grid-cols-[1fr_390px]`.
- Left side contains list table plus two panels: production status and custom SVG structure map.
- Right side contains classification donut, production progress bars, and top profiles.

KPI cards:

- Uses `ComponentsKpiCard`.
- Six KPI cards are present and data-driven.
- Visual style is not yet fully aligned with `CockpitKpiCard` used by Components List.

Tables:

- Uses `componentsTableShell`, `componentsTableHead`, `componentsTableRow`.
- Table shows only `filtered.slice(0, 8)` and has no pagination.
- Table is `text-sm`, not the target `text-[13px] table-fixed` inventory table style.

Charts:

- Uses `ComponentsDonut`, `ComponentsMiniBars`, custom progress rows, and a custom SVG "Sơ đồ cấu kiện".
- Chart panel heights are implicit, not tokenized to cockpit heights.
- Custom SVG panel introduces a separate design language and should be either restyled inside `CockpitChartCard` or removed if not operationally useful.

Empty states:

- Loading is plain text in table row.
- Empty states are plain text (`Chưa có lệnh sản xuất`, `Chưa có dữ liệu`) and should use `ModuleEmptyState` with icon/title/description.

Duplicate wrappers:

- Uses `ComponentsPanel` wrappers instead of cockpit card wrappers.
- Uses `componentsTableShell` rather than `CockpitTableShell`.

Spacing issues:

- Mixed `gap-3`, `space-y-3`, nested `xl:grid-cols-[0.45fr_0.55fr]`.
- Needs tighter Inventory-like `gap-1` for cockpit grids.

Typography issues:

- Table uses `text-sm` and `px-3 py-2`, larger than the denser Inventory/Components List table.
- Headings are inherited from `ComponentsPanel`, not the current cockpit title rhythm.

Responsive issues:

- Custom `390px` right rail can feel detached from the 12-column cockpit grid.
- Table and side widgets should become `xl:col-span-9` and `xl:col-span-3`, then chart row `xl:col-span-4` panels.

Migration plan:

- Replace KPI with `CockpitKpiCard`.
- Replace main list section with `CockpitTableShell`, `h-[560px]`, `text-[13px]`, `table-fixed`.
- Rebuild layout to match Components List: Row 1 table 9 + classification 3; Row 2 production status / progress / recent profiles 4/4/4.
- Replace plain text empty/loading with `ModuleEmptyState` and `ModuleLoadingState`.

### ComponentsProductionPage.tsx

Current layout:

- Uses `space-y-4`.
- KPI strip, filter bar, 9/3 content layout.
- Left table lists production orders.
- Right rail has progress summary, process flow text, overdue orders.
- Row click opens a custom centered modal.

KPI cards:

- Six `ComponentsKpiCard` cards.
- Good KPI coverage, but visual shell should align with `CockpitKpiCard`.

Tables:

- Plain `overflow-auto`, `table className="w-full min-w-[1100px] text-sm"`.
- Header is plain `text-xs uppercase text-slate-400`.
- No `CockpitTableShell`, no stable table height, no pagination.

Charts:

- No real charts. Progress is a large number and text panels.
- Should add cockpit analytics cards only if existing data supports them: status distribution, overdue orders, completion trend placeholder.

Empty states:

- Loading is plain text row.
- No proper empty state for no production orders or no delayed orders.

Duplicate wrappers:

- `ComponentsPanel` and custom modal shell duplicate the cockpit/detail drawer language.
- Modal should migrate to `ModuleDetailDrawer` or existing cockpit drawer pattern.

Spacing issues:

- Uses `space-y-4`, `gap-4`, and modal `p-5`; looser than target.

Typography issues:

- Modal title `text-xl`, table `text-sm`; does not match compact cockpit density.

Responsive issues:

- 9/3 structure is good, but right panels lack stable heights.
- Custom modal width `max-w-4xl` is acceptable functionally but visually differs from shared drawer behavior.

Migration plan:

- Use `CockpitKpiCard`, `CockpitChartCard`, `CockpitTableShell`, `DataTablePagination`.
- Make table 9-column left panel with `h-[560px]`.
- Make right widgets `h-[170px]`.
- Convert modal to `ModuleDetailDrawer` or shared detail drawer already accepted by Components List.

### ComponentsStockPage.tsx

Current layout:

- Includes `ModulePageHeader`, KPI strip, filter bar, `xl:grid-cols-[1fr_360px]`.
- Table left, donut and status panel right.
- Uses `ModuleDetailDrawer` for selected row.

KPI cards:

- Five lifecycle KPI cards with click-to-filter behavior.
- Good interaction pattern but still uses `ComponentsKpiCard`.

Tables:

- Uses `componentsTableShell`, `componentsTableHead`, `componentsTableRow`.
- Table is `text-sm`, not `text-[13px] table-fixed`.
- No shared `DataTablePagination`.

Charts:

- Uses `ComponentsDonut` in `ComponentsPanel`.
- Right-side status panel is text rows, not a cockpit metric panel.

Empty states:

- Uses `ModuleEmptyState`, which is good.
- Loading uses `ModuleLoadingState`, which is good.

Duplicate wrappers:

- Uses both `ModulePageHeader` and Components shared wrappers. This page is closer to target but still not fully cockpit foundation.

Spacing issues:

- `space-y-4`, `gap-4`, right rail `space-y-4`.
- Should tighten to `space-y-1`/`gap-1` equivalent used by the source-of-truth pages.

Typography issues:

- Table cell text and headers are larger and less dense than Components List.

Responsive issues:

- `xl:grid-cols-[1fr_360px]` should align to `xl:col-span-9` / `xl:col-span-3`.

Migration plan:

- Keep lifecycle filter behavior.
- Replace table shell with `CockpitTableShell` and add `DataTablePagination`.
- Convert right rail panels to `CockpitChartCard` with `h-[170px]`.
- Remove or restyle `ModulePageHeader` if it makes the page feel different from Inventory cockpit pages.

### ComponentsMaterialStockPage.tsx

Current layout:

- KPI strip, filter bar, 9/3 grid.
- Main table lists production warehouse material stock.
- Right rail has allocation flow and top available materials.
- Row opens a custom modal that includes return-to-main-warehouse form.

KPI cards:

- Six `ComponentsKpiCard` cards.
- KPI content is useful but one card says "Đã reserve BOM" while implementation currently shows `0`; note indicates backend allocation pending.

Tables:

- Plain table with `min-w-[1180px] text-sm`.
- No `CockpitTableShell`, no fixed table height, no pagination.
- Loading is plain text row.

Charts:

- No charts; only text flow and list panels.
- Top available materials can become a `CockpitChartCard` rank list.

Empty states:

- Table has no `ModuleEmptyState`.
- Selected history empty state is plain paragraph.

Duplicate wrappers:

- Uses `ComponentsPanel` and custom modal shell `bg-[#071323]`.
- Form card uses ad hoc amber panel.

Spacing issues:

- Uses `space-y-4`, `gap-4`, modal `gap-3`.
- Filter inputs use repeated `h-10 rounded-lg border border-slate-700 bg-[#050d18]`.

Typography issues:

- Table `text-sm` and `px-2 py-2` is acceptable but not matching denser target.
- Modal text hierarchy is different from `ModuleDetailDrawer`.

Responsive issues:

- 9/3 grid is structurally close.
- Custom modal centered layout may be cramped on smaller screens compared with drawer.

Migration plan:

- Preserve business workflow and return form.
- Replace page wrappers with cockpit cards/table shell.
- Convert custom modal to `ModuleDetailDrawer`, with the return form as an action section.
- Add `ModuleEmptyState` for no material stock and no selected history.

### ComponentsTransfersPage.tsx

Current layout:

- Very simple: KPI strip, search filter, one table panel.
- Uses `space-y-4`.

KPI cards:

- Four `ComponentsKpiCard` cards.
- KPI set is thin: total, completed, source data, live status.

Tables:

- Plain table with `min-w-[900px] text-sm`.
- Header and row styles are custom.
- No table height, no pagination, no drawer/detail action.

Charts:

- None.
- Should add route distribution or recent movement rank only if existing `YARD MOVE` data supports it.

Empty states:

- Loading is plain text row.
- No empty state when no transfer records match query.

Duplicate wrappers:

- Uses `ComponentsPanel`.
- Uses custom input classes instead of cockpit filter/input tokens.

Spacing issues:

- Uses `space-y-4`; should tighten.

Typography issues:

- Table is simple and readable, but not the Inventory table density/style.

Responsive issues:

- Single panel is simple, but lacks 9/3 or 12-column dashboard balance.

Migration plan:

- Convert to standard layout: KPI strip, filter bar, table 9 + route analytics 3, optional second row for recent movement analytics.
- Use `CockpitTableShell`, `DataTablePagination`, and proper empty state.

### ComponentsInternalQcPage.tsx

Current layout:

- Static mock-like page: KPI strip, filter bar, 9/3 layout.
- Main table has hardcoded QC rows.
- Right rail has hardcoded detail and top failure reasons.

KPI cards:

- Six `ComponentsKpiCard` cards with hardcoded values.
- Needs live data source or explicit placeholder styling if real APIs are missing.

Tables:

- Plain table with `min-w-[1050px] text-sm`.
- No table shell, no table height, no pagination.
- Hardcoded records make the page feel disconnected from system runtime.

Charts:

- No chart visualization; failure reasons are plain text rows.

Empty states:

- None. Since data is hardcoded, no loading/empty behavior exists.

Duplicate wrappers:

- `ComponentsPanel`, repeated custom inputs, and repeated table styles.

Spacing issues:

- Uses `space-y-4`, `gap-4`.

Typography issues:

- Detail panel title `text-xl`; table and filter text are not cockpit-aligned.

Responsive issues:

- 9/3 structure is acceptable, but right rail cards should use fixed cockpit heights.

Migration plan:

- First decide whether this page is placeholder or connected to QC API.
- If placeholder remains, label as placeholder analytics using cockpit cards.
- Convert table to `CockpitTableShell`, add `ModuleEmptyState`, and convert right cards to `CockpitChartCard`.

### ComponentsHistoryPage.tsx

Current layout:

- Static mock-like page: KPI strip, filter bar, 9/3 layout.
- Main table has hardcoded fabrication history.
- Right rail has hardcoded history detail and process timeline.

KPI cards:

- Six `ComponentsKpiCard` cards with hardcoded values.
- Values do not appear connected to production/component runtime.

Tables:

- Plain table with `min-w-[1120px] text-sm`.
- No cockpit table shell, no fixed height, no pagination.

Charts:

- None.
- Process timeline is plain text list.

Empty states:

- None due to hardcoded data.

Duplicate wrappers:

- Uses `ComponentsPanel`, custom filter input/select classes, and custom table styles.

Spacing issues:

- Uses `space-y-4`, `gap-4`.

Typography issues:

- Similar to QC page: detail title and row typography are not aligned with cockpit pages.

Responsive issues:

- 9/3 structure is acceptable, but without fixed heights the page can feel uneven compared with Inventory.

Migration plan:

- Connect to real production history/timeline data if available; otherwise mark as placeholder in UI plan.
- Replace table and right rail with cockpit primitives.
- Use `DataTablePagination` and `ModuleEmptyState`.

## Shared Component Migration Map

Use only existing cockpit primitives:

- KPI: `CockpitKpiCard`
- Analytics/cards: `CockpitChartCard`
- Tables: `CockpitTableShell`
- Pagination: `DataTablePagination`
- Empty/loading: `ModuleEmptyState`, `ModuleLoadingState`
- Detail: `ModuleDetailDrawer` where drawer behavior is needed

Avoid:

- New shells.
- New colors or gradients.
- New `rounded-3xl`, `bg-zinc-*`, custom `bg-[#050d18]` input language.
- Page-specific panel wrappers unless they only forward to cockpit primitives.

## Cross-Page Target Rules

- Root page spacing: match source pages with compact cockpit rhythm.
- Main operation layout: prefer 12-column grid.
- Tables: `CockpitTableShell`, `table-fixed`, `text-[13px]`, fixed cockpit height, row hover matching Inventory.
- Right widgets: use `CockpitChartCard` with short cockpit heights when paired with a main table.
- Charts: use consistent cockpit heights and panel titles.
- Empty states: always include icon, title, and description.
- Loading states: never plain text-only table rows unless wrapped by `ModuleLoadingState`.
- Detail surfaces: use drawer pattern instead of custom centered modal unless there is a strong workflow reason.

## Remaining Risks

- `ComponentsInternalQcPage.tsx` and `ComponentsHistoryPage.tsx` appear to use hardcoded demo data. UI migration alone will make them prettier but not operationally trustworthy.
- `ComponentsMaterialStockPage.tsx` includes active return workflow UI. Its visual migration must avoid changing inventory transaction behavior.
- `ComponentsOverviewPage.tsx` has a custom SVG structure map. It should be reviewed for actual user value before preserving it.

## Acceptance Criteria For Future Migration

- Components pages visually match Inventory Overview, Inventory Materials, and Components List.
- No page-specific industrial shell strings remain inside Components pages.
- No plain text loading/empty states remain.
- Table pages share height, density, hover, typography, and pagination behavior.
- No business logic, API contract, or workflow changes are introduced during UI migration.
