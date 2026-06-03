# System Module

## Scope

System Phase S1 implements cockpit foundations for Settings, Users, Roles & Permissions, System Logs, and operational workflow verification.

Included:

* API-backed Settings dashboard.
* API-backed Users page.
* API-backed Roles & Permissions page.
* API-backed System Logs page.
* Operational workflow health check from Supplier/Inventory/Production/QC/Yard/Projects.
* Sidebar and route wiring for `/settings`, `/users`, `/roles`, and `/system-logs`.

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

Backend:

* `GET /system/overview`
* `GET /system/users`
* `GET /system/roles`
* `GET /system/activity-logs`
* `GET /runtime/operational-workflow`

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
* Users page shows real users, statuses, roles, KPI strip, table, and detail panel.
* Roles page shows real roles, user counts, permission counts, and a derived permission matrix.
* System Logs page shows real ActivityLog rows with filters and action summary.
* Inventory outbound now validates selected location balance server-side when `zoneId` is provided.

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
* Add audit export.
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
