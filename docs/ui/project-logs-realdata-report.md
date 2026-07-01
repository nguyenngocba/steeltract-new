# Project Logs Real Data Report

Date: 2026-07-01

## Data Source

- `activity_logs`

## Runtime

- `GET /projects/runtime` now returns project-related activity log rows.
- Supported sources include Projects module logs and Project/ProjectTask/ReturnRequest entities.

## UI

- Replaced the Logs placeholder with:
  - log KPIs
  - activity timeline
  - action-type analytics
  - source summary
- Project Detail `Nhật ký` tab prefers real ActivityLog rows and falls back to derived WBS/return-request events if no logs exist.

## Remaining Gaps

- ActivityLog coverage depends on each workflow writing events consistently.
- Dedicated log filtering by user/date/action is a later UX enhancement.
