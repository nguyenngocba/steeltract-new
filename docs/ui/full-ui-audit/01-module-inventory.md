# EPIC 0 Full UI Audit - Inventory

Reference canon files:
- `InventoryOverviewPage.tsx`
- `InventoryMaterialsPage.tsx`
- `InventoryInboundPage.tsx`
- `InventoryOutboundPage.tsx`

Inventory is the UI canon. This module is audited mainly to identify internal drift and to define the comparison baseline for other modules.

## Visible Routes And Requested Tabs

| Requested tab | Current visible route/file | Coverage |
| --- | --- | --- |
| Overview | `/inventory` -> `InventoryOverviewPage.tsx` | Implemented |
| Materials | `/inventory/materials` -> `InventoryMaterialsPage.tsx` | Implemented |
| Inbound | `/inventory/inbound` -> `InventoryInboundPage.tsx` | Implemented |
| Outbound | `/inventory/outbound` -> `InventoryOutboundPage.tsx` | Implemented |
| Locations | `/inventory/locations` -> `InventoryLocationsPage.tsx` | Implemented |
| Transactions | `/inventory/transactions` -> `InventoryTransactionsPage.tsx` | Implemented |
| Suppliers | Supplier data appears in Inbound/Transactions; supplier module is `/suppliers` | Split ownership |
| Reports | No dedicated `/inventory/reports`; reports are embedded through transactions/overview/analytics surfaces | Gap |

## A. Layout

| Page | Result | Notes |
| --- | --- | --- |
| Overview | PASS | Canon page with KPI-first, filter/action row, dominant table/overview workspace, right/bottom analytic panels. |
| Materials | PASS | Canon list workspace: KPI, filter panel, 9/3 hero grid, dominant table, right rail, quick stats strip. |
| Inbound | PASS | Canon transaction dashboard: KPI, toolbar/filter, 9/3 hero grid, independent 4-card bottom analytics. |
| Outbound | PASS | Mature transaction dashboard consistent with Inbound style and shared pagination patterns. |
| Locations | CONDITIONAL | Uses Inventory visual language, but should be screenshot-compared against Overview/Materials before declaring canon. |
| Transactions | CONDITIONAL | Data-rich page, but table/modal density and report actions should be reviewed against Inbound/Outbound. |
| Returns/Transfer/Stock Take/Adjustments/Alerts/Audit | CONDITIONAL | Functional Inventory pages, not part of current four-page canon. Need a later Inventory internal consistency pass. |

## B. KPI

- Canon KPI height: `!h-[92px] !p-3` via `CockpitKpiCard`/Inventory metric wrappers.
- Overview has older local KPI variant around `h-[108px]`; this is acceptable only because Overview is named canon, but it should be documented as a deliberate variant.
- Materials/Inbound/Outbound use stronger shared KPI rhythm.
- Locations/Transactions/secondary pages need a consistency check for height, icons, trend/sparkline behavior.

## C. Filter

- Materials uses `InventoryPanel rounded-xl` with compact grid controls.
- Inbound/Outbound use `ModuleFilterBar` plus action buttons.
- Transactions uses rich filters with date/supplier/project/type/zone.
- Canon accepts both patterns:
  - List workspace: panel filter.
  - Transaction dashboard: toolbar + filter row.

## D. Table

| Page | Data table | Status |
| --- | --- | --- |
| Overview | Inventory table cards and recent transaction tables | PASS |
| Materials | `InventoryPanel` + `CockpitTableShell` + `InventoryPagination` | PASS |
| Inbound | `InventoryPanel` + fixed `h-[430px]` table viewport + modal pagination | PASS |
| Outbound | Mature transaction table with pagination | PASS |
| Transactions | Real table with detail drawer and attachments | PASS, needs visual parity review |
| Locations | Real map/table workspace | PASS, needs visual parity review |

## E. Chart

- Canon chart primitives:
  - `InventoryChartCard` for compact analytics cards.
  - `CockpitChartCard` for larger metric charts and quick stat strips.
- Materials right rail uses `ChartCard` wrapper over `CockpitChartCard` with explicit body heights.
- Inbound bottom cards use `InventoryChartCard className="p-2"`.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Overview KPIs/tables/charts | REAL DATA / derived client aggregates | `useInventoryOverview`, `useInventoryMaterials`, `useInventoryTransactions`, related inventory hooks |
| Materials table | REAL DATA | `useInventoryMaterials(query)` |
| Materials overview/analytics | REAL DATA / derived client aggregates | `useInventoryOverview(overviewQuery)`, `useZones`, `useCategories` |
| Inbound table/KPI/charts | REAL DATA / derived client aggregates | `useInventoryTransactions({ type: 'INBOUND' })`, `useSuppliers`, `useZones` |
| Outbound table/KPI/charts | REAL DATA / derived client aggregates | `useInventoryTransactions({ type: 'OUTBOUND' })`, `useProjects`, `useZones` |
| Transactions | REAL DATA | `useInventoryTransactions`, `getTransactionDetail`, `getAttachments` |
| Locations | REAL DATA | Inventory location/read-model hooks |
| Empty states | EMPTY | Rendered only when APIs return no rows |
| Supplier references | REAL DATA | `useSuppliers`, transaction supplier fields |

No intentional mock/fake data was found in the canonical four pages.

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Dedicated Inventory Reports route/workspace absent | P2 | Medium | M | Report read-model/API decision |
| Overview local KPI variant differs from `!h-[92px]` canon | P3 | Low | S | Visual decision: preserve or normalize |
| Secondary Inventory pages not certified against four-page canon | P2 | Medium | M | Browser screenshot harness |
| Transaction/Materials still contain client-side derived analytics in places | P2 | Medium | M/L | Confirm ADR011 requirements for dashboard vs workspace |

