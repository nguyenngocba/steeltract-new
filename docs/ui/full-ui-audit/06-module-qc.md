# EPIC 0 Full UI Audit - QC

## EPIC 6.0 UI Completion Update

Implemented on 2026-07-21.

Status: **P1 SOURCE/BUILD COMPLETE, BROWSER QA PENDING**

- QC inspection workspaces now use `DataTablePagination` with page-size options
  10, 20, 50 and 100.
- QC read-model requests no longer use a fixed `limit: 100`; page and page
  size are tracked by the workspace and reset when filters/tabs change.
- Inspection tables now render through shared cockpit table shell primitives
  with stable empty rows and a shared empty-state presentation.
- Inert toolbar buttons were removed. QC now keeps only actionable controls:
  create inspection, search and status filter.
- KPI cards no longer receive synthetic sparkline arrays; they display real
  runtime metrics only.
- Calibration remains a controlled empty state because no backend read contract
  exists.

## Visible Routes And Requested Tabs

All QC routes render `QcPage.tsx`.

| Requested tab | Current route/branch | Coverage |
| --- | --- | --- |
| Dashboard | `/qc/dashboard`, `/qc` overview | Implemented |
| Pending | Filter/status within inspections and production queue | Partial |
| Passed | Filter/status within inspections | Partial |
| Failed | Filter/status within inspections/NCR | Partial |
| NCR | `/qc/ncr`, `/qc/capa` | Implemented/Partial |
| Statistics | `/qc/reports`, dashboard metrics | Implemented/Partial |
| Production/Inbound/Final | `/qc/production`, `/qc/inbound`, `/qc/final` | Implemented |
| Plan/Standards/Calibration/Logs | Routes exist | Implemented/Empty depending data |

## A. Layout

- Uses `EnterpriseWorkspace`, with `FilterBar` first, then conditional branches.
- Overview has KPI, queue/table, right analytics style.
- Uses module primitives (`modulePanel`, `moduleTableHead`, etc.) rather than Inventory wrappers.
- Needs page-by-page visual parity pass.

## B. KPI

- `KpiStrip`/`Kpi` over `CockpitKpiCard`.
- PASS for KPI presence.
- Exact height/padding/sparkline consistency pending.

## C. Filter

- Global QC filter bar supports search/status.
- PASS functionally.
- Visual parity against Inventory filter panel/toolbar pending.

## D. Table

- Inspection queue and production queue tables/lists exist.
- Inspection tables now use shared `DataTablePagination` and request the active
  page/limit from the QC read model.
- Production queue remains a compact operational rail on overview/full
  inspection pages.

## E. Chart

- Uses `CockpitChartCard`, `CockpitStatusList`, `CockpitRecentList`.
- Calibration has controlled empty state rather than static fake rows.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Workspace inspections/queues/KPIs | REAL DATA | `useQcWorkspace({ page: 1, limit: 100, ... })` |
| Dashboard snapshot/read data | REAL DATA | `useQcDashboard(tab === 'dashboard')` |
| Commands | REAL DATA mutations | `createInspection`, `startInspection`, `completeInspection`, `approveInspection` |
| Calibration | EMPTY | No calibration read contract |
| Plan/standards/NCR/reports | REAL DATA or EMPTY depending runtime arrays | `QcCockpit` runtime fields |

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Add/verify pagination for inspection tables (`limit: 100` currently) | Closed | High | M | QC read model pagination contract |
| Pending/Passed/Failed are not first-class routes | P2 | Medium | M | Sidebar/filter route decision |
| Replace local module table/panel strings with Inventory shared primitives | Closed at table shell/pagination level; browser QA pending | Medium | M |
| Calibration remains empty | P2 | Medium | M/L | Calibration backend/read contract |
