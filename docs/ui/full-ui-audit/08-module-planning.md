# EPIC 0 Full UI Audit - Planning

Status: **RECONSTRUCTION COMPLETE (EPIC 9.0)**

## Visible Routes And Requested Tabs

Planning routes are fully registered in `AppRouter.tsx` and accessible via top-level sidebar navigation.

| Requested tab | Current route/file | Coverage | Status |
| --- | --- | --- | --- |
| Dashboard / Overview | `/planning`, `/planning/overview` | Implemented | **CANON PASSED** |
| Master Planning | `/planning/master` | Implemented | **CANON PASSED** |
| Production Planning | `/planning/production` | Implemented | **CANON PASSED** |
| Capacity Planning | `/planning/capacity` | Implemented | **CANON PASSED** |
| Material Planning / MRP | `/planning/material` | Implemented | **CANON PASSED** |
| Procurement Planning | `/planning/procurement` | Implemented | **CANON PASSED** |
| Schedule | `/planning/schedule` | Implemented | **CANON PASSED** |
| Calendar | `/planning/calendar` | Implemented | **CANON PASSED** |
| Constraints | `/planning/constraints` | Implemented | **CANON PASSED** |
| Reports | `/planning/reports` | Implemented | **CANON PASSED** |

## A. Layout

- Uses `EnterpriseWorkspace`.
- Standard rhythm: KPI row + search & filter toolbar + 1fr/360px hero table & right analytics rail.
- 100% SteelTrack UI Canon equal.

## B. KPI

- Four `CockpitKpiCard` cards bound to real production, project, material, and logistics data.
- `loading` and `normal` states supported natively.

## C. Filter

- Integrated search input (Mã kế hoạch, hạng mục, công trình...).
- Added quick filters: Status Filter (`statusFilter`), Project Filter (`projectFilter`), and Quick Status Chips.

## D. Table

- `PlanningTable` renders with `CockpitTableShell`.
- Integrated `DataTablePagination` with standard page controls and page size options (10, 20, 50).
- Standard `CockpitEmptyState` rendered when no rows match query or filter.

## E. Chart

- Right rail includes Category breakdown (`PlanningCategoryBars`), Blockers list (`Blockers Rail`), and recent progress status (`CockpitStatusList`).

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Production Plans | REAL DATA | `productionApi.orders()` |
| Project Master Plans | REAL DATA | `getProjectsRuntime` |
| Material MRP Demand | REAL DATA | `getInventoryItems` (Calculated shortage against minQuantity) |
| Logistics Schedule | REAL DATA | `getDispatchOrders` |

## G. Resolution Summary

| Gap | Status | Resolution |
| --- | --- | --- |
| Register Planning route in AppRouter | RESOLVED | Registered `/planning` and sub-routes in `AppRouter.tsx` and `navigation.config.ts` |
| Build Planning workspace UI Canon | RESOLVED | Reconstructed `PlanningPage.tsx` using shared cockpit/module primitives |
| Material MRP & Constraint views | RESOLVED | Bound to real inventory shortage & blocked production orders |
