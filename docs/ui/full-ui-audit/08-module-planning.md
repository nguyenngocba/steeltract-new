# EPIC 0 Full UI Audit - Planning

## Visible Routes And Requested Tabs

Planning files exist, but `AppRouter.tsx` does not register a `/planning` route in the audited router.

| Requested tab | Current route/file | Coverage |
| --- | --- | --- |
| Dashboard | `PlanningWorkspacePage.tsx` / `PlanningWorkspace.tsx` exists | Not visible in router |
| Planning | `PlanningOverview.tsx` exists | Not visible in router |
| Schedule | No visible route found | Gap |

## A. Layout

- Cannot certify as visible module because no route is registered in `AppRouter`.
- Existing planning files should be audited in a separate route activation sprint.

## B. KPI

- Not certified for visible UI.

## C. Filter

- Not certified for visible UI.

## D. Table

- Not certified for visible UI.

## E. Chart

- Not certified for visible UI.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Planning visible module | PLACEHOLDER/GAP | No registered route |
| Existing planning source files | Unknown in current audit | Need focused file-level review |

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Register or intentionally hide Planning route | P1 | High | S/M | Product navigation decision |
| Audit existing PlanningWorkspace once route is active | P1 | Medium | M | Route activation |
| Schedule workspace missing as visible page | P2 | Medium | M/L | Planning schedule read contract |

