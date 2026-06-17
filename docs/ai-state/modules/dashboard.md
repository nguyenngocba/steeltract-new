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
* Sprint 13 reworks the main dashboard into an Executive Dashboard with Inventory Forecast, Component Pipeline, Yard Occupancy, QC Quality Trend, Production Signal, and Executive Alerts panels.
* Executive Dashboard uses existing read-only frontend data sources: dashboard cockpit, inventory audit/transactions, components, production orders, Yard metrics/movements, and QC cockpit.
* Forecast and alert logic is rules-based and linear; no AI or machine learning was added.
* Panels show assumptions when historical detail is incomplete.
* Executive Dashboard now includes material replenishment forecasting from Inventory Audit rows and recent outbound transactions.
* Material forecast highlights which material codes need urgent purchase or replenishment, projected 7-day balance, and recommended quantity.
* Component forecast estimates 7-day ready output from current component lifecycle status and open Production Orders.
* Executive Alerts surface top material purchase/replenishment needs and component delivery/installation backlog signals.
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
* Add richer time-series APIs later if executive forecast accuracy needs more than current movement/history aggregates.
* Add formal procurement links once Purchasing exists so material replenishment recommendations can create purchase requests.
