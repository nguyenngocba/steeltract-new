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
* Sprint 9 hardening preserves warehouse, zone, slot, and level from production stock buckets into auto-issued material rows and Inventory transaction items.
* MO start plans required material issues before changing status and creates issue rows only after the start transition succeeds.
* Material requirements endpoint shows required, available SX, issued, and shortage quantities.
* Formal Production Material Reservation documents are implemented for Sprint 1.
* Reservation preview validates BOM demand against production warehouse stock minus active reservations.
* Reservation lines allocate by production warehouse location bucket: `warehouseId + zoneId + slotId + level`.
* Reservation Allocation Integrity Sprint 10C uses only active `inventory_location_stocks.quantity > 0` production buckets and subtracts active reservations by exact material/warehouse/zone/slot/level bucket.
* Reservation create/reserve/release/expire APIs are available and do not move Inventory stock.
* Production Material Ledger Sprint 2 is implemented for reservation lifecycle events.
* Ledger rows record `RESERVE` and `RELEASE` events from reservation create/reserve/release/expire, with production order, reservation, material, location, quantity, event date, remark, and actor.
* Material Issue from Reservation Sprint 3 is implemented. Issue can only consume reserved quantities and reduces `inventory_location_stocks`.
* Material Return Sprint 3 is implemented and Sprint 10A reconciles returns after consumption/scrap.
* Returned unused issued material is posted back to `MAIN` / `Kho chính`; issue already reduced `PRODUCTION` / `Kho vật tư SX` stock.
* Return validation enforces `issued = consumed + scrap + returned + remaining`, so partial returns cannot exceed the unconsumed remainder.
* Ledger now records `ISSUE` and `RETURN` events from production issue/return workflows.
* Production Consumption Sprint 4 is implemented for recording actual consumed and scrap quantities per MO/material.
* Ledger now records `CONSUME` events from production consumption posting.
* Component Costing Sprint 5 calculates actual material cost from production consumption and Inventory average cost.
* Automatic Component Costing Sprint 10B recalculates costing after production completion/component `READY` without requiring the manual `POST /components/:id/costing/recalculate` action.
* Automatic costing failure is caught and logged as a backend warning so production completion remains successful.
* Component Costing Breakdown Sprint 11 compares BOM planned material quantities with actual Production Material Consumption rows and surfaces material variance warnings.
* Decimal Quantity Sprint 11A supports decimal BOM quantities, MO quantities, reservation issue quantities, material return/consume/scrap quantities, and Yard staging quantities in the UI and backend DTO parsing.
* Quantity UI formatting supports `vi-VN` decimal typing such as `1,5`, `0,125`, and `1.234.567,125` without converting values to integers.
* Production execution can create/mark a component from an MO only after material has been issued.
* Production UI includes `/production/reservations` and MO detail reservation preview/create action.
* Production UI includes `/production/material-ledger` with filters for Production Order, Material, Event Type, and Date Range.
* Production UI includes `/production/consumptions` with Issued, Returned, Consumed, Scrap, and Remaining summaries.
* Sprint 12B standardizes Production Cockpit presentation with shared module UI primitives for KPI strip, analytics panels, filter bar, and the primary Manufacturing Order data grid.
* Sprint 12C adds sticky Production filters and frontend status KPI click-to-filter without changing Production APIs or workflow logic.
* Sprint 18A aligns Production Cockpit more closely with the Inventory operational theme: Inventory-style KPI cards, filter controls, analytics panels, primary Production Orders grid, progress/readiness/delay indicators, and shared detail drawers for Production Orders, BOM detail, and Material Issues.
* Sprint 18A extended the Inventory-style data-grid/table treatment to Production BOM, Reservations, Material Ledger, Material Issues, Consumptions, and Logs without changing Production APIs or workflows.
* Sprint 18C confirms existing Production Order responses expose BOM items and material issues enough for frontend Component Material Readiness calculations.
* Sprint 18D turns `/production/orders` into a Work Order Cockpit with KPI strip, Inventory-style Work Order grid, BOM Intelligence Material Ready %, drawer sections, and analytics panels.
* Work Order `READY TO RELEASE` is currently UI-only and appears when Material Readiness reaches 100%; it does not lock or change backend workflow.
* Sprint 18E turns `/production/material-issues` into a Production Material Control Center with KPI strip, Inventory-style issue grid, Required/Issued/Returned/Remaining/Readiness indicators, detail drawer sections, and analytics panels.
* Material Issue readiness is computed in the frontend from existing BOM required quantities and Production Material Issue net issued quantities; no backend API or workflow change was introduced.
* Sprint 19A adds `/production/warehouse` as a Production Warehouse Cockpit focused only on `PRODUCTION` / `Kho vật tư SX` balances.
* Production Warehouse Cockpit computes `Available = Production Stock - Reserved`, `Shortage = Required - Available`, and status from available production stock rather than total stock.
* Production Warehouse Cockpit groups location balances by Production Zone / Slot / Level and adds shortage, readiness, and WO consumption analytics using existing Inventory/Production data.
* Sprint 19B adds `/production/execution` as a Production Execution Board with Kanban columns for Planning, Ready Material, Cutting, Assembly, Welding, Painting, and Completed.
* Execution Board cards reuse BOM/Issue material readiness, delay detection, progress estimation, issue history, and reservation summaries from existing Production data.
* Execution Board prefers actual active stage data and falls back to status/readiness mapping until backend exposes a canonical shopfloor stage model.
* Sprint 19C MES Data Audit documents current Shopfloor and Costing readiness in `docs/ai-state/audits/mes-data-audit.md`.
* Sprint 19C concludes Costing should be prioritized next because BOM, consumption, inventory valuation, and ComponentCosting data are more complete than canonical shopfloor runtime history.
* Sprint 20A adds a read-only Costing Engine summary for Production Orders.
* `GET /production/orders/:id/cost` returns required, issued, returned, net issued, consumed, scrap, material cost, cost per unit, and material-level cost source rows.
* Production Order material cost uses actual issue Inventory transaction valuation where available and weighted average Inventory cost as fallback.
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
* `GET /production/orders/:id/cost`
* `POST /production/:id/consume`
* `POST /production/:id/component`
* `GET /production/logs`

## Routes

* `/production`
* `/production/boms`
* `/production/orders`
* `/production/execution`
* `/production/reservations`
* `/production/warehouse`
* `/production/material-ledger`
* `/production/material-issues`
* `/production/consumptions`
* `/production/logs`

## Remaining Tasks

* Add richer manual material issue editing and approval UI.
* Add issue/return document headers if approval workflow requires multi-line documents.
* Review and reconcile historical production issue transaction rows that were created before slot/level was preserved.
* Review historical issue/consume/return rows from validation data before any automated backfill.
* Review and clean the historical invalid reservation bucket reported by Runtime Integrity after Sprint 10C.
* Extend Production Material Ledger writes for adjust events.
* Add richer production costing inputs for labor, machine, overhead, QC rework, and Yard handling cost.
* Add richer production scheduling, work-center capacity, machine assignment, and operator workflow.
* Consider replacing `Float` with decimal-safe database types only if future financial/weight precision requirements exceed current operational tolerance.
* Continue Sprint 18 UI review with operators and extract repeated Production transaction/detail table helpers if the new cockpit patterns are approved.
* Consider exposing unit material cost on Work Order material readiness/value APIs if operators need true value-based WO ranking instead of required-quantity proxy analytics.
* Consider exposing unit material cost or total line value on Material Issue APIs if operators need true issue-value KPIs and value-based material issue analytics.
* Consider a persisted production warehouse receipt/balance ledger if operators need auditable production-stock history independent from current Inventory location balances and reservation rows.
* Consider exposing canonical shopfloor stage/status data if operators need the Execution Board to reflect real machine/work-center queues rather than UI fallback mapping.
* Review Sprint 20A Costing Engine with more real Production Orders and decide whether issue/return costs should move from read model to persisted costing snapshots.
* Prioritize 20B Component Cost Analysis and 20C Project Cost Control before deeper Shopfloor dashboard expansion.
* Add immutable stage transition history, actual runtime/downtime capture, production-line queues, and labor/machine rate data before treating Shopfloor analytics as authoritative MES data.
