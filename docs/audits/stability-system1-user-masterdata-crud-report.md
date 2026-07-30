# STABILITY.SYSTEM.1 - User Creation Fix & Master Data CRUD Workspace

Date: 2026-07-29

Status: IMPLEMENTED - HTTP SMOKE CERTIFIED

## Scope

This sprint fixed the operational 400 error in System Users creation and
completed the Settings Master Data CRUD workspace surface for:

- User Administration
- InventoryCategory / Danh mục vật tư
- InventoryItem / Vật tư chính
- MaterialType / Quy cách / Nhóm kỹ thuật
- MasterUnit / Đơn vị & Quy đổi

No schema change, migration, backend redesign, frontend route redesign, stage or
commit was performed.

## User Creation Root Cause

The frontend create-user modal posted to:

- URL: `POST /system/users`
- Body shape:
  - `username`
  - `fullName`
  - `email`
  - `password`
  - `roleIds`

The backend DTO requires:

- `username`: 3-64 characters
- `password`: 8-160 characters
- `email`: valid email if supplied
- `roleIds`: at least one role

The frontend only blocked an empty password. It allowed passwords shorter than
8 characters and then rendered the generic Axios message
`Request failed with status code 400`.

Runtime evidence:

```json
{
  "url": "/system/users",
  "method": "POST",
  "requestBody": {
    "username": "BAD-STABILITY-SYSTEM1-USER-11543544",
    "fullName": "Bad Password",
    "email": "",
    "password": "***",
    "roleIds": ["role_admin"]
  },
  "status": 400,
  "response": {
    "message": "Validation failed",
    "errors": [
      {
        "code": "too_small",
        "minimum": 8,
        "path": ["password"],
        "message": "Too small: expected string to have >=8 characters"
      }
    ]
  }
}
```

## Fix

Frontend now mirrors the backend contract before submitting create-user
requests:

- username must contain at least 3 characters
- password must contain at least 8 characters
- email must be valid when supplied
- at least one role must be selected

API validation errors are normalized into useful Vietnamese copy, including:

- `Mật khẩu phải có ít nhất 8 ký tự.`
- `Vui lòng chọn ít nhất một vai trò.`
- `Email không đúng định dạng.`
- `Bạn không có quyền thực hiện thao tác này.`

## Runtime User Certification

Fixture prefix: `STABILITY-SYSTEM1`

HTTP-only smoke result:

| Check | Result |
| --- | --- |
| Create valid user | PASS, `201` |
| Created user listed in `/system/users` | PASS |
| Detail role is correct | PASS |
| Created user login | PASS, `201` |
| User without `master-data.read` reaches master data | PASS, `403` |
| Change role to admin | PASS, `200` |
| Effective permissions update after re-login | PASS |
| Disable user | PASS, `201` |
| Disabled login blocked | PASS, `401` |
| Old token blocked after disable | PASS, `401` |
| Re-enable user | PASS, `201` |
| Re-enabled login | PASS, `201` |

## Master Data CRUD Matrix

| Workspace | Source | Create | Edit | Enable / Disable | Delete Safety |
| --- | --- | --- | --- | --- | --- |
| Users | `/system/users` | PASS | PASS | PASS | No delete API by design |
| InventoryCategory | `/master-data/material-categories` | PASS | PASS | PASS | Deactivate only |
| InventoryItem | `/inventory/items` | PASS | PASS | PASS | Soft delete only when safe |
| MaterialType | `/master-data/material-types` | PASS | PASS | PASS | Deactivate only |
| MasterUnit | `/master-data/uom` | PASS | PASS | PASS | Deactivate only |

## Material Master Semantics

`InventoryItem` is treated as Material Master identity, not stock.

Runtime evidence for a newly created material:

```json
{
  "code": "STABILITY-SYSTEM1-MAT-11543544",
  "category": "STABILITY Category Updated",
  "materialType": "STABILITY Type Updated",
  "unit": "S1U11543544",
  "currentStock": 0,
  "bomUsageCount": 0
}
```

Creating Material Master through `/inventory/items` did not create inventory
quantity, ComponentInstance, ProductionOrder or stock movement.

## Delete Safety

Category, MaterialType and MasterUnit use existing deactivate endpoints.

Material Master uses the existing soft-delete endpoint. The Settings UI blocks
the action when a material has current stock or BOM references. Backend still
enforces its own safe-delete checks.

## RBAC Certification

| Scenario | Endpoint | Result |
| --- | --- | --- |
| No token | `GET /master-data/material-categories` | `401` |
| Valid token without master-data permission | `GET /master-data/material-categories` | `403` |
| Admin create category | `POST /master-data/material-categories` | `201` |

## Activity Log Evidence

`/system/overview.recentActivities` exposed recent activity through HTTP. It
confirmed user status transitions and material mutations:

- `USER_DISABLED`
- `USER_ENABLED`
- `MATERIAL_CREATED`
- `MATERIAL_UPDATED`

There is no `/system/activity` endpoint in the current backend; direct activity
log inspection remains available through existing System Logs APIs.

## Backup Visibility

Backup was removed from current Settings tabs and sidebar navigation. Source
code/backend placeholders were not deleted. This keeps unsupported Backup
capability out of the operator UI while preserving future implementation paths.

## Files Changed

- `apps/frontend/src/modules/users/pages/UsersPage.tsx`
- `apps/frontend/src/shared/api/api-error-message.ts`
- `apps/frontend/src/modules/settings/pages/SettingsPage.tsx`
- `apps/frontend/src/modules/inventory/api/inventory.api.ts`
- `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
- `apps/backend-api/src/modules/inventory/inventory.service.ts`
- `docs/audits/stability-system1-user-masterdata-crud-report.md`
- `docs/ai-state/CHANGELOG_AI.md`
- `docs/ai-state/CURRENT_STATE.md`
- `docs/ai-state/PROJECT_STATUS.md`
- `docs/ai-state/NEXT_TASKS.md`
- `docs/ai-state/modules/system.md`

## Browser Smoke

Browser smoke was not executed because no browser harness was used in this
session. The sprint was certified through frontend build and authenticated HTTP
runtime smoke.

## Verification

- `pnpm -C apps/backend-api exec prisma validate`: PASS
- `pnpm -C apps/backend-api exec prisma migrate status`: PASS
- `pnpm -C apps/backend-api test -- system-user-admin`: PASS
- `pnpm -C apps/backend-api test -- rbac-enforcement`: PASS
- `pnpm -C apps/backend-api test -- inventory`: PASS
- Master Data targeted unit suite: NOT PRESENT; covered by RBAC targeted tests
  and authenticated HTTP CRUD smoke.
- `pnpm -C apps/backend-api test`: PASS, 86 suites / 271 tests
- `pnpm -C apps/frontend test`: PASS, 1 suite / 2 tests
- `pnpm -C apps/backend-api build`: PASS
- `pnpm -C apps/frontend build`: PASS
- Runtime HTTP smoke: PASS
- `git diff --check`: PASS
- staged files: NONE

Full verification is recorded in the final assistant summary for this sprint.

## Remaining P1

- Add a Playwright browser smoke for `/users` and `/settings?tab=master`.
- Add frontend max-length hints for UOM code (`<=32`) if operators commonly use
  long generated codes.
- Consider exposing a direct System ActivityLog HTTP endpoint if operators need
  filtered activity evidence outside the System Logs workspace.
