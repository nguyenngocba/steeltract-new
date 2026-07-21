# EPIC 0 Full UI Audit - Components

Reference canon:
- Inventory Overview, Materials, Inbound, Outbound.

Recent status: Components Overview/List were structurally and source-level visually aligned to Inventory references, but screenshot certification is still pending.

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
| Production/BOM | CONDITIONAL | Uses `ComponentsWorkspace`; less visually certified than Overview/List. |
| Stock/Material Stock | CONDITIONAL | Needs parity pass for table-as-hero and right rail fullness. |
| Transfers | CONDITIONAL | Smaller table workspace; needs Inventory transaction page comparison. |
| QC | CONDITIONAL | Has business cockpit language, but not certified against Inventory four-page canon. |
| History/Reports | CONDITIONAL | Needs full screenshot pass and empty-state/data-source certification. |

## B. KPI

- Overview uses six `CockpitKpiCard` cards at `!h-[92px] !p-3`: PASS.
- List uses five `InventoryMetricCard` wrappers at `!h-[92px] !p-3`: PASS.
- Other Components tabs need explicit KPI height audit.

## C. Filter

- Overview/List filters use `InventoryPanel rounded-xl` and compact grid sizing: PASS.
- Other tabs may still use `ComponentsWorkspace` and local filter patterns: CONDITIONAL.

## D. Table

| Page | Table state |
| --- | --- |
| Overview | PASS: hero table width/height now aligned to Inbound source path. |
| List | PASS: `InventoryPanel`, `CockpitTableShell`, `InventoryPagination`, `text-sm`, empty rows. |
| Production/BOM | Partial: BOM/modal interactions exist, but table parity not certified. |
| QC/History/Reports | Partial: need route-level table audit and pagination/empty-row review. |

## E. Chart

- Overview right rail/bottom analytics now use `InventoryChartCard className="p-2"` like Inbound.
- List right rail uses `ChartCard` helper equivalent to Materials with `value/delta/chartHeightClass`.
- Non-overview/list tabs need chart primitive standardization review.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Overview workspace table/filters | REAL DATA | `useComponentsOverview` |
| Overview dashboard KPIs/charts | REAL DATA / derived client aggregates | `useComponentsDashboard`, overview rows |
| List table | REAL DATA | `useComponentsWorkspace`, `useComponents` |
| List modals/BOM/production actions | REAL DATA / command-capable | `useProductionOrders`, `useComponentProductionBoms`, component mutations |
| Production/BOM tab | REAL DATA where API connected | `useComponentProductionBoms`, `useProductionOrders` |
| QC tab | REAL DATA / derived from component rows | Components read/query hooks |
| Reports/Usage | REAL DATA where read model exists; otherwise EMPTY | Components hooks |
| Ready Queue | REAL DATA derived from component status/location fields | `useComponentsOverview` rows |

No backend/API changes were made during this audit.

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Overview/List need real browser screenshot certification | P0 | High | S | Browser harness |
| BOM lacks dedicated Inventory-canon workspace route | P1 | Medium | M | Components BOM read model/UI decision |
| Ready Queue is embedded only, no full route | P2 | Medium | M | Route/API decision |
| Secondary Components tabs need full parity pass | P1 | Medium | L | Inventory canon checklist |
| Some analytics are derived client-side from read data | P2 | Medium | M | Read-model/dashboard contract |

