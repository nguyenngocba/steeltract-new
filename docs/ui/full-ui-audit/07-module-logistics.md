# EPIC 0 Full UI Audit - Logistics

Status: **RECONSTRUCTION COMPLETE (EPIC 8.0)**

## Visible Routes And Requested Tabs

All Logistics routes render `LogisticsPage.tsx` with dedicated tab behaviors and visual canon parity.

| Requested tab | Current route/branch | Coverage | Status |
| --- | --- | --- | --- |
| Dashboard / Overview | `/logistics` | Implemented | **CANON PASSED** |
| Deliveries | `/logistics/deliveries` | Implemented | **CANON PASSED** |
| Loading | `/logistics/loading` | Implemented | **CANON PASSED** |
| Dispatch | `/logistics/dispatch` | Implemented | **CANON PASSED** |
| Vehicles | `/logistics/vehicles` | Implemented | **CANON PASSED** |
| Planning | `/logistics/planning` | Implemented | **CANON PASSED** |
| Tracking | `/logistics/tracking`, `/logistics/shipment-tracking` | Implemented | **CANON PASSED** |
| Documents | `/logistics/documents` | Implemented | **CANON PASSED** |
| History / Logs / Reports | `/logistics/history`, `/logistics/logs`, `/logistics/reports` | Implemented | **CANON PASSED** |

## A. Layout

- Uses `EnterpriseWorkspace`.
- Standard rhythm: KPI row + search & filter toolbar + 1fr/360px hero table & right analytics rail.
- 100% SteelTrack UI Canon equal.

## B. KPI

- Four `CockpitKpiCard` cards bound to real dashboard backend counts.
- `loading` and `normal` states supported natively.

## C. Filter

- Integrated search input (Mã điều xe, công trình, xe, tài xế...).
- Added quick filters: Status Filter (`statusFilter`) & Project Filter (`projectFilter`).

## D. Table

- `DispatchTable` & `VehiclesWorkspace` table render with `CockpitTableShell`.
- Integrated `DataTablePagination` with standard page controls and page size options (10, 20, 50).
- Standard `CockpitEmptyState` rendered when no rows match query or filter.

## E. Chart

- Right rail includes Delivery Status (`StatusBars`), Dispatch Trend (`TrendBars`), Vehicle Utilization (`CockpitStatusList`), and Document Event Logs (`CockpitRecentList`).

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Dashboard KPIs/status/trend | REAL DATA | `getDispatchDashboard` via `useQuery(['logistics-dispatch-dashboard'])` |
| Dispatch/tracking/history table | REAL DATA | `getDispatchOrders` |
| Project data in create drawer | REAL DATA | `getProjectsRuntime` |
| Suggestions | REAL DATA | `suggestDispatchItems` |
| Vehicles route | REAL DATA | Aggregated from `dashboard.vehicleUtilization` and `getDispatchOrders` |
| Documents route | REAL DATA | Bound to `events` history and `items` in `getDispatchOrders` |

## G. Resolution Summary

| Gap | Status | Resolution |
| --- | --- | --- |
| `/logistics/vehicles` & `/logistics/planning` workspace | RESOLVED | Built distinct workspace views bound to real backend contracts |
| Standard filters beyond search | RESOLVED | Added Status and Project filters to toolbar |
| Pagination & empty states | RESOLVED | Added `DataTablePagination` and `CockpitEmptyState` |
| Reports / logs / documents routes | RESOLVED | Added dedicated tab handlers and routes in `AppRouter.tsx` |
