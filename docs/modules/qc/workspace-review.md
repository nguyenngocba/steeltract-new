# QC Workspace Review

Date: 2026-07-18

Status: IMPLEMENTED - VISUAL QA PENDING

## Scope

EPIC QC001 reviewed the active QC workspace as an Enterprise Quality Command
Center. The implementation stays frontend-only and uses the existing QC
workspace data contract.

## Inventory Golden UX Applied

- KPI-first layout for the five-second management scan.
- Quality alert band before the primary table.
- Dashboard tables show Top N rows only.
- `Xem tất cả` navigation is available where a full workspace exists.
- Primary inspection list remains the operator anchor.
- Supporting panels are used for queue, activity, distribution and NCR context.
- Drawers/dialogs preserve workspace context instead of forcing page exits.

## Current QC Workspace Shape

The active `/qc` overview now follows this hierarchy:

1. Application toolbar from `EnterpriseWorkspace`.
2. KPI section.
3. Quality alerts from existing inspection and production queue rows.
4. Top inspection queue with `Xem tất cả`.
5. Right-side decision support: MO queue and latest inspection.
6. Status/project/NCR summaries.
7. QC trend.

## Data Boundary

No backend endpoint, API adapter, DTO, route, permission or business rule was
changed. The workspace consumes existing `useQcWorkspace` and `useQcDashboard`
data only.

## Limitations

- Calibration has no authoritative backend contract in the current QC API, so
  the page now shows a truthful empty state instead of static equipment cards.
- Visual certification still requires authenticated browser screenshots.

