# EPIC 0 Full UI Audit - Projects

## Visible Routes And Requested Tabs

All visible Projects routes render `ProjectsPage.tsx`.

| Requested tab | Current route/file branch | Coverage |
| --- | --- | --- |
| Overview | `/projects` -> `OverviewTab` | Implemented |
| Projects | `/projects/list` | Implemented |
| Progress | `/projects/progress` | Implemented |
| Timeline | Detail drawer/timeline/logs, not route-level tab | Partial |
| Budget | `/projects/costs` | Implemented as costs |
| Templates | `/projects/templates` | Implemented |
| Components | `/projects/components` | Implemented |
| Materials | `/projects/materials` | Implemented |
| Documents/Logs/Reports | `/projects/documents`, `/logs`, `/reports` | Implemented/Partial |

## A. Layout

- Uses `EnterpriseWorkspace` with route tabs.
- Main pages use KPI/filter/table/right rail patterns.
- The module is data-rich but page branches vary in visual density.
- Not yet aligned pixel-for-pixel with Inventory canon.

## B. KPI

- `KpiStrip` exists and is used in overview/list areas.
- PASS for having KPI coverage.
- CONDITIONAL for exact height/padding consistency.

## C. Filter

- `FilterBar` supports query/status/type.
- Several subviews have local filters/pagination.
- PASS functionally; visual parity pending.

## D. Table

- Tables exist for projects, materials, components, progress/WBS, costs, documents/logs.
- Uses `CockpitTableShell`, `CockpitEmptyState`, `DataTablePagination` in branches.
- Pagination exists in several subviews but must be audited per route for consistent footer height and empty rows.

## E. Chart

- Uses `CockpitChartCard`, `CockpitStatusList`, `CockpitRecentList`, project risk/workload/timeline components.
- Some cards are real empty states when attachments/photos/tasks are absent.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Runtime overview/list/progress/materials/components/costs | REAL DATA | `getProjectsRuntime` via `useQuery(['projects-runtime'])` |
| Templates | REAL DATA | `getProjectTemplates` |
| Detail drawer tabs | REAL DATA | `getProjectDetailTab(project.id, tab)` |
| WBS/task actions | REAL DATA commands | `createProjectWbsTask`, `updateProjectWbsTask`, `generateProjectWbs`, etc. |
| Attachments/photos empty states | EMPTY | Await project attachment/photo contract |
| Derived warnings/suggestions | REAL DATA / derived | Project runtime health fields |

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Timeline is not a top-level requested route | P2 | Medium | M | Route/sidebar decision |
| Budget naming differs from route (`costs`) | P3 | Low | S | Label decision |
| Per-branch visual parity is not certified | P1 | High | L | Browser screenshots |
| Some empty states reference future attachment/photo foundation | P2 | Medium | M | Backend read contract |

