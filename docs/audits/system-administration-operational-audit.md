# System Administration Operational Audit Report

**Audit Date**: 2026-07-29  
**Auditor**: Principal ERP Platform Architect  
**Scope**: SteelTrack System Administration Module ("Hệ thống")  
**Mode**: **AUDIT ONLY** (No code changes, no DB mutations, no schema modifications)

---

## 1. Executive Summary

A comprehensive operational audit of the SteelTrack System Administration module ("Hệ thống") was performed across all 5 operational tabs:
1. **Người dùng** (Users)
2. **Vai trò & phân quyền** (Roles & Permissions)
3. **Nhật ký hệ thống** (System Audit Log)
4. **Cài đặt** (Settings)
5. **Sao lưu dữ liệu** (Backup & Recovery)

### Key Audit Findings:
- **Users Tab**: **PARTIAL READ-ONLY**. Users are loaded from real database records (`User` + `UserRole` + `Role`), but User CRUD (Create, Edit, Disable/Enable, Delete, Reset Password) is **NOT IMPLEMENTED** on the backend.
- **Roles & Permissions Tab**: **PARTIAL READ-ONLY**. Roles and permissions are queried from real `Role` and `Permission` tables, but Role/Permission mutation endpoints do **NOT** exist.
- **System Audit Log Tab**: **REAL READ-ONLY**. Appends activity logs to the `ActivityLog` database model for authentication and select domain operations. No log exporter endpoint exists.
- **Settings Tab**: **READ-ONLY / ENV-BASED**. Settings displayed in UI are generated from environment variables (`COMPANY_NAME`, `COMPANY_TAX_CODE`, `BACKUP_PATH`) and static configuration. The "Lưu thay đổi" (Save) button is a dummy UI button with no backend endpoint.
- **Backup Tab**: **PLACEHOLDER / FRONTEND ONLY**. No database backup controller, backup service, `pg_dump` execution script, or backup file storage mechanism exists in the backend API.
- **CRITICAL SECURITY GAP (P0)**: Operational core controllers (`inventory.controller.ts`, `production.controller.ts`, `qc.controller.ts`, `logistics.controller.ts`, `components.controller.ts`) enforce **JwtAuthGuard ONLY** or **No Guard at all**. `PermissionsGuard` is attached only on `Projects`, `Attachments`, `Jobs`, and `Workflow`. Any authenticated user can perform arbitrary write/delete operations across Inventory, Production, and QC regardless of assigned roles or permissions.

---

## 2. System Module Map

### Codebase Artifacts:
- **Frontend Pages**:
  - `UsersPage.tsx` (`apps/frontend/src/modules/users/pages/UsersPage.tsx`)
  - `RolesPage.tsx` (`apps/frontend/src/modules/roles/pages/RolesPage.tsx`)
  - `SystemLogsWorkspace.tsx` (`apps/frontend/src/modules/system-logs/workspaces/SystemLogsWorkspace.tsx`)
  - `SettingsPage.tsx` (`apps/frontend/src/modules/settings/pages/SettingsPage.tsx`)
- **Frontend API Clients**:
  - `system.api.ts` (`apps/frontend/src/modules/system/api/system.api.ts`)
  - `users.api.ts` (`apps/frontend/src/modules/users/api/users.api.ts`)
  - `roles.api.ts` (`apps/frontend/src/modules/roles/api/roles.api.ts`)
- **Backend Controllers & Services**:
  - `SystemController` (`apps/backend-api/src/modules/system/system.controller.ts`)
  - `AuthController` & `AuthService` (`apps/backend-api/src/modules/auth/`)
  - `RbacService` & `PermissionsGuard` (`apps/backend-api/src/modules/rbac/`)
- **Prisma Schema Models**:
  - `User`, `RefreshToken`, `Role`, `Permission`, `UserRole`, `RolePermission`, `ActivityLog`, `Notification`

---

## 3. Detailed Audit by Tab

### Tab 1: Users (Người dùng)
- **Database Model**: `User` (`users` table). Fields: `id`, `username`, `email`, `password`, `fullName`, `status` (`ACTIVE`, `DISABLED`), `createdAt`, `updatedAt`.
- **API Endpoint**: `GET /system/users` (Returns array of `User` with `userRoles` and latest `ActivityLog`).
- **Feature Operational Status**:
  - `List Users`: **CANONICAL / REAL**
  - `Search & Filter`: **FRONTEND ONLY** (Client-side filtering)
  - `Create User`: **NOT IMPLEMENTED** (UI dummy button)
  - `Edit User`: **NOT IMPLEMENTED** (UI drawer read-only)
  - `Disable / Enable User`: **NOT IMPLEMENTED** (No API)
  - `Delete User`: **NOT IMPLEMENTED** (No API)
  - `Reset Password`: **NOT IMPLEMENTED** (No API)
  - `Assign / Remove Role`: **NOT IMPLEMENTED** (No API)

---

### Tab 2: Roles & Permissions (Vai trò & phân quyền)
- **Database Models**: `Role` (`roles`), `Permission` (`permissions`), `UserRole` (`user_roles`), `RolePermission` (`role_permissions`).
- **API Endpoints**: `GET /system/roles`, `GET /system/role-matrix`.
- **Feature Operational Status**:
  - `List Roles & Permissions`: **CANONICAL / REAL**
  - `Role Matrix View`: **PARTIAL** (Queries real permissions count, hardcodes module labels)
  - `Create Role`: **NOT IMPLEMENTED** (No API)
  - `Edit Role`: **NOT IMPLEMENTED** (No API)
  - `Assign / Revoke Permissions`: **NOT IMPLEMENTED** (No API)
  - `Delete Role`: **NOT IMPLEMENTED** (No API)

---

### Tab 3: System Audit Log (Nhật ký hệ thống)
- **Database Model**: `ActivityLog` (`activity_logs` table). Fields: `id`, `action`, `entity`, `entityId`, `userId`, `module`, `metadata`, `createdAt`.
- **API Endpoints**: `GET /system/activity-logs`, `GET /system/activity-summary`.
- **Feature Operational Status**:
  - `List Activity Logs`: **CANONICAL / REAL**
  - `Filter Logs`: **CANONICAL / REAL** (Supports `module`, `action`, `entity` query parameters)
  - `Log Exporter`: **NOT IMPLEMENTED** ("Xuất Excel" button in UI is dummy)
  - `IP & Request Tracking`: **MISSING** (No `ipAddress` or `requestId` columns in `ActivityLog`)

---

### Tab 4: Settings (Cài đặt)
- **Database Model**: No `Setting` or `SystemConfig` table exists in Prisma schema.
- **API Endpoint**: `GET /system/overview`.
- **Feature Operational Status**:
  - `Read Settings`: **READ-ONLY / ENV-BASED** (Generates response from `process.env` and hardcoded static objects).
  - `Save Settings`: **NOT IMPLEMENTED** ("Lưu thay đổi" button in UI has no onClick handler and no backend endpoint).

---

### Tab 5: Backup (Sao lưu dữ liệu)
- **Database Model**: None.
- **API Endpoint**: None (Only a static `backup` metadata object inside `GET /system/overview`).
- **Feature Operational Status**:
  - `Trigger Backup`: **NOT IMPLEMENTED**
  - `List Backup History`: **PLACEHOLDER / FRONTEND ONLY**
  - `Download Backup`: **NOT IMPLEMENTED**
  - `Restore Backup`: **NOT IMPLEMENTED**

---

## 4. Authentication Architecture

- **Login Endpoint**: `POST /auth/login` (Zod validated `username`, `password`).
- **Password Hashing**: `bcryptjs` (`bcrypt.compare(dto.password, user.password)`).
- **Token Mechanism**: Access Token (JWT) + Refresh Token (stored in `RefreshToken` table with `tokenHash` and 30-day expiration).
- **Session Info**: `GET /auth/me` returns authenticated user profile, assigned roles, and permission list.
- **Logout Endpoint**: `POST /auth/logout` revokes stored refresh token in database.

---

## 5. Security & Authorization Findings (P0 / P1)

### Critical Findings (P0):
1. **Missing Backend Enforcement on Core Modules**: `PermissionsGuard` is **NOT** applied on `InventoryController`, `ProductionController`, `QcController`, `LogisticsController`, `ComponentsController`, or `MaterialMovementsController`.
   - **Impact**: Any authenticated user can perform receipts, transfers, production order releases, and QC approvals regardless of their assigned role or permissions.
   - **Remediation Required**: Attach `@UseGuards(PermissionsGuard)` and `@Permissions(...)` decorators across all core controllers.

2. **Missing Admin Mutation Endpoints**:
   - No backend endpoints exist to create users, edit user status, reset passwords, create roles, or assign permissions.
   - Admin UI actions are currently non-functional UI placeholders.

---

## 6. System Readiness Matrix

| Tab / Domain | Frontend Completeness | API Completeness | Backend Logic | DB Persistence | Security Enforcement | V1 Readiness |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Users (Người dùng)** | 85% | 20% (Read-only) | 20% | 100% (`User`) | 30% | **35%** |
| **Roles & Permissions** | 80% | 30% (Read-only) | 40% (RBAC service) | 100% (`Role`, `Permission`) | 20% (Not applied) | **30%** |
| **System Audit Log** | 90% | 70% | 70% | 100% (`ActivityLog`) | 80% | **75%** |
| **Settings (Cài đặt)** | 80% | 20% (Read-only) | 10% (ENV only) | 0% (No DB model) | 0% | **20%** |
| **Backup & Recovery** | 70% (Mock UI) | 0% | 0% | 0% | 0% | **0%** |

---

## 7. Action Plan & Scope Breakdown

### CODEX RESPONSIBILITIES (Backend / DB / Security Architecture):
1. **User Management Mutations**: Implement `POST /system/users`, `PATCH /system/users/:id`, `POST /system/users/:id/status`, `POST /system/users/:id/reset-password`.
2. **Role & Permission Management Mutations**: Implement `POST /system/roles`, `PATCH /system/roles/:id`, `POST /system/roles/:id/permissions`, `DELETE /system/roles/:id`.
3. **Backend Authorization Enforcement**: Attach `@UseGuards(PermissionsGuard)` and `@Permissions(...)` across `InventoryController`, `ProductionController`, `QcController`, `LogisticsController`, `ComponentsController`.
4. **Database Setting Model**: Create `SystemSetting` model in `schema.prisma` if dynamic settings persistence is required.
5. **Database Backup Service**: Implement `BackupService` with `pg_dump` execution and storage handling.

### GEMINI RESPONSIBILITIES (Frontend / UI / UX):
1. Bind forms in `UsersPage.tsx` to new User mutation endpoints.
2. Bind permission checkboxes in `RolesPage.tsx` to Role/Permission mutation endpoints.
3. Wire "Xuất Excel" button in `SystemLogsWorkspace.tsx` to log exporter API.
4. Replace dummy Backup tab in `SettingsPage.tsx` with clear status notices or bind to new Backup API once created by Codex.

---

## 8. Verification Results

1. **Prisma Schema Validation**:
   `pnpm -C apps/backend-api exec prisma validate` -> **PASS (Schema valid 🚀)**.
2. **Prisma Migration Status**:
   `pnpm -C apps/backend-api exec prisma migrate status` -> **PASS (84 migrations found, Database schema is up to date!)**.
3. **Backend Build**:
   `pnpm -C apps/backend-api build` -> **PASS (0 errors)**.
4. **Frontend Build**:
   `pnpm -C apps/frontend build` -> **PASS (0 errors)**.
5. **Git Diff Check**:
   `git diff --check` -> **PASS (0 format errors)**.
