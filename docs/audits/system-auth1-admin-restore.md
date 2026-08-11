# SYSTEM.AUTH.1 - Restore Administrator Account

Date: 2026-08-10  
Status: **PASS - ADMINISTRATOR ACCESS RESTORED**

## Existing Account Audit

The preserved account already existed, so no duplicate user was created.

| Property | Evidence |
| --- | --- |
| Username | `admin` |
| User ID | `cmphrrsgk0000pvi92vsmtay2` |
| Status | `ACTIVE` |
| Lock state | No independent lock field exists in the current canonical `User` model; the account is not `BLOCKED` |
| Canonical administrator role | `admin` (`role_admin`) |
| Role permissions | 29 |
| Total canonical permissions | 29 |

The database role is named `admin`; this is the canonical Administrator role
used by SteelTrack. It contains every permission currently registered in the
permission catalog.

## Password Restoration

The password was changed through the existing authenticated endpoint:

```text
POST /system/users/cmphrrsgk0000pvi92vsmtay2/reset-password
```

This route is protected by `rbac.write` and delegates to
`SystemUserAdminService.resetPassword()`. The service hashes the submitted
password with bcrypt, revokes active refresh tokens and writes
`USER_PASSWORD_RESET` to `ActivityLog` in one transaction.

No password hash was written directly, no authentication bypass was used and no
schema or migration change was made.

Result: HTTP `201`.

## Token Revocation Evidence

The refresh token issued before reset was submitted to `POST /auth/refresh`
after the reset and received HTTP `401`. Database evidence after the complete
smoke:

| Token state | Count |
| --- | ---: |
| Revoked historical/test tokens | 2 |
| Active token from the successful post-reset login | 1 |

The active token is new and was created only after authentication with the
restored password.

## Authentication Evidence

```text
POST /auth/login -> 201
GET /auth/me     -> 200
```

`GET /auth/me` returned:

- username: `admin`
- status: `ACTIVE`
- roles: `["admin"]`
- permissions: 29/29

One `USER_PASSWORD_RESET` audit record exists for the account.

## Module Authorization

The new JWT was used against representative read boundaries for every active
platform area:

| Module | Endpoint | Result |
| --- | --- | --- |
| System | `GET /system/settings-catalog` | 200 |
| Master Data | `GET /master-data/domains` | 200 |
| Inventory | `GET /inventory/items` | 200 |
| Components | `GET /components/foundation/instances` | 200 |
| Production | `GET /production` | 200 |
| QC | `GET /qc/cockpit` | 200 |
| Projects | `GET /projects` | 200 |
| Yard | `GET /yard/dashboard` | 200 |
| Logistics | `GET /logistics/dispatch-orders` | 200 |
| Suppliers | `GET /suppliers` | 200 |
| Executive BI | `GET /dashboard/executive-cockpit` | 200 |
| Historical Dashboard | `GET /history/jobs` | 200 |

## Verification

- Existing User/Auth service path used: PASS.
- Account active and unblocked: PASS.
- Administrator role assigned: PASS.
- Complete permission catalog assigned: PASS, 29/29.
- Old refresh token rejected: PASS, HTTP 401.
- Login with restored credentials: PASS, HTTP 201.
- `/auth/me`: PASS, HTTP 200.
- Module access: PASS, 12/12 representative boundaries.
- Password reset ActivityLog: PASS.
- Backend build: PASS (unchanged source, previously verified after RESET.1).
- Frontend build: PASS (unchanged source, previously verified after RESET.1).
- `git diff --check`: PASS after report update.
- Stage/commit: none.

