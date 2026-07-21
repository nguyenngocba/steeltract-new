# EPIC 0 Full UI Audit - Production

## Visible Routes And Requested Tabs

All Production visible routes point to `ProductionCockpitPage.tsx` through `ProductionPage.tsx`.

| Requested tab | Current route/mode | Coverage |
| --- | --- | --- |
| Overview | `/production` | Implemented |
| Planning | `/production/planning` | Implemented |
| Work Orders | `/production/orders` | Implemented |
| Production Queue | `/production/execution` | Implemented |
| Running | Derived within execution/overview | Partial |
| Completed | Status-filtered rows/summary | Partial |
| Scrap | `/production/incidents` and scrap/material paths | Partial |
| Machines | Machine panels exist in components, no dedicated route in `AppRouter` | Gap |
| BOMs | `/production/boms` | Implemented |
| Reservations/Warehouse/Material paths | `/production/reservations`, `/warehouse`, `/material-ledger`, `/material-issues`, `/consumptions` | Implemented/Partial |

## A. Layout

- Uses `EnterpriseWorkspace`, `ProductionCockpitShared`, `CockpitChartCard`, `CockpitTableShell`, and imported Inventory enterprise primitives.
- Stronger than older modules, but still not source-identical to the Inventory four-page canon.
- Overview/order workspace generally follows KPI/filter/table hero/right rail.
- Many modes share one page with conditional branches; this is efficient but makes parity certification per route harder.

## B. KPI

- KPI cards use `CockpitKpiCard` and imported `EnterpriseKpi`.
- PASS for broad visual language.
- CONDITIONAL for exact canon parity because per-mode KPI row count and spacing varies.

## C. Filter

- Uses search/status filters and deferred query for order workspace.
- PASS functionally.
- CONDITIONAL visually: filter layout should be compared against Inventory Materials for list modes and Inbound/Outbound for transaction/execution modes.

## D. Table

- Uses `CockpitTableShell`, `DataTablePagination`, and `ProductionOrderTable`/branch-specific tables.
- REAL read model for order workspaces: `useProductionCockpitReadModel`.
- Some non-order modes use legacy queries: `useProductionOrders`, `useProductionBoms`, `useProductionIssues`, `useProductionConsumptions`, `useProductionReservations`, `useProductionMaterialLedger`, `useProductionLogs`.
- Need per-mode audit for empty rows, table height, pagination consistency.

## E. Chart

- Uses `CockpitChartCard`, `ProductionDonut`, `ProductionMiniBars`, telemetry panels.
- Good cockpit feel, but exact chart height/body viewport parity needs screenshot pass.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Overview/order KPI/table | REAL DATA | `useProductionCockpitReadModel` |
| BOM workspace | REAL DATA | `useProductionBoms` |
| Execution/material issue/consumption | REAL DATA | `useProductionIssues`, `useProductionConsumptions`, command modals |
| Reservations | REAL DATA | `useProductionReservations`, reservation command hooks |
| Material ledger | REAL DATA | `useProductionMaterialLedger` |
| Logs | REAL DATA | `useProductionLogs` |
| Inventory/material readiness | REAL DATA / derived | `useInventoryItems`, `useInventoryAudit`, `calculateComponentMaterialReadiness` |
| Machine telemetry | REAL DATA or placeholder depending panel wiring | Needs page-level verification |

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| No dedicated Machines route despite requested tab | P1 | Medium | M | Route decision + machine read contract |
| Running/Completed/Scrap are not first-class visible tabs | P2 | Medium | M | Sidebar/route decision |
| Per-mode table heights/pagination not certified against Inventory | P1 | High | L | Browser visual harness |
| Some non-order modes still use legacy query paths | P2 | Medium | M | Query API adoption plan |

