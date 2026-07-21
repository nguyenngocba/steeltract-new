# EPIC 0 Full UI Audit - Production

## EPIC 3.2 Workspace Finalization Update

Implemented on 2026-07-21.

Status: **SOURCE/BUILD FINALIZED, BROWSER QA PENDING**

- Production was re-reviewed after EPIC 3 and EPIC 3.1 for operator clarity
  across Dashboard, Planning, Work Orders, Queue, Machines, Consumptions,
  Warehouse, Reservations, Ledger, Issues, Incidents, Logs and Reports.
- No additional source changes were required in this finalization pass because
  the active P0/P1 items were already closed at source/build level: queue table
  hero, pagination, empty rows, right analytics rails, machine route visibility
  and removal of synthetic KPI/chart data.
- Running, Completed and Scrap remain P2 route/model decisions rather than UI
  blockers because current Production exposes them through status filters and
  derived operational views.
- Browser screenshot parity remains pending.

## EPIC 3.1 UI Polish Update

Implemented on 2026-07-21.

Status: **UI POLISH SOURCE + BUILD COMPLETE, BROWSER QA PENDING**

- Production toolbar now removes inert filter buttons and uses working quick
  status filters for All, In Progress, Completed and Delayed states.
- Production Queue now has an Inventory-style table hero with pagination,
  stable empty rows and a right analytics rail before the kanban lanes.
- Production Queue keeps the kanban board as an operational bottom workspace
  rather than the only primary surface.
- Consumptions right rail now uses cockpit chart cards with equal heights,
  consumption rules, real distribution and balance panels.
- Incidents right rail now has three filled analytics cards: delayed orders,
  warning logs and total alert coverage.
- No backend, API, React Query contract, schema, permission or business logic
  changed.

Verification:

- `pnpm -C apps/frontend build`: PASS.
- `pnpm -C apps/backend-api build`: PASS.
- Browser screenshot parity remains pending because no approved authenticated
  browser harness is available in the workspace.

## EPIC 3 Completion Update

Implemented on 2026-07-21.

Status: **P0/P1 SOURCE + BUILD COMPLETE, BROWSER QA PENDING**

- Production now exposes a route-visible Machines workspace at
  `/production/machines` using the existing authenticated
  `/production/machines` endpoint and the shared Production/Inventory cockpit
  primitives.
- Production KPI cards no longer render synthetic sparkline arrays. Where the
  backend does not provide true historical trend data, the KPI renders the real
  current value without fabricated history.
- Production loading/error chart placeholders no longer use fake donut
  segments. Empty/loading states now explain that charts require real read-model
  data.
- Reports material-flow bars and Overview stage bars now render only when real
  values exist; otherwise they show the standard no-data state.
- Consumption and Incidents workspaces now render only the current page and use
  `DataTablePagination`.
- BOM, Warehouse, Issues, Reservations, Material Ledger and Logs tables now keep
  stable empty rows so low-data pages preserve the Inventory table-hero
  footprint.
- The unused legacy `ProductionTelemetry` component no longer contains
  hardcoded sample metrics.

Verification:

- `pnpm -C apps/frontend build`: PASS.
- `pnpm -C apps/backend-api build`: PASS.
- Browser screenshot parity remains pending because no approved authenticated
  browser harness is available in the workspace.

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
| Machines | `/production/machines` | Implemented |
| BOMs | `/production/boms` | Implemented |
| Reservations/Warehouse/Material paths | `/production/reservations`, `/warehouse`, `/material-ledger`, `/material-issues`, `/consumptions` | Implemented/Partial |

## A. Layout

- Uses `EnterpriseWorkspace`, `ProductionCockpitShared`, `CockpitChartCard`, `CockpitTableShell`, and imported Inventory enterprise primitives.
- Stronger than older modules and now consistently table-hero first for
  Overview, Orders, Planning, Execution, Machines and material-control tabs.
- Overview/order/execution workspace generally follows KPI/filter/table hero/right rail.
- Many modes share one page with conditional branches; this is efficient but makes parity certification per route harder.

## B. KPI

- KPI cards use `CockpitKpiCard` and imported `EnterpriseKpi`.
- PASS for broad visual language.
- CONDITIONAL for exact canon parity because per-mode KPI row count and spacing varies.

## C. Filter

- Uses search/status filters and deferred query for order workspace.
- Inert workspace filter buttons were removed; the active toolbar now exposes
  working quick status filters plus create actions.
- PASS functionally.
- CONDITIONAL visually: filter layout should be compared against Inventory Materials for list modes and Inbound/Outbound for transaction/execution modes.

## D. Table

- Uses `CockpitTableShell`, `DataTablePagination`, and branch-specific
  table-hero surfaces.
- REAL read model for order workspaces: `useProductionCockpitReadModel`.
- Execution Queue now has a paginated table hero before its kanban board.
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
| Machine telemetry | REAL DATA / EMPTY | `useProductionMachines`; empty state when no machine rows exist |

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| No dedicated Machines route despite requested tab | Closed | Medium | M | Existing machine read contract |
| Running/Completed/Scrap are not first-class visible tabs | P2 | Medium | M | Sidebar/route decision |
| Per-mode table heights/pagination not certified against Inventory | Closed at source/build; browser QA pending | High | L | Browser visual harness |
| Some non-order modes still use legacy query paths | P2 | Medium | M | Query API adoption plan |
