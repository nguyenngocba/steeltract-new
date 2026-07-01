# Project Return Workflow Report

Date: 2026-07-01

## Material Return

- Existing Project material return remains wired through the Inventory Return engine.
- UI supports partial return quantity from project material rows.
- Return requests are created with `flowType = SITE_RETURN`, project context, material, unit, zone, quantity, and remarks.
- Runtime refresh invalidates Projects, Inventory returns, and Inventory audit data after creation.

## Component Return

- Added a Projects API action for returning a project component:
  - `POST /projects/:id/components/:componentId/return`
- The action validates component ownership by `projectId`.
- Allowed source statuses: `SHIPPED`, `DELIVERED`, `INSTALLED`.
- Return result:
  - clears `component.projectId`
  - sets component status back to `READY`
  - clears install mapping fields
  - writes `ComponentTimeline` action `RETURNED_TO_YARD`
  - writes `ActivityLog` action `PROJECT_COMPONENT_RETURNED`

## UI

- Project Detail `Cấu kiện` tab now has per-row `Trả` action.
- Component return confirmation dialog captures reason and refreshes Projects, Components, and Yard runtime queries.

## Remaining Gaps

- Material return final stock posting still depends on the existing Inventory Return receive/inspect/dispose workflow.
- Component return does not yet create a dedicated Yard placement/disposition workflow record.
