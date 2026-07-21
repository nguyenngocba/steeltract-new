# EPIC 6.0 QC UI Completion Report

Date: 2026-07-21

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

## Scope

QC was brought closer to the SteelTrack UI canon without backend, API,
business-rule, route or schema changes.

Reviewed routes:

- `/qc`
- `/qc/dashboard`
- `/qc/inbound`
- `/qc/production`
- `/qc/final`
- `/qc/ncr`
- `/qc/capa`
- `/qc/logs`
- `/qc/reports`
- legacy branches for `/qc/plan`, `/qc/standards`, `/qc/calibration`

## Implemented

- QC inspection tables now use the shared `CockpitTableShell` and
  `DataTablePagination`.
- QC read-model requests now use page/limit state instead of a fixed
  `limit: 100`.
- Page size options are standardized at 10, 20, 50 and 100 rows.
- Pagination resets to page 1 when the active tab, search, status or page size
  changes.
- The global QC toolbar no longer shows inert `Xuất Excel`, `Báo cáo`, `Tìm
  kiếm` or `Làm mới` buttons.
- KPI cards no longer receive synthetic sparkline/trend arrays. They display
  authoritative runtime metrics only.
- Empty states now use the shared cockpit empty-state presentation and clearly
  state that QC displays backend-backed data only.

## Data Policy

- No fake KPI values were added.
- No fake charts were added.
- No synthetic trends remain in QC KPI cards.
- Calibration remains a controlled empty workspace because there is no
  authoritative calibration read contract.

## Acceptance Notes

| Area | Result |
| --- | --- |
| KPI row | PASS |
| Search/filter toolbar | PASS |
| Hero workspace | PASS |
| Right analytics rail | PASS |
| Bottom analytics | PASS |
| Table pagination | PASS |
| Loading/empty state | PASS |
| Backend/API unchanged | PASS |

## Remaining Work

- Browser screenshot parity is still pending.
- Pending, Passed and Failed remain status-filter workflows instead of
  first-class route tabs until a route/sidebar decision is approved.
- Calibration needs a backend read contract before it can display real data.

