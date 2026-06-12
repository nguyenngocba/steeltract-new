# Production Module

## Scope

Production covers BOM, Manufacturing Orders, routing stages, production logs, production material issues, QC gate handoff, and Yard staging for finished components.

## Implemented Features

* Production BOM CRUD, clone, archive, and linked routing steps.
* BOM material selection from `Kho vật tư SX`.
* BOM creation validates real production-warehouse stock and blocks over-allocation.
* Manufacturing Order creation from Component + BOM.
* Manufacturing Order start, stage completion, and completed-component readiness.
* MO start auto-issues missing BOM material quantities from production warehouse stock.
* Auto-issued materials create `ProductionMaterialIssue` rows with status `ISSUED`.
* Auto-issued materials create outbound Inventory movements so `Kho vật tư SX` stock is reduced.
* MO start plans required material issues before changing status and creates issue rows only after the start transition succeeds.
* Material requirements endpoint shows required, available SX, issued, and shortage quantities.
* Formal Production Material Reservation documents are implemented for Sprint 1.
* Reservation preview validates BOM demand against production warehouse stock minus active reservations.
* Reservation lines allocate by production warehouse location bucket: `warehouseId + zoneId + slotId + level`.
* Reservation create/reserve/release/expire APIs are available and do not move Inventory stock.
* Production Material Ledger Sprint 2 is implemented for reservation lifecycle events.
* Ledger rows record `RESERVE` and `RELEASE` events from reservation create/reserve/release/expire, with production order, reservation, material, location, quantity, event date, remark, and actor.
* Material Issue from Reservation Sprint 3 is implemented. Issue can only consume reserved quantities and reduces `inventory_location_stocks`.
* Material Return Sprint 3 is implemented for returning issued material back to the same production warehouse location.
* Ledger now records `ISSUE` and `RETURN` events from production issue/return workflows.
* Production Consumption Sprint 4 is implemented for recording actual consumed and scrap quantities per MO/material.
* Ledger now records `CONSUME` events from production consumption posting.
* Component Costing Sprint 5 calculates actual material cost from production consumption and Inventory average cost.
* Production execution can create/mark a component from an MO only after material has been issued.
* Production UI includes `/production/reservations` and MO detail reservation preview/create action.
* Production UI includes `/production/material-ledger` with filters for Production Order, Material, Event Type, and Date Range.
* Production UI includes `/production/consumptions` with Issued, Returned, Consumed, Scrap, and Remaining summaries.
* Production-to-Yard staging is gated by linked QC inspection status `PASSED` or `APPROVED`.

## Database Models

* `BOM`
* `BOMItem`
* `BOMRoutingStep`
* `ProductionOrder`
* `ProductionStage`
* `ProductionTask`
* `ProductionSchedule`
* `ProductionLog`
* `ProductionMaterialIssue`
* `ProductionMaterialReservation`
* `ProductionMaterialReservationLine`
* `ProductionMaterialLedger`
* `ProductionMaterialConsumption`
* `ComponentCosting`

## API Endpoints

* `GET /production`
* `POST /production`
* `GET /production/:id`
* `PATCH /production/:id`
* `POST /production/:id/start`
* `POST /production/stages/:id/complete`
* `POST /production/:id/stage-to-yard`
* `GET /production/:id/requirements`
* `GET /production/boms`
* `POST /production/boms`
* `GET /production/boms/:id`
* `PATCH /production/boms/:id`
* `POST /production/boms/:id/clone`
* `POST /production/boms/:id/archive`
* `GET /production/material-issues`
* `POST /production/material-issues`
* `PATCH /production/material-issues/:id`
* `POST /production/material-issues/:id/return`
* `GET /production/reservations`
* `GET /production/reservations/:id`
* `GET /production/:id/reservation-preview`
* `POST /production/:id/reservations`
* `POST /production/reservations/:id/reserve`
* `POST /production/reservations/:id/issue`
* `POST /production/reservations/:id/release`
* `POST /production/reservations/:id/expire`
* `GET /production/material-ledger`
* `GET /production/material-ledger/:id`
* `GET /production/:id/material-ledger`
* `GET /production/consumptions`
* `GET /production/:id/consumptions`
* `POST /production/:id/consume`
* `POST /production/:id/component`
* `GET /production/logs`

## Routes

* `/production`
* `/production/boms`
* `/production/orders`
* `/production/reservations`
* `/production/material-ledger`
* `/production/material-issues`
* `/production/consumptions`
* `/production/logs`

## Remaining Tasks

* Add richer manual material issue editing and approval UI.
* Add issue/return document headers if approval workflow requires multi-line documents.
* Extend Production Material Ledger writes for adjust events.
* Add richer production costing inputs for labor, machine, overhead, QC rework, and Yard handling cost.
* Add richer production scheduling, work-center capacity, machine assignment, and operator workflow.
