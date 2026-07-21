# QC UI Review

Date: 2026-07-21

Reference canon:

- Inventory Overview
- Inventory Materials
- Inventory Inbound
- Inventory Outbound

## Review Summary

QC now follows the operational workspace rhythm used by the higher-maturity
modules:

1. KPI row.
2. Search/status filter toolbar.
3. Hero inspection table or queue workspace.
4. Right analytics/action rail.
5. Bottom analytics for reports/dashboard branches.

## Page Review

| Route | Status | Notes |
| --- | --- | --- |
| `/qc` | Ready | Overview uses KPI, alerts, inspection queue, right rail and analytics. |
| `/qc/dashboard` | Ready | Dashboard uses snapshot-backed runtime data where available. |
| `/qc/inbound` | Ready | Inspection workspace uses paginated shared table. |
| `/qc/production` | Ready | Inspection workspace uses paginated shared table and production queue rail. |
| `/qc/final` | Ready | Same inspection workspace pattern; no fake data. |
| `/qc/ncr` | Ready | NCR table and summary use real runtime arrays or empty state. |
| `/qc/capa` | Ready | Shares NCR capability until a separate CAPA read model exists. |
| `/qc/logs` | Ready | Reports branch shows real trend/category/project data or empty state. |
| `/qc/reports` | Ready | Uses real runtime report arrays or empty state. |
| `/qc/calibration` | Controlled empty | No backend calibration read contract exists. |

## UI Findings Closed

- Fixed unbounded inspection table rendering.
- Removed inert toolbar buttons.
- Replaced fixed `limit: 100` workspace query with pagination state.
- Removed synthetic KPI trend arrays.
- Applied shared cockpit table shell and pagination.

## Follow-Up

- Capture authenticated browser screenshots for final visual certification.
- Decide whether Pending, Passed and Failed should become first-class routes.
- Define calibration read contract before implementing calibration data UI.

