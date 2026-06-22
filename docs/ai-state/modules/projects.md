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
* Project Components delivery/install actions use the authenticated frontend API client and surface success/error feedback.
* Clicking a Project Component row opens the existing Component detail modal on the Components list through route state.
* Installation confirmation opens a required mapping modal for Khu vực, Trục, Tầng, and Vị trí.
* Project Components table displays installation Zone, Axis, Level, and Position.
* Project component Actual Cost reflects `Component.actualCost`, which is updated by Component Costing recalculation.
* Sprint 20A adds a read-only Project Cost summary API that aggregates project-linked Components and direct project Production Orders.
* `GET /projects/:id/cost` returns project material cost, component count, production order count, component cost summaries, and production order cost summaries.
* Current project UI follows the Inventory visual baseline from the cross-module cockpit refresh.
* Sprint 12B standardizes Projects page header, KPI strip, Project runtime cards, Components runtime cards, filter bar, table shell, and empty state with shared module UI primitives.
* Sprint 12C adds sticky filters, frontend KPI click-to-filter for Projects/Project Components, and standard `ModuleDetailDrawer` usage for project detail.

## Database Models

Known operational table:

* `Project`

Project also participates through related Inventory, Production, Components, QC, and Yard records.

## API Endpoints

Currently documented through active integrations:

* Project APIs used by the frontend project and Inventory outbound workflows.
* `GET /projects/runtime` includes project-linked components, installation location fields, and ready/shipped/delivered/installed counters.
* `GET /projects/:id/cost`
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
* Use Sprint 20A Project Cost summary as the backend foundation for Sprint 20C Project Cost Control.
* Add planned/actual schedule baselines.
* Add project document and photo attachments.
* Add formal project return workflow across Yard and Inventory.
* Add a dedicated active component detail route if Project component row drill-down should use `/components/:id` instead of the existing list modal.
