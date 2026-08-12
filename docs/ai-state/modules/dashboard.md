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
* Epic PERF Foundation adds `DashboardInventoryReadModelService`, an internal cached Inventory dashboard read model used by Inventory-heavy dashboard endpoints and executive services without changing route contracts.
* EPIC 100 moves Dashboard Inventory read-model source queries through `InventoryRepository`, preparing the current process-local cache for a future persisted snapshot implementation.
* EPIC 101 defines enterprise performance gates for Dashboard/Cockpit endpoints and recommends persisted `DashboardExecutiveSnapshot` and module snapshots before scaling dashboard workloads to high-volume operational data.
* EPIC104 adds the first Data Engine index migration for transaction, return, task, and activity sources used by Dashboard and Executive Cockpit rollups. Persisted snapshot architecture is documented in `docs/architecture/persisted-snapshot-architecture.md`; no snapshot table exists yet.
* EPIC107 SNAP.1 adds persisted snapshot tables and services for Inventory, Project, and Dispatch dashboard data. Dashboard endpoints are not switched yet, but `SnapshotReaderService` and the repositories are ready for a follow-up read-path migration.
* EPIC107 SNAP.2 adds `DashboardReaderService`, `SnapshotReaderStrategy`, and `RuntimeAggregateStrategy`. Inventory, Projects, and Logistics dashboard reads now prefer persisted snapshots and fall back to runtime aggregate without changing response contracts.
* EPIC108 adds validation services to compare snapshot output against runtime/source recalculation and benchmark runtime vs snapshot dashboard read paths before further cutover expansion.
* EPIC109 OPS.1 consumes Dashboard/runtime foundation signals in Operations Center, but keeps the business Dashboard separate from system administration.
* SYSTEM.PROJECTION.1 makes Historical Dashboard authority depend on canonical Outbox/projection watermarks rather than calendar date. Same-day events trigger replacement snapshots, History exposes freshness/parity/lag/age, and projection health reports event ID, aggregate version and processed time for all 31 definitions.

## Database Models

Dashboard currently aggregates existing module data through services/read models, while the persisted snapshot schema is now available for future read-path migration.

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
* `inventory_dashboard_snapshots`.
* `project_dashboard_snapshots`.
* `dispatch_dashboard_snapshots`.

## API Endpoints

* `GET /dashboard/cockpit`
* `GET /dashboard/executive-cockpit`
* `GET /system/notifications`
* `GET /history/dashboard/latest`
* `GET /query-api/projections/health`

Internal read-model services:

* `DashboardInventoryReadModelService`
* `DashboardReaderService`

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
* Validate snapshot parity warnings and hit/fallback rates with real traffic.
* Initialize Logistics/Dispatch projections with real canonical events and certify the first closed-month rollups.
* Run EPIC108 benchmark cases for Dashboard runtime vs snapshot reads before expanding snapshot schemas or disabling parity checks.
* Expand snapshot schemas if chart-level dashboard payloads need to stop using runtime compatibility data.
* Apply `docs/audit/enterprise-performance-gate.md` before adding new Dashboard widgets or trends.
* Move executive health, recommendations, activities, and notification counts toward persisted read models after live KPI rules are validated.
