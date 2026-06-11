# Yard Module

## Scope

Yard covers finished component staging, yard placement, yard movement visibility, outbound/removal workflow, and future shipment staging.

## Current Status

In Progress.

## Implemented Features

* Yard cockpit UI follows the Inventory visual baseline.
* Yard staging is integrated with Production and gated by QC release.
* Yard placements and movements are included in operational workflow checks.
* Dashboard aggregates Yard activity and open workflow state.

## Database Models

Known operational tables include:

* `YardItemPlacement`
* `YardMovement`
* Yard slots/zones from the Yard schema area.

## API Endpoints

Currently documented through existing runtime/workflow integrations:

* `POST /production/:id/stage-to-yard`
* `GET /runtime/operational-workflow`
* `GET /dashboard/cockpit`

## Routes

* Yard cockpit routes are active in the app navigation.

## Remaining Tasks

* Add formal Yard outbound/shipment documents.
* Add shipment staging workflow.
* Add richer crane telemetry.
* Add realtime movement animation.
* Add full yard zone/slot CRUD screens.
* Add formal project-return Yard placement workflow.
