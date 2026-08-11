# System Module

## Scope

System Phase S1 plus SYSTEM.ADMIN.V1 implements cockpit foundations for
Settings, Users, Roles & Permissions, System Logs, and operational workflow
verification. Users and Roles are now operational V1 admin workspaces backed by
real APIs. STABILITY.SYSTEM.1 certified the create-user path, master-data CRUD
workspaces and current Backup UI hiding. STABILITY.SYSTEM.1A fixes the
Overview capability interaction so editable master-data rows open real CRUD
workspaces instead of metadata-only details. UI.SYSTEM.MASTERDATA.2 refines the
same master-data workspaces into a wider enterprise table/editor layout.
UI.SYSTEM.MASTERDATA.2A adds canonical `MasterMaterialUsageType` so `Loại vật
tư` is real master data instead of a hardcoded frontend enum list.

Included:

* API-backed Settings dashboard.
* API-backed Users page.
* Backend User Administration APIs for create, detail, update, role assignment,
  enable/disable and password reset.
* Backend Role/Profile Administration APIs for create, update and permission
  replacement.
* API-backed Roles & Permissions page with a real permission matrix.
* API-backed Settings catalog inspection and existing UOM integration.
* Settings Master Data CRUD for Material Categories, Material Master, Material
  Types and UOM using existing authenticated APIs.
* API-backed System Logs page.
* Operational workflow health check from Supplier/Inventory/Production/QC/Yard/Projects.
* Runtime integrity KPI summaries for Inventory, Production, and Projects.
* Sidebar and route wiring for `/settings`, `/users`, `/roles`, `/system-logs`, and `/operations-center`.

Excluded in S1:

* Persisted editable system settings.
* User delete APIs.
* Backup execution jobs and Backup navigation in the current operator UI.
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
* `GET /system/users/:id`
* `POST /system/users`
* `PATCH /system/users/:id`
* `PUT /system/users/:id/roles`
* `POST /system/users/:id/status`
* `POST /system/users/:id/reset-password`
* `GET /system/roles`
* `GET /system/permissions`
* `POST /system/roles`
* `PATCH /system/roles/:id`
* `PUT /system/roles/:id/permissions`
* `GET /system/role-matrix`
* `GET /system/settings-catalog`
* `GET /system/activity-logs`
* `GET /system/activity-summary`
* `GET /system/notifications`
* `GET /dashboard/cockpit`
* `GET /runtime/operational-workflow`
* `GET /runtime/integrity/inventory-summary`
* `GET /runtime/integrity/production-summary`
* `GET /runtime/integrity/project-summary`
* `GET /master-data/uom`
* `POST /master-data/uom`
* `PATCH /master-data/uom/:id`
* `DELETE /master-data/uom/:id`

## Implemented Features

* Settings tabs:
  * Tổng quan.
  * Cấu hình chung.
  * Phân quyền.
  * Danh mục.
  * Tích hợp.
  * Thông báo.
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
* SYSTEM.3 adds canonical User Administration backend operations protected by
  `rbac.write`: create users, update supported identity/display fields, replace
  roles through `UserRole`, enable/disable accounts and reset passwords.
* SYSTEM.3 hardens account state enforcement so disabled users cannot login,
  refresh tokens, resolve current user or continue with old access tokens.
* SYSTEM.3 writes `ActivityLog` entries for user create/update/enable/disable/
  role-change/password-reset without recording plaintext passwords or hashes.
* SYSTEM.3 protects against administrative lockout by preventing self-disable,
  self-removal of a final admin role and loss of the last active `rbac.write`
  administrator.
* SYSTEM.ADMIN.V1 adds canonical Role/Profile Administration operations
  protected by `rbac.write`: create role, update role and replace role
  permissions.
* SYSTEM.ADMIN.V1 protects against removing the final administrative
  `rbac.write` permission from the last active admin role.
* Roles page shows real roles, user counts, permission counts, and a permission matrix derived from persisted Permission names.
* Roles page supports real profile creation, permission assignment, detail
  inspection and effective access preview.
* Settings catalog classifies categories as real editable, real read-only,
  environment read-only or not implemented.
* Settings UOM tab reuses existing `MasterUnit` and `/master-data/uom`; no
  duplicate UOM model exists.
* STABILITY.SYSTEM.1 hides Backup from Settings/sidebar navigation until a real
  backup engine exists.
* STABILITY.SYSTEM.1 aligns create-user frontend validation with backend DTOs:
  username >= 3 characters, password >= 8 characters, valid optional email and
  at least one selected role.
* Settings Master Data CRUD uses:
  * `/master-data/material-categories`
  * `/master-data/material-usage-types`
  * `/inventory/items`
  * `/master-data/material-types`
  * `/master-data/uom`
* Material Master creation is stock-neutral; stock quantity is not created by
  the Settings workspace.
* Settings Overview master-data capability rows now open the same interactive
  CRUD modal workspaces. Non-master-data capability rows remain metadata
  detail views.
* Settings Master Data workspace UI now uses a 95vw/90vh modal, dominant table
  region, stable editor rail, compact row action icons, real summary metrics
  and clearer UOM base/derived conversion presentation.
* Material Master Settings table now presents `InventoryItem` as full Material
  Master administration and shows usage type (`Chính`, `Phụ`, `Tiêu hao`) plus
  status without column misalignment.
* `Loại vật tư` is represented by `MasterMaterialUsageType` and
  `InventoryItem.materialUsageTypeId`; legacy
  `InventoryItem.materialUsageType` (`PRIMARY`, `SECONDARY`, `CONSUMABLE`) is
  preserved as compatibility fallback.
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
* Add user delete API only if business policy approves deletion; SYSTEM.3 keeps
  enable/disable as the safe lifecycle command.
* Add role delete only if business policy approves deletion; V1 keeps create,
  update and permission replacement.
* Add notification mark-read/archive APIs.
* Add real browser smoke harness for System admin routes. V1 was certified by
  authenticated HTTP smoke and Vite preview route smoke because no Playwright
  runner is installed.
* Add audit export.
* Add a frontend System Integrity page or dashboard panel if operators need ongoing visibility into `/runtime/integrity/*`.
* Export runtime metrics to a central telemetry sink before multi-instance deployment; current EPIC 102 metrics are process-local.
* Persist runtime metrics if leadership needs sprint-over-sprint 7/30/90-day performance trend comparisons.
* Expand Operations Center with OPS.2 Database Center, OPS.3 Runtime Explorer, OPS.4 Event Explorer, and OPS.5 Backup Center.
* Wire EPIC108 validation services into Operations Center with admin-only access and read-only defaults.
* Validate Inventory material/location snapshot health in Operations Center after real operator flows and background worker ticks.
* Resolve historical Prisma migration drift so `prisma migrate dev` can be used as a strict local verification gate again.
* Add backup execution and restore workflow.
* Add browser smoke for create-user validation and the four Settings Master
  Data modal workspaces.
* Add true Chromium/Playwright browser certification for SYSTEM.1A when a
  browser harness is available.
* Add configuration change approval.
* Add formal project-return and Yard shipment documents.

## Integration Points

* User, Role, Permission, UserRole, RolePermission for Users and Roles.
* ActivityLog for System Logs.
* InventoryTransaction and InventoryTransactionItem for material workflow checks.
* ProductionOrder, BOM, and ProductionMaterialIssue for production workflow checks.
* QcInspection for QC gate verification.
* YardItemPlacement and YardMovement for staging/outbound/return checks.

## Enterprise Read Platform

The Core background worker now applies Domain Outbox events to a shared
projection registry before marking an event dispatched. Durable receipts provide
idempotency; checkpoints, failures and lag provide health; retained Outbox rows
provide resume/rebuild replay. `/query-api/projections` is GET-only and additive.
The new migration is not deployed by this sprint, and existing UI consumers have
not been cut over.
# SYSTEM.RBAC.2 authorization baseline

- Backend authorization is expressed as Module x Action permissions.
- Frontend navigation, routes, dashboards and actions consume the shared
  permission engine; role names are display/assignment data, not authorization.
- Backend guards remain authoritative and return 403 for missing grants.
- Legacy `.read`/`.write` permissions are compatibility aliases and must not
  widen view access into command access.
- Canonical role presets are served by `GET /system/role-matrix` and persisted
  through ordinary Role/Permission relations.

# SYSTEM.WAREHOUSE.1 canonical Warehouse master

- Settings Master Data owns Warehouse CRUD through the generic dictionary API.
- Warehouse Type classifies a Warehouse; capability flags govern business use.
- Referenced Warehouses cannot be deactivated and return dependency evidence.
- SYSTEM.RESET preserves Warehouse and WarehouseZone configuration.
- Inventory Locations requires an active parent Warehouse and links operators
  to Warehouse Master when none exists.

# UI.MASTERDATA.1 unified workspace

- Master-data administration uses one shared workspace composition: compact
  header, real KPI strip, shared toolbar, compact table and right detail drawer.
- Detail drawers expose Overview, Dependencies, History and Settings; History
  remains controlled-unavailable when no canonical API exists.
- Warehouse, Category, Usage Type, Technical Group and UOM Settings capabilities
  use the 96vw workspace. Inventory Location and Yard reuse the same toolbar and
  drawer conventions in their existing operational routes.
- Warehouse Zone and Yard Zone stay under their canonical topology owners; no
  parallel dictionary was created.
- Destructive actions must display canonical dependency counts and respect the
  existing deactivate/delete backend contract.

# UI.AUDIT.1 enterprise presentation contract

- `docs/ui/STEELTRACK_UI_GUIDELINES.md` is the official active UI standard.
- Canonical shared metrics: KPI 92px, control/table row 36px, surface radius
  8px, detail drawer 64vw and full-list workspace 96vw.
- Canonical toolbar order is Search, Filter, Refresh, Density, Export, View,
  Add.
- Record details use right drawers. Centered overlays are restricted to focused
  commands, confirmations, media previews and the documented full-list
  workspace exception.
- Runtime visual certification remains required after PostgreSQL availability
  is restored.
