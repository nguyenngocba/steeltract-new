# SPRINT PROJECTS.2 - Canonical Project Execution Read Model

Audit date: 2026-07-29
Mode: Implementation. No schema, migration, Yard, Logistics, Inventory, or broad UI redesign.

## BEFORE

`AUDIT.PROJECTS.1` found Projects was operationally partial:

- `ProjectsService.runtimeDashboardRuntime()` calculated project progress from legacy `Component.status` values such as `READY`, `DELIVERED`, and `INSTALLED`.
- Project materials runtime used project-linked `InventoryTransaction` rows with `take: 500`, which is not correctness-safe for long-running projects.
- Project detail `components` tab used legacy `Component.projectId` / `Component.status`, not physical `ComponentInstance`.
- `ProductionService.stageToYard()` placed `Component.id` into Yard and updated `Component.status=STOCK`; it did not place individual `ComponentInstance` rows.
- `DispatchItem.componentId` still points to component definition / legacy component, not physical instance.

## CANONICAL MODEL

Implemented one canonical execution read model based on:

Project
-> ProjectComponentRequirement
-> ProductionOrder
-> ComponentInstance

The new read model does not use `Component.status`, remarks/free text, frontend reconstruction, or paginated transaction lists as physical execution source-of-truth.

## API

New endpoint:

`GET /projects/:id/execution`

Controller:

- `ProjectsController.execution`
- Guarded by existing Projects RBAC: `JwtAuthGuard`, `PermissionsGuard`, `projects.read`

Service:

- `ProjectsService.executionReadModel(projectId)`

Repository:

- `ProjectsRepository.findProjectExecutionSources(projectId)`

Response shape:

- `project`
- `summary`
- `requirements[]`

Each requirement exposes:

- requirement identity
- component definition identity
- `requiredQty`
- `orderedQty` / `plannedQty`
- `instanceCount`
- `inProductionQty`
- `completedQty`
- `qcPassedQty`
- `qcFailedQty`
- `finishedGoodsQty`
- production order summary
- physical instance summary
- explicit execution status
- explicit progress denominator and percentages

## REQUIREMENT AGGREGATION

Rules implemented in `project-execution-read-model.ts`:

- `requiredQty` comes from `ProjectComponentRequirement.requiredQuantity`.
- `orderedQty` sums non-cancelled `ProductionOrder.quantity`.
- `plannedQty` mirrors `orderedQty` for V1 because current schema does not expose a separate production planning quantity.
- `instanceCount` counts physical `ComponentInstance` rows under the requirement.
- `inProductionQty` counts `ComponentInstance.state = IN_PRODUCTION`.
- `completedQty` counts physical instances in completed production-side states:
  `PRODUCED_WAITING_QC`, `QC_PASSED`, `QC_FAILED`, `REWORK`, `SCRAPPED`, `USE_AS_IS`.
- `qcPassedQty` counts `ComponentInstance.state = QC_PASSED`.
- `qcFailedQty` counts `ComponentInstance.state = QC_FAILED`.
- `finishedGoodsQty` comes from canonical Finished Goods eligibility, not duplicated Projects logic.
- `productionCompletionPercent = completedQty / requiredQty`.
- `finishedGoodsPercent = finishedGoodsQty / requiredQty`.
- `requiredQty = 0` safely yields 0% and `NO_REQUIREMENTS`.

Execution status is a derived read-model label only:

- `NO_REQUIREMENTS`
- `NO_PRODUCTION`
- `PLANNED`
- `IN_PRODUCTION`
- `WAITING_QC`
- `QC_BLOCKED`
- `FINISHED_PARTIAL`
- `FINISHED`
- `OVER_PRODUCED`

## PRODUCTION

The read model uses `ProductionOrder.componentRequirementId` through Prisma relation `ProjectComponentRequirement.productionOrders`.

Cancelled production orders are retained in the response for visibility but excluded from ordered/planned quantity totals.

Multiple production orders per requirement are supported.

## QC

The read model uses `ComponentInstance.state` for direct QC state counts:

- `QC_PASSED`
- `QC_FAILED`

It does not infer QC from legacy component records.

## FINISHED GOODS

Finished Goods count is delegated to Components domain:

- `FinishedGoodsEligibilityService.countByProjectRequirement(projectId)`
- `FinishedGoodsEligibilityRepository.countByProjectRequirement(projectId)`

This reuses the same predicate as `GET /components/instances/finished-goods`:

- produced instance
- not scrapped
- `QC_PASSED` with final passed/approved QC inspection
- or `USE_AS_IS` with approved acceptable NCR disposition

Projects does not duplicate Finished Goods business rules.

## MATERIALS

No new material accounting engine was built.

This sprint intentionally does not replace project material accounting, reservation, issue, consumption, shipment, or historical reconstruction. Existing materials tabs still require a later source cleanup because they use runtime material rows derived from project-linked inventory transactions plus WBS allocations.

## LEGACY REMOVED

For the new read model:

- No `Component.status` dependency.
- No remarks parsing.
- No frontend-derived physical progress.
- No `InventoryTransaction take: 500`.
- No Yard or Dispatch fake readiness.

Minimal frontend adoption:

- `ProjectsPage` now calls `GET /projects/:id/execution` when a Project detail drawer is open.
- Project overview detail KPI for `Cấu kiện` prefers canonical physical instance count when available.
- Project detail overview/components tabs render a compact `Canonical Execution` panel with requirement/order/instance/Finished Goods metrics.
- The panel explicitly states Yard/Dispatch instance-level handoff is not canonical yet.

## TESTS

Added `project-execution-read-model.spec.ts` covering:

1. One requirement, required 10, no ProductionOrder, no instances.
2. Required 10, multiple ProductionOrders, partial ComponentInstances.
3. Multiple requirements aggregate correctly.
4. Finished Goods instances are counted from external eligibility summary.
5. Project A finished goods summary does not affect Project B source.
6. Zero/empty dataset and divide-by-zero handling.
7. Legacy `Component.status` cannot affect canonical execution result.

Targeted result:

- `pnpm -C apps/backend-api test -- project-execution-read-model.spec.ts` PASS

## RUNTIME

Runtime HTTP API/RBAC certification was not executed because no backend server was listening at `127.0.0.1:3000`; `curl` returned HTTP code `000`.

No runtime fixture was created.

## KNOWN DOWNSTREAM GAP

Not fixed by design in this sprint:

- `ComponentInstance -> Yard = NOT CANONICAL YET`
- `ComponentInstance -> Dispatch = NOT CANONICAL YET`
- `YardController` still lacks `PermissionsGuard`
- `ProductionService.stageToYard()` remains definition/order-level
- `DispatchItem.componentId` remains component-level
- Project materials source cleanup remains separate work

## FILES CHANGED

- `apps/backend-api/src/modules/components/repositories/finished-goods-eligibility.repository.ts`
- `apps/backend-api/src/modules/components/services/finished-goods-eligibility.service.ts`
- `apps/backend-api/src/modules/projects/repositories/projects.repository.ts`
- `apps/backend-api/src/modules/projects/services/projects.service.ts`
- `apps/backend-api/src/modules/projects/services/project-execution-read-model.ts`
- `apps/backend-api/src/modules/projects/services/project-execution-read-model.spec.ts`
- `apps/backend-api/src/modules/projects/projects.controller.ts`
- `apps/frontend/src/modules/projects/api/projects.api.ts`
- `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`
- `docs/audits/projects2-canonical-execution-read-model-report.md`

## VERIFICATION

Completed:

- targeted backend test: PASS
- backend build: PASS
- frontend typecheck: PASS
- full backend tests: PASS (`87` suites, `278` tests)
- frontend build: PASS
- `git diff --check`: PASS
- staged files: none

Warnings:

- Runtime HTTP API/RBAC certification was not executed because no backend
  server was listening at `127.0.0.1:3000`.
- Frontend build emitted the existing large chunk warning for vendor bundles.
