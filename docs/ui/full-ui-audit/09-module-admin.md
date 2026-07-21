# EPIC 0 Full UI Audit - Admin

Status: **STANDARDIZATION COMPLETE (EPIC 10.0)**

## Visible Routes And Requested Tabs

| Requested tab | Current route/file | Coverage | Status |
| --- | --- | --- | --- |
| Dashboard / Settings | `/settings` -> `SettingsPage.tsx` | Implemented | **CANON PASSED** |
| Users | `/users` -> `UsersPage.tsx` | Implemented | **CANON PASSED** |
| Roles | `/roles` -> `RolesPage.tsx` | Implemented | **CANON PASSED** |
| System logs | `/system-logs` -> `SystemLogsWorkspace.tsx` | Implemented | **CANON PASSED** |

## A. Layout

- Uses `EnterpriseWorkspace` across all Admin pages.
- Standard rhythm: KPI row + search & filter toolbar + hero table & right analytics/detail rail.
- 100% SteelTrack UI Canon equal.

## B. KPI

- All Admin pages (`/settings`, `/users`, `/roles`, `/system-logs`) use canonical `CockpitKpiCard`.
- Synthetic sparklines and local `MiniKpi` implementations removed completely.

## C. Filter

- Integrated search input.
- Added quick filters: Status Filter, Role Filter, Module Filter, and Quick Status Chips.
- Added `Xóa lọc` reset button.

## D. Table

- All Admin tables render through `CockpitTableShell`.
- Integrated `DataTablePagination` with standard page controls and page size options (10, 20, 50).
- Standard `CockpitEmptyState` rendered when no rows match query or filter.

## E. Chart

- Right rail includes Company Info, Workflow Checks, Role Matrix, and Module/Action Activity Lists.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Settings overview stats | REAL DATA | `systemApi.overview`, `systemApi.workflow` |
| Master Data | REAL DATA | `useCategories`, `useInventoryItems`, `useMaterialTypes`, `useUnits` |
| Users table/KPI/detail | REAL DATA | `getUsers` via `useQuery(['system-users'])` |
| Roles table/KPI/detail | REAL DATA | `getRoles`, `systemApi.roleMatrix` |
| System Logs | REAL DATA | `systemApi.activityLogs`, `systemApi.activitySummary` |
| Capability Guidance | CONTROLLED EMPTY | Controlled empty states; no fake metrics |

## G. Resolution Summary

| Gap | Status | Resolution |
| --- | --- | --- |
| Users/Roles lack standard pagination | RESOLVED | Added `DataTablePagination` with 10/20/50 page size controls |
| Settings local UI classes | RESOLVED | Replaced with `CockpitKpiCard`, `CockpitTableShell`, and shared module buttons |
| System logs UI harmonization | RESOLVED | Converted to `EnterpriseWorkspace` with 4 KPI cards and `DataTablePagination` |
