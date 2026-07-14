# EPIC160 - Yard UI and Data Audit

## Active Route

`AppRouter` loads `modules/yard/pages/YardPage.tsx` for all Yard routes.
`YardOverviewPage.tsx` contains static KPI values but is orphaned and not routed.
Several older feature/component trees also appear unused by the active page.

## Active Data Findings

| Finding | Severity | Evidence |
| --- | --- | --- |
| 3D demo fallback | FAIL | when runtime slots are empty, `YardOperationalMap3D` renders `DEMO-*` zones, slots and placements |
| Synthetic QC status | FAIL | Yard QC tab marks every fourth placement as waiting using array index |
| Partial movement KPIs | FAIL | frontend receives only 12 movements then labels counts/distributions as operational totals |
| Client aggregation | WARNING | KPIs, movement segments, weight, alerts and trends are calculated in React |
| Search/filter controls | WARNING | main filter bar inputs/buttons are not bound to query state or backend filters |
| Polling | WARNING | five independent queries refetch every five seconds on every Yard route |
| Static orphan page | WARNING | `YardOverviewPage` hardcodes 81%, 48, 35 and 6 but is not active |
| Placeholder backend API | WARNING | orphan controller/service path returns empty arrays for yards/trucks |

## Real Data Areas

The active zone, slot, placement, movement, crane and repository metric payloads
come from real APIs. The movement trend does not fabricate points, but it is
derived from only the latest 12 movements and therefore is not a valid historical
trend.

## Assessment

**UI/Data binding: BLOCKED.** Fake 3D fallback and synthetic QC classification
must be removed in a later approved remediation sprint. EPIC160 makes no UI or
frontend changes.

