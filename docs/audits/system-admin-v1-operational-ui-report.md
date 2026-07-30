# SYSTEM.ADMIN.V1 - Operational Administration & Settings Report

Date: 2026-07-29

Status: IMPLEMENTED - TEST/BUILD PASS - HTTP SMOKE PASS

## Users

The Users workspace now uses real System Administration APIs instead of read-only frontend state.

Implemented:

- `GET /system/users`
- `GET /system/users/:id`
- `POST /system/users`
- `PATCH /system/users/:id`
- `PUT /system/users/:id/roles`
- `POST /system/users/:id/status`
- `POST /system/users/:id/reset-password`

The frontend Users page now supports:

- compact enterprise create-user modal
- real role/profile selection from persisted `Role` rows
- effective permission preview derived from selected roles
- enabled/disabled account state
- detail drawer with identity, status, assigned profiles, effective access, created date and last ActivityLog evidence
- role assignment
- enable/disable
- password reset

Password hashes and refresh token values are never returned to the frontend.

## Roles / Profile

Roles now behave as reusable authorization profiles backed by persisted `Role`, `Permission`, `RolePermission` and `UserRole` records.

Implemented:

- `GET /system/roles`
- `GET /system/permissions`
- `POST /system/roles`
- `PATCH /system/roles/:id`
- `PUT /system/roles/:id/permissions`

The Roles page now supports:

- real role/profile creation
- permission assignment from the canonical SYSTEM.2 permission catalog
- role detail panel
- permission replacement
- effective access preview

No fake roles or frontend-only profiles were introduced.

## Permission Matrix

`GET /system/role-matrix` now derives modules and capabilities from real permission names.

Current catalog:

- 29 canonical permissions
- module grouping based on permission key prefix
- capability labels derived from actual action suffixes such as `read`, `write`, `approve`, `manage`

The UI answers:

- which modules a role can see
- which actions the role can perform

No permission is invented by the frontend.

## Settings Catalog

Added `GET /system/settings-catalog`.

The endpoint returns a real configuration catalog with explicit status classification:

- `REAL_EDITABLE`
- `REAL_READ_ONLY`
- `ENV_READ_ONLY`
- `NOT_IMPLEMENTED`

The Settings page now opens an inspectable catalog modal/drawer for configuration entries instead of inert cards.

## UOM Integration

The Settings catalog reuses the existing UOM capability.

Backend:

- existing `MasterUnit` model
- existing `/master-data/uom` API
- existing UOM service/repository

Frontend:

- `SettingsPage` reads `getUnitsOfMeasure`
- no duplicate UOM model or client was created
- UOM rows display real code, name, symbol, category, base-unit relationship, conversion factor, status and update time where available

UOM routes are now protected with SYSTEM.2 RBAC:

- read requires `master-data.read`
- create/update/delete require `master-data.write`

## System Information

System Information is exposed as safe read-only runtime data through `/system/settings-catalog.safeRuntime` and existing `/system/overview`.

Exposed:

- application name
- environment
- timezone
- server time
- existing company/system overview values

Not exposed:

- `DATABASE_URL`
- JWT secret
- passwords
- SMTP credentials
- private keys
- connection secrets

## System Configuration

No persisted editable settings model exists yet.

SYSTEM.ADMIN.V1 therefore separates:

- effective configuration: read-only
- editable persisted settings: not implemented

No fake React state or localStorage persistence was introduced.

## Activity Log

ActivityLog remains the source of truth for system audit evidence.

New administrative operations write legitimate ActivityLog rows:

- `USER_CREATED`
- `USER_UPDATED`
- `USER_ROLES_CHANGED`
- `USER_ENABLED`
- `USER_DISABLED`
- `USER_PASSWORD_RESET`
- `ROLE_CREATED`
- `ROLE_UPDATED`
- `ROLE_PERMISSIONS_CHANGED`

The System Logs workspace continues to read persisted ActivityLog rows.

## System Overview

System KPIs and summaries use real database counts from:

- `User`
- `Role`
- `Permission`
- `ActivityLog`
- `InventoryItem`
- `Supplier`
- `Project`
- `Component`
- `QcInspection`
- `YardItemPlacement`

No hardcoded chart datasets or random values were introduced.

## Placeholder Removal

Removed or replaced fake operational affordances:

- Users `Thêm người dùng` is now a real backend mutation.
- Roles `Thêm vai trò` is now a real backend mutation.
- Settings catalog cards are inspectable and classified by real backend availability.
- Backup remains a controlled empty state and does not show fake records.

## Backend Changes

Changed or added:

- `apps/backend-api/src/modules/system/dto/role-administration.dto.ts`
- `apps/backend-api/src/modules/system/system-role-admin.repository.ts`
- `apps/backend-api/src/modules/system/system-role-admin.service.ts`
- `apps/backend-api/src/modules/system/system-role-admin.service.spec.ts`
- `apps/backend-api/src/modules/system/system.controller.ts`
- `apps/backend-api/src/modules/system/system.module.ts`
- `apps/backend-api/src/modules/rbac/rbac-enforcement.spec.ts`
- `apps/backend-api/src/modules/master-data/uom/uom.controller.ts`

Previously implemented SYSTEM.2/SYSTEM.3 files remain part of the same dirty working tree and were not reverted.

## Frontend Changes

Changed:

- `apps/frontend/src/modules/system/api/system.api.ts`
- `apps/frontend/src/modules/users/pages/UsersPage.tsx`
- `apps/frontend/src/modules/roles/pages/RolesPage.tsx`
- `apps/frontend/src/modules/settings/pages/SettingsPage.tsx`

The pages use the existing authenticated `lib/api` client.

## Real Data Sources

| Area | Source |
| --- | --- |
| Users | `/system/users`, `/system/users/:id` |
| Roles/Profile | `/system/roles` |
| Permission catalog | `/system/permissions`, `/system/role-matrix` |
| Settings catalog | `/system/settings-catalog` |
| UOM | `/master-data/uom` |
| System overview | `/system/overview` |
| Activity log | `/system/activity-logs`, `/system/activity-summary` |
| Notifications | `/system/notifications` |

## Remaining Unsupported Settings

These remain controlled read-only or empty states because there is no persisted backend contract yet:

- Backup/restore execution
- MFA/device registry/IP whitelist
- password policy administration
- API token registry
- persisted editable company/system settings
- system settings approval workflow

## Backup Status

Backup remains NOT IMPLEMENTED for this sprint.

UI behavior:

- show "Chức năng sao lưu backend chưa được triển khai"
- no fake backup jobs
- no fake backup history
- no local-only restore buttons

Backup/Restore belongs to a future SYSTEM.7 scope.

## RBAC Runtime Evidence

Authenticated HTTP smoke on `127.0.0.1:3105`:

| Check | Result |
| --- | --- |
| No-token `/system/settings-catalog` | 401 |
| Admin `/system/permissions` | 200, 29 permissions |
| Admin creates `SYSTEMV1-ROLE-*` | 201 |
| Admin role matrix | 200 |
| Admin creates `SYSTEMV1-USER-*` | 201 |
| Admin user detail | 200 |
| Controlled user login | 201 |
| Controlled user with `rbac.read` reads `/system/users` | 200 |
| Controlled user without `rbac.write` creates role | 403 |
| Admin reads `/master-data/uom` | 200, 27 rows |
| Controlled user without `master-data.read` reads UOM | 403 |
| Admin reads settings catalog | 200, 10 categories |
| Admin reads role ActivityLog | 200 |

Controlled fixtures were retained for audit traceability:

- `SYSTEMV1-ROLE-*`
- `SYSTEMV1-USER-*`

## Browser / Route Smoke

Real Playwright/browser runner is not installed in `apps/frontend`.

Available route smoke through Vite preview build artifact passed:

| Route | HTTP | Root HTML |
| --- | --- | --- |
| `/users` | 200 | present |
| `/roles` | 200 | present |
| `/settings` | 200 | present |
| `/system-logs` | 200 | present |

## Verification

Passed:

- `pnpm -C apps/backend-api exec prisma validate`
- `pnpm -C apps/backend-api exec prisma migrate status`
- targeted User/Role/RBAC/Auth tests: 5 suites, 18 tests
- `pnpm -C apps/backend-api test`: 86 suites, 271 tests
- `pnpm -C apps/frontend test`: 1 suite, 2 tests
- `pnpm -C apps/backend-api build`
- `pnpm -C apps/frontend build`
- `git diff --check`

Warning:

- `pnpm -C apps/backend-api start:prod` points to `node dist/main`, while the build artifact is `dist/main.js`. Runtime smoke used `node apps/backend-api/dist/main.js` directly.
- Full browser smoke was not run because no Playwright/browser runner is installed.
- Runtime performance monitor warned that two `POST /auth/login` calls exceeded the default 200ms budget during smoke (`360ms` and `257ms`). This is not a functional failure, but should be tracked under auth/runtime performance if it persists.

## Remaining P0

None for SYSTEM.ADMIN.V1.

## Remaining P1

- Persisted editable settings model if operators need real settings mutation.
- Backup/restore backend engine and admin UI.
- Session listing/revocation on top of `RefreshToken`.
- Notification mark-read/archive mutations.
- True browser smoke harness for admin pages.

## Recommendation

Proceed to SYSTEM settings persistence or Backup Center only as a separate scoped sprint. The current V1 administration workspace is operational for Users, Roles/Profile, Permissions, Settings catalog inspection, UOM integration, System Overview and Activity Log without schema change.
