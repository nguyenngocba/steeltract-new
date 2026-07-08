# System Module

## Scope

System Phase S1 implements cockpit foundations for Settings, Users, Roles & Permissions, System Logs, and operational workflow verification.

Included:

* API-backed Settings dashboard.
* API-backed Users page.
* API-backed Roles & Permissions page.
* API-backed System Logs page.
* Operational workflow health check from Supplier/Inventory/Production/QC/Yard/Projects.
* Runtime integrity KPI summaries for Inventory, Production, and Projects.
* Sidebar and route wiring for `/settings`, `/users`, `/roles`, `/system-logs`, and `/operations-center`.

Excluded in S1:

* Persisted editable system settings.
* User create/edit/delete APIs.
* Role mutation and permission assignment APIs.
* Backup execution jobs.
* Audit export generation.
* Approval workflow for configuration changes.

## Routes

Frontend:

* `/settings`
* `/users`
* `/roles`
* `/system-logs`
* `/operations-center`

Backend:

* `GET /system/overview`
* `GET /system/users`
* `GET /system/roles`
* `GET /system/role-matrix`
* `GET /system/activity-logs`
* `GET /system/activity-summary`
* `GET /system/notifications`
* `GET /dashboard/cockpit`
* `GET /runtime/operational-workflow`
* `GET /runtime/integrity/inventory-summary`
* `GET /runtime/integrity/production-summary`
* `GET /runtime/integrity/project-summary`

## Implemented Features

* Settings tabs:
  * Tổng quan.
  * Cấu hình chung.
  * Phân quyền.
  * Danh mục.
  * Tích hợp.
  * Thông báo.
  * Sao lưu & Phục hồi.
  * Nhật ký cấu hình.
* Settings overview uses existing database tables and environment values, without new schema.
* Workflow health panel validates:
  * Supplier inbound.
  * Main Inventory stock.
  * Project outbound.
  * Production material outbound.
  * Production material returns.
  * BOM and Manufacturing Orders.
  * QC gate.
  * Yard staging.
  * Yard outbound.
  * Project return readiness.
  * QC failure readiness.
* Users page shows real users, statuses, roles, latest ActivityLog data, KPI strip, filters, table, and detail panel.
* Roles page shows real roles, user counts, permission counts, and a permission matrix derived from persisted Permission names.
* System Logs page shows real ActivityLog rows with filters, action summary, module distribution, and activity trend.
* Notifications page uses persisted Notification records from `/system/notifications`, with unread/priority/read filters and a detail workspace.
* Dashboard/Tổng quan uses `/dashboard/cockpit` to aggregate real Projects, Production Orders, Components, Inventory, Yard, QC, Activity Logs, and Notifications.
* Inventory outbound now validates selected location balance server-side when `zoneId` is provided.
* Runtime Integrity APIs provide read-only KPI summaries for reconciliation/hardening and do not mutate business records.
* EPIC 102 adds backend runtime observability under `core/performance`: request metrics interceptor, Prisma query profiler, query budget warnings, slow query detector, runtime health snapshots, read-model/cache hit counters, and `/performance/metrics` runtime output. It does not change business workflow or UI.
* EPIC 103 adds runtime analytics over those metrics: 5m/1h/24h endpoint rankings, query rankings, read-model effectiveness, rule-based recommendations, performance score, and architecture score. Long-range 7/30/90-day trend reporting is deferred until metrics are persisted.
* EPIC104 adds the first schema-backed Data Engine index foundation. System/ActivityLog timelines now have composite indexes for module/date and entity/entityId/date reads, and persisted snapshot architecture is documented for future runtime/dashboard scaling.
* EPIC107 SNAP.1 adds persisted dashboard snapshot models and services. Runtime metrics now include snapshot hit/miss/rebuild/lag signals, and snapshot rebuild jobs write real PostgreSQL rows through repositories.
* EPIC107 SNAP.2 adds snapshot read-cutover observability. Runtime metrics now include snapshot fallback, stale count, age, and confidence, enabling Operations Center screens to show whether dashboards are using snapshots or runtime aggregate fallback.
* EPIC108 adds validation services for snapshot parity, benchmark execution, background recovery state, and controlled stress harnesses. These are backend-only foundations for the future Operations Center.
* EPIC109 OPS.1 adds the read-only Operations Center module. `GET /operations-center/overview` aggregates runtime metrics, background jobs, outbox events, snapshot health, cache/read-model effectiveness, database size, storage usage, API ranking, query ranking, performance score, architecture score, and system alerts.
* EPIC112 INV.CORE.2 extends Operations Center Inventory health with material snapshot health, location snapshot health, snapshot freshness, hit ratio, lag, and rebuild status.

## Workflow Verification Result

Latest DB check:

* Supplier inbound: 8.
* Inventory items: 8.
* Project outbound: 5.
* Production outbound: 4.
* Production returns: 3.
* BOMs: 7.
* Production orders: 12.
* Completed production orders: 10.
* Approved QC releases: 9.
* Active Yard placements: 23.
* Removed Yard placements: 15.
* Staged components without QC: 0.

Warnings still expected:

* 4 completed MOs do not yet have approved QC, but they are not staged to Yard.
* No failed/rework QC sample currently exists in DB.
* No project-return Yard placement sample currently exists in DB.

## Remaining Features

* Persist settings in a dedicated settings table.
* Add user create/edit/lock/delete/password-reset APIs.
* Add role create/edit/delete and permission assignment APIs.
* Add notification mark-read/archive APIs.
* Add audit export.
* Add a frontend System Integrity page or dashboard panel if operators need ongoing visibility into `/runtime/integrity/*`.
* Export runtime metrics to a central telemetry sink before multi-instance deployment; current EPIC 102 metrics are process-local.
* Persist runtime metrics if leadership needs sprint-over-sprint 7/30/90-day performance trend comparisons.
* Expand Operations Center with OPS.2 Database Center, OPS.3 Runtime Explorer, OPS.4 Event Explorer, and OPS.5 Backup Center.
* Wire EPIC108 validation services into Operations Center with admin-only access and read-only defaults.
* Validate Inventory material/location snapshot health in Operations Center after real operator flows and background worker ticks.
* Resolve historical Prisma migration drift so `prisma migrate dev` can be used as a strict local verification gate again.
* Add backup execution and restore workflow.
* Add configuration change approval.
* Add formal project-return and Yard shipment documents.

## Integration Points

* User, Role, Permission, UserRole, RolePermission for Users and Roles.
* ActivityLog for System Logs.
* InventoryTransaction and InventoryTransactionItem for material workflow checks.
* ProductionOrder, BOM, and ProductionMaterialIssue for production workflow checks.
* QcInspection for QC gate verification.
* YardItemPlacement and YardMovement for staging/outbound/return checks.
