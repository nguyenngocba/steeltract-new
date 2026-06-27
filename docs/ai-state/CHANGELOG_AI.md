# SteelTrack AI Changelog

## 2026-06-27 Sprint 20D.1 – Executive Dashboard Implementation

Completed:

* **ERP Executive Cockpit**: Completely redesigned the Inventory Overview Page (`InventoryOverviewPage.tsx`) into a Manufacturing ERP Cockpit (Executive Dashboard).
* **Card Re-use**: Utilized the existing shared cockpit components (`CockpitKpiCard`, `CockpitChartCard`, `COCKPIT_HEIGHTS`, and `COCKPIT_SHELL`) without duplicating tokens or creating new generic card wrapper structures.
* **Layout Grid**: Implemented the full 4-row grid structure supporting standard and ultrawide viewports:
  - *Row 1*: 5 Executive KPI Cards (Inventory Days, Production Active, Component Pipeline, QC Pass Rate, Open Alerts) mapping to color-coded cockpit tones.
  - *Row 2*: Inventory Forecast SVG Area Chart (`col-span-12 xl:col-span-8`) and Component Pipeline SVG Donut Chart (`col-span-12 xl:col-span-4`).
  - *Row 3*: Operational Pulse shift throughput metrics (`col-span-12 xl:col-span-6`) and exception registry categorized by severity (`col-span-12 xl:col-span-6`).
  - *Row 4*: Operational Timeline event flow (`col-span-12 xl:col-span-7`) and factory OEE circular rings (`col-span-12 xl:col-span-5`).
* **Real-time & Mock view models**: Implemented standard mock view models and structured time strings.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20C.8 – Components Theme Unification

Completed:

* **Unified Root Layout**: Changed root layout wrapper to `w-full min-w-0 flex-1 space-y-1` and replaced grid/chart gaps with a clean `gap-1` system. Removed light surfaces, center wrappers (`mx-auto`), `max-w-*` restrictions, and hardcoded widths.
* **WMS KPI Cockpit Cards**: Unified the KPI strip by defining a local `InventoryMetricCard` and `KpiSparkline` matching `InventoryMaterialsPage` exact visuals (h-[108px], rounded-2xl, border-cyan-300/15, industrial gradient, and ring-cyan-400/[0.055]). Configured the grid layout as `grid-cols-1 md:grid-cols-5 gap-1` with 5 metrics:
  1. *Tổng cấu kiện* (blue, Package)
  2. *Đang sản xuất* (cyan, Layers3)
  3. *Hoàn thành* (emerald, Warehouse)
  4. *Chờ vật tư* (amber, Warehouse)
  5. *Trễ tiến độ* (red, MapPinned)
* **Reorganized Analytics Layout**: Configured a fluid 3-row layout structure matching the locations page hierarchy:
  - *Row 1*: "Phân bố cấu kiện" (donut chart) and "Tình trạng cấu kiện" (mini bars trend) in `col-span-12 xl:col-span-6` grid.
  - *Row 2*: "Cấu kiện mới nhất" (sorted by raw creation time DESC) and "Cấu kiện sử dụng nhiều nhất" (sorted by quantity DESC) in `col-span-12 xl:col-span-6` grid.
  - *Row 3*: "Danh sách cấu kiện" table in full width.
* **Redesigned Analytics Cards**: Configured local `ChartCard` matching the Inventory card shell (height h-[220px], same gradient, same shadow, same ring, rounded-2xl, and title: `text-xs font-bold uppercase tracking-[0.12em] text-white`, subtitle: `text-[11px] text-slate-500`).
* **Direct Table Parity**: Styled the main table to match the Inventory stock list exactly:
  - Shell classes: `border-0 ring-0 bg-transparent shadow-none rounded-none overflow-auto scrollbar-none h-[520px]`
  - Table style: `w-full min-w-[1050px] text-sm table-fixed`
  - Header cells: `bg-transparent text-slate-300 border-b border-cyan-400/10`
  - Row lines: `hover:bg-cyan-400/[0.04] border-b border-white/[0.04] cursor-pointer`
  - Numeric columns (Khối lượng): `font-mono tabular-nums text-right`
* **Creation Modal Theme**: Refactored the local create modal to use the exact translucent WMS modal container, inputs, and button visual styles of the Inventory transaction forms.
* **Visual Audit & Pagination**: Performed a visual audit, resolving nested card wrappers, matching all design tokens and height constraints (`h-[108px]`, `h-[220px]`, `gap-1`), adding local frontend pagination for table parity, and replacing all prohibited classes (`gap-3`, `gap-4`, `space-y-4`, `max-w-3xl`) with safe overrides.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.5F – Inventory Locations KPI Cockpit

Completed:

* **WMS KPI Cockpit Cards**: Replaced the first 5 locations analytics cards with the standard WMS KPI cockpit cards, fully aligned with the unified `InventoryMetricCard` visual design:
  1. *Tổng vị trí* (blue, MapPinned)
  2. *Đang sử dụng* (emerald, Layers3)
  3. *Vị trí trống* (cyan, Package)
  4. *Hiệu suất sức chứa* (purple, Warehouse)
  5. *Tổng tồn theo vị trí* (amber, Warehouse)
* **Visual Parity**: Applied standard styles: height of `h-[108px]`, `rounded-2xl`, `border-cyan-300/15`, cockpit gradient background, and `ring-cyan-400/[0.055]`, featuring the `KpiSparkline` at the bottom.
* **6-Month Trend Rollback**: Implemented transactional rollback logic over 6 snapshot dates to compute historical location stats:
  - `totalLocationsTrend`: total locations (constant count of real storage locations)
  - `occupiedLocationsTrend`: occupied locations (active locations count with stock > 0)
  - `emptyLocationsTrend`: empty locations (active locations count with stock === 0)
  - `occupancyPercentTrend`: slot occupancy percentage (occupied slots / total slots capacity)
  - `totalStockTrend`: total stock quantity (in tons)
* **Vietnamese Delta Notes**: Configured dynamic delta notes comparing current month with the previous month:
  - Location count delta: `▲2 vị trí (+18,2%)` / `▼2 vị trí (-18,2%)`
  - Capacity percentage delta: `▲1,2% (+5,4%)`
  - Stock value delta: `▲3.790.984.762 đ (+49,2%)`
  - Stock weight delta: `▲686,5 tấn (+6,4%)`
* **Card 5 Rich Subtext**: Programmed Card 5 subtext to display both value delta and weight delta inline: `▲3.790.984.762 đ (+49,2%) · ▲686,5 tấn (+6,4%)` with color indicators.
* **Responsive Layout**: Wrapped the cockpit cards in a fluid `<div className="grid grid-cols-1 gap-1 md:grid-cols-5">` layout.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.5D – Inventory Locations Responsive Workspace

Completed:

* **Removed Width Constraints**: Removed all fixed width constraints, `max-w-*` limits, `mx-auto` centering wrappers, container classes, and hardcoded widths like `w-[1040px]` or `w-[320px]`.
* **Root Layout Adjustment**: Updated the root layout wrapper to use `w-full min-w-0 flex-1 space-y-1`.
* **Main Row 1 Grid**: Structured Row 1 as a 12-column grid (`grid-cols-12 gap-1`) where "Danh sách vị trí kho" takes `col-span-12 2xl:col-span-8` and the stacked right sidebar takes `col-span-12 2xl:col-span-4`.
* **Analytics Bottom Grid**: Reconfigured Row 2, 3, and 4 cards to use a 12-column grid (`grid-cols-12 gap-1`) with `col-span-12 xl:col-span-6` for each of the four cards (*Giá trị tồn theo vị trí*, *Vị trí tồn kho cao nhất*, *Vật tư nhập gần nhất*, and *Vật tư xuất gần nhất*).
* **Automatic Scaling**: Ensured the dashboard grows and shrinks dynamically to fit all monitors (laptop to ultrawide) and respects both sidebar states (expanded and collapsed).
* **Preserved Core Logic**: Left all calculations, hooks, APIs, datasets, and chart logic completely unchanged.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.5C – Inventory Locations Dashboard Usability Polish

Completed:

* **Enlarged Locations Section**: Made "Danh sách vị trí kho" card larger with a height of `h-[560px]`, text size `text-[12px]`, row cell padding `py-2.5`, and table headers `text-xs font-semibold`.
* **New Locations Columns**: Added columns `Kho`, `Zone`, `Slot`, `Tầng`, `Khối lượng`, `Số vật tư`, and `Trạng thái`.
* **Vietnamese Status Badges**: Added rounded-full status badges for locations: `Đang dùng` (cyan), `Trống` (emerald), and `Bảo trì` (amber).
* **Enlarged Analytics Cards**: Adjusted card heights:
  * *Giá trị tồn theo vị trí*: `h-[320px]`
  * *Vị trí tồn kho cao nhất*: `h-[320px]`
  * *Vật tư nhập gần nhất*: `h-[300px]`
  * *Vật tư xuất gần nhất*: `h-[300px]`
* **Xem Tất Cả Action & Modal**: Added a "Xem tất cả" action on the header of the four analytics cards. Clicking the action opens a full table modal dialog with `fixed inset-0 bg-slate-950/75 backdrop-blur-md max-h-[70vh] overflow-auto rounded-2xl` layout and localized columns (including transaction date mapping `Ngày` for imports and exports).
* **Preserved Calculations**: Left all original query hooks, useMemo metrics, and API logic completely unchanged.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.5B – Inventory Locations Dashboard Layout Polish

Completed:

* **Primary Dashboard Section**: Made "Danh sách vị trí kho" the main left card with a height of `h-[520px]` and responsive width (approximately 1040px on standard desktop sizes).
* **Right Sidebar Layout**: Created a stacked right sidebar (`w-[320px]`, `gap-1`) containing:
  * *Hiệu suất sức chứa*: Compact donut chart using `CompactDonutSummary`.
  * *Trạng thái vị trí*: Vertical bar chart using `VerticalBarChart`.
  * *Phân bố loại vật tư*: Pie chart using `CompactPieChart`.
* **Compact Tables Replacement**: Replaced horizontal bar charts with compact tables (`rounded-xl border border-white/10 bg-[#08111f]/90 text-[11px] py-1 px-2` spacing) displaying the top 5 rows sliced:
  * *Giá trị tồn theo vị trí* (Columns: Kho | Giá trị | %)
  * *Vị trí tồn kho cao nhất* (Columns: Vị trí | Khối lượng | %)
  * *Vật tư nhập gần nhất* (Columns: Mã | Vật tư | Số lượng)
  * *Vật tư xuất gần nhất* (Columns: Mã | Vật tư | Số lượng)
* **Reduced Spacing**: Applied `gap-1` and `space-y-1` spacing across the locations cockpit page to create a dense industrial theme.
* **Fully Localized Vietnamese Labels**: Fully translated all units (such as `t` to `tấn`, table headers, status labels) and removed English chart titles.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.5A Inventory Location Dashboard Redesign

Completed:

* **MES/WMS Cockpit Theme & Spacing**:
  * Redesigned the dashboard charts in `InventoryLocationsPage.tsx` to align with the premium dark cockpit theme (gradients, rings, cyan borders, and backdrop-blurs).
  * Removed all legacy borders/slate-950 background styles, ensuring cards look extremely premium and cohesive.
  * Standardized card padding to `p-3` and card grid gap to `gap-3` (strictly avoiding `gap-5` or `gap-6` as requested).
* **Grid Layout & Responsive Heights**:
  * Structured the dashboard into 5 rows with exact height and column configurations:
    * **Row 1**: *Top occupied slots* (Left, `h-[220px]`, top 6, horizontal progress bars) & *Hiệu suất sức chứa* (Right, `h-[220px]`, `CompactDonutSummary` showing "X% Đã sử dụng" center value and Legend: Đang dùng, Trống, Bảo trì).
    * **Row 2**: *Giá trị tồn theo vị trí* (Left, `h-[250px]`, `HorizontalBars` showing Top 8 locations sorted DESC in billions/millions VND short form) & *Top 5 vị trí có tồn cao nhất* (Right, `h-[250px]`, `HorizontalBars` in tons).
    * **Row 3**: *Top 10 vật tư nhập gần nhất* (Left, `h-[250px]`, `HorizontalBars` showing top 6 material names and quantities) & *Top 10 vật tư xuất gần nhất* (Right, `h-[250px]`, `HorizontalBars` showing top 6 material names and quantities).
    * **Row 4**: *Top 5 vật tư tồn cao nhất* (Full width, `h-[280px]`, custom detail table showing material Code, Name, Location, Stock, Value, and a percentage progress bar relative to the max stock).
    * **Row 5**: *Phân bố sức chứa theo kho* (Full width, `h-[250px]`, custom progress bar list showing zone name, tonnage, capacity utilization percentage, and active slot count).
  * Replaced the old low-value "Luồng điều chuyển theo slot" chart with the new warehouse/zone capacity distribution chart.
  * Ensured responsive columns: 2 columns on Desktop/Laptop (`lg:grid-cols-2`), 1 column on Tablet/mobile (`grid-cols-1`).
* **KPI Metric Cards**:
  * Redesigned the 5 KPI metric cards at the top of the page using the premium cockpit theme and rings to maintain 100% style consistency.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.4F Inventory Materials Parity Audit & Visual Rhythm

Completed:

* **Parity Verification & Synchronization**:
  * Audited the snapshot engine in `InventoryMaterialsPage.tsx` and synchronized it with the 12-month transaction-based rollback logic of `InventoryOverviewPage.tsx`.
  * Updated `kpiTrend` inside `InventoryMaterialsPage.tsx` to compute 12 end-of-month snapshots instead of 6, ensuring the sparkline shapes are identical between both pages.
  * Replicated the `dateAgeInfo` logic to apply a flat placeholder sparkline when historical data age is less than 365 days.
  * Corrected the existence logic (`existed = firstTxDate && firstTxDate <= end`) and implemented main warehouse rollback filter logic for low stock/out of stock alerts to ensure absolute consistency.
  * Confirmed snapshot values match (May 2026: ~7.711.783.211 đ value / ~10.767 tons weight; June 2026: 14.168.720.116 đ value / ~15.542.5 tons weight today) and that no more +100% bug is present.
* **Visual Audit & Rhythm**:
  * Verified that the first three dashboard cards (Phân bố tồn kho, Biến động tồn kho, Cảnh báo tồn kho) are correctly styled at `h-[170px]` using dynamic `p-3` padding.
  * Confirmed that `CompactDonut` and `StockTrendChart` internals are preserved at original sizes using scroll containment viewports (`h-[82px] overflow-y-auto`) to avoid any vertical text clipping, SVG compression, or label overlapping.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.4E (Part 2) Inventory Materials Snapshot Synchronization and Chart Height Reduction

Completed:

* **KPI Snapshot Engine Synchronization**:
  * Built `firstTransactionDateMap` in `kpiTrend` using the minimum transaction date (`transactionDate` / `createdAt`) with a fallback to `row.createdAt` for every material.
  * Replaced the record creation date checks with the Map-resolved minimum transaction dates inside the historical snapshots generator and monthly code-count filters.
  * Corrected May 2026 snapshot values to match Inventory Overview (eliminating the forced +100% delta).
* **Dashboard Chart Height Adjustment**:
  * Parameterized `ChartCard`, `CompactDonut`, and `StockTrendChart` to support custom dimensions, font sizing, and row limits.
  * Reduced the visual height of Cards 1 (Phân bố tồn kho), 2 (Biến động tồn kho), and 3 (Cảnh báo tồn kho) to `h-[170px]` (charts content set to `h-[74px]`), while preserving Cards 4 and 5 inside the alerts sidebar drawer at `h-[260px]`.
  * Configured `CompactDonut` to render a smaller circle (`h-16 w-16`) and display up to 3 segments in a condensed two-column format.
  * Configured `StockTrendChart` to render with a height of `h-[74px]`.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.4E Inventory Materials KPI cards visual/behavior parity

Completed:

* Aligned the first 5 KPI cards in the Inventory Materials tab to be visually and behaviorally identical to the Inventory Overview KPI cards:
  * **Card Containers**: Configured `rounded-2xl`, `border-slate-800`, `bg-slate-950/60`, equal height `h-[108px]`, and `p-4` padding.
  * **Typography**: Applied title class `text-[10px] uppercase tracking-[0.12em] text-slate-400`, value class `text-2xl font-semibold text-white mt-1`, and note class `text-[10px] font-semibold mt-1`.
  * **Delta Formatting**: Formatted value metrics with Vietnamese locale decimal commas (e.g. `▲5.203,5 tấn (+48,3%)`) and count metrics (e.g. `▲3 mã`, `▼2 mã`).
  * **Fallback Deltas**: Completely removed "+ mới so với tháng trước" / "Chưa có dữ liệu lịch sử" fallbacks.
  * **Semantic Colors**: Standardized note text color class mapping and card tones to match the Overview page exactly (emerald, cyan, indigo, amber, red).
* Spacing: Configured the metric cards grid container to use a gap spacing of `gap-1` to align with the Overview cockpit layout.
* Cleaned up unused `formatPercentDelta` helper.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.4D Inventory Materials KPI-Style Values

Completed:

* Restructured the visual value rows and subtitles of all 5 Inventory Materials dashboard cards to conform to the KPI-style value presentation:
  * **Phân bố tồn kho**: Renders value `15.970,5 tấn` and subtitle `6 kho hoạt động`.
  * **Biến động tồn kho**: Renders value `15.970,5 tấn` and subtitle `▲5.203,5 tấn (+48,3%)`.
  * **Cảnh báo tồn kho**: Renders value `12` and subtitle `▲2 với tháng trước` (dynamically compiled from alert difference).
  * **Theo mức độ**: Renders value `3` and subtitle `3 mức`.
  * **Top tồn thấp**: Renders value `6` and subtitle `Dưới định mức`.
* Ensured value styling matches `text-2xl font-semibold text-white mt-1` and subtitle styling matches `text-[10px] text-slate-400 mt-1`.
* Cleaned up redundant `className` prop from Card 1 `ChartCard` call.
* Preserved calculations, datasets, chart components, responsive grid architecture, and card heights.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.4C Align Materials Dashboard Card Vertical Rhythm

Completed:

* Redesigned the header container of `ChartCard` to a fixed height of `h-[64px]` with `flex flex-col justify-start` visual classes.
* Aligned all 5 Inventory Materials dashboard cards to begin their chart contents precisely below the same header height.
* Styled the card header values and subtitles using the exact spacing rhythm of the Overview KPI cards:
  * Main value: `mt-1 text-2xl font-semibold text-white leading-none`
  * Subtitle: `mt-1 text-[10px] text-slate-400`
* Updated subtitles for all 5 cards to use compact formats:
  * Phân bố tồn kho: `${warehouseOptions.length} kho hoạt động` (e.g. `6 kho hoạt động`).
  * Biến động tồn kho: `▲5.203,5 tấn (+48,3%)` (dynamically compiled from quantity delta calculations).
  * Cảnh báo tồn kho: `▲2 với tháng trước` (dynamically compiled from alert difference calculations).
  * Theo mức độ: `3 mức cảnh báo` (fixed string as requested).
  * Top tồn thấp: `Dưới định mức`.
* Preserved calculations, datasets, chart components, and grid layout.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.4A Restyle Inventory Materials Dashboard Cards

Completed:

* Restyled all 5 Inventory Materials dashboard cards to visually match the Inventory Overview KPI visual guidelines.
* Set card containers to `rounded-2xl`, `border-slate-800`, `bg-slate-950/60`, and equal height of `h-[260px]` with premium shadow tokens.
* Redesigned the card header typography:
  * Title: `text-[10px] uppercase tracking-[0.12em] text-slate-400`
  * Primary number: `text-2xl font-semibold text-white`
  * Secondary note: `text-[10px] text-slate-400`
* Styled and laid out headers for all 5 cards:
  1. **Phân bố tồn kho**: Renders title "Phân bố tồn kho", primary number `${formatQuantity(kpis.totalQty, 1)} tấn`, and secondary note `Tổng tồn · ${warehouseOptions.length} kho`, reusing existing `CompactDonut`.
  2. **Biến động tồn kho**: Renders title "Biến động tồn kho", primary number `${formatQuantity(kpis.totalQty, 1)} tấn`, and secondary note with dynamic quantity delta percentage `▲/▼ X tấn (+/- Y%)`, reusing existing `StockTrendChart`.
  3. **Cảnh báo tồn kho**: Renders title "Cảnh báo tồn kho", primary number `${alerts.length} cảnh báo`, and secondary note with alert difference, improving typography and spacing of the alert list.
  4. **Theo mức độ**: Wrapped the severity chart in `ChartCard` with title "Theo mức độ", primary number `${alerts.length} cảnh báo`, secondary note "Mức độ cảnh báo tồn", and improved typography.
  5. **Top tồn thấp**: Wrapped the low stock chart in `ChartCard` with title "Top tồn thấp", primary number `${alerts.slice(0, 6).length} vật tư gần ngưỡng`, secondary note "Vật tư dưới mức tối thiểu", and displayed quantity beside material code in the chart labels (e.g. `VT-00001 (X tấn)`).
* Restructured `AlertMiniChart` to remove internal cards/background borders and render clean progress bars directly within the unified `ChartCard` wrapper.
* Preserved all calculations, monthly trend logics, datasets, responsive grid architecture, and filter layouts.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3S Polish Overview Category KPI Typography

Completed:

* Refactored the `percent` helper in `kpiDeltas` calculation to display percentage changes inside parentheses instead of pipes, i.e. from `▲999 tấn | +94,8%` to `▲999 tấn (+94,8%)`.
* Changed `OverviewMetricCard` parameter type for `value` from `string` to `React.ReactNode`.
* Updated category cards (`Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`) to render the count as `text-white font-semibold` and the quantity as `text-slate-400 font-normal text-[14px]` inline (e.g. `6 (2.053 tấn)`).
* Preserved the dark cockpit theme, responsive layout grid, sparkline trends, colors, delta calculations, snapshot rollback logic, and equal visual card heights (`h-[108px]`).

Verification:

* Verified the frontend and backend applications build successfully using `pnpm -C apps/frontend build` and `pnpm -C apps/backend-api build`.

## 2026-06-25 Sprint 20I.3R Simplify Overview Category KPI Cards

Completed:

* Removed the `compositionText` prop and all composition subtitle rendering from the `OverviewMetricCard` component.
* Updated the category cards (`Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`) to remove calculations and prop passes for category composition percentages.
* Ensured all 8 KPI cards maintain equal visual height matching `h-[108px]`.
* Preserved the dark cockpit theme, responsive layout grid, sparkline trends, KPI colors, delta calculations, and real 12-month historical stock snapshots.

Verification:

* Verified the frontend and backend applications build successfully using `pnpm -C apps/frontend build` and `pnpm -C apps/backend-api build`.

## 2026-06-25 Sprint 20I.3Q Remove KPI Composition Progress Bars

Completed:

* Removed the thin composition progress bar, its wrapper, and percentage bar display elements from `OverviewMetricCard`.
* Added `compositionText` prop to the `OverviewMetricCard` component to allow rendering small helper text (e.g. `"12,9% tổng tồn"`) without progress bars.
* Configured the category KPI cards (`Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`) to calculate and display the exact composition percentage format `"X,X% tổng tồn"` using `formatQuantity(percentage, 1)`.
* Preserved the dark cockpit cockpit layout, responsive grid, sparkline trends, metric colors, and delta calculations.

Verification:

* Verified the frontend and backend applications build successfully using `pnpm -C apps/frontend build` and `pnpm -C apps/backend-api build`.

## 2026-06-25 Sprint 20I.3P Enhanced Overview KPI Cards

Completed:

* Enhanced OverviewMetricCard component to support rendering a thin, color-matched composition progress bar.
* Calculated and rendered compact composition progress percentages on the category KPI cards (primaryQty/totalQty, secondaryQty/totalQty, consumableQty/totalQty).
* Refactored KPI delta line presentation:
  * Percentage-based metrics (totalValue, totalQty, primaryQty, secondaryQty, consumableQty) now display absolute diff and percentage change (e.g. `▲5.203,5 tấn | +48,3%`).
  * Count-based metrics (totalItems, lowStockCount, outOfStockCount) now display absolute counts change only (e.g. `▲3 mã`, `▼2 mã`).
* Kept category value formats aligned to `X (Y tấn)` (e.g. `6 (2.053 tấn)`).
* Preserved the dark cockpit styling, responsive layout grid, and real 12-month historical snapshots.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3N Historical Material Existence Fix

Completed:

* Replaced the metadata-based existence check (`material.createdAt`) in the monthly snapshot generator with a transaction-based existence check (`firstTransactionDate`).
* Calculated `firstTransactionDate` for each material as the minimum of the material's transaction transactionDate, falling back to transaction createdAt if transactionDate is absent.
* Evaluated historical material existence at each monthly snapshot date as:
  `firstTransactionDate <= snapshotDate`
* Recalculated monthly snapshot values and deltas for totalItems, totalQty, primaryQty, secondaryQty, consumableQty, lowStockCount, and outOfStockCount.
* Verified that the previous month snapshot (May 31, 2026) has non-zero quantities, causing the forced `▲100%` delta notes to disappear and show real percentage changes:
  * totalQty: `▲48.3%`
  * primaryQty: `▲94.8%`
  * secondaryQty: `▲47.7%`
  * consumableQty: `▲34.5%`

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3H Compact Inventory KPI Cards

Completed:

* Compacted the category cards value presentation format from `X mã (Y tấn)` to `X (Y tấn)` (e.g. `6 (2.053 tấn)`).
* Refactored the KPI note comparison suffix: changed the month-specific suffix (e.g. `so với Tháng 5/2026`) to the generic `với tháng trước` for both percentage and count delta notes.
* Reduced typography scales across the OverviewMetricCard component:
  * Title remains `text-[10px]`
  * Value remains `text-xl`
  * Note reduced from `text-[11px]` to `text-[10px]`
* Preserved the dark cockpit theme, responsive layouts, and sparkline rendering.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3G Category KPI Quantity Enhancements

Completed:

* Enhanced the category KPI cards (Vật tư chính, Vật tư phụ, Vật tư tiêu hao) to show both unique material counts and total quantity in tons.
* Refactored delta calculations for category KPI cards to be calculated from quantity in tons (`Y tấn`), not from unique material count.
* Delta notes are formatted as `▲/▼ X% với tháng trước` or `▲/▼ X.X% với tháng trước` (no space after arrow for integers, e.g. `▲40%`).
* Mapped category sparkline trends to historical quantities in tons (`primaryQty`, `secondaryQty`, `consumableQty`) for visual consistency with the delta note direction.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3F Inventory Overview Snapshots Numeric Verification

Completed:

* Conducted a detailed database-level numeric verification of monthly stock snapshots for `VT-NEW-00001` (Thép hình 10mm).
* Created the verification report [inventory_snapshots_numeric_verification.md](file:///root/.gemini/antigravity-cli/brain/50ac5739-b85e-404c-b2bd-897dca8ea7c0/inventory_snapshots_numeric_verification.md).
* Verified exact calculations for current stock, and snapshot stocks at previous month, 6 months ago, and 12 months ago with 0 variance.
* Audited transaction types: `IMPORT` (inbound), `EXPORT` (outbound), `TRANSFER`, and `ADJUSTMENT`.
* Audited value trend accuracy and confirmed that `historicalValue = historicalQty * currentAverageCost` is an **approximate** calculation.

## 2026-06-25 Sprint 20I.3E Inventory Overview KPI Audit

Completed:

* Audited the yearly KPI trend implementation and sparkline data logic for the Inventory Overview page.
* Created the audit report [inventory_overview_audit.md](file:///root/.gemini/antigravity-cli/brain/50ac5739-b85e-404c-b2bd-897dca8ea7c0/inventory_overview_audit.md).
* Verified data age calculations, snapshot date generation, material creation filters, and stock quantity rollbacks.

## 2026-06-25 Sprint 20I.3D Inventory Overview KPI Monthly Sparklines

Completed:

* Implemented 12-point monthly end-of-month snapshots using real transaction ledger data rollbacks and material creation dates.
* Configured the sparkline trend vectors to render only when >= 12 months history exists (otherwise showing a flat line placeholder at the current metric level with no data fabrication).
* Refactored KPI delta notes comparing current month vs previous month, in the exact format:
  * Value & Quantity: `▲/▼ X.X% so với Tháng 5/2026`
  * Unique Item Count, Primary, Secondary, Consumable: `▲/▼ X mã vật tư so với Tháng 5/2026`
  * Low Stock: `▲/▼ X mã sắp hết so với Tháng 5/2026`
  * Out of Stock: `▲/▼ X mã hết hàng so với Tháng 5/2026`
* Added dynamic semantic coloring to note containers:
  * Positive inventory metrics (value, quantity, counts) increases -> emerald, decreases -> red.
  * Low stock / out of stock increases -> red, reductions -> emerald.
  * No change -> slate-400 (neutral).
* Modified `OverviewMetricCard` component to accept a `noteClassName?: string` parameter to dynamically style the text color of the notes.

## 2026-06-25 Sprint 20I.3C Restore KPI Sparklines

Completed:

* Restored all 8 KPI sparkline trends and delta percentage logic in `InventoryOverviewPage` based on real historical data age and stock rollbacks without data fabrication.
* Added data age detection: scans oldest dates from both transaction ledger and material creation to compute age in days relative to `new Date()`.
* Implemented automatic scale switching:
  * `<30 days`: Displays flat placeholder sparklines (all points set to current value) and sets delta text to `"Chưa có dữ liệu lịch sử"`.
  * `>=30 days`: Shows real historical trends with 5-day intervals, calculating percentage delta compared to the previous period.
  * `>=365 days`: Shows real yearly line trends with 60-day intervals, calculating percentage delta compared to the previous period.
* Reconstructed historical inventory snapshots: rolls back material stocks to each snapshot date by subtracting later transaction item quantities (properly filtering for warehouse classification on low/out stock checks), computing exact metrics for total value, quantity, unique item code count, low stock, out of stock, primary, secondary, and consumable counts.

## 2026-06-25 Sprint 20I.3B Inventory KPI Semantics Fix

Completed:

* Fixed semantic value mappings in the Inventory Overview KPI strip:
  * Changed value displays for `Vật tư chính`, `Vật tư phụ`, and `Vật tư tiêu hao` from total VND value to unique material counts.
  * Replaced `primaryValue`, `secondaryValue`, and `consumableValue` with `primaryCount`, `secondaryCount`, and `consumableCount` inside `summary` calculations.
* Fixed KPI trend sparkline logic:
  * Disabled sparkline rendering (returning `undefined` trend arrays) for count-based metrics (`Mã vật tư`, `Sắp hết hàng`, `Hết hàng`, `Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`) since historical database records for counts are unavailable.
  * Preserved real historical line trends for `Tổng giá trị tồn kho` and `Tổng khối lượng` computed from actual transaction movements.
  * Modified `OverviewMetricCard` to make `trend` optional and conditionally render the `KpiSparkline` component only when trend data is present.
* Fixed KPI delta label logic:
  * Removed fake linear progress percentages derived from current count datasets.
  * Made deltas show `"Chưa có dữ liệu lịch sử"` for all count metrics and when transaction history does not exist.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3 Inventory Overview KPI Redesign

Completed:

* Redesigned the Inventory Overview KPI strip to replace the old 8 metrics (including main/production warehouse split) with the requested 8 cards:
  1. **Tổng giá trị tồn kho** (total value, tone: `emerald`, icon: `CircleDollarSign`)
  2. **Tổng khối lượng** (total weight/quantity, tone: `cyan`, icon: `RefreshCw`)
  3. **Mã vật tư** (unique material code count, tone: `indigo`, icon: `PackageCheck`)
  4. **Sắp hết hàng** (low stock count, tone: `amber`, icon: `TriangleAlert`)
  5. **Vật tư chính** (value of primary usage materials, tone: `blue`, icon: `PackageCheck`)
  6. **Vật tư phụ** (value of secondary usage materials, tone: `violet`, icon: `Package`)
  7. **Vật tư tiêu hao** (value of consumable usage materials, tone: `orange`, icon: `Package`)
  8. **Hết hàng** (out of stock count, tone: `red`, icon: `ShieldX`)
* Added support for `indigo`, `violet`, and `orange` tones inside the `OverviewMetricCard` color dictionary.
* Implemented clean pulsing skeleton loading states when data queries are pending.
* Extended the `summary` metadata calculations to compute `primaryValue` and `secondaryValue` dynamically (using `'PRIMARY'` default usage type fallback).
* Adjusted sparkline trend and delta percentage calculations for all new KPI fields.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20B.1 Component UI Audit

Completed:

* Conducted a thorough audit of the Component module UI patterns, page hierarchy, and styles to ensure compliance with SteelTrack UI standards (dark cockpit theme, no white surfaces).
* Created a comprehensive audit report artifact [component_ui_audit.md](file:///root/.gemini/antigravity-cli/brain/50ac5739-b85e-404c-b2bd-897dca8ea7c0/component_ui_audit.md).
* Documented usage of `EnterpriseModulePage`, `RuntimePanel`, KPI card wrappers, detail drawers, and CSS conic/SVG chart primitives.
* Identified technical debt / template stubs in `src/modules/components/components/` and `charts/` subfolders.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Transaction Date-Time Refresh

Fixed:

* Added shared `formatLocalDateTimeInput()` helper for `datetime-local` fields so forms use local date/time instead of UTC-derived `toISOString().slice(0, 16)`.
* Inventory transaction modals now refresh `transactionDate` to the current local date/time when opened and again when the date-time input receives focus:
  * Nhập kho;
  * Xuất kho;
  * Điều chuyển;
  * Điều chỉnh tồn kho.
* Component Production Material Stock return modal refreshes return date/time when a return drawer opens and when the date-time input receives focus.
* Production Manufacturing Order modal initializes planned start with current local date/time and refreshes start/due date-time fields on focus.
* Fixed a pre-existing Material Detail build error by allowing `MetricLine` to accept an optional icon prop.

Verification:

* Frontend build passed with the existing Vite `NODE_ENV` and large chunk warnings.

## 2026-06-24 Business Data Cleanup

Executed:

* Backed up the database before cleanup:
  * `backups/steeltrack_before_business_data_cleanup_20260624_092729.dump`
* Added and executed cleanup SQL:
  * `scripts/sql/business-data-cleanup-20260624.sql`
* Added cleanup audit:
  * `docs/ai-state/audits/business-data-cleanup-20260624.md`
* Cleared business/runtime data for materials, components, projects, suppliers, vehicles, Inventory transactions/balances, Production BOM/MO/material activity, QC runtime records, Yard placements/movements/snapshots, attachments metadata, notifications, analytics/runtime logs, and workflow instances/actions.
* Preserved configuration/reference foundations: users, roles, permissions, categories, material types, units, warehouses, warehouse zones, yard layout, QC checklist templates, workflow definitions/steps, work centers, and machines.

Verification:

* Confirmed zero rows in `inventory_items`, `components`, `projects`, `Supplier`, `vehicles`, `inventory_transactions`, `inventory_location_stocks`, `BOM`, `production_orders`, `ProductionMaterialIssue`, `qc_inspections`, `yard_item_placements`, `yard_movements`, `attachments`, and `notifications`.
* Confirmed preserved rows remain in `inventory_categories`, `material_types`, `master_units`, `master_warehouses`, `warehouse_zones`, `yard_slots`, `qc_checklists`, `users`, and `roles`.
* Confirmed all 93 Yard slots are `AVAILABLE` with `currentStackLevel = 0`.

Scope:

* No Prisma schema change.
* No API change.
* No application code change.

## 2026-06-23 Sprint 20A.5 Demo Dataset Seeder

Implemented:

* Backed up the current database before seeding:
  * `backups/steeltrack_before_sprint20a5_20260623_082210.dump`
* Added transactional purge SQL:
  * `scripts/sql/sprint20a5-purge-transactional-data.sql`
* Added runnable Prisma demo seeder:
  * `apps/backend-api/prisma/seeds/sprint20a5-demo.seed.ts`
* Seeder purges transactional/operational data, resets `inventory_items.quantity` snapshot to 0, then creates a reusable `DEMO20A5-*` dataset.
* Demo dataset creates:
  * 20 suppliers;
  * 20 projects;
  * 20 inventory items;
  * 20 components;
  * 20 BOMs;
  * 20 production work orders;
  * Inventory import/transfer/production issue transactions;
  * Main and Production warehouse location stocks;
  * Production reservations, reservation lines, material issues, consumptions, and ledger rows;
  * Component costing for every seeded component.

Verification:

* Seeder verification passed:
  * suppliers: 20;
  * projects: 20;
  * inventory items: 20;
  * components: 20;
  * BOMs: 20;
  * production orders: 20;
  * component costing rows: 20;
  * work orders with full readiness: 20;
  * inventory location stock buckets: 40.
* SQL verification confirmed 20/20 work orders meet readiness from BOM required quantity versus issued quantity.
* Backend build passed.
* Frontend build passed.

Scope:

* No Prisma schema change.
* No API change.
* No migration.

## 2026-06-22 Sprint 19E Inventory Adjustment Workflow Unification

Implemented:

* Added `Điều chỉnh tồn kho` to the Inventory navigation directly below `Kiểm kê`.
* Updated Inventory Global Actions so `Khác -> Điều chỉnh tồn kho` opens the adjustment modal directly instead of routing to the page first.
* Added shared `AdjustmentTransactionModal` in `InventoryTransactionModals.tsx` alongside Inbound, Outbound, Transfer, and Stock Take modals.
* Adjustment creation now loads Material Detail `locationBalances`, shows a location-balance table, and calculates System Qty from the selected `warehouse/zone/slot/level` bucket only.
* Integrated `WarehouseMiniMap` into the adjustment modal for 2D slot/level selection synchronized with the selected bucket.
* Added reason dropdown presets and custom reason handling.
* Added realtime Difference and Variance Value display using the material average/unit cost available to the frontend.
* Adjustment detail drawer now reads new adjustment audit metadata from the existing `note` field when available, while legacy rows remain variance-only.

Scope:

* Frontend UI/UX only.
* No backend change.
* No API contract change.
* No Prisma schema change.
* No migration.

Verification:

* Frontend build passed.

## 2026-06-22 Sprint 19D Inventory Adjustment Center Refactor

Implemented:

* Refactored `InventoryAdjustmentsPage.tsx` to match the Inventory Inbound, Outbound, and Transfer UX pattern.
* Removed the inline Quick Adjustment Wizard from the page body.
* Added toolbar action `+ Điều chỉnh tồn kho` that opens an adjustment modal.
* Adjustment form now captures Material, Zone, Slot, Level, readonly System Qty, Actual Qty, auto-calculated Difference, Reason, and Attachment.
* Delta quantity is no longer directly editable in the UI.
* Adjustment numbers now use `KK` prefix in the frontend request instead of `DC`.
* Main adjustment table now sits in the primary page flow with Inventory table tokens and row-click detail drawer.
* Added adjustment detail drawer with Adjustment No, Material, Location, Difference, Variance Value, Reason, material lines, and attachment list.
* Added KPI strip for Adjustment Today, Adjustment Month, Increase Qty, Decrease Qty, Net Adjustment, and Abnormal Adjustments.
* Added analytics panels for Adjustment Trend, Top Variance Materials, Top Variance Locations, and Financial Impact.

Scope:

* Frontend UI/UX only.
* No backend change.
* No API contract change.
* No Prisma schema change.
* No migration.

Verification:

* Frontend build passed.

## 2026-06-22 Sprint 20A Costing Engine

Implemented:

* Added a read-only backend Costing Engine module at `apps/backend-api/src/modules/costing`.
* Added `CostingEngineService` for Production Order, Component, and Project cost aggregation.
* Added read-only API endpoints:
  * `GET /production/orders/:id/cost`
  * `GET /components/:id/cost`
  * `GET /projects/:id/cost`
* Production Order cost summary now returns Required Qty, Issued Qty, Returned Qty, Net Issued Qty, Consumed Qty, Scrap Qty, Material Cost, Cost Per Unit, and material-level cost rows.
* Component cost summary aggregates linked Production Orders and returns Material Cost and Cost Per Unit.
* Project cost summary aggregates project-linked Components and direct project Production Orders.

Costing rules:

* Material Cost uses actual Production Material Issue inventory transaction valuation when available.
* Fallback cost uses weighted average Inventory cost from `inventory_transaction_items.unitPrice` / `totalAmount`.
* No existing `ComponentCosting` rows are overwritten by these read models.

Verification:

* Verified 3 real Work Orders against SQL issue transaction valuation:
  * `MO-20260613-49982`: engine `85,585,910.28811619`, SQL `85,585,910.28811619`.
  * `MO-20260612-21547`: engine `16,906,102.615384612`, SQL `16,906,102.615384612`.
  * `MO-S3-1781194119`: engine `155,006.24301933107`, SQL `155,006.24301933107`.
* Error variance: 0% for the sampled Work Orders.

Scope:

* Backend read model/API only.
* No frontend UI change.
* No Prisma schema change.
* No migration.
* No workflow mutation.

## 2026-06-22 Sprint 19C MES Data Audit

Created:

* Added `docs/ai-state/audits/mes-data-audit.md`.

Findings:

* Shopfloor data foundation exists through `ProductionOrder`, `ProductionStage`, `ProductionTask`, `ProductionLog`, `WorkCenter`, and `Machine`.
* Shopfloor is not yet full MES-ready because immutable stage transition history, actual runtime/downtime, production line queues, operator rate data, and work-center costing are incomplete.
* Costing data is stronger: BOM planned material, Production Material Consumption, Inventory Transaction Item `unitPrice` / `totalAmount`, and ComponentCosting already form a usable material-costing path.
* Project cost is partially derivable from shipped/installed Components, ComponentCosting, and Inventory project transactions, but still needs a formal project cost ledger/control layer.

Decision:

* Prioritize Costing path first:
  * 20A Costing Engine
  * 20B Component Cost Analysis
  * 20C Project Cost Control
* Defer deeper Shopfloor dashboards until stage transition history and runtime/operator/machine data are canonical.

Scope:

* Documentation audit only.
* No frontend code change.
* No backend code change.
* No API, Prisma schema, migration, or workflow change.

## 2026-06-22 Sprint 19B Production Execution Board

Implemented:

* Added `/production/execution` as a new Production Execution Board tab.
* Created a separated `ProductionExecutionBoard` component for Kanban/shopfloor-style tracking.
* Added Kanban columns: Planning, Ready Material, Cutting, Assembly, Welding, Painting, and Completed.
* Work Order cards show WO No, Component, Project, Qty, Material Ready %, Progress %, Due Date, and delay badge.
* Stage mapping prefers existing active stage data and falls back to status/readiness mapping when backend stage is not canonical.
* Reused Sprint 18C material readiness logic to show `Waiting Material` versus `Ready To Release`.
* Added bottleneck analytics with per-stage counts, current bottleneck, waiting-material count, delayed count, and stage distribution donut.
* Added Work Order drawer sections for Work Order info, material status, production progress, material issue history, and reservations.

Scope:

* Frontend UI/data composition only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-22 Sprint 19A Production Warehouse

Implemented:

* Added a new `/production/warehouse` Production Warehouse Cockpit route and Production tab.
* Built a frontend-only `PRODUCTION` warehouse view from existing Inventory item `locationBalances`, Inventory audit cost, Production Orders, Reservations, and Consumption data.
* Added KPI strip for Production Stock, Materials in Production, Reserved for WO, Available for WO, Shortage Risk, and Inventory Value.
* Added material grid columns: Material, Main Stock, Production Stock, Reserved, Available, Required, Shortage, and Status.
* Status now uses Production `Available = Production Stock - Reserved`, not total stock.
* Required demand is derived from open Production Order BOM quantities with waste and MO quantity.
* Reserved quantity is derived from active reservation lines as `reservedQty - issuedQty`.
* Added analytics panels for top WO material consumption, material readiness, production locations, and shortage board.
* Added Production Zone / Slot / Level detail table and row drawer for material-level production warehouse locations.

Scope:

* Frontend UI/data composition only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18E Material Issue Dashboard

Implemented:

* Refactored `/production/material-issues` from a transaction list into a Production Material Control Center using the Inventory visual foundation.
* Added Material Issue KPI strip for issue count, issue value placeholder, issued material quantity, returned material quantity, issued Work Orders, and completion readiness rate.
* Material Issue grid now shows Issue No, Date, Work Order, Component, Required, Issued, Returned, Remaining, Readiness, Status, and Return action.
* Required/Remaining/Readiness are computed from existing Production Order BOM quantities and Production Material Issue net issued quantities.
* Material Issue drawer now has sections for issue information, material lines, warehouse source, and issue timeline.
* Added analytics panels for top issued materials, top returned materials, Work Orders missing material, readiness by Work Order, production warehouse source locations, readiness distribution, and business indicators.
* Preserved the existing material return action and validation behavior.

Notes:

* Current Material Issue API responses do not expose unit material cost or line total, so the issue value KPI is shown as unavailable instead of deriving a misleading value.

Scope:

* Frontend UI/UX only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18D Work Order Cockpit

Implemented:

* Refactored `/production/orders` from a Manufacturing Order list into a Work Order Cockpit using the Inventory visual foundation.
* Added Work Order KPI strip for Total Work Orders, Planned, Released, In Progress, Completed, and Delayed.
* Integrated Sprint 18C BOM Intelligence readiness into Work Orders, using BOM required quantity versus Production Material Issue net issued quantity.
* Work Order grid now shows WO No, Component, Project, Qty, Material Ready, Progress, Due Date, and Status.
* Material Ready uses percentage bands: 0-49 red, 50-79 amber, 80-99 cyan, and 100 emerald.
* Work Order drawer now has sections for WO information, material status, production progress, material issues, and reservations.
* Added Work Order analytics panels for material-value proxy, material shortages, upcoming due dates, production progress, and material readiness distribution.
* Added UI-only `READY TO RELEASE` warning when Material Readiness is at least 100%; no workflow lock was introduced.

Notes:

* Current Production Order / Material Issue responses do not expose unit material cost, so the "Top WO theo giá trị vật tư" panel uses required material quantity as a visible proxy and labels this limitation in the UI.

Scope:

* Frontend UI/UX only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18C BOM Intelligence

Implemented:

* Audited the real Component -> Production Order -> BOM -> BOM Item -> Production Material Issue data path.
* Added `docs/ai-state/audits/bom-intelligence-audit.md` documenting actual models, relationships, missing frontend type fields, and optional future API shape.
* Added frontend helper `calculateComponentMaterialReadiness()` to compute required, issued, remaining, and readiness percent from existing data.
* Removed the Sprint 18B `Material Ready = 100%` fallback from the Component Management Cockpit.
* Component material readiness now uses BOM required quantities and net Production Material Issue quantities (`issuedQty - returnedQty`).
* Component detail drawer material metrics now show real Required, Issued, and Remaining quantities from the same helper.
* Updated frontend production/component type definitions to include existing response fields required for readiness: `bomId`, embedded `bom`, embedded `materialIssues`, and `BOMItem.materialId`.

Scope:

* Frontend helper and type alignment only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18B Component Management Cockpit

Implemented:

* Components List is now positioned as `Trung tâm điều hành cấu kiện` instead of a plain CRUD list.
* Added Inventory-style KPI strip for total components, running components, completed components, waiting-material components, delayed components, and total component weight.
* Component table now uses the Inventory grid/table visual foundation and adds Project, Work Order, Progress, Material Ready, and Weight columns.
* Component rows open the shared `ModuleDetailDrawer` with operational sections for component information, BOM, material required/issued/remaining, related Work Orders, and production progress.
* Added Inventory-style analytics panels for top component weight, delayed components, material-shortage components, component structure mix, and creation rhythm.
* Initial Material Readiness used a safe frontend fallback; Sprint 18C superseded this with real BOM/Issue aggregation.

Scope:

* Frontend UI/UX only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18A Production UI Refactor

Implemented:

* Production Cockpit now uses the Inventory visual foundation for KPI cards, filter bar controls, analytics panels, spacing, and primary data-grid styling.
* Reworked the Production overview into an operational cockpit layout: KPI strip, Production Orders grid, and analytics panels.
* Added Production KPI cards for running orders, completed today, waiting material, delayed orders, running components, and estimated production weight.
* Production Orders grid now shows progress, status badge, material readiness, and delay warning.
* Added overview analytics panels for production progress, production stages, material issue readiness, and top running components using existing frontend data only.
* Production Order detail now opens in the shared `ModuleDetailDrawer` instead of the previous full-screen modal shell.
* Material Issue rows now open a detail drawer while preserving the existing return action behavior.
* Extended the Inventory-style treatment to Production BOM, Reservations, Material Ledger, Material Issues, Consumptions, and Logs tabs.
* BOM registry now has KPI cards and uses the shared data-grid/table shell; BOM detail now opens in a shared drawer.
* Reservation, Ledger, Issue, Consumption, and Log tables now use Inventory table tokens and shared module panels instead of local CRUD-style table shells.

Scope:

* Frontend UI/UX only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.
* Frontend build passed again after the extended tab rollout.

## 2026-06-20 Sprint 17F Main Warehouse Stock Status

Implemented:

* Inventory Overview stock status now uses `Kho chính` / `MAIN` stock from `locationBalances`, not total stock across all warehouses.
* Overview KPIs for low-stock and out-of-stock materials now derive from the `MAIN` warehouse status rule.
* Inventory Overview stock tables now show `Kho chính`, `Kho SX`, and `Tổng tồn` as separate columns.
* Inventory Materials list now uses the same `MAIN`-based status rule and shows separate main/production/total stock columns.
* Material Detail `Vị trí` tab now groups location balances into `Kho chính`, `Kho sản xuất`, and optional `Kho khác`.
* Quantity display in Inventory stock tables uses the shared locale parser/formatter and tabular numeric styling so values such as `700` are not visually truncated or rounded away.

Scope:

* Frontend only.
* No backend API change.
* No Prisma schema change.
* No migration.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 17E Inventory Document Numbering Hardening

Implemented:

* Operational code formatting now uses five-digit date-scoped sequences, for example `NK-260620-00001`.
* `nextOperationalCode` no longer uses `count() + 1`; it scans current-day prefix rows, extracts numeric suffixes, and generates `max(sequence) + 1`.
* Inventory transaction creation now ignores frontend-supplied `code` and `transactionNo`.
* Inventory transaction creation writes `code = transactionNo = generatedNo`.
* Inventory transaction creation retries up to three times on Prisma `P2002` duplicate collisions for `code` / `transactionNo`.
* Material Movement direct Inventory transaction writer now uses the same Inventory numbering prefixes.
* Production Material Issue direct Inventory transaction writers now use the same Inventory numbering prefixes.
* Added diagnostic SQL report `scripts/sql/validate-inventory-transaction-numbering.sql` for historical `code <> transactionNo` rows.

Scope:

* Backend numbering logic only.
* No Prisma schema change.
* No migration.
* Historical mismatched records are reported, not overwritten.

Verification:

* Backend build passed.

## 2026-06-20 Sprint 17B Inventory Locations & Material Movement Visualization

Implemented:

* Inventory Locations now shows occupancy percentage, free slots, occupied slots, and inventory value by location.
* Location list now includes occupancy and value columns.
* Added value-by-location analytics using existing material cost/audit data when available.
* Added Top Occupied Slots with quantity and value.
* Clicking a top occupied slot opens a material list drawer for that slot.
* Added movement route analytics for transfer transactions with source slot, destination slot, movement count, quantity, and value.

Scope:

* Frontend only.
* Reused existing Inventory zones, audit, and transaction APIs.
* No schema, migration, backend API, or workflow changes.
* Inventory value is only as complete as the available material average/unit cost data in current frontend sources.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 17A Inventory Stocktake Enhancement

Implemented:

* Inventory Stock Take rows now open a session detail drawer.
* Session detail shows stocktake header information and all material variance lines.
* Added stocktake KPIs for total sessions, pending approval, variance materials, accuracy, and variance value.
* Stocktake analytics now includes top variance materials, top variance locations, and adjustment preview.
* Detail line columns include Material, SystemQty, ActualQty, VarianceQty, UnitPrice, and VarianceValue.
* Existing adjustment transaction fields are used when available; when `SystemQty` / `ActualQty` are absent, the UI falls back to variance-only display.

Scope:

* Frontend only.
* Reused existing Inventory adjustment transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 16D Inventory Outbound Analytics Enhancement

Implemented:

* Inventory Outbound now includes project consumption analytics with document count, quantity, value, and value percentage.
* Added daily and monthly outbound trend charts.
* Added material consumption analytics with quantity, value, and issue count.
* Added outbound-purpose distribution for project, production, customer, and other.
* Added financial KPI panel for today, week, month, and year.
* Added abnormal consumption alerts based on material-level quantity/value outliers in the current filtered dataset.

Scope:

* Frontend only.
* Reused existing Inventory transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 16C Inventory Inbound Enhancement

Implemented:

* Inventory Inbound rows now open a detail drawer with inbound header info and all material lines.
* Inbound detail shows material code, material name, quantity, unit, unit price, line amount, warehouse, zone, slot, and level.
* Inbound KPI strip now includes today's inbound value, monthly inbound value, monthly inbound document count, and monthly active supplier count.
* Inbound analytics now includes top suppliers by inbound value, top suppliers by inbound quantity, value-ranked top materials, and price monitoring panels for top increases/decreases.
* Inbound calculations now aggregate all transaction item lines instead of using only `items[0]`.
* Attachment button clicks on Inbound rows now open only the attachment drawer and no longer trigger row detail.
* Inventory Inbound, Outbound, and Transfer filter bars now use the same larger spacing rhythm (`p-3`, `gap-3`) for search/dropdown controls.

Scope:

* Frontend only.
* Reused existing Inventory transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.
* Build output includes Inventory Outbound, Inbound, and Transfer route chunks, so the reported Outbound page issue is not caused by a frontend build/lazy-route failure.

## 2026-06-19 Sprint 16B Inventory Transfer Enhancement

Implemented:

* Inventory Transfer rows now open a detail drawer with transaction info, source/destination locations, and material lines.
* Transfer detail shows warehouse, zone, slot, and level for source and destination lines.
* Added transfer KPIs for monthly transfer value, today's transfer value, and monthly transfer document count.
* Changed Top Materials ranking to sort by transfer value instead of quantity.
* Added top transfer routes with route count, quantity, and value.
* Added top source locations and top destination locations by transfer value.

Scope:

* Frontend only.
* Reused existing Inventory transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-19 Sprint 16A Inventory Outbound Enhancement

Implemented:

* Inventory Outbound rows now open a detail drawer showing document header fields, project/receiver, actor, remarks, and item lines.
* Outbound detail item table shows material code, material name, quantity, unit, unit price, and total amount using existing Inventory transaction API data.
* Added `Giá trị xuất hôm nay` KPI to the Outbound KPI strip.
* Changed Top Materials ranking to sort by total outbound value instead of outbound quantity.
* Added Top Projects ranking aggregated by outbound value.

Scope:

* Frontend only.
* Reused existing Inventory transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-19 Sprint 15B Inventory Cost Integrity

Fixed:

* Inventory transaction item creation now persists `unitPrice` and `totalAmount` for new IMPORT, EXPORT, TRANSFER, RETURN, and ADJUSTMENT rows.
* `InventoryService.createTransaction()` now applies material valuation before writing transaction items, using provided line values first and weighted average material cost as fallback.
* Production material issue/return direct Inventory transaction writers now persist valuation fields.
* Material Movement direct transaction writer now persists valuation fields.
* Created and executed one-time repair script `scripts/sql/backfill-inventory-transaction-item-costs.sql` to populate missing historical `unitPrice` / `totalAmount`.

Root cause:

* Transaction item normalization left valuation fields null when the client did not submit price data, especially for EXPORT rows and direct production/material movement writers.
* Sprint 15A fixed read-time display but did not repair source rows.

Verification:

* Backfill updated 67 historical rows.
* Verification SQL now reports `rows_with_amount = total_rows` and `rows_with_unit_price = total_rows` for IMPORT, EXPORT, TRANSFER, and RETURN.
* Backend build passed.

## 2026-06-19 Sprint 15A Fix Outbound Inventory Value

Fixed:

* Fixed Inventory Outbound value display so `Giá trị xuất trong tháng` and row-level `Giá trị` no longer depend on `items[0].totalAmount`.
* Inventory Outbound now sums all transaction item quantities and values for each outbound document.
* `/inventory/transactions` and `/inventory/transactions/:id` now enrich transaction item `unitPrice` / `totalAmount` from material average inbound cost when stored outbound transaction rows have missing amount fields.
* Search/filter logic on Inventory Outbound now considers all item lines in a transaction instead of only the first line.

Evidence:

* PostgreSQL local validation showed `EXPORT` transaction item rows had `unitPrice` and `totalAmount` null, while `IMPORT` rows contained priced data.
* After the service fix, `GET /inventory/transactions?type=OUTBOUND` returns computed `items.unitPrice` and `items.totalAmount`; sample `XK-260619-001` returned `totalAmount=3524043.9704058017`.

Verification:

* Backend build passed.
* Frontend build passed.

## 2026-06-19 Inventory Transactions UX 2.0

Implemented:

* Added shared Inventory transaction attachment controls for transaction-specific pages.
* `Nhập kho`, `Xuất kho`, `Điều chuyển`, and `Kiểm kê` lists now include a `Hồ sơ` column with a `📎 count` action.
* Clicking the `Hồ sơ` action opens a standard attachment drawer with header `📎 <count> tài liệu`.
* Drawer lists the transaction files using the existing `InventoryAttachmentList`, including original filename, category, size, upload date, download action, and image preview.
* Attachment matching reuses `module=inventory`, `entityType=transaction`, `entityId`, and transaction metadata such as `transactionNo`.

Scope:

* Frontend UX only.
* No backend, API, Prisma, database, storage, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-19 Sprint 14B.5 Attachment UX Refinement

Fixed:

* Removed image/document attachment badges from Inventory Materials list and expanded material list to reduce visual noise in the stock cockpit.
* Kept attachment context inside Material Detail, where users already inspect a specific material.
* Material Detail Overview now shows a subtle `Hồ sơ vật tư` summary card with `Ảnh vật tư` and `Tài liệu` counts.
* Material Detail `Nhập / Xuất` tab now includes a `Tài liệu` column for related Inventory transaction attachments.
* Material Detail `Công trình` tab now includes `Hồ sơ liên quan` based on outbound transaction attachments where available.
* Material Detail `Nhà cung cấp` tab now includes `Chứng từ` based on inbound transaction attachments where available.
* Material Detail `Tài liệu vật tư` tab now classifies documents by source, including `Master Material`, `Inbound Transaction <no>`, and `Outbound Transaction <no>`.
* Attachment chips now use subtle Module UI Foundation styling with `FileText` icon instead of emoji-heavy badges.
* Clicking a contextual attachment chip opens a standard `ModuleDetailDrawer` with the file list and download/preview actions.

Scope:

* Frontend UX only.
* No backend, API, Prisma, database, storage, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-18 Sprint 14B.4 Inventory Attachment UX Audit

Fixed:

* Improved attachment discoverability without changing backend, storage, API contracts, or upload workflow.
* Inventory Transactions list now shows an attachment badge column (`📎 count`) so users can see files before opening the detail drawer.
* Inventory transaction detail drawer now shows attachment count in the header subtitle and a quick attachment panel in the Overview tab, while keeping the dedicated `Tài liệu đính kèm` tab.
* Inventory Materials list now shows material attachment badges (`📷 photo count`, `📄 document count`) for each material row and in the expanded list.
* Material Detail drawer now shows photo/document counts in the header and an Overview attachment summary with direct shortcuts to `Hình ảnh vật tư` and `Tài liệu vật tư`.

Audit finding:

* Runtime attachment data was already persisted and served correctly, but users could not discover it easily because the transaction list had no attachment signal and transaction files were only visible inside a secondary tab.

Verification:

* Frontend build passed.
* Backend was not changed.

## 2026-06-18 Sprint 14B.3 Attachment UI Data Binding Fix

Fixed:

* Hardened Material Detail attachment binding so image URLs resolve from `currentVersion.publicUrl`, `versions[0].publicUrl`, direct `publicUrl` / `url`, `currentVersion` / `latestVersion`, or `storagePath`.
* Hardened Transaction Attachment binding with the same URL fallback.
* Material attachment query now resolves material id from `id`, `materialId`, or `inventoryItemId`, preventing empty queries while detail data is still loading.
* Added development-only console diagnostics for Material and Transaction attachment query params, API response payload, and mapped UI objects.
* Material document download now uses the same URL resolver as image rendering.

Evidence:

* Material attachment API response contains `versions[0].publicUrl=/uploads/inventory/materials/...jpg`.
* Transaction attachment API response contains `versions[0].publicUrl=/uploads/inventory/transactions/inbound/...pdf`.
* Frontend mapped URLs resolve to `http://172.168.53.116:3000/uploads/...`.
* Static file requests for both mapped URLs return `200 OK`.

Verification:

* Frontend build passed.
* Backend build passed with no backend code changes.

## 2026-06-18 Sprint 14B.1 Attachment Engine Runtime Fix

Fixed:

* Restored runtime RBAC seed data required by guarded attachment endpoints.
* Added migration `20260618094500_restore_rbac_foundation` to recreate the `admin` role, base permissions, role-permission mappings, and admin user-role mapping idempotently without changing passwords or business data.

Root cause:

* `permissions`, `roles`, `role_permissions`, and `user_roles` tables were empty, so `PermissionsGuard` rejected `/attachments` and `/attachments/upload` with 403 before `AttachmentsController` and `AttachmentsService.upload()` could run.

Evidence after fix:

* `permissions=27`, `roles=1`, `role_permissions=27`, `user_roles=1`.
* JWT login payload includes `attachments.read` and `attachments.write`.
* `GET /attachments?module=inventory&entityType=material&entityId=<materialId>` returns 200.
* `POST /attachments/upload` for `VAL-MAT-002` returned 201 and inserted a `PHOTO` attachment.
* `POST /attachments/upload` for an Inventory transaction returned 201 and inserted an `INVOICE` attachment.
* `attachments` table contains uploaded records.
* Files exist under `/data/steeltrack-storage/inventory/materials` and `/data/steeltrack-storage/inventory/transactions/inbound`.

## 2026-06-18 Sprint 14B Inventory Transaction Attachments

Implemented:

* Extended the shared Attachment Engine to Inventory transaction documents without creating a new storage engine.
* Added attachment categories for transaction documents: `INVOICE`, `DELIVERY_NOTE`, `PACKING_LIST`, and `REPORT`.
* Added migration `20260618090000_inventory_transaction_attachment_categories`.
* Inventory transaction attachments use `module=inventory`, `entityType=transaction`, and `entityId=inventoryTransactionId`.
* Backend storage routing now saves transaction files under `/data/steeltrack-storage/inventory/transactions/<type>` for inbound, outbound, transfer, stocktake, return, and adjustment.
* Added shared frontend `InventoryAttachmentPicker` and `InventoryAttachmentList`.
* Inbound, Outbound, Transfer, and Stock Take transaction modals can select attachments while creating the transaction; files upload after the transaction save succeeds.
* Inventory Transactions page now opens a transaction detail drawer by clicking transaction number.
* Transaction detail drawer includes `Tài liệu đính kèm` tab showing original filename, category, upload date, size, download action, and image preview for image files.
* Material image gallery remains filtered by `module=inventory&entityType=material&entityId=<materialId>`.

Verification:

* Prisma generate passed.
* Prisma migration deploy applied Sprint 14B migration.
* Backend build passed.
* Frontend build passed.

## 2026-06-17 Sprint 14A Attachment & Image Foundation

Implemented:

* Extended the existing Attachments foundation into a shared metadata-first attachment system for Inventory, Components, Production, Projects, Suppliers, and Assets.
* Added nullable direct metadata fields on `Attachment`: `module`, `entityType`, `entityId`, `originalName`, `storedName`, `extension`, `checksum`, `storagePath`, and `uploadedBy`.
* Added attachment indexes for module/entity/entity/checksum lookup and migration `20260617140000_attachment_foundation_metadata`.
* Moved filesystem storage out of the source tree. Runtime storage now uses `STORAGE_ROOT` or defaults to `/data/steeltrack-storage`.
* Updated local storage to support deterministic stored names such as `INV_MAT_<entityId>_<date>_<hash>.ext`.
* Added SHA256 checksum dedupe: duplicate uploads reuse the existing stored physical file and create a new metadata reference.
* Added upload validation for configurable max file size and allowed MIME types: `image/*`, PDF, DOCX, and XLSX.
* Disabled OCR preparation in the Sprint 14A upload path because OCR/AI tagging is explicitly out of scope.
* Material Detail `Hình ảnh vật tư` now uploads images through `/attachments/upload`, refreshes the gallery, preserves original filenames, and renders backend-served images.
* Material Detail now includes `Tài liệu vật tư` for non-photo attachments with filename, size, upload date, and download link.

Follow-up fix:

* Fixed Material Detail `Hình ảnh vật tư` tab so its upload button calls the same image upload handler as the Overview gallery.
* Fixed `/attachments` listing to pass `entityType` into repository filters so uploaded material photos are returned for `module=inventory&entityType=material&entityId=<materialId>`.
* Backend storage now initializes the standard `/data/steeltrack-storage` folder tree on service startup when permissions allow.

Storage:

* Files are served from `/uploads/*` backed by `STORAGE_ROOT`, not `apps/frontend/public`, repo `uploads`, or source-code folders.
* Initial folder routing covers inventory/materials, inventory transaction folders, components, production, projects, suppliers, and assets.

Verification:

* Prisma generate passed.
* Prisma migration deploy reported no pending migrations.
* Backend build passed.
* Frontend build passed.

## 2026-06-17 Quantity Input Thousand Separator Bug Fix

Fixed:

* Changed `formatQuantityInput()` to behave as an edit-mode sanitizer instead of inserting thousands separators while typing.
* Quantity inputs now preserve raw editable values while focused, for example `1000`, `10000`, `100000`, `1,5`, and `1000,5`.
* Quantity inputs format with `formatQuantity()` on blur, for example `1000 -> 1.000` and `1000,5 -> 1.000,5`.
* Added focus/blur handling to audited Inventory transaction forms, Inbound/Outbound wizard quantity fields, Material Master minimum stock, warehouse capacity, Inventory adjustment quantity, Production BOM quantity fields, Manufacturing Order quantity, Production yard staging quantity/weight, and Components material return quantity.
* VND currency input formatting remains separate and unchanged.

Verification:

* Helper verification passed for `1000`, `10000`, `100000`, `1,5`, `1000,5`, plus smart paste cases `1,250.5`, `1.250,5`, `1250.5`, and `1250,5`.
* Frontend build passed.

## 2026-06-17 Sprint 11A.2 Numeric Formatting Consolidation + Sprint 13B.3 Material Visual Analytics

Implemented:

* Consolidated frontend quantity/currency/date display away from ad-hoc `toLocaleString('vi-VN')` and `Intl.NumberFormat` usage.
* Updated shared number utilities with smart locale parsing for `1,250.5`, `1.250,5`, `1250.5`, and `1250,5`.
* VND currency display now uses whole dong formatting through `formatCurrencyVnd`, for example `128.571.428 đ`.
* Quantity display/input uses shared `formatQuantity`, `formatQuantityInput`, and `parseLocaleNumber` helpers.
* Replaced scattered numeric formatting in Inventory, Production, Components, Dashboard, Yard, Projects, QC, Suppliers, System, and adjacent frontend pages.
* Added Material Detail image gallery support that reads future `imageUrl`/`photoUrl`/`thumbnailUrl` fields and shows an empty state when no image exists.
* Added Material Master image upload preview UI without changing payload/API/schema.
* Reworked Material Detail Analytics into a Module UI Foundation cockpit with Inbound Trend, Outbound Trend, Inventory Trend, Forecast 7 Days, and Inventory Turnover panels.

Constraints honored:

* No API contract changes.
* No backend changes.
* No Prisma schema changes.
* No database changes.
* No workflow/business logic changes.

Verification:

* `rg "toLocaleString\\('vi-VN'\\)|Intl\\.NumberFormat" apps/frontend/src` returned no results.
* Frontend build passed.

## 2026-06-15 Inventory Numeric Input Formatting Fix

Fixed:

* Split currency input formatting from quantity input formatting.
* Currency fields now accept digits only and format with Vietnamese thousand separators, e.g. `1111 -> 1.111`.
* Quantity fields still support decimal values with comma decimal separator, e.g. `1,5`, `0,125`.
* Updated Inventory inbound unit price inputs to use the currency formatter.
* Updated locale number parsing so `.` is always treated as a thousands separator and `,` is the decimal separator.

Verification:

* Frontend build passed.

## 2026-06-15 Inventory Stock KPI Sparkline Cards

Implemented:

* Updated the five top KPI cards on Inventory Material Stock to use fixed-height compact metric cards.
* Added icon badges and bottom monthly sparkline charts for inventory value, quantity, material codes, low-stock items, and out-of-stock items.
* Kept existing frontend filters and data sources; KPI status cards still filter the current list client-side.
* Exposed `createdAt` and `updatedAt` from `/inventory/audit` so new material code counts are based on real material creation dates.
* Replaced decorative KPI trends with monthly snapshots derived from real Inventory audit rows and transaction item movement history.
* KPI helper text now shows month-over-month deltas for value, quantity, low-stock, and out-of-stock metrics; material code helper text shows real new codes in the current month.

Constraints honored:

* API response was extended with existing material timestamps only.
* No Prisma schema changes.
* No database changes.
* No workflow changes.

Verification:

* Backend build passed.
* Frontend build passed.

## 2026-06-15 Operational Code Numbering Standardization

Implemented:

* Standardized new user-facing operational codes to `PREFIX-YYMMDD-###`.
* Added frontend shared helpers `compactDate`, `nextCodeFromCount`, and `nextLocalCode`.
* Added backend shared helpers `compactCodeDate`, `formatOperationalCode`, and `nextOperationalCode`.
* Updated active frontend generators for:
  Inventory inbound/outbound/transfer/stock take/adjustment, Production BOM, Manufacturing Order, Components, and Projects.
* Updated backend fallback generators for:
  Inventory transactions, Return Requests, Production BOM, Work Orders, Production Reservations, Material Issues, Component creation from Production, QC Inspection, NCR, Material Movements, and Purchase Receiving.
* Documented the decision in `docs/ai-state/decisions/code-numbering-decisions.md`.

Constraints:

* Existing historical records were not rewritten.
* No Prisma schema changes.
* No database migration changes.

Verification:

* Backend build passed.
* Frontend build passed.

## 2026-06-15 Sprint 13B.2 Theme Consistency Audit

Implemented:

* Audited Material Detail Drawer against Dashboard, Inventory Stock, and Production Cockpit theme patterns.
* Added shared `ModuleTabs` to the Module UI Foundation.
* Replaced the Material Detail custom horizontal tab shell with shared `ModuleTabs`.
* Updated Material Detail tables to use shared `moduleTableHead` and `moduleTableRow` tokens.
* Replaced the focused 2D location preview custom modal shell with `ModuleDetailDrawer` and `ModuleAnalyticsPanel`.

Audit findings fixed:

* Tab spacing/color/active state did not match Production Cockpit.
* Table header/row styling was duplicated locally instead of using shared module tokens.
* Focused 2D preview used a custom modal surface instead of the standard drawer surface.

Constraints honored:

* No API changes.
* No backend changes.
* No Prisma schema changes.
* No database changes.
* No workflow or business logic changes.

Verification:

* Frontend build passed.

## 2026-06-15 Sprint 13B.1 Material Detail Redesign

Implemented:

* Redesigned the Inventory Material Detail drawer using the Sprint 12A-12C Module UI Foundation.
* Added a header KPI strip for Current Stock, Average Cost, Inventory Value, and Storage Locations.
* Replaced the left-side detail menu with horizontal tabs.
* Added colored transaction type badges for Inbound, Outbound, Transfer, and Adjustment.
* Reworked the Location tab with a donut distribution and location table.
* Added Analytics tab content for movement trend and a frontend forecast panel.
* Added Project tab usage summary and top project usage table.
* Added Supplier tab purchase summary and top supplier table.

Constraints honored:

* No API changes.
* No backend changes.
* No Prisma schema changes.
* No database changes.
* No workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 13 Dashboard Forecast Enhancement

Implemented:

* Added material replenishment forecasting to the Executive Dashboard.
* Dashboard now estimates projected 7-day material balance from Inventory Audit rows and recent outbound Inventory transactions.
* Dashboard highlights material codes that need urgent purchase or replenishment, including recommended quantity and action label.
* Added 7-day component forecast using current Component lifecycle status and open Production Orders.
* Executive Alerts now include top material purchase/replenishment needs and component delivery/installation backlog signals.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No database changes.
* No API contract changes.
* No workflow changes.
* No AI or machine learning was added.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 13 Executive Dashboard

Implemented:

* Reworked the main Dashboard into an Executive Dashboard focused on:
  Inventory Forecast, Component Pipeline, Yard Occupancy, QC Quality Trend, Production Signal, and Executive Alerts.
* Inventory Forecast uses existing inventory audit rows, inventory transactions, and dashboard movement trend data.
* Component Pipeline uses existing `components` lifecycle statuses and Production Order records.
* Yard Occupancy uses existing Yard runtime metrics and Yard movements.
* QC Quality Trend uses existing QC cockpit aggregate metrics.
* Executive Alerts are rules-based from existing cockpit/operational data; no AI or machine learning was added.
* Dashboard panels show assumptions when detailed historical data is missing.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No database changes.
* No API contract changes.
* No workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 12C UI Polish, UX Consistency & Frontend Performance

Implemented:

* Shared module UI foundation now supports sticky `ModuleFilterBar`, clickable/active `ModuleKpiCard`, icon/CTA `ModuleEmptyState`, KPI/table/analytics loading skeleton variants, and `ModuleDetailDrawer`.
* Inventory Stock KPI cards can filter frontend stock status for all/low/out-of-stock rows.
* Components List lifecycle KPI cards filter by raw lifecycle status: `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Components Stock lifecycle KPI cards filter by lifecycle status and use shared empty/loading states.
* Components List and Components Stock detail views now use `ModuleDetailDrawer` for consistent width, header, close action, and scroll behavior.
* Production Cockpit KPI cards filter frontend Manufacturing Orders by status.
* Projects Overview KPI cards filter project status, and Project Components KPI cards filter component lifecycle status.
* Project detail view now uses `ModuleDetailDrawer`.
* App router now uses `React.lazy`/`Suspense` route splitting for active module pages.
* Yard 2D/3D operational maps are lazy-loaded inside Yard workspace.

Bundle audit:

* Main application chunk reduced from approximately `2,040 kB` before route splitting to approximately `380 kB`.
* `YardPage` route chunk reduced to approximately `56 kB`.
* Remaining Vite large chunk warning is isolated to lazy `YardOperationalMap3D` at approximately `969 kB`, loaded only when the 3D yard map is opened.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No API contract changes.
* No business workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 12B Production + Projects + Yard UI Rollout

Implemented:

* Production Cockpit now uses shared module UI foundation for page header, KPI strip, filter bar, analytics panels, and the primary Manufacturing Order data grid.
* Projects cockpit now uses shared module UI foundation for page header, filter bar, KPI strip, Project runtime cards, Components runtime cards, table shell, and empty state.
* Yard active cockpit now uses shared module UI foundation for page header, KPI strip, filter bar, occupancy analytics, shipment/operation analytics, and yard trend analytics panels.
* Extended `ModuleKpiCard` with an optional icon prop so modules can keep operational icon cues while using the shared card rhythm.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No API contract changes.
* No business workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 12A UI Standardization Foundation

Implemented:

* Added shared module UI primitives under `apps/frontend/src/shared/ui/modules`.
* Created generic presentation components:
  `ModulePageHeader`, `ModuleKpiStrip`, `ModuleKpiCard`, `ModuleFilterBar`, `ModuleAnalyticsPanel`, `ModuleDataGrid`, `ModuleEmptyState`, and `ModuleLoadingState`.
* Inventory visual wrappers now delegate to the shared module UI foundation while preserving existing behavior.
* Inventory Stock compact KPI cards now use the shared module KPI card.
* Components shared cockpit wrappers now delegate to shared module UI constants/components.
* Components List and Components Stock now use Inventory-style page headers and lifecycle KPI strips:
  `Tổng cấu kiện`, `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED`.
* Documented the Inventory UI pattern audit in `docs/ai-state/design/ui-standardization-foundation.md`.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No API contract changes.
* No business workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 11A Decimal Quantity & Currency Formatting

Fixed:

* Added shared frontend number helpers for `vi-VN` decimal quantity input and VND currency display.
* Inventory transaction modals now accept and display decimal quantities/unit prices using locale formatting while preserving up to 3 decimal digits.
* Inventory inbound/outbound legacy wizards, stock adjustment, stock-take, Material Master minimum stock, and warehouse location capacity now parse decimal values consistently.
* Production BOM, Manufacturing Order, production return/consume prompts, and Yard staging now support decimal quantities such as `0,001`, `1,5`, and `1.234.567,125`.
* Components production material return uses the same decimal parser and VND currency formatter.
* Backend Inventory and Production DTOs now tolerate locale-formatted numeric strings in quantity-related fields.

Database audit:

* No migration required for the audited operational quantity/cost fields; current Prisma models use `Float` for Inventory, BOM, Production, Yard quantity, and Component costing values.

Verification:

* Frontend build passed.
* Backend build passed.

## 2026-06-13 Sprint 11 Component Costing Breakdown

Implemented:

* Added `GET /components/:id/costing/breakdown`.
* Breakdown response includes component id/code, production order id, estimated material rows, actual material rows, summary material costs, and warnings.
* Estimated material rows use BOM quantities, waste percent, production order quantity, and Inventory average material cost.
* Actual material rows use `ProductionMaterialConsumption.consumedQty + scrapQty` and Inventory average material cost.
* Added warning engine:
  `BOM_MATERIAL_NOT_CONSUMED`;
  `UNPLANNED_MATERIAL`;
  `QUANTITY_VARIANCE`.
* Quantity variance threshold is configurable with `COMPONENT_COSTING_QTY_VARIANCE_THRESHOLD_PERCENT` and defaults to 10%.
* Component Detail UI now has a `Cost Breakdown` tab with KPI cards, Estimated Materials table, Actual Materials table, and Warnings section.

Root cause:

* `ComponentCosting` stored summary totals but did not expose the material rows used to create those totals.
* Users could see estimated, actual, and variance cost but could not tell which BOM materials or actual consumed materials drove the numbers.

Verification:

* Test case created BOM material `VAL-MAT-100` quantity `100` and consumed unplanned `VAL-MAT-002` quantity `9`.
* `GET /components/:id/costing/breakdown` returned:
  estimated material cost `128,571,428.57142857`;
  actual material cost `2,442,627.7427184465`;
  warnings `BOM_MATERIAL_NOT_CONSUMED` and `UNPLANNED_MATERIAL`.
* Backend build passed.
* Frontend build passed.

## 2026-06-13 Sprint 10C Reservation Allocation Integrity

Fixed:

* Production reservation preview/allocation now reads active `inventory_location_stocks` buckets directly instead of reconstructing availability from historical Inventory transactions and issue rows.
* Reservation allocation only considers production warehouse buckets where `inventory_location_stocks.quantity > 0`.
* Bucket selection is exact by:
  `inventoryItemId + warehouseId + zoneId + slotId + level`.
* Active reservations are deducted by exact bucket, so one occupied slot/level no longer reduces a different slot/level.
* Runtime production integrity summary now reports `invalidReservationBuckets` for active reservation lines whose exact bucket has no positive current stock.

Root cause:

* Reservation allocation used transaction history tagged `[COMPONENT_PRODUCTION]` and manual issue deduction.
* Historical production buckets could remain in the derived availability map after their active `inventory_location_stocks` row was consumed or removed.
* Reservation could succeed against that historical bucket, then issue-from-reservation failed during exact stock mutation with negative/insufficient stock validation.

Verification:

* Smoke setup created active production stock for a new material:
  `A02/L1 = 10`, `A02/L2 = 5`.
* Reservation requirement `8` previewed and allocated only from active bucket `A02/L1`.
* Issue from reservation succeeded immediately.
* Verified final stock:
  `A02/L1 = 2`, `A02/L2 = 5`.
* Backend build passed.
* Frontend build passed.

Remaining data state:

* Runtime integrity summary still reports `invalidReservationBuckets = 1` from a historical reservation created before this fix. No silent data backfill was performed.

## 2026-06-13 Sprint 10B Automatic Component Costing

Fixed:

* Production completion now automatically recalculates Component costing for the linked component.
* `POST /production/:id/component` also triggers automatic costing after creating or marking a component `READY`.
* Automatic costing calls the existing ComponentCosting upsert path, so an existing `ComponentCosting` row is updated and a missing row is created.
* Costing failures are caught and logged with `Logger.warn`; production completion remains successful.
* Automatic costing writes ActivityLog action `AUTO_RECALCULATE_COSTING` with `componentId` and `productionOrderId` metadata.
* Manual `POST /components/:id/costing/recalculate` remains unchanged and continues to write `RECALCULATE_COSTING`.

Root cause:

* Component costing existed only behind the manual Components API action.
* Production completion and production-output component creation updated Component status to `READY` but never called the costing service, leaving `components.estimatedCost` and `components.actualCost` at zero until a user pressed Recalculate.

Verification:

* Smoke flow created component `S10B-20260613103402-COMP`, transferred material to production, issued `10`, consumed `8`, scrapped `1`, and completed the production stage.
* Without calling manual recalculate, verified:
  `ComponentCosting` row exists;
  `components.estimatedCost = 2,714,030.825242719`;
  `components.actualCost = 2,442,627.742718447`.
* Verified ActivityLog:
  `AUTO_RECALCULATE_COSTING` with component and production order metadata.
* Reservation-based smoke found a separate existing defect: reservation issue allocated a historical production slot without current stock and returned `Inventory quantity cannot become negative`. This is documented as future reservation reconciliation work, not part of Sprint 10B.

## 2026-06-13 Sprint 10A.1 Return Material UI Reconciliation

Fixed:

* Production Cockpit now uses one shared returnable calculation for rendering and click handling.
* Returnable quantity is computed from `ProductionMaterialIssue.returnedQty` plus consumed/scrap aggregate:
  `issued - consumed - scrap - returned`.
* Rows with status `RETURNED` are treated as fully reconciled in the UI, so the Return action is disabled/hidden.
* Successful return mutation now updates the `['production', 'issues']` query cache immediately with the backend response before async refetch completes.
* Inventory insufficient-stock errors from stale return attempts are translated into a user-friendly reload/reconciliation message.

Root cause:

* The backend correctly wrote `ProductionMaterialLedger` `RETURN` and updated `ProductionMaterialIssue.returnedQty`, while `ProductionMaterialConsumption.returnedQty` remained a historical snapshot.
* The Cockpit depended on query invalidation/refetch timing after return. A stale issue row could keep the Return action visible long enough for a second return attempt.
* The UI needed to use `ProductionMaterialIssue.returnedQty` as the active returned source of truth and refresh it synchronously from the return mutation response.

Verification:

* Existing Sprint 10A smoke row `S10A-20260613094829-ISSUE` verifies:
  issue `10`, consume `8`, scrap `1`, return `1`.
* SQL returnable check now reports:
  `backend_formula_returnable = 0`, `ui_returnable = 0`.
* Backend build passed.
* Frontend build passed.

## 2026-06-13 Sprint 10A Material Return Reconciliation

Fixed:

* Production Material Return now validates against the real MO/material balance:
  `issued - consumed - scrap - previously returned`.
* Returning unused issued material now creates an Inventory `RETURN` transaction into `MAIN` / `Kho chính` instead of restoring the old production issue bucket.
* `inventory_location_stocks` and `inventory_items.quantity` are updated through the Inventory return transaction and exact main warehouse bucket upsert.
* `ProductionMaterialIssue.returnedQty` is incremented by the returned quantity.
* `ProductionMaterialLedger` writes a `RETURN` event at the main warehouse destination bucket.
* Legacy `PATCH /production/material-issues/:id` status changes to `RETURNED` now route through the same return validation instead of the old stock movement path.
* Production Cockpit Material Issues UI now calculates returnable quantity after consumed/scrap quantities and prompts for partial return quantity.
* Production mutations now invalidate Inventory query caches after issue/return changes.

Root cause:

* The previous return path treated returnable quantity as `issuedQty - returnedQty`, so it ignored consumed and scrap quantities.
* The previous return path restored stock to the original production issue location. That conflicted with the active workflow where issue already deducts `Kho vật tư SX`, consumption/scrap are production-side actuals, and only unused remainder should return to `Kho chính`.
* A legacy status-update path could still create the old return movement without the new reconciliation checks.

Verification:

* Smoke test completed through API using `VAL-MAT-002`:
  issue `10`, consume `8`, scrap `1`, return `1`.
* Verified balance:
  `issued = 10`, `consumed = 8`, `scrap = 1`, `returned = 1`.
* Verified Inventory transactions:
  transfer Main -> Production `-10/+10`, production issue export `-10`, return to Main `+1`.
* Verified ledger rows:
  `CONSUME = 9` at production bucket and `RETURN = 1` at main warehouse bucket.

## 2026-06-12 Sprint 9 Bug Fixes

Fixed:

* Fixed critical Inventory production-transfer stock check where top-level `warehouseId` for the receiving production warehouse was inherited by the main-warehouse source line.
* Inventory line normalization now resolves `warehouseId` from each line `zoneId` when the line has a zone, preventing source and destination warehouse IDs from being mixed in multi-line transfers.
* Inventory outbound modal now sends source line `warehouseId` explicitly from the selected source location/zone.
* Inventory transaction location synchronization now keys `inventory_location_stocks` by the full location bucket:
  `inventoryItemId + warehouseId + zoneId + slotId + level`.
* Inventory outbound validation now checks the exact selected location bucket instead of a zone-only aggregate.
* Inventory transactions now update location stock whenever any location field is present, including warehouse-only buckets.
* Production material issue transactions now pass `warehouseId`, `zoneId`, `slotId`, and `level` on transaction item lines.
* MO auto-issue planning now preserves production warehouse slot and level from production stock buckets, so issue rows and Inventory transaction items target the same 2D location.
* Project Components delivery/install API calls now use the authenticated shared API client instead of the unauthenticated `shared/http/http-client`.
* Project Components actions now show success/error feedback and invalidate both Projects runtime and Components queries.
* Project Components row navigation now opens the existing Component detail modal on the Components list when a `componentId` route state is provided.

Root causes:

* Production issue paths could create Inventory transaction items without slot/level, so `inventory_items.quantity` changed while the exact `inventory_location_stocks` bucket did not.
* Production stock planning grouped buckets by warehouse/zone only, dropping slot/level selected in the production warehouse 2D location.
* Project delivery used an Axios client without auth interceptors, causing protected `POST /components/:id/deliver` requests to return `401 Unauthorized` from the real UI path.
* Production transfer payloads used top-level `warehouseId = wh-production-steeltrack`; before the fix, the source line for `Kho chính` inherited that value and queried the wrong stock bucket.

Verification:

* Before fix data check for `VAL-MAT-001` remained `inventory_items.quantity = 80` and location stock total `90`, proving existing validation data was already inconsistent.
* Authenticated delivery verification changed `CPL-48937939` from `SHIPPED` to `DELIVERED` via `POST /components/:id/deliver` (`201`).
* Production issue/return smoke test on `VAL-MAT-001` quantity `1` changed item/location `80/50 -> 79/49 -> 80/50`, and created `EXPORT`/`RETURN` transaction item rows with the same warehouse, zone, slot, and level.
* Production transfer smoke test on `VAL-MAT-002` with legacy payload shape changed source line normalization to `wh-main-steeltrack` and completed without insufficient-stock error; reverse transfer restored the checked bucket.
* Runtime integrity APIs still report historical mismatches after the fix because existing bad rows were not backfilled in this bug-fix sprint.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Clean Dataset Plan

Completed:

* Created `docs/ai-state/audits/clean-dataset-plan.md`.
* Classified operational tables that can be cleared to isolate legacy/test data from active workflow defects.
* Classified master/reference tables that should be kept.
* Defined Scenario A clean validation workflow:
  1 material, 1 BOM, 1 MO, 1 reservation, 1 issue, 1 return, 1 consume, 1 component, 1 QC, 1 Yard placement, shipped, delivered, installed.
* Documented expected Inventory and Production balances for every validation step.

Notes:

* No production code changed.
* No database cleanup was executed.
* Existing `scripts/reset-clean-workflow.sql` is not suitable for this exact plan because it clears `projects`, while this plan keeps Projects as master/context data.

## 2026-06-12 System Audit & Hardening Sprint 8

Completed:

* Created `docs/ai-state/audits/system-integrity-audit.md`.
* Audited Inventory reconciliation across `inventory_transactions`, `inventory_transaction_items`, and `inventory_location_stocks`.
* Audited Production material reservation, issue, return, consumption, and ledger data.
* Audited Component lifecycle states `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Audited costing balance rule:
  `issued = returned + consumed + scrap`.
* Audited Project rule that installed components must have `projectId`.
* Added read-only KPI summary APIs:
  `GET /runtime/integrity/inventory-summary`;
  `GET /runtime/integrity/production-summary`;
  `GET /runtime/integrity/project-summary`.

Findings:

* Inventory has 26 transaction-vs-location reconciliation mismatches and 2 `inventory_items.quantity` snapshot mismatches.
* Production has 1 over-issued reservation line, no consumption rows in current live data, and issue rows not fully represented by `ISSUE` ledger rows.
* Component lifecycle has 1 `READY` component without a matching `READY` timeline action.
* Costing balance has 7 rows where issued material remains unallocated to returned/consumed/scrap.
* Project installed-component `projectId` rule has no current violations.

Verification:

* Backend build passed after adding Runtime Integrity APIs.
* Frontend build passed.
* KPI endpoints were verified through an in-memory API smoke test.

## 2026-06-12 Installation Mapping Sprint 7

Completed:

* Added component installation location fields:
  `installZone`, `installAxis`, `installLevel`, `installPosition`.
* Added Prisma migration `20260612110000_component_installation_location`.
* Extended `POST /components/:id/install` payload with required installation location fields.
* Install validation now requires the component to be `DELIVERED` and requires all installation location fields.
* Installation writes the location fields to `components`, sets `installedDate`, and records the full location in the `ComponentTimeline` `INSTALLED` note.
* Project runtime now returns installation location for each project component.
* Projects -> `Cấu kiện công trình` now opens an installation modal when confirming installation and requires:
  Khu vực, Trục, Tầng, Vị trí.
* Project Components table now displays Zone, Axis, Level, and Position columns.
* Component Detail now shows the installation location.

Verification:

* Prisma migration applied successfully.
* Prisma generate passed.
* Backend build passed.
* Frontend build passed.
* In-memory API smoke test verified missing install payload returns `400`, then `SHIPPED -> DELIVERED -> INSTALLED` succeeds with install location stored on the component, returned through `/projects/runtime`, and written to timeline note. Smoke data was cleaned up.

## 2026-06-12 Delivery And Installation Sprint 6

Completed:

* Audited `ComponentStatus` and confirmed `DELIVERED` and `INSTALLED` already exist in Prisma, so no schema migration was required.
* Added lifecycle APIs:
  `POST /components/:id/deliver`;
  `POST /components/:id/install`.
* Added validation:
  `SHIPPED -> DELIVERED`;
  `DELIVERED -> INSTALLED`.
* Delivery and installation APIs update `Component.status`, set `installedDate` on install, write ActivityLog rows, emit component update events, and create `ComponentTimeline` rows with actions `DELIVERED` and `INSTALLED`.
* Updated Project runtime so `SHIPPED` remains "đã xuất bãi", while delivered counts only include `DELIVERED` and `INSTALLED`.
* Added Project runtime component counters:
  `readyComponents`, `shippedComponents`, `deliveredComponents`, and `installedComponents`.
* Added `Xác nhận nhận hàng` and `Xác nhận lắp đặt` actions in Projects -> `Cấu kiện công trình`.

Verification:

* Backend build passed.
* Frontend build passed.
* In-memory API smoke test created a temporary `SHIPPED` component, verified direct install returns `400`, then verified deliver returns `DELIVERED`, install returns `INSTALLED`, timeline contains `DELIVERED` and `INSTALLED`, and `/projects/runtime` exposes the installed component. Smoke data was cleaned up.

## 2026-06-12 Component Costing Sprint 5

Completed:

* Audited Components and Production schema and confirmed components already expose `estimatedCost` and `actualCost`, but no persisted costing breakdown existed.
* Added `ComponentCosting` Prisma model and migration.
* Added costing APIs:
  `GET /components/:id/costing`;
  `POST /components/:id/costing/recalculate`.
* Added costing service that validates a Component has a Production Order and consumption records before recalculation.
* Material costing formula:
  `(ProductionMaterialConsumption.consumedQty + scrapQty) * Inventory average cost`.
* Inventory average cost uses the same inbound transaction basis as Inventory:
  positive inbound transaction value divided by positive inbound quantity.
* Recalculate upserts `ComponentCosting`, updates `Component.estimatedCost` and `Component.actualCost`, and writes an ActivityLog row.
* Added Component detail Costing section with estimated, actual, variance, material, labor, machine, overhead, and MO fields.
* Project Components tab continues to show `Actual Cost` from the component `actualCost` field populated by costing recalculation.

Verification:

* Prisma migration `20260612100000_component_costing` applied successfully.
* Route mapping confirmed:
  `GET /components/:id/costing`;
  `POST /components/:id/costing/recalculate`.
* Smoke costing for component `CPL-98509548` created temporary production consumption, recalculated costing, confirmed Project runtime Actual Cost updated, and cleaned up smoke rows/reset component costs.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Production Consumption Sprint 4

Completed:

* Audited production issue/return workflow and confirmed issued quantities are tracked by `ProductionMaterialIssue` with returned balances and `ISSUE`/`RETURN` material ledger rows.
* Added `ProductionMaterialConsumption` Prisma model and migration.
* Added consumption APIs:
  `GET /production/consumptions`;
  `GET /production/:id/consumptions`;
  `POST /production/:id/consume`.
* Added validation so consumed quantity, scrap quantity, and returned quantity cannot exceed issued material for the same MO/material.
* Added automatic Production Material Ledger `CONSUME` writes when material consumption is posted.
* Added Production Cockpit `Tiêu hao vật tư` route/tab with Issued, Returned, Consumed, Scrap, and Remaining summaries.

Verification:

* Prisma migration `20260612090000_production_material_consumption` applied successfully.
* `GET /production/consumptions` returned an authenticated array response.
* Smoke `POST /production/:id/consume` created a `ProductionMaterialConsumption` row and a matching `CONSUME` ledger row, then smoke rows were cleaned up.
* `pnpm -C apps/backend-api exec prisma generate` passed.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Project Components Tab

Completed:

* Audited Projects UI and confirmed it exposed project lists, progress, materials, and reports but did not expose project-linked components.
* Extended `GET /projects/runtime` with a `components` collection derived from `components.projectId`.
* Added Projects tab `Cấu kiện công trình` next to `Vật tư theo công trình`.
* Added project and component status filters for `ALL`, `STOCK`, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Added summary cards for total components, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Added project component table columns: component code, name, project, status, planned date, installed date, estimated cost, and actual cost.
* Component rows navigate to the existing Components list route because no component detail route is currently active.

Verification:

* Verified `CPL-98509548` appears in `/projects/runtime.components` with project `CT-2026-4166` and status `SHIPPED`.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Yard Outbound Component Status Fix

Completed:

* Audited Yard outbound flow from `YardOperationDialog` to `yardApi.remove`, `YardController.removeItem`, and `YardService.removeItem`.
* Confirmed previous outbound only set `YardItemPlacement.removedAt`, wrote a `REMOVE` yard movement, updated slot occupancy, and logged yard activity.
* Fixed Yard outbound for component placements so removal now also updates the linked Component to `SHIPPED`, clears yard location fields, preserves/infers `projectId`, and writes a `ComponentTimeline` `SHIPPED` entry.
* Updated Yard runtime mutation invalidation to refetch Yard, Components, Projects, and Dashboard queries after outbound.
* Updated Projects runtime metrics so `SHIPPED` and `DELIVERED` components count correctly in completed/delivered project component totals.

Verification:

* Smoke outbound created a project-linked component, placed it in Yard, removed it through `POST /yard/placements/:id/remove`, and verified:
  Component status `SHIPPED`;
  placement `removedAt` set;
  projectId retained;
  one `SHIPPED` component timeline row created;
  project runtime delivered count increased while the smoke component existed.
* Smoke records were removed after verification.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Auth Route Guard Fix

Completed:

* Audited frontend auth flow: LoginPage, Zustand auth store, token storage, Axios interceptor, refresh flow, and active router/provider wiring.
* Verified backend `/auth/login` returns both camelCase and snake_case token fields:
  `accessToken`, `access_token`, `refreshToken`, `refresh_token`.
* Verified `/auth/refresh` expects `{ refreshToken }` and returns rotated access/refresh tokens.
* Fixed active app provider wiring so `AuthProvider` runs inside `QueryClientProvider`.
* Added active `/login` route and route guard so business pages no longer render unauthenticated and fire `/components` or `/production` requests without Bearer tokens.
* Updated LoginPage to persist both access and refresh tokens through the shared auth store and navigate back through React Router instead of forcing a reload.

Verification:

* `GET /components` returned `200` with 6 existing records before smoke creation.
* `GET /production` returned `200`.
* `POST /components` returned `201`.
* Frontend build passed.

## 2026-06-11 Production Execution Sprint 3

Completed:

* Audited Component creation workflow across frontend, API, backend service, repository, and database.
* Verified generic `POST /components` creation works through API smoke testing.
* Fixed the isolated UI login blocker by aligning the login default password with the current seed password `123`.
* Added Production execution component endpoint `POST /production/:id/component`, requiring issued material before creating/marking a component as `READY`.
* Added reservation-linked material issue workflow:
  `POST /production/reservations/:id/issue`.
* Added material return workflow:
  `POST /production/material-issues/:id/return`.
* Extended `ProductionMaterialIssue` with reservation/location/return tracking.
* Issue reduces exact `inventory_location_stocks`; return restores exact location stock.
* Issue and return update reservation line balances and write `ISSUE` / `RETURN` ledger events.
* Added UI actions for issuing from reservation, returning issued material, and creating/marking a component from an MO.
* Added `docs/ai-state/modules/components.md`.

Verification:

* Smoke workflow completed:
  Production Order -> Reservation -> Issue -> Create Component -> Return Excess Material.
* Smoke ledger for the MO contains `RESERVE`, `ISSUE`, and `RETURN`.

Build:

* Backend build passed after service/controller changes.
* Frontend build passed after UI/API changes.

## 2026-06-11 Production Material Ledger Sprint 2

Completed:

* Added Prisma enum `ProductionMaterialLedgerEventType` with `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, `CONSUME`, and `ADJUST`.
* Added Prisma model and migration for `ProductionMaterialLedger`.
* Added ledger read APIs:
  `GET /production/material-ledger`;
  `GET /production/material-ledger/:id`;
  `GET /production/:id/material-ledger`.
* Added automatic ledger writes for reservation create/reserve/release/expire.
* Added `/production/material-ledger` tab with filters for Production Order, Material, Event Type, and Date Range.
* Updated production module, decisions, current state, current modules, and next-phase design docs.

Build:

* `pnpm -C apps/backend-api exec prisma generate`
* `pnpm -C apps/backend-api build`
* `pnpm -C apps/frontend build`

Notes:

* Ledger currently writes reservation lifecycle events. Issue, return, consume, and adjust writers remain future sprint work.

## 2026-06-11 Production Reservation Sprint 1

Completed:

* Added Prisma models and migration for `ProductionMaterialReservation` and `ProductionMaterialReservationLine`.
* Added reservation preview, create, reserve, release, and expire backend APIs.
* Reservation preview validates BOM demand against `Kho vật tư SX` availability minus active reservations.
* Reservation lines persist production warehouse allocation by `warehouseId + zoneId + slotId + level`.
* Added `/production/reservations` frontend tab and MO detail reservation preview/create action.
* Updated production module, decisions, current state, current modules, and next-phase design docs.

Build:

* `pnpm -C apps/backend-api exec prisma generate`
* `pnpm -C apps/backend-api build`
* `pnpm -C apps/frontend build`

Notes:

* Reservation does not move Inventory stock. Material issue from reservation, returns, production ledger, and costing remain future sprint work.

## 2026-06-11 Documentation Cleanup Phase

Completed:

* Merged legacy documentation classified as MERGE into ai-state:
  `AI_CONTEXT.md`, `AI_RULES.md`, `KNOWN_ISSUES.md`, `ROADMAP.md`, `TREE_STRUCTURE.md`,
  `architecture/ARCHITECTURE_FREEZE.md`, `architecture/INVENTORY_TRANSACTION_RULES.md`,
  and `inventory/inventory-phase1-migration-plan.md`.
* Preserved the KEEP event naming standard in ai-state by creating `design/event-naming.md` while leaving `docs/architecture/EVENT_NAMING.md` in place.
* Created new ai-state documents:
  `roadmap.md`;
  `design/repo-structure.md`;
  `design/event-naming.md`;
  `audits/technical-debt-audit.md`;
  `audits/post-cleanup-summary.md`.
* Updated `CODEX_WORKFLOW.md` with merged engineering rules and removed dependency on legacy root AI docs as required reading.
* Updated architecture and inventory decision docs with merged legacy decisions and migration rationale.
* Updated `CURRENT_STATE.md` and `CURRENT_MODULES.md` with documentation cleanup state.
* Created `docs/archive/` and moved ARCHIVE documents:
  `docs/PROJECT_OVERVIEW.md` -> `docs/archive/PROJECT_OVERVIEW.md`;
  `docs/architecture/REFACTOR_MASTER_PLAN.md` -> `docs/archive/REFACTOR_MASTER_PLAN.md`.
* Deleted only documents classified as DELETE:
  `docs/modules/COMPONENTS.md`;
  `docs/modules/INVENTORY.md`;
  `docs/modules/YARD.md`.

Notes:

* Documentation-only task; no application code, database, or schema changes were made.

## 2026-06-11 Documentation Refactor

Completed:

* Normalized `docs/ai-state` structure with `audits/`, `design/`, `modules/`, and `decisions/` directories.
* Moved module docs into the normalized module directory:
  `MODULE_PRODUCTION.md` -> `modules/production.md`;
  `MODULE_QC.md` -> `modules/qc.md`;
  `MODULE_SUPPLIERS.md` -> `modules/suppliers.md`;
  `MODULE_SYSTEM.md` -> `modules/system.md`.
* Created `CURRENT_STATE.md` summarizing Inventory, Production, QC, Yard, Suppliers, Projects, Dashboard, and System by status, architecture, limitations, and current focus.
* Created decision docs:
  `decisions/architecture-decisions.md`;
  `decisions/inventory-decisions.md`;
  `decisions/production-decisions.md`.
* Created missing module docs:
  `modules/yard.md`;
  `modules/projects.md`;
  `modules/dashboard.md`.
* Updated `CODEX_WORKFLOW.md` to require reading `PROJECT_STATUS.md`, `CURRENT_STATE.md`, `NEXT_TASKS.md`, related module docs, using Semble before grep, using Context7 before framework changes, building before completion, and updating ai-state docs after workflow changes.
* Created `audits/documentation-audit.md` with missing, outdated, duplicate, and recommended cleanup notes.

Notes:

* Documentation-only task; no application code, database, or schema changes were made.

## 2026-06-11

Completed:

* Updated Inventory transfer creation:
  transfer source/destination locations are now limited to `Kho chính` and exclude production warehouse locations;
  selecting a material source location now keeps the real `fromZoneId` for the transaction while using the selected `zone/slot/level` row to auto-fill source cell and level;
  destination warehouse selection now suggests and fills the first available destination cell/level;
  removed the old transfer flow diagram panel and replaced it with separate source and destination 2D warehouse location views matching the outbound workflow.
* Fixed a frontend type mismatch in the warehouse location 2D material list by allowing `unitMaster` on generated occupancy rows.
* Improved the Inventory location create/edit modal:
  the parent warehouse selector now clearly shows `Kho chính (MAIN)` and `Kho sản xuất (PRODUCTION)` from real master warehouse data, falls back to warehouse data embedded in zones if the master-data request is empty, and requires a parent warehouse before saving a new location.

Build:

* Frontend build passed.
* Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.

## 2026-06-07

Completed:

* Fixed Production BOM and production material consumption:
  BOM create now validates requested material quantity plus waste against real available `Kho vật tư SX` stock and blocks over-allocation;
  the BOM modal now shows `Cần / Tồn SX` per selected material and displays shortage warnings before submit;
  backend production stock calculation now counts only transaction lines that belong to the production warehouse and uses signed receipt/return quantities instead of counting main-warehouse transfer lines;
  starting a Manufacturing Order now auto-creates `ISSUED` `ProductionMaterialIssue` rows for missing BOM requirements and creates outbound inventory movements from the production warehouse location so production material stock is reduced;
  `/production/:id/requirements` now uses the corrected production-warehouse balance logic;
  Production start now plans material issues before the MO state update and creates issue rows only after the start transition succeeds, avoiding orphaned production material issues if the start action fails.
* Fixed QC quick pass workflow:
  backend QC completion now accepts `READY` inspections in addition to `IN_PROGRESS` and `REWORK_REQUIRED`, so newly created ready inspections can be marked `PASSED` and approved without getting stuck.
* Upgraded System module detail pages to use richer real runtime data:
  Users now shows real user status, assigned roles, latest activity timestamp/action/module from `ActivityLog`, cockpit KPIs, filters, table, and detail panel;
  Roles now shows real roles, user counts, permission counts, and a permission matrix derived from persisted `Permission` records;
  System Logs now shows real `ActivityLog` rows, action/module summaries, activity trend, filters, and a cockpit table.
* Added backend System support endpoints:
  `GET /system/role-matrix`;
  `GET /system/activity-summary`;
  `GET /system/notifications`.
* Rebuilt the main Dashboard/Tổng quan as an Inventory-style dark cockpit backed by `GET /dashboard/cockpit`, aggregating real Projects, Production Orders, Components, Inventory transactions/items, Yard activity, QC open work, Activity Logs, and Notifications.
* Rebuilt the Notifications/Thông báo page to read persisted `notifications` records through `/system/notifications`, with unread/priority/read filters and a selected-notification detail workspace.
* Registered the active `/notifications` route in the main app router.

Modified:

* Dashboard frontend API contract.
* System frontend API contract.
* Users, Roles, System Logs, Dashboard, and Notifications frontend pages.
* Dashboard backend controller.
* System backend controller.

Build:

* Backend build passed.
* Frontend build passed.
* Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.

## 2026-06-06

Completed:

* Removed orphan warehouse-like zones `ST-WH-RAW` and `ST-WH-FAB` from the current database and added migration `20260606093000_remove_orphan_st_wh_zones` so they are not retained as usable or hidden locations.
* Updated the operational sample-data seeder to stop recreating `ST-WH-RAW` and `ST-WH-FAB`.
* Simplified Inventory navigation:
  removed the horizontal in-page Inventory tab strip;
  Inventory tab switching is now handled from the sidebar;
  Inventory actions `Nhập kho`, `Xuất kho`, and `Khác` now render in the global topbar on Inventory routes.
* Added persisted sidebar hide/show behavior to increase available workspace width.
* Aligned the Stock tab free-text search field with the surrounding filters.
* Frontend and backend builds pass.

## 2026-06-03

Completed:

* Completed Inventory Sprint B - Warehouse Locations:
  added Inventory tab `/inventory/locations` labeled `Vị trí kho`;
  extended `WarehouseZone` with `row`, `column`, `level`, and `capacity` fields while preserving `code`, `name`, and `active`;
  added migration `20260605063000_inventory_warehouse_location_fields` and applied it to the local database;
  expanded `GET /inventory/zones` with material count and total stock quantity statistics;
  added `GET /inventory/zones/:id` detail data with stored materials and recent transaction lines;
  added create, edit, activate, deactivate, and soft-delete APIs for warehouse locations;
  added frontend location management workspace with KPI strip, filters, location table, current `warehouse_zones` audit panel, create/edit modal, and detail drawer;
  added sidebar and Inventory tab navigation for `Vị trí kho`;
  preserved the requested boundary: no Redis, caching, performance optimization, or 2D warehouse map UI in this sprint.
* Audited current `warehouse_zones` after the clean workflow reset:
  demo records are `DEMO-WH-FAB` and `DEMO-WH-RAW`;
  warehouse-like records are `ST-WH-FAB` and `ST-WH-RAW`;
  real storage locations are `A01`, `A02`, and `B01`.
* Backend and frontend builds pass after Inventory Sprint B. Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.
* Added Material Master v1 usage classification:
  added Prisma enum `MaterialUsageType` with `PRIMARY`, `SECONDARY`, and `CONSUMABLE`;
  added `InventoryItem.materialUsageType` with default `PRIMARY` and applied migration `20260604214339_add_material_usage_type`;
  updated Inventory item create/update/list/detail/audit flows to persist and return usage type plus clearer zone code/name fields;
  changed the MaterialDrawer `Loại vật tư` field to Vietnamese usage options `Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`;
  renamed the old technical type selector to `Quy cách / nhóm kỹ thuật`;
  added default warehouse zone selection to the MaterialDrawer;
  added `Loại vật tư` columns to Inventory Overview, Stock list, and Stock full-list modal;
  updated the material detail popup to show `Loại vật tư`.
* Reworked the MaterialDrawer create/edit form to match the Inventory inbound modal layout with two-column fields, summary boxes, a business note panel, full-width description, and clearer footer actions.
* Fixed material deletion by adding soft delete:
  added `InventoryItem.deletedAt` and migration `20260604224726_inventory_item_soft_delete`;
  changed Inventory repository delete to mark records deleted instead of hard-deleting rows referenced by transactions/BOM/history;
  active Inventory item queries now hide deleted materials while preserving old operational history.
* Fixed Material Detail supplier tab:
  renamed supplier column `Tổng nhập` to `Đơn giá nhập`;
  changed the displayed value to inbound unit price with average cost fallback.
* Fixed Inventory outbound material location dropdown:
  material detail now falls back to the material default zone when legacy transaction lines have stock but no zone;
  outbound modal now builds selectable source locations from balances and falls back to the material default zone/current stock when no balance rows are returned.
* Replaced secondary frontend static fallback panels with API-backed runtime data:
  Analytics charts now read Inventory transactions, Production orders, and Yard metrics.
  Notifications and Command Center alerts now read Analytics Engine alerts.
  Digital Twin machine map and heatmap now read Production machines and Yard metrics.
  Smart Search now indexes Inventory materials, Components, and Yard slots from APIs.
  Material Movements now reads real Inventory transaction items.
* Removed unused secondary operational/static data files and unused random Yard grid components.
* Cleared the lightweight Inventory Zustand store seed so it no longer injects a fake realtime transaction.
* Removed legacy unprefixed inventory material records `HB200`, `HB250`, `I200`, `PL12`, and `PL20` from the current database after confirming they had no transaction, return, BOM, or production issue references.
* Deleted the dangerous `reset-inventory-phase2-demo.ts` script so it cannot wipe operational inventory history and reseed demo data.
* Replaced active frontend `mock-data` folders for Analytics, Digital Twin, Notifications, and AI Assistant with `operational-data` folders.
* Updated remaining active hardcoded sample identifiers such as `Beam H400`, `CK-220`, and `MC-02` to operational `ST-*` identifiers.
* Replaced backend Simulation `DEMO-*` seed/scenario data with operational SteelTrack `ST-*` data for Inventory, Components, Production, QC, Yard, Projects, Suppliers, workers, cranes, and analytics.
* Ran the operational sample data bootstrap against the current database with reset enabled.
* Verified the current database has zero `DEMO` records in the main Inventory, Components, Production, and Yard tables checked.
* Separated Components production material warehouse UI from main Inventory stock by deriving visible stock from issued Production Material Issue records.
* Added source location selection to the Inventory outbound modal and dedicated Inventory > Outbound tab; outbound transactions now carry the selected `zoneId` and block export quantities that exceed the chosen location balance.
* Linked Inventory outbound transactions tagged `[COMPONENT_PRODUCTION]` into Components > Production Material Stock so "Xuất sản xuất cấu kiện" appears in the production material warehouse view.
* Preserved scroll position and expanded-group state in both runtime sidebars so sidebar clicks no longer jump back to the top.
* Locked project selection when Inventory outbound target is "Xuất sản xuất cấu kiện" so component-production issues cannot be mixed with project outbound.
* Made Inventory > Materials stock rows clickable and mapped audit rows correctly into the material drawer for view/edit.
* Added Components list delete action backed by the existing Components DELETE API.
* Added Components production material stock detail popup and a "return to main warehouse" action tagged `[COMPONENT_PRODUCTION_RETURN]`.
* Changed Production BOM material selection and Production requirements availability to use production-material warehouse stock from `[COMPONENT_PRODUCTION]` transactions instead of main Inventory stock; production material issues now reduce available SX material balance.
* Replaced Components stock and transfer tabs with runtime data from Components and Yard placements/movements so component positions match the Yard.
* Kept the Production "stage to yard" panel visible when all stages are completed, even before the order status query refreshes.
* Split Yard overview into a dashboard-style cockpit instead of reusing the full 2D spatial map tab.
* Added Yard overview panels for spatial preview, zone utilization, component distribution, inbound/outbound queues, recent activity, and overload alerts.
* Removed the reference image background from Yard 2D map, added 2D zoom controls, and changed zone clicks to update side charts instead of opening a popup.
* Added Yard zone edit/delete controls in the 2D zone cards and a guarded backend `DELETE /yard/zones/:id` endpoint that only deletes empty zones.
* Adjusted Yard 3D slot layout to scale dynamically so configured zones/slots fit inside the visible floor.
* Restricted Yard inbound workflow to completed `READY` components that are not already placed in the Yard.
* Added sidebar scroll reset when changing module routes or hash tabs.
* Removed the sidebar route/hash scroll reset after it caused sidebar clicks to jump back to the top.
* Removed the unused frontend inventory mock data file.
* Removed the unused frontend Yard mock slots file.
* Hardened sidebar click behavior again by restoring scroll with layout effect, keeping the app shell height locked to the viewport, and blurring sidebar links on focus/mousedown so the browser does not scroll the active menu item into view.
* Split Inventory > Materials stock row click from edit behavior: clicking a material now opens a read-only material detail popup, while "Sửa" opens the material drawer and "Thêm vật tư mới" stays as the create drawer.
* Added a Components production order popup so clicking a production row shows current status, active stage, dates, and routing stage progress.
* Changed Components stock to derive inventory only from completed production orders that also have a Yard placement; stock rows now show Yard zone/slot, BOM-derived material cost estimate, total amount, and a button that focuses the exact Yard position.
* Added production-material warehouse return form with return time, quantity, and note; material detail popup now shows recent issue/return history tagged with component-production markers.
* Added Yard focus handoff from Components stock into Yard 2D map, with the selected slot highlighted and surrounding placements dimmed.
* Added explicit zone detail popup buttons in Yard 2D zones and stronger selected-zone visual styling.
* Added clickable component detail cards inside the Yard zone detail popup with an "Xuất bãi" action that exports from the known current placement without asking the user to reselect a position.
* Enlarged Yard 3D crane GLB scale so the cranes render closer to zone size.
* Fixed Production-to-Yard staging rules in both Production MO popup and Yard inbound workflow:
  slots now remain selectable when they already contain lower stack levels as long as `currentStackLevel < maxStackLevel`;
  the next stack level is derived automatically instead of manually entered;
  inbound quantity is capped by completed MO quantity minus active Yard placements;
  Yard inbound now stages from completed MOs through the production `stage-to-yard` API instead of creating unlimited direct placements.
* Fixed another sidebar jump source by moving the AppSidebar scroll ref from the header to the actual scrollable menu area and persisting AppSidebar group open state.
* Completed Supplier Phase S1 Supplier Master Cockpit:
  replaced the simple CRUD supplier page with KPI strip, filter bar, main supplier table, right insight panel, and slide-over detail workspace;
  added supplier detail tabs for Overview, Materials, Inbound History, Ratings, and Files;
  added backend supplier cockpit summary/detail endpoints that derive inventory usage, inbound history, material history, and supplier-score ratings without schema changes;
  retained existing Supplier CRUD and `/suppliers` route without adding Procurement, Purchase Order, Contract, or Approval Workflow scope.
* Added two top-level Supplier module tabs matching the requested reference:
  `Danh sách nhà cung cấp` and `Đánh giá nhà cung cấp`;
  added `GET /suppliers/cockpit/evaluations` to connect Supplier Master, SupplierScore, and Inventory usage;
  added evaluation KPI strip, filters, evaluation table, selected supplier score detail panel, score trend, supplier classification, and recent evaluation cards.
* Built Projects/Công trình operational cockpit from real linked data:
  replaced the static Projects card page with five tabs: Tổng quan, Danh sách công trình, Tiến độ công trình, Vật tư theo công trình, and Báo cáo công trình;
  changed `/projects/runtime` from hardcoded project samples to data derived from Project, Component, ProductionOrder, and InventoryTransaction;
  added project KPI strips, filters, main project table, progress views, material-by-project table, report panels, and project detail popup.
* Removed a stray `production.service.ts` code fragment outside any method so backend build can pass.
* Built QC/Chất lượng operational cockpit:
  replaced the active `/qc` page with seven tabs: Tổng quan, Phiếu kiểm tra, Kế hoạch QC, Tiêu chuẩn, Không phù hợp (NCR), Hiệu chuẩn thiết bị, and Báo cáo;
  added `GET /qc/cockpit` to connect QC inspections, checklists, NCR, completed Production Orders, Components, and Projects;
  added QC KPI strip, filters, inspection table, latest inspection detail, production queue waiting for QC, checklist cards, NCR table, calibration placeholders, and report panels;
  added inspection detail and completed-MO popups so QC can create inspections and mark production/component checks as passed or rework-required;
  enforced the Yard staging gate in Production so a completed MO/component can only be staged to Yard after a linked QC inspection is `PASSED` or `APPROVED`;
  removed unused QC stub/static frontend files that could be confused with active data.
* Added operational workflow verification before System Settings work:
  added `GET /runtime/operational-workflow` to verify Supplier inbound, main Inventory stock, Project outbound, Production material outbound/return, BOM/MO, QC gate, Yard staging, Yard outbound, project return, and QC failure readiness from real database records;
  hardened Inventory outbound validation so server-side stock checks can enforce selected `zoneId` location balance, not only total item balance;
  backfilled 9 historical QC release records for active Yard component placements that existed before the QC gate was added, using current Yard placement and completed Production Order history;
  verified the current DB after backfill: supplier inbound 8, inventory items 8, project outbound 5, production outbound 4, production returns 3, BOMs 7, production orders 12, completed orders 10, approved QC 9, active Yard placements 23, removed Yard placements 15, staged components without QC 0.
* Built System cockpit foundation without adding schema duplicates:
  added `GET /system/overview`, `GET /system/users`, `GET /system/roles`, and `GET /system/activity-logs` using existing User, Role, Permission, ActivityLog, Inventory, Supplier, Project, Component, QC, and Yard tables;
  replaced Settings page with tabs matching the requested reference: Tổng quan, Cấu hình chung, Phân quyền, Danh mục, Tích hợp, Thông báo, Sao lưu & Phục hồi, and Nhật ký cấu hình;
  added workflow health panel inside Settings so the material-to-yard operational chain is visible as OK/WARN/BLOCKED;
  replaced Users, Roles, and System Logs pages with API-backed cockpit layouts and added active routes/sidebar entries for `/settings`, `/users`, `/roles`, and `/system-logs`.
* Optimized Inventory/Vật tư kho UI consistency:
  updated shared Inventory module shell, tab bar, KPI cards, section header, and runtime panels to a macOS-style glass surface with tighter typography, lighter shadows, and cleaner spacing;
  added shared Inventory visual components for KPI cards, glass panels, horizontal bar charts, mini bar charts, and consistent inputs;
  rebuilt Inventory > Tồn kho KPI/filter/table/insight panels with the new visual system, added smarter stock distribution, top inventory value, and stock health charts;
  changed the material detail popup to the same glass theme and kept row click as read-only detail while the `Sửa vật tư` action opens the edit form;
  rebuilt the material create/edit drawer in Vietnamese with the same Inventory glass visual language so editing from Tồn kho no longer feels like a different page;
  rebuilt Inventory > Audit with Vietnamese labels, macOS-style table, KPI strip, top value chart, and stock distribution mini chart;
  normalized active secondary Inventory tab panels/tables for Nhập kho, Xuất kho, Điều chuyển, Kiểm kê, Lịch sử giao dịch, and Cảnh báo tồn kho to the same glass surface treatment.
* Completed an additional Inventory dark cockpit cleanup pass:
  removed remaining light-mode/white surfaces from the Inventory module shell, tab bar, material drawer, material detail popup, Inventory > Tồn kho table, "Xem tất cả" modal, and secondary Inventory tabs;
  added a shared donut summary chart for professional stock-health composition and wired it into Inventory > Tồn kho alongside top value, location distribution, and stock rhythm visuals;
  kept add/edit material actions on the same Vietnamese cockpit drawer as the overview so Tồn kho no longer opens a mismatched material form.
* Completed Inventory Foundation Phase A UI consolidation:
  removed the duplicate create-material form and handler from Inventory Overview;
  wired the Overview "Thêm vật tư mới" action to the shared `MaterialDrawer`;
  preserved the no-schema/no-migration boundary for Phase A and did not touch the Supplier module;
  refreshed the app sidebar dark theme and active child-tab styling, including hash-aware active matching for submenu tabs.
* Completed Sprint A.5 Inventory cleanup:
  removed inbound, outbound, transfer, and stock-take modal forms from Inventory Overview;
  removed Overview transaction modal state and submit handlers;
  changed Overview quick actions to navigate to dedicated Inventory transaction pages while keeping MaterialDrawer and material detail in Overview;
  did not modify Inventory transaction pages or backend code.
* Refined Inventory > Tồn kho analytics:
  stock table pagination now defaults to a bottom-left `Hiển thị 1-10/xxx kết quả` label with centered clickable page numbers;
  warehouse/location stock distribution uses a donut chart;
  added a monthly stock movement trend chart from Inventory transactions;
  removed the older stock-health and stock-rhythm charts;
  rewired stock alerts from current stock/minimum stock thresholds;
  added a bottom quick-stat strip for today's inbound, outbound, transfer, current-month stock-take, and stock variance indicators.
* Standardized Inventory tab visuals using the Stock tab as the baseline:
  promoted shared Inventory panel/KPI/insight/pagination/table primitives;
  widened and spaced the Stock table/chart layout so analytics blocks no longer stick together;
  applied the same shell, KPI, filter, table, side-panel, and pagination treatment to Overview, Inbound, Outbound, Transfer, Stock Take, Transactions, Alerts, and Audit tabs;
  reworked the Overview main screen so its KPI strip, stock table, recent inbound/outbound lists, warehouse filter, and buttons match the rest of the Inventory cockpit;
  removed local duplicate KPI/insight helper components from the normalized tabs without changing backend, API, Prisma, or mutation logic.

Modified:

* Analytics chart data sources.
* Notifications and Command Center alert data sources.
* Digital Twin runtime panels.
* AI Assistant smart-search source.
* Material Movements backend service and frontend API client.
* Frontend operational static datasets for Analytics, Digital Twin, Notifications, and AI Assistant.
* Inventory transaction modal placeholder and lightweight runtime store seed.
* Production work-order and work-center static panels.
* Backend material movements static fallback records.
* Simulation operational sample data seeder.
* Simulation scenario runner.
* Simulation module provider wiring.
* Components material stock workspace.
* Components stock, transfer, and list workspaces.
* Production BOM modal and material requirements endpoint.
* Inventory outbound modal and dedicated outbound tab.
* Yard 2D/3D maps, tab workspace, operation dialog, API client, hooks, and backend zone endpoint.
* Application sidebar behavior.

Notes:

* Added `Danh mục / Đơn vị` management to `Hệ thống > Cài đặt`, reusing the same Inventory category/type/unit APIs used by Material Master.
* Settings now supports create/edit/deactivate for material categories, material type/specification groups, and units of measure, with active Material Master usage counters.
* Settings displays fixed material usage groups `PRIMARY`, `SECONDARY`, and `CONSUMABLE` with linked material counts; dynamic custom usage groups would require a later DB phase.
* Frontend build passes after Settings catalog/unit management.
* Applied compact section headers globally through shared `SectionHeader`, removing the large repeated `SteelTrack ERP` eyebrow and reducing module header height across tabs/modules.
* Expanded route-aware topbar titles for Inventory, Components, Production, Yard, Projects, Suppliers, QC, Logistics, Procurement, Documents, Analytics, Reporting, Notifications, Master Data, AI, Settings, Users, Roles, Logs, and Backup.
* Frontend build passes after the global module header density pass.
* Moved app quick search to the right side of the topbar next to `LIVE` and added route-aware compact module titles on the left, including `Kho vật tư`.
* Removed the duplicate large Inventory Overview header and tightened Inventory KPI/panel/table/recent-transaction spacing for a denser one-screen cockpit layout.
* Inventory Overview stock table stays capped at 10 rows and recent inbound/outbound panels stay capped at 5 transactions with smaller typography.
* Frontend build passes after the shell header and Inventory Overview density pass.
* Rebuilt Inventory master-data workspace for material categories, material type/specification groups, and units of measure with create/edit/deactivate actions and Material Master usage counts.
* Added Inventory unit CRUD on `/inventory/units` while keeping existing schema unchanged.
* Standardized steel-structure dictionary data: 8 active categories, 24 active material type/specification groups, and 14 active units; unused demo/duplicate records were deactivated instead of hard-deleted.
* Production BOM material selection now groups production-warehouse materials by `materialUsageType` and auto-derives BOM item category from the selected material.
* Backend and frontend builds pass after Inventory master-data and BOM grouping changes.
* Fixed Inventory location validation mismatch for material `001`: detail showed stock at default zone `B01` by falling back to `InventoryItem.zoneId`, while backend selected-location validation counted only line/header zone and returned zero for legacy no-zone inbound lines.
* Backend `getCurrentStockAtLocation` now counts legacy no-zone lines for the selected material default zone, matching material detail `locationBalances`.
* Inbound modal now auto-selects the selected material default zone so new normal UI inbound transactions persist a real `zoneId`.
* SQL verification for material `001`: total stock `1,567`, effective stock at `B01` `1,567`, previous strict line/header-zone stock `0`.
* Backend and frontend builds pass after the location validation fix.
* Fixed Inventory outbound and transfer modal submit locking by auto-selecting valid stock source/destination zones from material location balances or material default zone fallback.
* Fixed outbound expected issue value display to calculate from material detail average cost with material list fallback.
* Added outbound validation messages for missing source stock location and quantity exceeding selected source-zone stock.
* Frontend build passes after the Inventory outbound/transfer modal fix.
* Added transfer transaction time and moved MaterialDrawer to a portal with a cleaner modal-style layout.
* Fixed Inventory `Khác` action menu clipping by rendering the dropdown through a portal.
* Refined inbound/outbound modal layout and added side tabs to the shared material detail modal.
* Unified Inventory material detail display between Overview and Stock using a shared material detail modal.
* Improved transaction modal controls so primary create buttons and native select dropdowns are clearer in the dark UI.
* Restored Inventory transaction modal workflow for inbound, outbound, transfer, and stock-take actions from the global action bar.
* Dedicated Inventory transaction tabs now serve as history/analytics pages, while existing form and mutation logic lives in reusable modal components.
* Updated Inventory transaction page layout order to Form -> KPI -> Filter -> Table for inbound, outbound, transfer, and stock-take pages.
* Completed Inventory Global Action Bar: shared right-aligned action bar beside Inventory tabs, route-based transaction actions, and `MaterialDrawer` create action.
* Removed duplicate Inventory Overview quick actions and the Stock tab create-material filter button while preserving specialized transaction forms.
* Backend and frontend builds pass after API-backed fallback replacement.
* Remaining `Math.random` usages in active modules are for generated document/reference suffixes or randomized simulation mode, not seeded fake operational records.
* Frontend Inventory, Components, Production, and Yard surfaces now use runtime/API data for the touched workflows.
* Current database verification: zero legacy unprefixed material records for `HB200`, `HB250`, `I200`, `PL12`, `PL20`; zero `DEMO` records in the checked Inventory, Components, Production, and Yard tables.
* Active frontend module scan no longer finds `mock-data` folders under `apps/frontend/src/modules`; remaining `demo.` strings in the Simulation seeder are retained only to clean old legacy records.
* Current operational bootstrap result: 5 inventory materials, 10 inventory transactions, 12 components, 6 production orders, 6 yard zones, 72 yard slots, 2 QC checklists, 4 workers.
* Production material warehouse now includes real `[COMPONENT_PRODUCTION]` outbound transactions, but still needs a backend balance/receipt model if it must behave as a fully independent warehouse instead of an issued-material view.
* Latest verification: `pnpm -C apps/backend-api build` and `pnpm -C apps/frontend build` pass after Inventory UI optimization. Vite still reports the existing NODE_ENV and large chunk warnings.
* Yard runtime UI now fetches zones separately from slots, so zones can render on Yard Overview and the 2D map even before slot cards are populated.
* Added Yard cockpit create-zone and create-slot modals backed by the existing Yard APIs; new slots are immediately available to the production finished-goods staging dropdown when they have stack capacity.
* Moved Yard 2D zoom controls into the top location toolbar and added `+ Zone`, global `+ Slot`, and per-zone `+ Slot` actions to avoid covering the map canvas.
* Fixed the actual `/yard/slots` 500 error caused by missing `yard_item_placements.stagedQuantity` and `remainingQuantity` columns in the database; migration `20260605050000_add_yard_placement_quantities` has been applied.
* Authenticated verification now returns 75 Yard slots and 73 stack-available slots, so production finished-goods staging can select slots again.
* Production staging now surfaces backend errors inline instead of appearing unresponsive; QC gate failures are translated with the required action.
* Fixed Production-to-Yard remaining quantity calculation to count placements by `metadata.productionOrderId`, not by shared `componentId`.
* Verified successful staging for `MO-20260603-11563` into `ST-YARD-07/07-08/L1`; `/yard/slots` now returns the new placement.
* QC cockpit now includes a fast production-gate workflow: completed MOs can use `Tạo QC` or `Tạo & duyệt đạt`; the fast path creates/reuses an inspection, starts it, completes it as `PASSED`, and approves it.
* Verified QC gate end-to-end for `MO-20260605-36058`: QC inspection `QC-20260605-1780639947783` was approved, then Production staged `CPL-33167708` to `ST-YARD-C/ST-C-03/L2`.
* Database was reset for a clean end-to-end workflow test. Backup saved at `backups/steeltrack_before_clean_workflow_20260605_132345.dump`; reusable script added at `scripts/reset-clean-workflow.sql`.
* Operational data is now clean: inventory materials/transactions, returns, projects, components, BOMs, production orders, QC inspections, yard placements/movements, activity logs and outbox events are zeroed. Master dictionaries, suppliers, QC checklists, yard zones and yard slots were preserved; all yard slots are `AVAILABLE`.
* Frontend and backend builds pass after the Yard zone/slot runtime fix.

## 2026-06-02

Completed:

* Added transaction-driven Inventory runtime and operational workspace.
* Added Components operational pages for structure stock, transfers, internal QC, and fabrication history.
* Added Production BOM foundation, routing, Manufacturing Orders, material issues, and production logs.
* Linked Manufacturing Orders to Components.
* Added production execution actions for starting, completing, and staging finished structures to Yard.
* Replaced Yard demo slots with runtime API data and polling-based operational refresh.
* Applied the production foundation Prisma migration.
* Added real Production BOM creation from Components and Production workspaces.
* Removed embedded BOM material drafting from component creation; components now store only structure master data.
* Required Manufacturing Orders to select a BOM belonging to the selected component.
* Generated Manufacturing Order execution stages from the selected BOM routing.
* Added working BOM clone and archive actions in the Production BOM registry.
* Added Yard operational cockpit with realtime KPI strip, operational tabs, slot drill-down, level occupancy, structure details, crane status, and movement feed.
* Added Yard 2D spatial layout from real zone/slot placements.
* Added top-down React Three Fiber Yard viewer using the supplied crane and structure GLB assets.
* Added Yard submenu navigation for overview, 2D, 3D, inbound, outbound, internal transfer, internal QC, and history.
* Added deterministic Yard cockpit demo data with six operational zones, 72 slots, 12 staged structures, two cranes, stacked placements, and movement history.
* Added legacy Yard slot cleanup during simulation bootstrap so repeated demo bootstraps keep spatial metrics stable.
* Added working Yard inbound, outbound, and internal-transfer operator workflows backed by the existing placement APIs.
* Added a shared industrial Yard workflow dialog with component selection, crane coordination, destination slot suggestion, operational summary, and occupancy preview.
* Replaced the flat Yard slot grid with a color-coded zone cockpit over the supplied Yard reference image.
* Added zone drill-down popup with slot occupancy, horizontal stack-level cross-section, and structure detail list.
* Enlarged the Yard 3D digital twin and rendered structures across the active Yard slots with more visible crane assets.
* Verified Yard placement lifecycle with a real `place -> move -> remove` API smoke test and confirmed source and destination occupancy return to zero.

Modified:

* Sidebar navigation for Components and Production workspaces.
* Production frontend routes and operational pages.
* Production backend controllers, services, repositories, DTOs, and Prisma schema.
* Yard runtime frontend integration.
* AI state documentation structure.

Notes:

* Inventory operational foundation is complete.
* Components is approximately 70% complete.
* Production is approximately 65% complete.
* Yard is approximately 60% complete with configured demo zones, working operator workflows, zone drill-down, and enlarged 3D spatial viewer.
