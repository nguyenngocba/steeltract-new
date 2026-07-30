# SYSTEM.2 - Canonical RBAC Enforcement Report

Date: 2026-07-29

Status: IMPLEMENTED - RUNTIME CERTIFIED

## Current RBAC Architecture

SteelTrack already had a canonical RBAC foundation:

- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `JwtAuthGuard`
- `PermissionsGuard`
- `@RequirePermissions(...)`
- JWT access tokens containing user identity, roles and permission names
- `RbacService.getUserAccess(userId)` resolving User -> Role -> Permission from the database
- Existing `ActivityLog` write path for permission denials

Application-level authentication remains enforced by global `JwtAuthGuard`.

SYSTEM.2 added backend authorization metadata through:

`JwtAuthGuard + PermissionsGuard + @RequirePermissions(...)`

Domain services remain responsible for state/business validation.

## Existing Permission Catalog

Before SYSTEM.2 runtime bootstrap, the DB catalog had 27 permissions.

SYSTEM.2 added the missing Logistics permissions and made catalog initialization idempotent:

- `logistics.read`
- `logistics.write`

The canonical catalog now contains 29 permissions:

- `analytics.read`
- `analytics.write`
- `attachments.read`
- `attachments.write`
- `components.read`
- `components.write`
- `inventory.read`
- `inventory.write`
- `jobs.read`
- `jobs.write`
- `logistics.read`
- `logistics.write`
- `master-data.read`
- `master-data.write`
- `production.read`
- `production.write`
- `project.approve`
- `projects.read`
- `projects.write`
- `qc.read`
- `qc.write`
- `rbac.read`
- `rbac.write`
- `tasks.read`
- `tasks.write`
- `workflow.read`
- `workflow.write`
- `yard.read`
- `yard.write`

## Endpoint Permission Matrix

| Module | READ | CREATE/UPDATE/DELETE | EXECUTE/APPROVE |
| --- | --- | --- | --- |
| Inventory | `inventory.read` | `inventory.write` | `inventory.write` |
| Inventory Returns | `inventory.read` | `inventory.write` | `inventory.write` |
| Components | `components.read` | `components.write` | `components.write` |
| Component Commands | n/a | `components.write` | `components.write` |
| Component Foundation | `components.read` | `components.write` | `components.write` |
| Finished Goods Instances | `components.read` | n/a | n/a |
| Production | `production.read` | `production.write` | `production.write` |
| Production Commands | `production.read` for execution history | `production.write` | `production.write` |
| QC | `qc.read` | `qc.write` | `qc.write` |
| Projects | `projects.read` | `projects.write` | `projects.write` |
| Suppliers | `master-data.read` | `master-data.write` | `master-data.write` |
| Logistics | `logistics.read` | `logistics.write` | `logistics.write` |
| System Administration | `rbac.read` | n/a in SYSTEM.2 | n/a in SYSTEM.2 |

The catalog is currently coarse-grained. High-impact commands such as QC PASS/FAIL, Production execution start/complete, and Inventory issue/adjustment are protected by module `*.write`, not yet by command-specific permission keys.

## Admin Safety Gate

Runtime DB evidence after SYSTEM.2 bootstrap:

- Permission count: 29
- `logistics.read`: present
- `logistics.write`: present
- Active admin user: `admin`
- Admin role permission count: 29
- Admin role has `logistics.read`: true
- Admin role has `logistics.write`: true

No user, role, password or existing permission was removed.

## Changes Implemented

Backend:

- Added canonical RBAC catalog constant and idempotent admin catalog bootstrap in `RbacService`.
- Marked `RbacModule` as global so `PermissionsGuard` resolves `RbacService` consistently from feature modules.
- Added `logistics.read` and `logistics.write` to Prisma seed.
- Added permission enforcement to Inventory, Components, Production, QC, Projects, Suppliers, Logistics and System controllers.
- Added targeted RBAC enforcement tests for 403 behavior and representative controller metadata.

Documentation:

- Added this report.
- Updated AI state docs.

## 401/403 Semantics

Runtime proof against working-tree backend on port `3102`:

| Case | Endpoint | Result |
| --- | --- | --- |
| No token | `POST /inventory/transactions` | 401 Unauthorized |
| Valid signed token, no DB roles | `GET /inventory/items` | 403 Permission denied |
| Valid signed token, no DB roles | `POST /production/commands/orders` | 403 Permission denied |
| Admin token | `GET /inventory/items` | 200 |
| Admin token | `GET /system/overview` | 200 |
| Admin token | `GET /logistics/dispatch-dashboard` | 200 |

The 403 proof uses a synthetic signed access token with no matching role permissions. No fake user or business data was created.

## Runtime Certification

Runtime server was started from the current working tree on:

`127.0.0.1:3102`

The first runtime start exposed a real DI issue:

`PermissionsGuard` could not resolve `RbacService` inside feature modules.

Fix:

`RbacModule` is now `@Global()`.

Retest:

- API started successfully.
- No-token request returned 401.
- Token without DB role permissions returned 403.
- Admin retained read access to Inventory, System Admin and Logistics.

## Cross-Module Results

| Module | Status | Notes |
| --- | --- | --- |
| Inventory | PASS | Reads require `inventory.read`; item/transaction mutations require `inventory.write`. |
| Components | PASS | Reads require `components.read`; create/update/upload/commands require `components.write`. |
| Production | PASS | Reads require `production.read`; order/material/execution commands require `production.write`. |
| QC | PASS | Reads require `qc.read`; inspection/NCR/disposition commands require `qc.write`. |
| Projects | PASS | Reads require `projects.read`; project/WBS/site updates require `projects.write`. |
| Suppliers | PASS | Uses `master-data.read/write` because supplier-specific keys do not exist yet. |
| Logistics | PASS | New `logistics.read/write` permissions added and assigned to admin. |
| System Admin | PASS | Read APIs require `rbac.read`. |

## Activity Log Findings

Existing `RbacService.logPermissionDenied(...)` writes denied operations to `ActivityLog`:

- action: `PERMISSION_DENIED`
- entity: `Permission`
- module: `rbac`
- metadata: required permissions and path

SYSTEM.2 reused this existing ActivityLog infrastructure. No second audit system was created.

## Frontend Compatibility

The frontend already consumes authenticated API requests and receives `roles`/`permissions` from `auth/me`.

SYSTEM.2 did not redesign frontend permission visibility. Admin retains access because the admin role now has every canonical permission in the backend catalog.

Non-admin frontend UX for permission-denied states remains a later UI concern.

## Remaining Gaps

P0:

- None identified after runtime certification.

P1:

- Split high-impact `*.write` permissions into stable command-specific keys, for example:
  - `inventory.issue`
  - `inventory.adjust`
  - `production.execute`
  - `production.material-issue`
  - `qc.decide`
  - `qc.ncr-disposition`
- Add real Role/User administration APIs before non-admin permission management is practical.
- Add e2e HTTP tests using a controlled low-permission user once SYSTEM.3/SYSTEM.4 provide safe user/role management.

P2:

- Add frontend no-permission panels for non-admin users.
- Add security-denial dashboards from existing `ActivityLog` records.

## SYSTEM.3 Prerequisites

- User create/update/disable APIs.
- Safe password reset/change flows.
- User role assignment APIs with `rbac.write`.
- Audit logging for user/role mutations.

## SYSTEM.4 Prerequisites

- Role create/update APIs.
- Permission assignment matrix APIs.
- Guarded role mutation endpoints using `rbac.write`.
- Prevent removing the last administrative role/user permission set.

## Verification Summary

Verification was run after implementation:

- `pnpm -C apps/backend-api exec prisma validate`: PASS
- `pnpm -C apps/backend-api exec prisma migrate status`: PASS, 84 migrations up to date
- Targeted auth/RBAC tests: PASS
- Targeted Inventory authorization/regression tests: PASS
- Targeted Components authorization/regression tests: PASS
- Targeted Production authorization/regression tests: PASS
- Targeted QC authorization/regression tests: PASS
- `pnpm -C apps/backend-api test`: PASS, 82/82 suites and 257/257 tests
- `pnpm -C apps/frontend test`: PASS, 1/1 file and 2/2 tests
- `pnpm -C apps/backend-api build`: PASS
- `pnpm -C apps/frontend build`: PASS, existing Vite chunk-size warning only
- `git diff --check`: PASS
- Staged files: NONE

No schema change, Prisma model change, migration, stage or commit was performed.
