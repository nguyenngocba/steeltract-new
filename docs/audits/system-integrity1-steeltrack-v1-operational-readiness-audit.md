# SYSTEM.INTEGRITY.1 - SteelTrack V1 Operational Readiness Audit

Date: 2026-08-03

Mode: Audit only. No source implementation, schema change, migration, staging
or commit performed.

## Executive Summary

SteelTrack V1 operational readiness is **72%**.

The platform has a strong canonical core in Inventory, Components,
Production, QC, Projects and Yard, with meaningful test/build evidence and
several runtime-certified flows. It is not V1-ready yet because Logistics
write-path conversion to physical `ComponentInstance` identity is still open,
some legacy read models still derive business facts from `Component.status` or
frontend/client calculations, and several registered legacy endpoints rely on
global JWT only instead of canonical RBAC permissions.

Overall classification: **CONDITIONALLY READY FOR INTERNAL STAGING, NOT READY
FOR V1 FREEZE**.

## Evidence Sources

Source code:

- `apps/backend-api/prisma/schema.prisma`
- `apps/backend-api/src/modules/**`
- `apps/frontend/src/modules/**`

Runtime/database evidence:

- Prisma read-only count audit on local DB.
- Current DB counts:
  - Projects: 14
  - ProjectComponentRequirements: 25
  - Components: 29
  - ComponentInstances: 35
    - `PLANNED`: 24
    - `IN_PRODUCTION`: 3
    - `PRODUCED_WAITING_QC`: 4
    - `QC_PASSED`: 2
    - `QC_FAILED`: 2
  - ProductionOrders: 29
    - `DRAFT`: 8
    - `RELEASED`: 7
    - `IN_PROGRESS`: 13
    - `COMPLETED`: 1
  - QcInspections: 7
  - NCR: 3 open
  - Active Yard placements: 0
  - DispatchItems: 0
  - InventoryItems: 72
  - InventoryLocationStocks: 117
  - InventoryTransactions: 153
  - Users: 7
  - Roles: 6
  - Permissions: 29

Verification evidence from latest state:

- `prisma validate`: PASS
- `prisma generate`: PASS
- `prisma migrate status`: PASS
- Backend tests: PASS, 89 suites / 291 tests
- Frontend tests: PASS, 2 files / 4 tests
- Backend build: PASS
- Frontend build: PASS
- `git diff --check`: PASS

## Phase 1 - Canonical Source Of Truth

| Domain | Status | Evidence | Finding |
|---|---:|---|---|
| Inventory | GREEN | `InventoryPostingService`, `InventoryLocationStock`, `InventoryTransaction`, `InventoryReadModelService` | Transaction/location-stock model is canonical. `InventoryItem.quantity` remains a snapshot/cache fallback in dashboard and UI helpers. |
| Components | YELLOW | `ProjectComponentRequirement`, `ComponentInstance`, `FinishedGoodsEligibilityRepository` | Canonical foundation exists. Some legacy read models still map `Component.status` values such as `STOCK`, `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED`. |
| Production | GREEN/YELLOW | `ProductionOrder`, `ComponentInstanceExecution`, `/production/read-model/cockpit` | Canonical instance execution exists and Components Production now reads the production cockpit read model. Some Production material/BOM calculations still multiply BOM item quantity by `ProductionOrder.quantity`, which is valid for planned requirements but must not be interpreted as physical progress. |
| QC | YELLOW | `qc_inspections.componentInstanceId`, `QcCommandService` final gate | Final QC operates on `ComponentInstance` and updates physical state. Compatibility paths still accept/report `productionOrderId` and `componentId`. |
| Finished Goods | GREEN/YELLOW | `GET /components/instances/finished-goods` | Canonical eligibility is correct. Legacy dashboards/snapshots still contain `ComponentStatus.STOCK/READY` calculations. |
| Yard | YELLOW | `YardItemPlacement.componentInstanceId`, `POST /yard/stage` | Canonical stage-to-yard exists. Runtime DB has 0 active placements, and mutating write smoke was intentionally not executed. |
| Logistics | RED | `DispatchItem.componentInstanceId` exists, but `LogisticsService.normalizeItems()` still requires `componentId` for component dispatch | LOGISTICS.2A schema foundation complete; LOGISTICS.2B write path is not canonical yet. |
| Projects | YELLOW | `GET /projects/:id/execution` uses requirement -> order -> instance | Canonical execution read model exists. Other project runtime/detail paths still use component-level status/timelines and capped inventory transactions. |

## Phase 2 - End-To-End Workflow

| Step | Status | Evidence | Notes |
|---|---:|---|---|
| Material Master | GREEN | Master Data CRUD workspaces and 72 active InventoryItems | Canonical dictionaries in place. |
| Inventory | GREEN | 117 location-stock rows, 153 transactions | Location stock is the operational source of truth. |
| Requirement | GREEN | 25 ProjectComponentRequirements | Canonical requirement model exists. |
| BOM | YELLOW | Component BOM definition and legacy Production BOM coexist | Engineering/Production BOM split still needs UI cleanup. |
| Production Order | GREEN | 29 ProductionOrders; command API and read model | Requirement-bound order flow exists. |
| Execution | GREEN/YELLOW | `ComponentInstanceExecution`, 3 `IN_PRODUCTION` instances | Instance-level execution exists; browser/operator certification still pending. |
| QC | GREEN/YELLOW | `QcCommandService` transitions instance states; 7 inspections | Final physical instance gate exists. Broader QC read-model surfaces still mixed. |
| Finished Goods | GREEN | 2 `QC_PASSED` instances; finished-goods API | Correct canonical eligibility. |
| Yard | YELLOW | `/yard/stage`, 0 active placements | Source and API exist; mutating runtime certification pending. |
| Dispatch | RED | Dispatch service creates component-level dispatch items | ComponentInstance dispatch write path not implemented. |
| Delivery | RED | Logistics delivery currently attached to dispatch order/component identity | Physical delivery state transition is schema-ready but not write-path-ready. |
| Installation | RED/YELLOW | Legacy Component install APIs exist; physical instance installation not complete | Needs ComponentInstance identity conversion. |
| Project Completion | YELLOW | Projects execution read model exists | Downstream Yard/Dispatch/Delivery gaps prevent full authoritative completion. |

## Phase 3 - Read Model Audit

Backend read-models already used:

- Inventory: `GET /inventory/overview`, `GET /inventory/materials`,
  `InventoryLocationStock` based views.
- Components: `GET /components/read-model/list`,
  `GET /components/read-model/overview`,
  `GET /components/instances/finished-goods`.
- Production: `GET /production/read-model/cockpit`.
- Projects: `GET /projects/:id/execution`.
- QC: `GET /qc/read-model/workspace`, `GET /qc/cockpit`.
- Yard: `GET /yard/read-model/workspace`.
- Historical Dashboard: `GET /history/*`.

Frontend/client calculations that remain:

- `WarehouseRealtimeDashboardPage.tsx` derives low-stock and utilization views
  from existing Inventory endpoints. Acceptable for a realtime frontend-only
  cockpit, but not authoritative enough for V1 operational certification.
- `YardPage.tsx` and `YardTabWorkspace.tsx` compute occupancy/chart breakdowns
  in frontend from slots/movements/metrics.
- `HistoricalDashboardPage.tsx` maps snapshot JSON into display KPIs/charts;
  acceptable because source is snapshot payload, but not a rich typed BI read
  model.
- Several analytics/executive dashboard paths still use `component.count()` or
  `Component.status` for component counts/completion.

High-risk read-model debt:

- `DashboardController.cockpit()` counts `Component` rows and
  `ComponentStatus.READY/SHIPPED/DELIVERED/INSTALLED` as completed components.
- `ComponentsReadModelRepository.componentStatuses()` still maps "Tồn kho" to
  `ComponentStatus.STOCK/SHIPPED/DELIVERED/INSTALLED`.
- `ComponentSnapshotRepository.calculateDashboardSnapshots()` still computes
  `stockCount` from `ComponentStatus.STOCK`.
- `ProjectsService` runtime calculations still derive some progress from
  project-linked `components` and component statuses.

## Phase 4 - API Audit

Canonical APIs:

- Auth: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- System/RBAC: `/system/users`, `/system/roles`, `/system/permissions`,
  `/system/role-matrix`
- Master Data: `/master-data/*`, `/master-data/uom`
- Inventory: `/inventory/overview`, `/inventory/materials`,
  `/inventory/items`, `/inventory/transactions`, `/inventory/returns`
- Components canonical: `/components/foundation/definition-requirements`,
  `/components/foundation/requirements`, `/components/foundation/instances`,
  `/components/instances/finished-goods`, `/components/commands/*`
- Production canonical: `/production/commands/*`,
  `/production/read-model/cockpit`
- QC canonical commands: `/qc/commands/inspections/:id/pass`,
  `/qc/commands/inspections/:id/fail`, `/qc/commands/inspections/:id/ncr`,
  `/qc/commands/ncr/:id/*`
- Projects execution: `/projects/:id/execution`
- Yard canonical: `/yard/stage`, `/yard/read-model/workspace`
- Historical Dashboard: `/history/*`

Legacy/deprecated APIs to review:

- `/components/:id/deliver`
- `/components/:id/install`
- `/production/:id/stage-to-yard` returns `410 Gone` but remains registered for
  compatibility.
- `/production/:id/component`
- `/inventory/categories`, `/inventory/material-types`, `/inventory/units`
  duplicate `/master-data/*` concepts.
- `/material-movements`
- Component-level Logistics dispatch through `/logistics/dispatch-orders`
  payload `componentId`.

Dead/placeholder risk:

- `DashboardController` still exposes several older analytics endpoints
  (`/dashboard/stats`, `/dashboard/analytics`, `/dashboard/forecast`,
  `/dashboard/costs`, `/dashboard/procurement`, `/dashboard/anomalies`) that
  need re-audit before V1 freeze.
- Duplicate `yard/controllers/yard.controller.ts` exists but the active
  `YardModule` registers `apps/backend-api/src/modules/yard/yard.controller.ts`.

## Phase 5 - Runtime Certification

| Area | Status | Evidence |
|---|---:|---|
| Inventory | GREEN | Runtime stock/location tests and OPS3A1 certification; current DB has 117 location stocks and 153 transactions. |
| Master Data | GREEN | Runtime HTTP CRUD certified in SYSTEM.MASTERDATA and SYSTEM.1A. |
| RBAC | YELLOW | `rbac-enforcement.spec.ts` covers representative controllers. Some registered legacy controllers lack `PermissionsGuard`. |
| Components DOMAIN.3-5E | GREEN/YELLOW | Backend/runtime smoke exists; browser/operator certification pending for some paths. |
| Production Commands | GREEN/YELLOW | Backend tests and HTTP smoke for execution REST commands; browser certification pending. |
| QC physical gate | YELLOW | Backend command path is canonical; full UI/browser smoke pending. |
| Yard handoff | YELLOW | Read-only runtime smoke passed; mutating Yard fixture intentionally not executed. |
| Logistics | RED | Schema foundation only; component dispatch write path still legacy. |
| Historical Dashboard | YELLOW | API/UI tests and build pass; seeded browser/staging snapshot QA pending. |
| Executive BI | YELLOW | UI present; some source-of-truth and historical correctness gaps remain. |

## Phase 6 - UI Consistency

GREEN:

- Inventory remains the strongest visual canon.
- Components and Production have adopted shared cockpit/Inventory primitives in
  key workspaces.
- Components Production now uses `ModuleDetailDrawer` for `Xem tất cả` and
  right-side canonical details.
- Settings Master Data workspaces are interactive and visually aligned.

YELLOW:

- QC, Yard, Logistics, Projects and Executive BI still contain mixed levels of
  runtime/browser certification.
- Several UI pages still compute charts/KPIs from loaded rows rather than
  receiving typed backend aggregates.
- Logistics UI cannot be considered canonical until dispatch/delivery writes
  use physical `ComponentInstance`.

RED:

- No global authenticated browser route smoke exists for all V1 modules.

## Phase 7 - Security

GREEN:

- `JwtAuthGuard` is registered as a global `APP_GUARD`.
- Auth blocks disabled users at login, refresh, `/auth/me`, and JWT strategy
  validation.
- `PermissionsGuard` enforces `RequirePermissions`.
- `rbac-enforcement.spec.ts` validates representative controller permissions
  for Inventory, Components, Production, QC, Projects, Suppliers/Master Data,
  Logistics, Yard and System.

YELLOW/RED:

- Registered legacy controllers under Inventory and material movements do not
  use `PermissionsGuard`:
  - `inventory/categories` has `POST`, `PUT`, `DELETE`.
  - `inventory/material-types` has `POST`, `PUT`, `DELETE`.
  - `inventory/units` has `POST`, `PUT`, `DELETE`.
  - `inventory/zones` requires review.
  - `material-movements` has `POST`.
- These endpoints are still protected by global JWT, but they are not protected
  by canonical RBAC permissions. This is a V1 P0/P1 security hardening item
  depending on whether routes remain enabled.
- Dashboard endpoints use JWT but not RBAC permission decorators.

## Phase 8 - Technical Debt

P0 technical debt:

- Logistics component dispatch/delivery remains component-definition based.
- Registered legacy write endpoints lack `PermissionsGuard`.

P1 technical debt:

- Dashboard and snapshots still contain `Component.status`/`ComponentStatus`
  semantics for physical quantities.
- Project material runtime derives from project-linked inventory transactions
  in some paths instead of a dedicated material requirement/reservation/issue
  read model.
- Engineering BOM and operational Production BOM concepts coexist in UI/API.
- Browser smoke harness is missing for multi-module authenticated flows.

P2 technical debt:

- Historical dashboard trend richness is limited by snapshot payload shape.
- Vite chunk-size warnings remain.
- Several older modules/controllers exist for broad ERP demos and should be
  reviewed before V1 route freeze.

## Phase 9 - V1 Readiness Score

| Module | Backend | API | Read Model | Runtime | UI | Canonical | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|
| Authentication | 90 | 90 | 80 | 85 | 85 | 90 | 87% |
| RBAC | 82 | 78 | 75 | 75 | 80 | 80 | 78% |
| Master Data | 88 | 86 | 82 | 85 | 88 | 86 | 86% |
| Inventory | 92 | 90 | 88 | 88 | 92 | 90 | 90% |
| Components | 84 | 82 | 78 | 78 | 86 | 78 | 81% |
| Production | 86 | 84 | 82 | 80 | 84 | 82 | 83% |
| QC | 78 | 78 | 72 | 68 | 78 | 74 | 75% |
| Projects | 76 | 76 | 74 | 66 | 78 | 70 | 73% |
| Yard | 78 | 76 | 74 | 64 | 78 | 74 | 74% |
| Logistics | 58 | 55 | 56 | 45 | 62 | 42 | 53% |
| Executive BI | 70 | 68 | 62 | 58 | 76 | 60 | 66% |
| System Administration | 82 | 80 | 76 | 78 | 82 | 78 | 80% |

Weighted overall: **72%**.

## P0

1. Convert Logistics dispatch/delivery write path to physical
   `ComponentInstance` identity:
   - candidate picker from active Yard placements;
   - `DispatchItem.componentInstanceId` write;
   - duplicate prevention by `componentInstanceId`;
   - departure transitions to `IN_TRANSIT`;
   - delivery transitions to `DELIVERED`;
   - Projects reads dispatched/delivered from canonical dispatch evidence.
2. Close RBAC gap on registered legacy write endpoints or remove/deprecate them:
   - `/inventory/categories`
   - `/inventory/material-types`
   - `/inventory/units`
   - `/inventory/zones`
   - `/material-movements`
3. Stop V1 dashboards from reporting physical component inventory/completion
   from `Component.status`, `ComponentStatus.STOCK`, `READY`, `SHIPPED`,
   `DELIVERED`, or `INSTALLED`.

## P1

1. Run authenticated browser smoke across Inventory, Components, Production,
   QC, Projects, Yard, Logistics, Settings, Executive BI and Historical
   Dashboard.
2. Migrate Projects material read-model away from capped transaction-derived
   reconstruction.
3. Finish Engineering BOM vs Production BOM UI/API separation.
4. Certify mutating Yard handoff fixture with an approved disposable runtime DB.
5. Convert remaining QC/reporting surfaces to prefer `ComponentInstance`
   identity where final-product semantics are involved.
6. Define route freeze: canonical APIs, compatibility APIs, deprecated APIs,
   dead APIs.

## P2

1. Reduce Vite chunk-size warnings.
2. Add richer Historical Dashboard daily/range typed trend endpoints.
3. Add granular command permissions such as `production.execute`,
   `qc.decide`, `inventory.issue`.
4. Clean old demo modules/controllers before production packaging.
5. Add more typed backend aggregates for UI charts to reduce frontend
   transformation logic.

## Sprint Forecast To V1

Estimated remaining work to V1 freeze: **5 focused sprints**.

1. **Sprint 1 - Security/RBAC Closure**
   - Guard or remove legacy write endpoints.
   - Add tests proving 401/403/authorized behavior for every registered
     mutation route.
2. **Sprint 2 - Logistics Physical Dispatch**
   - Implement LOGISTICS.2B canonical ComponentInstance dispatch/delivery.
3. **Sprint 3 - Dashboard/Read-Model Source Cleanup**
   - Remove physical component metrics derived from `Component.status`.
   - Route Executive BI and module dashboards to canonical read models.
4. **Sprint 4 - Runtime Browser Certification**
   - Authenticated browser smoke for every V1 route and critical workflow.
5. **Sprint 5 - V1 Freeze & Route Deprecation**
   - Freeze canonical routes.
   - Mark compatibility routes.
   - Produce final V1 certification report.

## Recommended Roadmap After Audit

Recommended sequence:

1. **RBAC legacy endpoint closure** - must happen before more feature work.
2. **Logistics physical ComponentInstance dispatch/delivery** - current largest
   canonical business gap.
3. **Dashboard/read-model source cleanup** - remove misleading executive and
   module-level physical inventory metrics.
4. **QC/Yard browser certification** - certify physical handoff and QC final
   operator workflows.
5. **Executive BI freeze** - after source cleanup.
6. **V1 route freeze** - classify canonical, compatibility, deprecated and
   removed endpoints.

## Final Answer

1. SteelTrack is currently **72% complete for V1 operational readiness**.
2. P0 remaining:
   - Logistics ComponentInstance dispatch/delivery.
   - RBAC closure for registered legacy write endpoints.
   - Remove physical component metrics from `Component.status`.
3. Estimated remaining sprints to V1: **5**.
4. Priority roadmap: **Security/RBAC -> Logistics -> Dashboard source cleanup
   -> QC/Yard/browser certification -> Executive BI -> V1 freeze**.
