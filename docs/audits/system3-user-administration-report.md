# SYSTEM.3 - Canonical User Administration Report

Date: 2026-07-29

Status: IMPLEMENTED - RUNTIME CERTIFIED

## Current User Model

SteelTrack uses the existing canonical security schema:

- `User`: `id`, `username`, `email`, `password`, `fullName`, `status`, `createdAt`, `updatedAt`
- `UserStatus`: `ACTIVE`, `INACTIVE`, `BLOCKED`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `RefreshToken`
- `ActivityLog`

No duplicate profile table or duplicate permission model was introduced.

Passwords are stored in `User.password` as bcrypt hashes. `AuthService` already denied login when `User.status !== ACTIVE`.

SYSTEM.3 additionally enforces active account state during:

- access-token validation
- refresh-token rotation
- current-user resolution

This prevents a disabled account from continuing with an old JWT.

## API Contracts

All endpoints are under `/system` and inherit SYSTEM.2 RBAC.

Read:

- `GET /system/users`
- `GET /system/users/:id`

Write:

- `POST /system/users`
- `PATCH /system/users/:id`
- `PUT /system/users/:id/roles`
- `POST /system/users/:id/status`
- `POST /system/users/:id/reset-password`

### POST /system/users

Required permission: `rbac.write`

Request:

```json
{
  "username": "operator01",
  "email": "operator01@example.com",
  "fullName": "Operator 01",
  "password": "********",
  "roleIds": ["role-id"]
}
```

Response returns sanitized user detail with roles and permissions. It never returns `password`, password hash, refresh token or secrets.

### PATCH /system/users/:id

Required permission: `rbac.write`

Allowed fields:

- `username`
- `email`
- `fullName`

Forbidden by omission:

- `id`
- `password`
- `createdAt`
- `updatedAt`
- refresh token fields
- direct permissions

### PUT /system/users/:id/roles

Required permission: `rbac.write`

Request:

```json
{
  "roleIds": ["role-id"]
}
```

The endpoint replaces `UserRole` assignments transactionally. Direct user-permission assignment is not supported.

### POST /system/users/:id/status

Required permission: `rbac.write`

Request:

```json
{
  "status": "ACTIVE"
}
```

Supported V1 values:

- `ACTIVE`
- `BLOCKED`

`BLOCKED` is the canonical disabled account state for this sprint.

### POST /system/users/:id/reset-password

Required permission: `rbac.write`

Request:

```json
{
  "password": "********"
}
```

The password is hashed through the same bcrypt mechanism as `AuthService`. Existing refresh tokens for the target user are revoked.

## User Creation

Implemented as an atomic operation:

1. Validate unique `username`.
2. Validate unique `email` when provided.
3. Validate all roles exist.
4. Hash initial password with bcrypt.
5. Create `User` with `status = ACTIVE`.
6. Create `UserRole` assignments.
7. Write `ActivityLog` action `USER_CREATED`.

Database unique races are mapped to `409 Conflict`.

## User Editing

`PATCH /system/users/:id` updates only supported account/profile fields and logs `USER_UPDATED`.

No secret field can be updated through this endpoint.

## Role Assignment

`PUT /system/users/:id/roles` replaces role assignments transactionally:

`User -> UserRole -> Role -> RolePermission -> Permission`

The endpoint supports an empty role list for deliberate deprivileging, subject to lockout rules.

It logs `USER_ROLES_CHANGED`.

## Account Status

Enable:

- sets `User.status = ACTIVE`
- logs `USER_ENABLED`

Disable:

- sets `User.status = BLOCKED`
- revokes active refresh tokens
- logs `USER_DISABLED`

Disabled users cannot:

- login
- refresh tokens
- use old access tokens
- resolve `/auth/me`

## Password Administration

Admin reset uses `POST /system/users/:id/reset-password`.

Behavior:

- hashes the new password with bcrypt
- updates `User.password`
- revokes existing refresh tokens
- logs `USER_PASSWORD_RESET`
- never returns or logs plaintext password

## RBAC

All User Administration write APIs require `rbac.write`.

Read APIs continue to require `rbac.read`.

Runtime certification proved:

- no token -> `401`
- valid user token after role removal -> `403`
- administrator token -> operation allowed

No new permission key was required.

## Activity Logging

SYSTEM.3 writes ActivityLog entries:

- `USER_CREATED`
- `USER_UPDATED`
- `USER_ENABLED`
- `USER_DISABLED`
- `USER_ROLES_CHANGED`
- `USER_PASSWORD_RESET`

Log metadata captures actor and target context but never plaintext passwords or password hashes.

## Lockout Protection

Chosen rule:

An administrator is an active user whose effective role permissions include `rbac.write`.

Protection:

- Admin cannot disable their own current account.
- Admin cannot remove their own final admin role.
- System cannot disable the last active `rbac.write` administrator.
- System cannot remove the final active `rbac.write` administrator permission through role replacement.

This protects administrative continuity without introducing a second superuser concept.

## Runtime Certification

Runtime server:

`127.0.0.1:3103`

Controlled fixture retained:

`SYSTEM3-1785305716894`

Certification results:

| Check | Result |
| --- | --- |
| `GET /system/users` without token | 401 |
| Admin reads roles | 200 |
| Admin creates user | 201 |
| Created user appears in `GET /system/users` | PASS |
| Created user login | 201 |
| Created user accesses user detail before role removal | 200 |
| Admin removes fixture roles | 200 |
| Same valid user token after DB role removal | 403 |
| Admin restores fixture role | 200 |
| Admin disables fixture user | 201 |
| Disabled user login | 401 |
| Old token after disable | 401 |
| Admin re-enables fixture user | 201 |
| Admin resets password | 201 |
| Old password login after reset | 401 |
| New password login after reset | 201 |
| User detail password/hash leakage | false |
| ActivityLog contains SYSTEM.3 actions | PASS |

No password value is recorded in this report.

## Frontend Integration Contract

Gemini/frontend can implement Users UI against these backend contracts:

- Create User modal -> `POST /system/users`
- User detail drawer -> `GET /system/users/:id`
- Edit User -> `PATCH /system/users/:id`
- Enable/Disable -> `POST /system/users/:id/status`
- Role assignment -> `PUT /system/users/:id/roles`
- Password reset -> `POST /system/users/:id/reset-password`

Existing `GET /system/users` remains backward-compatible and still returns role information used by the current read-only Users page.

## Remaining Gaps

P0:

- None.

P1:

- SYSTEM.4 Role & Permission Matrix mutation APIs.
- Frontend Users create/edit/detail/role/status/password-reset UX.
- E2E browser tests for Users UI once frontend forms are implemented.
- Explicit session revocation listing if administrators need to see active sessions.

P2:

- Password policy configuration UI.
- MFA placeholder/enablement.
- Email recovery.
- SSO/LDAP/AD integration.

## Verification

- `pnpm -C apps/backend-api exec prisma validate`: PASS
- `pnpm -C apps/backend-api exec prisma migrate status`: PASS, 84 migrations up to date
- Targeted SYSTEM.3/Auth/RBAC tests: PASS, 5 suites and 18 tests
- `pnpm -C apps/backend-api test`: PASS, 85/85 suites and 267/267 tests
- `pnpm -C apps/frontend test`: PASS, 1/1 file and 2/2 tests
- `pnpm -C apps/backend-api build`: PASS
- `pnpm -C apps/frontend build`: PASS, existing Vite chunk-size warning only

Schema change: NONE

Migration: NONE

Stage: NONE

Commit: NONE
