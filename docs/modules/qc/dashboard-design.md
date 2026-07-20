# QC Dashboard Design

Date: 2026-07-18

Status: IMPLEMENTED - VISUAL QA PENDING

## Design Intent

QC should read as a command center between Production and Yard. The overview is
not a CRUD index; it should tell the operator what is blocking release and what
needs inspection next.

## Dashboard Sections

- KPI strip: pending, in progress, passed today, failed today, open NCR, MO
  waiting for QC.
- Quality alerts: inspection/NCR/rework and waiting production queue.
- Top inspection queue: short operational list with `Xem tất cả`.
- MO waiting queue: quality gate before Yard.
- Latest inspection: current context and result.
- Status distribution, project summary and NCR summary.
- Trend chart using existing QC trend rows.

## Navigation

- `Xem tất cả` on the inspection queue routes to `/qc/production`.
- `Xem tất cả` on the MO waiting queue routes to `/qc/plan`.
- `Xem tất cả` on latest inspection routes to `/qc/production`.

## No Fake Data

The previous calibration cards were static examples. They were replaced with a
controlled empty state because there is no equipment calibration read contract
available in the active QC API.

