# EPIC 0 Full UI Audit - QC

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
- No explicit page-size/pagination certification found; `/qc` fetches `limit: 100`.
- Potential issue: large dataset could render too many rows unless branch-level table paging exists.

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
| Add/verify pagination for inspection tables (`limit: 100` currently) | P1 | High | M | QC read model pagination contract |
| Pending/Passed/Failed are not first-class routes | P2 | Medium | M | Sidebar/filter route decision |
| Replace local module table/panel strings with Inventory shared primitives | P1 | Medium | M |
| Calibration remains empty | P2 | Medium | M/L | Calibration backend/read contract |

