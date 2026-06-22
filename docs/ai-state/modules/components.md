# Components Module

## Scope

Components covers steel component master records, production linkage, component timeline, stock/yard visibility, and handoff from Production.

## Implemented Features

* Components list, overview, stock, material stock, production, yard, and history pages.
* Generic component master creation through `POST /components`.
* Component creation UI in `/components/list`.
* Component records can be linked to Projects.
* Production BOM and Manufacturing Order workflows can start from selected Components.
* Production execution can create or mark a component as `READY` from a valid Manufacturing Order after material issue.
* Component timeline records production-created and yard-staged state changes.
* Component delivery workflow advances `SHIPPED -> DELIVERED -> INSTALLED` through dedicated APIs.
* Delivery and installation write `ComponentTimeline` actions `DELIVERED` and `INSTALLED`.
* Installation mapping stores `installZone`, `installAxis`, `installLevel`, and `installPosition` on the Component.
* Component detail UI shows installation location for installed components.
* Component costing is persisted in `ComponentCosting` and can be recalculated from production consumption data.
* Component costing is now automatically recalculated when production completion marks the component `READY`.
* Automatic costing writes ActivityLog action `AUTO_RECALCULATE_COSTING`; manual recalculation still writes `RECALCULATE_COSTING`.
* Component detail UI includes a Costing section for estimated cost, actual cost, variance, material, labor, machine, and overhead.
* Sprint 11 adds Component Cost Breakdown with planned BOM material rows, actual consumed/scrap material rows, KPI cards, and costing warnings.
* Costing warnings detect `BOM_MATERIAL_NOT_CONSUMED`, `UNPLANNED_MATERIAL`, and `QUANTITY_VARIANCE`.
* Sprint 11A formats component material stock costs as whole VND and supports decimal return quantities when returning production material back to Main Warehouse.
* Sprint 12A migrates Components List and Components Stock presentation toward the Inventory cockpit baseline using shared module UI primitives.
* Components lifecycle KPI strips now show `Tổng cấu kiện`, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED` from existing frontend data.
* Sprint 12C adds sticky filters, lifecycle KPI click-to-filter, shared empty/loading states, and standard `ModuleDetailDrawer` usage for Components List/Stock detail surfaces.
* Sprint 18B turns Components List into a Component Management Cockpit using the Inventory visual foundation, including KPI strip, operational component grid, shared detail drawer, and analytics panels.
* Component Cockpit grid now surfaces Project, Work Order, Progress, Material Ready, and Weight alongside existing component fields.
* Component Cockpit detail drawer includes component info, BOM summary, material required/issued/remaining, related Work Orders, and production progress.
* Sprint 18C adds BOM Intelligence mapping and computes Component Material Ready from BOM required quantity and Production Material Issue net issued quantity.
* Material readiness no longer falls back to `100%`; components without BOM/required material do not silently appear fully ready.
* Sprint 20A adds a read-only Costing Engine summary for Components.
* `GET /components/:id/cost` aggregates linked Production Order cost summaries into Component material cost and cost per unit without overwriting persisted `ComponentCosting`.

## Component Creation Audit

Current frontend path:

* `/components/list`
* `ComponentsListPage`
* `useCreateComponent`
* `POST /components`

Backend path:

* `ComponentsController.create`
* `ComponentsService.create`
* `ComponentsRepository.create`
* Tables: `components`, `activity_logs`

Production-context path:

* `POST /production/:id/component`
* Requires issued production material for the MO.
* Updates existing linked Component to `READY`, or creates one if the MO does not already reference a Component.
* Tables: `components`, `component_timelines`, `production_logs`

## Root Cause Found

Generic backend component creation was functional in API smoke testing.

The isolated UI blocker found during Sprint 3 was the login page default password:

* UI default: `admin123`
* Current seed password: `123`

This prevented a fresh user from logging in with the prefilled credentials before using the create component form.

Fix:

* Login page default password now matches the seed password `123`.

## API Endpoints

* `GET /components`
* `GET /components/:id`
* `GET /components/:id/timeline`
* `GET /components/:id/costing`
* `GET /components/:id/costing/breakdown`
* `GET /components/:id/cost`
* `POST /components`
* `POST /components/:id/deliver`
* `POST /components/:id/install` with `installZone`, `installAxis`, `installLevel`, `installPosition`
* `POST /components/:id/costing/recalculate` for manual recalculation; production completion now also calls the same upsert logic automatically.
* `PATCH /components/:id`
* `DELETE /components/:id`
* `POST /components/upload`
* `POST /components/timeline-upload`
* `POST /production/:id/component`

## Remaining Tasks

* Decide whether component master creation should remain separate from production-output creation long term.
* Add richer costing inputs for labor, machine, overhead, QC rework, and Yard handling.
* Compare Sprint 20A read-model component cost with persisted `ComponentCosting` during Sprint 20B Component Cost Analysis.
* Add stricter UI messaging that Production output creation requires issued material.
* Add delivery and installation document numbers, signed handover evidence, and coordinate/drawing references if required by field operations.
* Evaluate whether long-term component costing should move from `Float` to database decimal types if accounting-grade precision is required.
* Continue UI standardization for remaining Components tabs after Sprint 12A review.
* Consider adding a backend `GET /components/:id/material-readiness` API if multiple modules need the same readiness aggregation and frontend duplication becomes too high.
