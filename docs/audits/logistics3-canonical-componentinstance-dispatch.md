# LOGISTICS.3 - Canonical Physical Dispatch & Delivery

Date: 2026-08-03

Status: IMPLEMENTED - BUILD PASS, RUNTIME BROWSER SMOKE PENDING

## Audit

Dispatch, delivery and installation were audited across backend service,
repository, command domain and Logistics UI.

Canonical usage found before this sprint:

- `DispatchItem.componentInstanceId` already existed from LOGISTICS.2A.
- `ComponentInstanceState` already included `IN_YARD`, `IN_TRANSIT` and
  `DELIVERED`.
- Yard already persisted physical placement through `YardItemPlacement` with
  `componentInstanceId` and active placement by `removedAt = null`.
- Logistics controller write routes already used `JwtAuthGuard`,
  `PermissionsGuard` and `logistics.write`.

Legacy usage found:

- `POST /logistics/dispatch-orders/suggest` selected from
  `ProjectTask.componentAllocations`, which points to `Component` definitions.
- `POST /logistics/dispatch-orders` accepted `componentId` for component
  dispatch lines.
- Duplicate active dispatch prevention checked `DispatchItem.componentId`.
- `receive()` updated legacy `Component.status = DELIVERED`.
- Shipment command domain used `ShipmentLineInput.componentId`.
- Logistics UI create drawer sent `componentId`, showed component-level
  suggestions and displayed hardcoded/fake logistics analytics.

## Root Cause

LOGISTICS.2A added the physical schema foundation but the active Logistics
write path was still wired to the old component-definition identity. As a
result, Logistics could dispatch an engineering `Component` instead of a
specific manufactured `ComponentInstance`, and delivery completion could mutate
legacy `Component.status`.

## Schema

No Prisma schema change was required.

`DispatchItem.componentInstanceId` and the `ComponentInstanceDispatchItems`
relation already exist. `DispatchItem.componentId` remains nullable for legacy
history/readability only and is not used by new canonical dispatch creation.

## Source Of Truth

New dispatch source:

`ComponentInstance`
-> active `YardItemPlacement(componentInstanceId, removedAt = null)`
-> `DispatchItem.componentInstanceId`
-> `DispatchOrder`
-> delivery state on `ComponentInstance`
-> installation timestamp on `ComponentInstance.installedAt`

Dispatch candidates must be:

- `ComponentInstance.state = IN_YARD`
- active Yard placement exists
- no active dispatch item already references the same `componentInstanceId`

## Read Model

`DispatchOrder` reads now include each item's `componentInstance` with:

- instance number
- component definition
- requirement
- production order
- project
- project task
- active Yard placement and slot/zone/row

The dashboard runtime now exposes real backend-derived:

- dispatch KPI counts
- dispatch status counts
- movement trend
- vehicle utilization
- component instance state counts
- top active projects by physical dispatch rows

No frontend-only fake logistics KPI/chart data remains in the active Logistics
page.

## Backend

Implemented:

- canonical Yard-staged instance suggestion query
- create dispatch validation requiring `componentInstanceId`
- duplicate active dispatch prevention by `componentInstanceId`
- rejection of legacy componentId-only component dispatch
- departure transition: `ComponentInstance.state = IN_TRANSIT`
- delivery receive transition: `ComponentInstance.state = DELIVERED`
- completion transition: `ComponentInstance.installedAt = now`
- removal of Logistics repository methods that supported component-definition
  suggestion, component allocation handoff and `Component.status` mutation
- shipment command domain/persistence now uses `componentInstanceId`

Material dispatch compatibility remains present for historical project issue
logic, but new component dispatch does not use `Component`.

## Frontend

Implemented:

- Logistics API types include `componentInstance` lineage and active Yard
  placement.
- Create dispatch drawer submits `componentInstanceId`.
- Suggested rows show instance number, component, production order and Yard
  location.
- Main tables display physical instance count/first instance/Yard location
  instead of fake customer and line-count wording.
- Detail drawer item rows render physical instance state, production order and
  Yard location.
- Hardcoded fake analytics for delayed delivery, OTD, component status and top
  projects were replaced with backend-derived values or controlled empty
  states.

## Runtime

Runtime browser certification was not executed in this pass. The local
database may have zero active Yard placements, so an authenticated end-to-end
write smoke should use a controlled fixture:

Finished Goods -> Yard stage -> Logistics suggest -> create dispatch -> loading
-> depart -> arrive -> receive -> complete.

## Verified

- Prisma validate: PASS
- Prisma generate: PASS
- Prisma migrate status: PASS
- Targeted Logistics tests: PASS
- Backend build: PASS
- Frontend build: PASS

Final full-suite verification is recorded in the sprint response.

## Remaining Gaps

P1:

- Browser/runtime smoke with a disposable physical fixture.
- If business requires a distinct installed state beyond `installedAt`, run a
  schema/state-machine sprint. This sprint did not modify the frozen
  `ComponentInstanceState` enum.
- Decide whether material project issue belongs in Logistics V1 or should be
  split into a separate outbound/project material flow.
