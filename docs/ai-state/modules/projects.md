# Projects Module

## Scope

Projects covers project master data, project status visibility, material outbound context, production/QC/Yard grouping, and future contract/milestone/budget management.

## Current Status

In Progress.

## Implemented Features

* Project data is used by Inventory outbound workflows.
* Dashboard cockpit aggregates project totals and active project status.
* QC analytics can group by project when production/component/project links are available.
* Project runtime separates shipped, delivered, and installed component states.
* Project runtime exposes component rows linked by `components.projectId`.
* Project UI includes the `Cấu kiện công trình` tab with project/status filters, summary cards, and component date/cost columns.
* Project Components tab can confirm delivery (`Xác nhận nhận hàng`) for `SHIPPED` components and confirm installation (`Xác nhận lắp đặt`) for `DELIVERED` components.
* Installation confirmation opens a required mapping modal for Khu vực, Trục, Tầng, and Vị trí.
* Project Components table displays installation Zone, Axis, Level, and Position.
* Project component Actual Cost reflects `Component.actualCost`, which is updated by Component Costing recalculation.
* Current project UI follows the Inventory visual baseline from the cross-module cockpit refresh.

## Database Models

Known operational table:

* `Project`

Project also participates through related Inventory, Production, Components, QC, and Yard records.

## API Endpoints

Currently documented through active integrations:

* Project APIs used by the frontend project and Inventory outbound workflows.
* `GET /projects/runtime` includes project-linked components, installation location fields, and ready/shipped/delivered/installed counters.
* `POST /components/:id/deliver`
* `POST /components/:id/install`
* `GET /dashboard/cockpit`
* `GET /runtime/operational-workflow`

## Routes

* `/projects`

## Remaining Tasks

* Add persisted project contract fields.
* Add milestones.
* Add project material budgets.
* Add planned/actual schedule baselines.
* Add project document and photo attachments.
* Add formal project return workflow across Yard and Inventory.
* Add a dedicated active component detail route if Project component row drill-down should open a detail page by id.
