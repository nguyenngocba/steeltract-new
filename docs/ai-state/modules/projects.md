# Projects Module

## Scope

Projects covers project master data, project status visibility, material outbound context, production/QC/Yard grouping, and future contract/milestone/budget management.

## Current Status

In Progress.

## Implemented Features

* Project data is used by Inventory outbound workflows.
* Dashboard cockpit aggregates project totals and active project status.
* QC analytics can group by project when production/component/project links are available.
* Current project UI follows the Inventory visual baseline from the cross-module cockpit refresh.

## Database Models

Known operational table:

* `Project`

Project also participates through related Inventory, Production, Components, QC, and Yard records.

## API Endpoints

Currently documented through active integrations:

* Project APIs used by the frontend project and Inventory outbound workflows.
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
