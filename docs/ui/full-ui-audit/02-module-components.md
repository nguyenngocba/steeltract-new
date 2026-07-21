# EPIC 0 Full UI Audit - Components

Reference canon:
- Inventory Overview, Materials, Inbound, Outbound.

Recent status: Components Overview/List were structurally and source-level visually aligned to Inventory references. EPIC 2 also remediated the secondary Components tabs at source/build level: Production/BOM, Stock, Material Stock, Transfers, QC, History and Reports now use Inventory-canon workspace primitives for primary panels, charts and pagination. Screenshot certification is still pending.

## Visible Routes And Requested Tabs

| Requested tab | Current visible route/file | Coverage |
| --- | --- | --- |
| Overview | `/components` -> `ComponentsOverviewPage.tsx` | Implemented |
| Components | `/components/list` -> `ComponentsListPage.tsx` | Implemented |
| BOM | `/components/production` and BOM modal paths in `ComponentsListPage` | Partial |
| QC | `/components/qc` -> `ComponentsInternalQcPage.tsx` | Implemented |
| Ready Queue | Embedded in `ComponentsOverviewPage` bottom analytics | Partial, no dedicated route |
| History | `/components/history` -> `ComponentsHistoryPage.tsx` | Implemented |
| Usage | `/components/reports`, `/components/material-stock`, `/components/stock` | Partial |
| Transfers | `/components/transfers` | Implemented |

## A. Layout

| Page | Result | Notes |
| --- | --- | --- |
| Overview | PASS by source-level comparison | Now mirrors Inbound: KPI, filter panel, 9/3 hero grid, right rail, independent 4-card bottom analytics. |
| Components/List | PASS by source-level comparison | Now mirrors Materials: KPI, filter panel, 9/3 table hero, right rail, quick stats strip. |
| Production/BOM | PASS by source/build check | Uses `EnterpriseModulePage`, Inventory filter panel, table hero, right rail and `InventoryPagination`. |
| Stock/Material Stock | PASS by source/build check | Table-as-hero, right rail and pagination now use Inventory primitives. |
| Transfers | PASS by source/build check | Movement table uses Inventory hero surface and `InventoryPagination`; no demo transfer data. |
| QC | PASS with data limitation | Uses Inventory primitives and real component lifecycle data; authoritative QC result contract remains a future backend decision. |
| History/Reports | PASS by source/build check | History uses read-model search/action pagination; Reports no longer fabricates chart values. |

## B. KPI

- Overview uses six `CockpitKpiCard` cards at `!h-[92px] !p-3`: PASS.
- List uses five `InventoryMetricCard` wrappers at `!h-[92px] !p-3`: PASS.
- Secondary Components tabs use `CockpitKpiCard` with the Inventory `!h-[92px] !p-3` density.

## C. Filter

- Overview/List filters use `InventoryPanel rounded-xl` and compact grid sizing: PASS.
- Secondary tabs now use Inventory-canon filter panels. Non-functional History dropdown/date filters were removed.

## D. Table

| Page | Table state |
| --- | --- |
| Overview | PASS: hero table width/height now aligned to Inbound source path. |
| List | PASS: `InventoryPanel`, `CockpitTableShell`, `InventoryPagination`, `text-sm`, empty rows. |
| Production/BOM | PASS: Inventory table hero and pagination wrapper. |
| QC/History/Reports | PASS: QC and History have Inventory table/pagination; Reports is analytics-first with truthful empty states. |

## E. Chart

- Overview right rail/bottom analytics now use `InventoryChartCard className="p-2"` like Inbound.
- List right rail uses `ChartCard` helper equivalent to Materials with `value/delta/chartHeightClass`.
- Secondary tabs use `InventoryChartCard` for right rail and analytics cards.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Overview workspace table/filters | REAL DATA | `useComponentsOverview` |
| Overview dashboard KPIs/charts | REAL DATA | `useComponentsOverview`, `useComponentsDashboard` fallback |
| List table | REAL DATA | `useComponentsWorkspace`, `useComponents` |
| List modals/BOM/production actions | REAL DATA / command-capable | `useProductionOrders`, `useComponentProductionBoms`, component mutations |
| Production/BOM tab | REAL DATA | `useProductionOrders`; BOM modal continues to use existing BOM hooks |
| QC tab | REAL DATA / lifecycle-derived | `useComponents`; authoritative QC Components contract not present |
| Reports/Usage | REAL DATA or EMPTY | `useComponentsDashboard`, `useComponentsOverview`, `useComponentsHistory` |
| Ready Queue | REAL DATA derived from component status/location fields | `useComponentsOverview` rows |

No backend/API changes were made during this audit.

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Overview/List need real browser screenshot certification | P0 | High | S | Browser harness |
| BOM lacks dedicated Inventory-canon workspace route | P2 | Medium | M | Components BOM read model/UI decision |
| Ready Queue is embedded only, no full route | P2 | Medium | M | Route/API decision |
| Secondary Components tabs need full browser parity pass | P1 | Medium | S | Browser harness |
| Some analytics are derived client-side from read data | P2 | Medium | M | Read-model/dashboard contract |
