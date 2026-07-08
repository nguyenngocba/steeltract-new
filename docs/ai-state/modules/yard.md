# Yard Module

## Scope

Yard covers finished component staging, yard placement, yard movement visibility, outbound/removal workflow, crane tracking, loading/unloading tasks, and yard capacity management.

## Current Status

* **Design**: 100% Completed (Approved Master Blueprint at [yard-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/yard-blueprint.md)).
* **Implementation**: 72% (Cockpit UI and basic integration complete; advanced placement, reservations, crane task queues, and AI optimization remain as next implementation sprints).

## Implemented Features

* Yard cockpit UI follows the Inventory visual baseline.
* Sprint 12B standardizes Yard cockpit page header, KPI strip, filter bar, occupancy analytics, shipment/operation analytics, and trend panels with shared module UI primitives.
* Sprint 12C makes Yard filters sticky and lazy-loads 2D/3D operational maps so the Yard route chunk stays light until map tabs are opened.
* Yard staging is integrated with Production and gated by QC release.
* Yard placements and movements are included in operational workflow checks.
* Yard outbound removal marks linked component placements as `SHIPPED`, preserves/infers `projectId`, and writes component timeline history.
* Dashboard aggregates Yard activity and open workflow state.

## Database Models

The blueprint defines the following data models to be added:

* `YardZone`: Physical partition of the finished component yard.
* `YardSlot`: Specific coordinate coordinate slot in a zone.
* `YardItemPlacement`: Component physical placement details.
* `YardCrane`: Heavy cranes and equipment tracker.
* `YardReservation`: Booking coordinates for components prior to entry/dispatch.
* `YardMovement`: Immutable movement logs of components on the yard.
* `YardLoadUnloadTask`: Detailed crane tasks for loading, unloading, or shifting.

## API Endpoints

Designed endpoints in the blueprint include:

* `POST /yard/reservations` - Create slot reservations
* `POST /yard/placements` - Confirm physical component placements
* `POST /yard/movements` - Move components internally
* `GET /yard/layout-state` - Read layout state (snapshot-first)

## Routes

* Yard cockpit routes are active in the app navigation.

## Remaining Tasks (Phased Sprints)

* **Sprint 1**: Set up Prisma models and `YardRepository`.
* **Sprint 2**: Implement APIs for Placements and Reservations with occupancy gates.
* **Sprint 3**: Implement internal movements and Crane task queue dispatch.
* **Sprint 4**: Build `snapshot.yard.rebuild` background job and register metrics.
* **Sprint 5**: Integrate 2D/3D visual map on the frontend and wire AI smart stacking suggestions.
