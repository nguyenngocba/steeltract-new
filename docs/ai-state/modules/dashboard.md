# Dashboard Module

## Scope

Dashboard provides the main Tổng quan cockpit for operational ERP/MES visibility across Projects, Production, Components, Inventory, Yard, QC, Activity Logs, and Notifications.

## Current Status

In Progress.

## Implemented Features

* Dashboard uses the Inventory dark cockpit visual baseline.
* Dashboard reads real backend data through `GET /dashboard/cockpit`.
* Executive Intelligence tabs read real backend DTOs through `GET /dashboard/executive-cockpit`.
* Backend intelligence aggregation is split into `DashboardMetricsService`, `DashboardActivityService`, `DashboardNotificationService`, `DashboardInsightService`, and `DashboardRecommendationService`.
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
* Sprint 70EXEC.1 adds URL-driven tabs for `KPI Chính`, `Biểu đồ xu hướng`, `Hoạt động gần đây`, and `Thông báo`.
* Predictive Trends calculate material shortage, production stop risk, consumption trends, and inventory projections from Inventory transactions/location stocks plus Production BOM/material issue data.
* Recent Activities unify real Inventory transactions, Production logs, Yard movements, QC inspections, Purchase Orders, and Projects into a single executive timeline.
* System Notifications classify operational conditions into Critical, Warning, and Information using real Inventory, Production, Yard, QC, Projects, Purchasing, and persisted notification records.
* Sprint 70EXEC.2 adds an Executive Control Tower section to KPI Chính with System Health Score, 7-day Executive Summary, Suggested Actions, Activities by Module, and Notification Center.
* Health Score covers Inventory, Production, Yard, QC, Suppliers, and Projects using real operational counts and rule weights.
* Suggested Actions recommend operational follow-up only; they do not create workflow records.
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
* Purchase Orders.

## API Endpoints

* `GET /dashboard/cockpit`
* `GET /dashboard/executive-cockpit`
* `GET /system/notifications`

## Routes

* `/dashboard`
* `/`
* `/?tab=trends`
* `/?tab=activities`
* `/?tab=notifications`
* `/notifications`

## Remaining Tasks

* Add persisted dashboard preferences.
* Add deeper drill-through links.
* Add notification/action mutation flows after System mutation APIs exist.
* Add configurable dashboard widgets if required.
* Add richer time-series APIs later if executive forecast accuracy needs more than current movement/history aggregates.
* Add formal procurement links once Purchasing exists so material replenishment recommendations can create purchase requests.
* Validate Sprint 70EXEC.1/70EXEC.2 prediction, notification, health score, and recommendation thresholds with live operator data.
