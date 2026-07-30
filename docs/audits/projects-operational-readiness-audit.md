# SPRINT AUDIT.PROJECTS.1 - Project Operational Readiness Audit

Audit date: 2026-07-29
Mode: Audit only. No source, schema, fixture, staging, or commit changes.

## Executive Summary

Projects is partially operational.

The Project Master, WBS/task workspace, templates, project runtime read endpoint, project material return UI, and several project dashboard views are usable. The canonical Components foundation now gives Projects a real relation to `ProjectComponentRequirement`, `ProductionOrder`, and `ComponentInstance`.

The module is not yet V1-operationally complete because the primary Projects runtime still depends heavily on legacy `Component.status`, capped inventory transaction reads, and description-derived metadata. Finished Goods is canonical at `ComponentInstance`, but Yard staging and Logistics dispatch still fall back to component-definition/order-level references, so an individual physical component cannot yet be traced end-to-end through Yard and Delivery with hard database relations.

Overall Projects V1 readiness: 58%.

## 1. Database Relationship Map

### Canonical

| Concept | Prisma model | Actual relation |
|---|---|---|
| Project master | `Project` | Owns `tasks`, `componentRequirements`, `componentInstances`, `inventoryTransactions`, `dispatchOrders` |
| Project component demand | `ProjectComponentRequirement` | `projectId -> Project`, `componentId -> Component`, optional revision/BOM/task, has `requiredQuantity`, `producedQuantity`, `acceptedQuantity`, `installedQuantity` |
| Engineering definition | `Component` | Canonical definition via `lifecycleState`, `componentType`, `profile`, revisions, BOM definitions; still has legacy fields |
| Physical component | `ComponentInstance` | `componentId`, `componentRevisionId`, optional `productionOrderId`, `requirementId`, `projectId`, `projectTaskId`; tracks physical state |
| Production linkage | `ProductionOrder` | Optional `projectId`, `componentId`, `componentRequirementId`, `componentRevisionId`, `bomDefinitionId`; owns `componentInstances` |
| Instance execution | `ComponentInstanceExecution` | Links physical instance to `WorkOrder` and `ProductionExecution` |
| Finished Goods eligibility | `ComponentInstance` + QC/NCR relations | `QC_PASSED` or `USE_AS_IS`, `qcPassedAt`, final QC inspection or approved NCR |
| WBS | `ProjectTask` | Project-owned hierarchy with material/component/resource/cost/inspection relations |

### Partial

| Concept | Prisma model | Gap |
|---|---|---|
| Project material requirement | `ProjectTaskMaterialAllocation` | Stores planned/issued/used/returned quantities, but current Projects runtime also reconstructs from `InventoryTransaction` and only reads recent transaction rows |
| Project component task allocation | `ProjectTaskComponentAllocation` | Links `ProjectTask` to legacy `Component`, not `ComponentInstance`; no instance-level task allocation |
| Yard placement | `YardItemPlacement` | Polymorphic `itemType/itemId` can hold component-related ids, but no FK to `ComponentInstance`; current production staging uses `Component.id` |
| Yard movement | `YardMovement` | Same polymorphic `itemType/itemId`, no hard FK to physical component |
| Dispatch/delivery | `DispatchOrder`, `DispatchItem`, `DispatchEvent` | Dispatch owns transport lifecycle and project relation, but `DispatchItem.componentId` points to `Component`, not `ComponentInstance` |
| Project progress | `ProjectTask`, `ProjectDashboardSnapshot`, runtime calculations | WBS is real; runtime progress still blends legacy component status and production order status |

### Legacy

| Concept | Source | Issue |
|---|---|---|
| Project component inventory/progress | `Component.status` values `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED`, `STOCK` | Mixes physical state with engineering definition; not canonical after Component Domain work |
| Project metadata fields | `Project.description` JSON | `customerName`, `location`, `projectType`, dates, contract value are encoded into description rather than first-class columns |
| Project component return | `POST /projects/:id/components/:componentId/return` | Updates legacy `Component.status` and clears `projectId`; not instance-level |
| Production staging to Yard | `ProductionService.stageToYard` | Places `order.component.id` in Yard and updates `Component.status=STOCK`; not `ComponentInstance` |

### Missing

| Required trace | Missing relation/API |
|---|---|
| `ComponentInstance -> YardItemPlacement` | No FK or canonical placement API requiring `componentInstanceId` |
| `ComponentInstance -> DispatchItem` | `DispatchItem` lacks `componentInstanceId` |
| `ComponentInstance -> ProjectTaskComponentAllocation` | Task allocation points to `Component`, not physical instance |
| Finished Goods delivery trace | No canonical chain from `GET /components/instances/finished-goods` result to Yard placement to dispatch line |
| Project delete/archive endpoint | Repository has delete, service has `remove`, controller exposes no `DELETE /projects/:id` |

## 2. Backend API Inventory

### Projects API

| Method | Route | Service | Database source | RBAC | Status |
|---|---|---|---|---|---|
| GET | `/projects` | `ProjectsService.findAll` | `Project` | `projects.read` | REAL |
| POST | `/projects` | `ProjectsService.create` | `Project`, optional `ProjectTemplate -> ProjectTask` | `projects.write` | REAL/PARTIAL |
| PATCH | `/projects/:id` | `ProjectsService.update` | `Project`; metadata in `description` | `projects.write` | REAL/PARTIAL |
| DELETE | `/projects/:id` | Not exposed | Repository/service delete exists | N/A | MISSING |
| GET | `/projects/runtime` | `ProjectsService.runtimeDashboard` | Project snapshot or runtime fallback | `projects.read` | PARTIAL |
| GET | `/projects/:id/detail/:tab` | `ProjectsService.detailTab` | Project detail snapshots or runtime fallback | `projects.read` | PARTIAL |
| POST | `/projects/:id/components/:componentId/return` | `ProjectsService.returnProjectComponent` | `Component`, `ComponentTimeline`, `ActivityLog`, Outbox | `projects.write` | LEGACY/PARTIAL |
| GET | `/projects/:id/wbs` | `ProjectsService.wbs` | `ProjectTask` tree | `projects.read` | REAL |
| POST | `/projects/:id/wbs` | `ProjectsService.createWbsTask` | `ProjectTask` plus allocations/resources/cost | `projects.write` | REAL |
| POST | `/projects/:id/wbs/generate` | `ProjectsService.generateWbs` | `ProjectTask` | `projects.write` | REAL |
| PATCH | `/projects/:id/wbs/bulk` | `ProjectsService.bulkUpdateWbs` | `ProjectTask` | `projects.write` | REAL |
| PATCH | `/projects/:id/wbs/:taskId` | `ProjectsService.updateWbsTask` | `ProjectTask` plus child tables | `projects.write` | REAL |
| PATCH | `/projects/:id/wbs/:taskId/move` | `ProjectsService.moveWbsTask` | `ProjectTask` | `projects.write` | REAL |
| DELETE | `/projects/:id/wbs/:taskId` | `ProjectsService.deleteWbsTask` | `ProjectTask` and related rows | `projects.write` | REAL |
| POST | `/projects/:id/site-update` | `ProjectsService.siteUpdate` | `ProjectTaskMaterialAllocation`, `ProjectTaskComponentAllocation`, inspection/cost | `projects.write` | PARTIAL |
| GET | `/projects/templates` | `ProjectsService.listTemplates` | `ProjectTemplate` | `projects.read` | REAL |
| POST | `/projects/templates` | `ProjectsService.createTemplate` | `ProjectTemplate`, Outbox | `projects.write` | REAL |
| PATCH | `/projects/templates/:templateId` | `ProjectsService.updateTemplate` | `ProjectTemplate`, Outbox | `projects.write` | REAL |
| POST | `/projects/templates/:templateId/duplicate` | `ProjectsService.duplicateTemplate` | `ProjectTemplate`, Outbox | `projects.write` | REAL |
| POST | `/projects/templates/:templateId/publish` | `ProjectsService.publishTemplate` | `ProjectTemplate` | `projects.write` | REAL |
| POST | `/projects/templates/:templateId/deactivate` | `ProjectsService.deactivateTemplate` | `ProjectTemplate` | `projects.write` | REAL |
| POST | `/projects/templates/:templateId/default` | `ProjectsService.setDefaultTemplate` | `ProjectTemplate` | `projects.write` | REAL |
| GET | `/projects/templates/:templateId/export` | `ProjectsService.exportTemplate` | `ProjectTemplate` | `projects.read` | REAL |
| POST | `/projects/templates/import` | `ProjectsService.importTemplates` | `ProjectTemplate` | `projects.write` | REAL |

### Adjacent canonical APIs needed by Projects

| Method | Route | Service | Database source | RBAC | Status |
|---|---|---|---|---|---|
| GET | `/components/foundation/requirements` | `ComponentDomainFoundationService.listRequirements` | `ProjectComponentRequirement` | `components.read` | REAL |
| POST | `/components/foundation/definition-requirements` | `ComponentDomainFoundationService.createDefinitionRequirement` | `Component` + `ProjectComponentRequirement` | `components.write` | REAL |
| GET | `/components/foundation/instances` | `ComponentDomainFoundationService.listInstances` | `ComponentInstance` | `components.read` | REAL |
| GET | `/components/instances/finished-goods` | `FinishedGoodsEligibilityService.list` | `ComponentInstance`, QC/NCR | `components.read` | REAL |
| POST | `/production/:id/stage-to-yard` | `ProductionService.stageToYard` | `ProductionOrder`, QC, `YardItemPlacement`, legacy `Component` | `production.write` | LEGACY/PARTIAL |
| POST | `/yard/placements` | `YardService.placeItem` | `YardItemPlacement` | JWT only | PARTIAL/RBAC GAP |
| GET | `/yard/search` | `YardService.search` | `YardItemPlacement`, `YardMovement` | JWT only | PARTIAL/RBAC GAP |
| POST | `/logistics/dispatch-orders/suggest` | `LogisticsService.suggestDispatchItems` | `ProjectTaskMaterialAllocation`, `ProjectTaskComponentAllocation` | `logistics.write` | PARTIAL |
| POST | `/logistics/dispatch-orders` | `LogisticsService.createDispatchOrder` | `DispatchOrder`, `DispatchItem` | `logistics.write` | REAL/PARTIAL |
| PATCH | `/logistics/dispatch-orders/:id/receive` | `LogisticsService.receive` | Dispatch + Inventory export + project allocation reconcile | `logistics.write` | REAL/PARTIAL |

## 3. Frontend Operational Audit

### Active routes

Router maps these visible routes to `ProjectsPage`:

- `/projects`
- `/projects/list`
- `/projects/templates`
- `/projects/progress`
- `/projects/components`
- `/projects/materials`
- `/projects/costs`
- `/projects/documents`
- `/projects/logs`
- `/projects/reports`

`ProjectsWorkspacePage.tsx` returns `null`; `ProjectOverviewPage.tsx` returns `<div />`; they are not active route targets in the current router.

### Frontend source classification

| Area | Source | Classification | Notes |
|---|---|---|---|
| Main dashboard/list/progress/cost/doc/log tabs | `GET /projects/runtime` | DERIVED REAL DATA/PARTIAL | Real endpoint, but runtime source mixes canonical and legacy calculations |
| Project create/edit dialog | `POST /projects`, `PATCH /projects/:id` | REAL/PARTIAL | Project CRUD works, but code is client-generated and extended fields are stored in description JSON |
| Template workspace | `/projects/templates*` | REAL | CRUD-like template management backed by API |
| WBS workspace | `/projects/:id/wbs*` | REAL | Create, update, move, delete, bulk, generate backed by API |
| Project detail drawer | `/projects/:id/detail/:tab` | DERIVED REAL DATA/PARTIAL | Snapshot or fallback; still uses legacy component rows |
| Materials tab | Runtime `materials` from project inventory transactions + allocations | PARTIAL | Uses only project-linked inventory transactions from runtime fallback, capped to 500 in repository |
| Material return action | `POST /inventory/returns` with `SITE_RETURN` | REAL/PARTIAL | Real return request; project material requirement authority remains partial |
| Components tab | Runtime `components` from `Component.projectId` and `Component.status` | LEGACY/PARTIAL | Not canonical `ComponentInstance` or Finished Goods source |
| Component deliver/install actions | `/components/:id/deliver`, `/components/:id/install` | LEGACY/PARTIAL | Operates on legacy Component, not ComponentInstance |
| Component return action | `/projects/:id/components/:componentId/return` | LEGACY/PARTIAL | Clears legacy `Component.projectId`, sets `READY` |
| Search/filter/reset | Local filter over runtime rows | REAL UI, local derived | No backend query for each tab |
| Search buttons in Materials/Components filter bars | `onClick={() => {}}` | DEAD ACTION | Visual button does nothing because filtering is already reactive |
| Smart Return button in site mode | toast only | PLACEHOLDER/DEAD ACTION | Explicitly says future sprint |
| Task link/export/return buttons | toast only | PLACEHOLDER/DEAD ACTION | `TaskResourceActions` messages point to future API |
| Legacy `ProjectsTable.tsx` | hardcoded `CT-001` etc. | HARDCODED/DEAD | Not routed, but should be removed or quarantined |
| Legacy `ProjectTimeline.tsx` | hardcoded `PJ-001` etc. | HARDCODED/DEAD | Not routed, but dangerous if imported later |
| Reports charts | Derived from runtime rows | DERIVED REAL DATA/PARTIAL | Real input, but runtime semantics are not fully authoritative |

## 4. Project to Component Traceability

Can the system answer from canonical data?

| Question | Current answer |
|---|---|
| Project X requires which component definitions? | YES via `ProjectComponentRequirement.projectId -> componentId` |
| How many required? | YES via `ProjectComponentRequirement.requiredQuantity` |
| How many production orders? | YES via `ProductionOrder.componentRequirementId` and/or `projectId` |
| How many ComponentInstances created? | YES via `ComponentInstance.requirementId` / `productionOrderId` / `projectId` |
| How many completed? | PARTIAL via `ComponentInstance.state` and execution state; needs canonical read screen |
| How many QC passed? | YES via `ComponentInstance.state=QC_PASSED` or finished goods API |
| How many in Finished Goods? | YES via `GET /components/instances/finished-goods` |
| How many in Yard? | NO authoritative instance-level answer. Yard can store polymorphic `itemId`, but current production staging stores `Component.id` |
| How many delivered? | NO authoritative instance-level answer. Dispatch line points to `Component`, not `ComponentInstance` |

Semantic mismatch: Projects UI currently displays components from `Component.projectId` and `Component.status`, not from `ProjectComponentRequirement` plus `ComponentInstance`.

## 5. Project to Material Audit

The current implementation separates some concepts, but the Projects runtime still blurs them.

| Concept | Current source | Readiness |
|---|---|---|
| Engineering/project material requirement | `ProjectTaskMaterialAllocation.plannedQty` | PARTIAL |
| Inventory reservation | Inventory/production reservation models, not project-owned | MISSING from Projects UI |
| Inventory issue to project | `InventoryTransaction.projectId`, logistics receive creates `EXPORT` | PARTIAL |
| Production consumption | Production material consumption/ledger | Outside Projects; not confused in schema |
| Project shipment | `DispatchOrder` / `DispatchItem` | PARTIAL |
| Project material return | `ReturnRequest` with `flowType=SITE_RETURN` | REAL/PARTIAL |

`ProjectsService.runtimeDashboardRuntime` builds material rows from `InventoryTransaction.findMany(... take: 500)` and then overlays task allocation/return metrics. This is not authoritative for a large or long-running project.

## 6. Finished Goods to Yard Audit

Known OPS3C gap remains open.

Canonical Finished Goods source:

- `GET /components/instances/finished-goods`
- Backed by `ComponentInstance` with final QC/NCR eligibility.

Current Yard handoff:

- `POST /production/:id/stage-to-yard`
- Requires production order completed and approved QC.
- Calls `yardService.placeItem` with:
  - `itemType: COMPONENT`
  - `itemId: order.component.id`
  - `itemCode: order.component.code`
  - quantity from `ProductionOrder.quantity`
  - metadata contains `productionOrderId`
- Then updates legacy `Component.status=STOCK` and stores yard zone/slot fields on `Component`.

Result:

- Individual `ComponentInstance` cannot be placed into Yard through the current production staging command.
- `YardItemPlacement` has no `componentInstanceId` FK.
- `YardMovement` has no `componentInstanceId` FK.
- `DispatchItem` has no `componentInstanceId` FK.
- Trace `ComponentInstance -> Yard -> Shipment -> Project` is not currently canonical.

## 7. Logistics Boundary

Projects owns:

- Project master lifecycle.
- WBS/tasks.
- Project requirements/acceptance records.
- Site receipt and project acceptance semantics through `ProjectCommandService`.
- Project material/task planning records.

Logistics owns:

- Dispatch order.
- Vehicle/driver/loading/departure/arrival/receive/complete/cancel lifecycle.
- Transport status and dispatch events.

Boundary risk:

- `LogisticsService.suggestDispatchItems` suggests components from `ProjectTaskComponentAllocation.componentId`, not finished `ComponentInstance`.
- `DispatchItem.componentId` is definition-level/legacy component.
- Logistics receive reconciles material allocations and creates Inventory export for material items, but component delivery is not instance-authoritative.

## 8. RBAC Audit

Static RBAC:

- `ProjectsController` uses `@UseGuards(JwtAuthGuard, PermissionsGuard)` and class-level `@RequirePermissions('projects.read')`.
- Write endpoints use `@RequirePermissions('projects.write')`.
- `rbac-enforcement.spec.ts` asserts Projects controller maps to `projects.read` and create maps to `projects.write`.
- Adjacent Components, Production, Logistics controllers use permission guards for relevant endpoints.

Runtime RBAC:

- Runtime HTTP test was not possible because no backend server was listening at `127.0.0.1:3000`; `curl` returned HTTP code `000`.
- No-token/403/authorized runtime checks were therefore not executed.

Boundary RBAC gap:

- `YardController` currently uses `@UseGuards(JwtAuthGuard)` only and does not use `PermissionsGuard` / `@RequirePermissions`.
- Since Yard is part of the Project finished-goods handoff path, this is a cross-module authorization gap.

## 9. Real Runtime Data Counts

Read-only Prisma query results from the current DB:

| Entity | Count |
|---|---:|
| projects | 14 |
| project component requirements | 25 |
| production orders | 29 |
| component definitions | 29 |
| component instances | 35 |
| finished goods eligible instances | 2 |
| yard placements | 0 |
| dispatch orders | 0 |
| dispatch items | 0 |
| project-linked inventory transactions | 31 |
| project task material allocations | 0 |
| project task component allocations | 0 |

Project statuses:

- `PLANNING`: 4
- `ACTIVE`: 10

Requirement statuses:

- `DRAFT`: 25

Component instance states:

- `PLANNED`: 24
- `IN_PRODUCTION`: 3
- `PRODUCED_WAITING_QC`: 4
- `QC_FAILED`: 2
- `QC_PASSED`: 2

Yard placements and dispatch orders are both zero in the current runtime data, so the downstream Project delivery path has no live operational evidence yet.

## 10. Readiness Score

| Area | Score | Reason |
|---|---|---|
| Project Master | GREEN | CRUD create/read/update exists; status enum exists; missing delete/archive route |
| Requirements | YELLOW | Canonical `ProjectComponentRequirement` exists and has data, but Projects UI/runtime does not use it as primary source |
| Material linkage | YELLOW | WBS material allocation and project inventory transactions exist; authoritative reservation/issue/consumption separation is incomplete in Projects UI |
| Component linkage | YELLOW | Canonical requirement/order/instance chain exists; Projects UI still uses legacy `Component.status` |
| Production linkage | GREEN/YELLOW | `ProductionOrder` links to project, requirement, component, instances; Projects runtime partly reads orders, UI lacks canonical instance execution detail |
| Finished Goods linkage | YELLOW | Canonical API exists; Projects UI/dashboard has not migrated |
| Yard linkage | RED | Current staging is order/component-level, not `ComponentInstance`-level; no runtime placements |
| Logistics linkage | RED | Dispatch exists, but no instance-level dispatch line; no runtime dispatch data |
| Frontend operational integrity | YELLOW | Main Projects page is usable, but contains dead buttons, legacy component semantics, stubs, and dead hardcoded components |
| RBAC | YELLOW | Projects endpoints protected; runtime not verified; Yard boundary lacks permissions guard |

Overall Projects V1 readiness: 58%.

## P0

1. Replace Projects component inventory/progress source with canonical `ProjectComponentRequirement` + `ComponentInstance` read models.
2. Add canonical instance-level Yard placement/handoff API or enforce `YardItemPlacement.itemId = ComponentInstance.id` for finished goods with validation.
3. Add instance-level Logistics dispatch support (`DispatchItem.componentInstanceId` or equivalent additive bridge) before claiming Project delivery traceability.
4. Remove or disable dead UI actions that look operational: project material/component search buttons with empty handlers, task link/export/return toast-only actions, Smart Return toast-only action.
5. Add permissions enforcement to Yard endpoints before using Yard as part of Project operational workflow.

## P1

1. Add Project runtime endpoint/view that exposes canonical requirement counts, produced counts, QC passed counts, finished goods counts, yarded counts, delivered counts.
2. Replace `InventoryTransaction take: 500` material derivation with a real project material read model or paginated/aggregated query.
3. Promote Project extended fields (`customerName`, `location`, `projectType`, contract dates/value) out of `description` JSON when schema gate is approved.
4. Add Project archive/cancel/delete policy endpoint; do not expose hard delete blindly.
5. Remove or quarantine unused hardcoded Projects components: `ProjectsTable.tsx`, `ProjectTimeline.tsx`.
6. Add runtime RBAC smoke coverage for Projects no-token, insufficient permission, and authorized user.

## P2

1. Project historical/as-of progress reconstruction.
2. Forecasting and risk prediction from delivery/production/QC timelines.
3. Project BI drilldown from executive dashboard into canonical Project requirement and instance lineage.
4. Full task-level material reservation and component instance assignment UI.

## Recommended Implementation Order

1. Canonical Projects read model: Requirement -> ProductionOrder -> ComponentInstance -> FinishedGoods.
2. Projects frontend migration for Components tab and Project detail Components tab.
3. FinishedGoods -> Yard canonical handoff with instance-level validation.
4. Yard RBAC enforcement.
5. Logistics instance-level dispatch line and receive/complete traceability.
6. Project material read model cleanup and removal of `take: 500` runtime shortcut.
7. UI cleanup for dead buttons and legacy hardcoded components.

## Can This Be Fixed UI-Only?

Partial.

The Projects UI can stop showing legacy/incorrect metrics and can display canonical requirements/instances using existing APIs. However, true Project -> Finished Goods -> Yard -> Logistics traceability cannot be completed UI-only because the current Yard/Dispatch data model and APIs do not provide enforced `ComponentInstance` handoff relations.

## Verification

- Source/schema changes: none.
- Runtime fixture creation: none.
- DB read-only count query: PASS.
- HTTP RBAC runtime check: NOT RUN, backend server not listening on `127.0.0.1:3000`.
- `git diff --check`: pending at report creation time.
- Staging/commit: not performed.
