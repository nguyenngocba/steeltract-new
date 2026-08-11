# SYSTEM.RBAC.2 - Enterprise Authorization Matrix

Date: 2026-08-10

Status: **IMPLEMENTED - GREEN WITH ONE CONTROLLED CLEANUP WARNING**

## Scope

This sprint changed authorization only. It did not change Prisma schema,
migrations, business workflows, domain services or API payload contracts.

## Phase 1 - Current RBAC Audit

### Findings before implementation

| Surface | Finding | Severity | Resolution |
|---|---|---:|---|
| Sidebar | Module visibility was mostly static; `adminOnly` also inspected role names | P0 | Filter recursively through the canonical permission engine; remove role-name authorization |
| Routes | Protected routes required authentication but had no module permission boundary | P0 | Add `RoutePermissionGuard` and controlled `/unauthorized` route |
| Shared guards | `PermissionGuard`/`usePermission` were compatibility stubs | P0 | Implement one shared permission layer and re-export legacy imports |
| Toolbars | Primary module actions rendered for every authenticated user | P0 | Gate Inventory, Components, Production, Projects, Planning, QC, Yard and Logistics action bars |
| Record actions | Production material, execution, Yard and Logistics detail commands were visible to view-only users | P0 | Gate canonical commands by action permission |
| Dashboard | All module queries and widgets loaded regardless of access | P0 | Enable queries and render KPI/cards only for accessible domains |
| Role editor | Flat permission list; no presets, row/column operations or clone | P1 | Add grouped matrix, select row/column, clone and nine presets |
| User admin | Create/edit/disable actions ignored action-level permissions | P0 | Hide actions through `users.create`, `users.edit`, `users.disable` |
| API guards | Main domain controllers used broad read/write permissions | P0 | Map representative read/write endpoints to canonical action permissions |
| Inventory dictionaries | Category, unit, material type and zone controllers had JWT only | P0 | Add `PermissionsGuard` with canonical read/write permissions |
| Dashboard API | JWT only | P0 | Require `dashboard.view`; executive endpoints require `dashboard.executive` |
| Legacy auth context | An unused mock `shared/auth/auth.store.tsx` remains in source | P2 | Confirmed no active imports; removal deferred to dead-code maintenance |

## Phase 2 - Canonical Permission Matrix

The catalog contains 87 permissions: 29 retained legacy grants and 58
action-level permissions. Legacy grants remain for backward compatibility and
are evaluated as aliases. A `.read` grant can satisfy only view actions; it
cannot widen into create/edit/delete/command access.

| Module | Canonical actions |
|---|---|
| Dashboard | `dashboard.view`, `dashboard.executive` |
| Inventory | `inventory.view`, `create`, `edit`, `delete`, `receive`, `issue`, `transfer`, `adjust`, `return`, `approve`, `export` |
| Components | `components.view`, `create`, `edit`, `delete`, `release` |
| Production | `production.view`, `create`, `edit`, `release`, `execute`, `complete`, `cancel`, `material-reserve`, `material-issue` |
| QC | `qc.view`, `inspect`, `pass`, `fail`, `rework`, `scrap`, `use-as-is` |
| Projects | `projects.view`, `create`, `edit`, `delete`, `approve` |
| Yard | `yard.view`, `stage`, `move` |
| Logistics | `logistics.view`, `dispatch`, `receive`, `return` |
| Suppliers | `suppliers.view`, `suppliers.edit` |
| Planning | `planning.view` (planning creation reuses existing `production.create`) |
| Settings | `settings.view`, `settings.edit` |
| Users | `users.view`, `create`, `edit`, `disable` |
| Roles | `roles.view`, `roles.edit` |
| Permissions | `permissions.view` |

No action was added without a matching existing route, UI command or business
operation.

### Presets

`Administrator`, `Warehouse Manager`, `Warehouse Operator`, `Production
Planner`, `Production Operator`, `QC Inspector`, `Logistics Coordinator`,
`Project Manager` and `Executive Viewer` are returned by the role-matrix API.
Presets populate the editor and do not bypass ordinary role-permission records.

## Phase 3 - Frontend Authorization Engine

Canonical implementation:

- `shared/permissions/authorization.ts`: pure grant/path evaluation.
- `usePermission()` and `useModuleAccess()`: Zustand-backed hooks.
- `PermissionGate` and `ActionGuard`: hide unauthorized UI; no disabled shell.
- `RoutePermissionGuard`: blocks direct URL entry and redirects to 403.
- Legacy permission imports re-export the canonical implementation.

The sidebar uses the same path policy as the router. `AppSidebar`, nested
`SidebarGroup` and `EnterpriseSidebar` no longer inspect role names.

## Backend Enforcement

Backend remains authoritative. The frontend gate is presentation only.

- Inventory transaction writes use a request-aware guard that maps transaction
  type to `receive`, `issue`, `transfer`, `adjust` or `return`.
- Production command routes map create/release/execute/complete/cancel and
  material reserve/issue independently.
- QC decision routes map inspect/pass/fail/rework/scrap/use-as-is.
- Yard and Logistics physical commands map stage/move/dispatch/receive/return.
- User, role and permission administration use separate actions.
- Master-data writes use `settings.edit`; Inventory pickers retain
  authenticated `inventory.view` reads.

Malformed requests that pass authorization still reach DTO validation and
return 400/404. Unauthorized requests stop at 403.

## Dashboard Authorization

Dashboard queries are conditionally enabled by module access. KPI cards,
business-domain launch cards and analytics blocks are omitted when their module
is unavailable. `dashboard.executive` exposes the cross-domain executive and
historical views; it does not grant System Administration.

## Runtime Evidence

The runtime harness created/synchronized real roles and users through System
REST APIs. Passwords are random and stored only in
`/tmp/system-rbac2-credentials.json` with mode `0600`.

| User | Allowed evidence | Denied evidence |
|---|---|---|
| `warehouse_demo` | Inventory read 200; receive command reached DTO 400 | Production 403; category write 403 |
| `planner_demo` | Production read 200; order create reached DTO 400 | QC 403 |
| `qc_demo` | QC read 200; inspect command passed authorization | Inventory 403 |
| `logistics_demo` | Logistics read 200; dispatch reached DTO 400 | Inventory 403 |
| `pm_demo` | Projects read 200; create reached DTO 400 | QC 403 |
| `executive_demo` | Executive dashboard 200 | System users 403 |
| `admin_demo` | System users 200; role matrix 200; category write reached DTO 400 | None expected |
| anonymous | None | Inventory 401 |

The browser suite logged in as all seven users and verified permission-specific
sidebar groups, an allowed route, a forbidden direct route and representative
primary actions. Result: **7/7 passed**. Screenshots:

- `/tmp/system-rbac2-playwright/warehouse_demo.png`
- `/tmp/system-rbac2-playwright/planner_demo.png`
- `/tmp/system-rbac2-playwright/qc_demo.png`
- `/tmp/system-rbac2-playwright/logistics_demo.png`
- `/tmp/system-rbac2-playwright/pm_demo.png`
- `/tmp/system-rbac2-playwright/executive_demo.png`
- `/tmp/system-rbac2-playwright/admin_demo.png`

## Verification

| Gate | Result |
|---|---|
| Prisma validate | PASS |
| Prisma generate | PASS |
| Prisma migrate status | PASS - 90 migrations, database up to date |
| Backend targeted RBAC | PASS - 5/5 |
| Backend full tests | PASS - 94/94 suites, 314/314 tests |
| Frontend tests | PASS - 3/3 files, 7/7 tests |
| Frontend typecheck | PASS |
| Backend build | PASS |
| Frontend build | PASS |
| Playwright RBAC | PASS - 7/7 |
| `git diff --check` | PASS |
| Staged files | PASS - none |

## Controlled Warning

The first version of the runtime harness used an empty QC create request as an
authorization probe. The existing DTO accepted it, creating two empty READY
inspections:

- `cmsn036j400appv3xz0a9x7nh` / `QC-260810-00001`
- `cmsn05wqn00d0pvjzix7pxzm9` / `QC-260810-00002`

Both have no Component, ComponentInstance, Project, Production Order,
checklist, results, issues, attachments or NCR. The harness now probes a missing
ID and cannot create more records. Cleanup was not forced because the domain
does not expose a delete API and prior runtime rules prohibit direct Prisma
mutation. This is operational cleanup, not an authorization blocker.

## Remaining Debt

- The 29 legacy permissions remain intentionally until all persisted custom
  roles are migrated to action grants.
- Some deep Project template/WBS controls and legacy contextual toast actions
  predate this sprint. Their backend operations remain permission guarded, but
  a future presentation-only pass should map every contextual Project command
  to `projects.edit`/`projects.approve` and remove dead toast-only actions.
- The unused mock auth context can be removed in a dedicated dead-code sprint.

## Result

Canonical backend enforcement, module routing, dynamic navigation, dashboard
scoping, role profiles and the primary operational command surfaces are active.
Runtime proves 401, 403 and successful permission paths with real JWTs.
