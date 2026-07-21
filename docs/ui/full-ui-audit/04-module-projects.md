# EPIC 0 Full UI Audit - Projects

## EPIC 4.0 Completion Update

Status: **P0/P1 SOURCE IMPLEMENTED - FRONTEND BUILD PASS, BROWSER QA PENDING**

Projects now follows the active Inventory/Components/Production workspace
rhythm on the visible route set. The Overview and Projects list tabs put the
project table in the hero workspace with KPI cards first, a right analytics
rail and a full-width lower analytics band. Progress, Components, Materials,
Costs, Documents, Logs and Reports continue to use real `projects/runtime`,
template and detail-tab data through existing APIs.

No backend, route, API, permission, React Query contract, schema or business
workflow changed.

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
- Overview and list now follow the Inventory hero-table composition:
  KPI -> filter -> hero table/right rail -> bottom analytics.
- Detail drawer timeline now renders milestones from real WBS/phase data or a
  standard empty state instead of static milestone labels.
- Pixel-perfect browser certification remains pending.

## B. KPI

- `KpiStrip` is used in Overview, Projects List, Progress, Costs, Documents,
  Logs and Reports coverage paths where route-level KPI context is relevant.
- PASS for source-level KPI coverage and shared cockpit card usage.
- CONDITIONAL for authenticated screenshot parity.

## C. Filter

- `FilterBar` supports query/status/type.
- Several subviews have local filters/pagination.
- PASS functionally; visual parity pending.

## D. Table

- Tables exist for projects, materials, components, progress/WBS, costs,
  documents/logs.
- Uses `CockpitTableShell`, `CockpitEmptyState`, `DataTablePagination` in the
  primary paginated branches.
- Overview and Projects List now keep the project registry as the dominant
  table surface instead of pushing it below analytics.

## E. Chart

- Uses `CockpitChartCard`, `CockpitStatusList`, `CockpitRecentList`, project
  risk/workload/timeline components.
- Cards use real runtime/detail data or standard empty states when
  attachments/photos/tasks are absent.
- Static milestone labels were removed from the active project detail timeline.

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
| Authenticated browser visual certification | P1 | High | M | Browser screenshots |
| Some empty states reference future attachment/photo foundation | P2 | Medium | M | Backend read contract |
