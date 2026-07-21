# EPIC 4.0 Projects UI Completion Report

Status: **Implemented - Source/Build Pass, Browser QA Pending**

## Scope Completed

- Projects Overview now follows the Inventory canon: KPI row, global filter,
  hero project table, right analytics rail and bottom analytics band.
- Projects List now has KPI context, hero table, right rail and lower analytics
  instead of a table-only workspace.
- Active project detail timeline now renders milestones from real WBS/phase
  data. If WBS data is unavailable, it shows the standard no-data state.
- Existing Projects tabs continue to use existing backend contracts:
  `/projects/runtime`, `/projects/templates` and project detail-tab reads.

## Visible Tabs Reviewed

- `/projects`
- `/projects/list`
- `/projects/templates`
- `/projects/progress`
- `/projects/components`
- `/projects/materials`
- `/projects/costs`
- `/projects/documents`
- `/projects/logs`
- `/projects/reports`

Timeline, Resources and Milestones are not first-class visible routes in the
current router. Timeline remains available inside the project detail drawer.
No new routes were invented in this UI-only sprint.

## Data Policy

- No backend API was added.
- No fake KPI/chart values were introduced.
- Charts and summary widgets use existing runtime/detail data.
- Missing attachment/photo/WBS data renders standard empty states.

## Known Limitations

- Authenticated browser screenshot parity is still pending.
- Legacy unused Projects components still contain sample names but are not
  imported by active Projects routes. Clean them in a separate dead-code pass if
  the source tree must be zero-mock-string.

## Verification

- `pnpm -C apps/frontend build`: PASS.
- Backend build and `git diff --check` are part of the final EPIC 4.0 gate.
