# Project Task Smart Suggestion Report

Date: 2026-07-01

## Change

- WBS task create/edit modal now defaults to `Simple Mode`.
- Simple Mode shows only:
  - task name
  - parent task tree select
  - duration days
  - suggested start/finish dates
- Advanced Mode keeps the full PM/Admin fields for dependencies, status, progress, baseline, actual dates, cost, resources, and inspection.

## Smart Suggestions

- Added `Gợi ý ngày` based on selected parent finish date and duration.
- Added `Gợi ý Lắp dựng`, which pre-fills:
  - materials: Bulong M20, Bản mã, Long đền
  - components: Cột, Dầm, Giằng
  - workers: 4 công nhân, 1 kỹ sư
  - machines: 1 cẩu, 1 xe nâng
  - inspection status: pending inspection

## Rule

- Simple Mode does not ask users to enter progress, status, delay, forecast, or cost.
- Simple Mode submits status `PLANNED`, progress `0`, and leaves actual dates empty.

## Remaining Gaps

- Suggestions are still static steel-construction defaults, not yet derived from a template rule table.
- Task-level smart return is still a workflow follow-up.
