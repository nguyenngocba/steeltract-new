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
* `GET /production/logs`

## Routes

* `/production`
* `/production/boms`
* `/production/orders`
* `/production/material-issues`
* `/production/logs`

## Remaining Tasks

* Add formal BOM reservation documents instead of derived reservation state.
* Add manual material issue creation/edit/return approval UI.
* Add persisted production-material warehouse balance/receipt ledger.
* Add production costing ledger with material issue actuals, labor, machine, overhead, QC rework, and Yard handling cost.
* Add richer production scheduling, work-center capacity, machine assignment, and operator workflow.
