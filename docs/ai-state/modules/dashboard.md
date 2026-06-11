# Dashboard Module

## Scope

Dashboard provides the main Tổng quan cockpit for operational ERP/MES visibility across Projects, Production, Components, Inventory, Yard, QC, Activity Logs, and Notifications.

## Current Status

In Progress.

## Implemented Features

* Dashboard uses the Inventory dark cockpit visual baseline.
* Dashboard reads real backend data through `GET /dashboard/cockpit`.
* KPI cards summarize projects, production orders, components, inventory/material counts, transport/yard activity, and revenue/operational signals where available.
* Dashboard includes alerts, recent notifications, quick access actions, and module summary panels.
* Notifications route is registered separately and reads persisted notification rows through System APIs.

## Database Models

Dashboard aggregates existing module data rather than owning a dedicated schema.

Key sources:

* Projects.
* Production Orders.
* Components.
* Inventory transactions and items.
* Yard placements/movements.
* QC inspections.
* Activity Logs.
* Notifications.

## API Endpoints

* `GET /dashboard/cockpit`
* `GET /system/notifications`

## Routes

* `/dashboard`
* `/`
* `/notifications`

## Remaining Tasks

* Add persisted dashboard preferences.
* Add deeper drill-through links.
* Add notification/action mutation flows after System mutation APIs exist.
* Add configurable dashboard widgets if required.
