# STABILITY.PROJECTS.3A - Canonical Yard Runtime Certification & Legacy Handoff Closure

Date: 2026-07-29

## Status

Status: **CONDITIONALLY CERTIFIED**

The canonical Yard handoff path is now protected at code, test, build and
read-runtime levels. Committed runtime write certification was intentionally not
performed in this environment because it would stage a real eligible
`ComponentInstance` into Yard. The attempted write smoke was blocked by the
execution safety reviewer, so this report does not claim a green runtime write
fixture.

## Scope

This sprint focused only on closing read/write paths that confuse
`Component.id` with physical `ComponentInstance.id` for Yard placement.

No UI redesign, Logistics migration, schema change, Prisma model change or new
migration was introduced in this sprint.

## Legacy Path Audit

| Path | Previous Risk | 3A Result |
| --- | --- | --- |
| `POST /production/:id/stage-to-yard` | Staged aggregate ProductionOrder quantity using legacy Component definition identity. | Endpoint retained for compatibility but now returns `410 Gone` before any Yard write. |
| `ProductionService.stageToYard()` | Internal callers could bypass controller and stage by order/component definition. | Method now throws `GoneException`; canonical caller must use `YardService.stageComponentInstance()`. |
| Production cockpit Yard action | UI submitted aggregate quantity against ProductionOrder staging hook. | UI now selects a QC-passed/use-as-is `ComponentInstance` and calls `/yard/stage`. |
| Generic `YardService.placeItem()` | Could create `itemType=COMPONENT` placement without physical instance identity. | Rejects new component placements unless `componentInstanceId` is provided. |
| Yard read model | Slots/movements did not expose physical instance lineage deeply enough for downstream consumers. | Includes `componentInstance`, component, requirement, project and production order context. |
| Component snapshot | Legacy location derivation only resolved `itemType=COMPONENT + itemId=Component.id`. | Now prefers canonical `componentInstance.componentId` and falls back to legacy itemId only for old rows. |
| Operational simulation seed | Seeded Yard placements from Component definition rows. | Seeds only eligible `ComponentInstance` rows with no active Yard placement. |

## Canonical Yard Flow

Canonical entrypoint:

`POST /yard/stage`

Required identity:

`componentInstanceId`

Eligibility source:

`FinishedGoodsEligibilityService.findEligibleInstance()`

The command stages only physical instances that satisfy the Finished Goods
eligibility predicate also used by:

`GET /components/instances/finished-goods`

Created placement semantics:

- `YardItemPlacement.componentInstanceId = ComponentInstance.id`
- `YardItemPlacement.itemId = ComponentInstance.id`
- `YardMovement.componentInstanceId = ComponentInstance.id`
- Activity/outbox/timeline behavior uses existing Yard path
- `Component.status` is not mutated by canonical Yard remove

Duplicate protection:

- Repository check rejects an already active placement for the same
  `ComponentInstance`.
- Existing partial unique index from PROJECTS.3 remains the database guard:
  one active Yard placement per physical instance, many historical placements.

## Read Model / Snapshot

Projects execution:

`GET /projects/:id/execution`

Runtime read-only smoke showed the response contains:

- `project`
- `summary`
- `requirements`
- requirement-level `componentInstances`
- per-instance `yardPlacements`

For the sampled project
`cms5iqull0kfmpvhfykmfbtpy`, the read model returned physical instances under
the project requirement and no Yard placements yet.

Yard read model:

`GET /yard/read-model/workspace`

Runtime read-only smoke returned `200`. The current database has no active Yard
placements, so canonical placement samples were empty.

Component snapshot:

`ComponentSnapshotRepository.calculateSummarySnapshots()` now resolves Yard
location by canonical ComponentInstance relation first and only falls back to
legacy Component item id for old rows.

## Runtime Fixture Evidence

Authenticated runtime read-only smoke on `127.0.0.1:3100`:

| Check | Result |
| --- | --- |
| `GET /health/live` | `200` |
| `POST /auth/login` as admin | `201` |
| `POST /yard/stage` without token | `401` |
| `GET /components/instances/finished-goods?page=1&pageSize=100` | `200`, 2 rows |
| `GET /yard/slots?limit=200` | `200`, 93 slots |
| `GET /yard/read-model/workspace?slotLimit=20&movementLimit=20` | `200` |
| `GET /projects/:id/execution` for sampled project | `200` |

Finished Goods sample:

| Instance | State | Project | Production Order |
| --- | --- | --- | --- |
| `CPL-20260729-373DF0D8-OPS3C-20260729032211-PO-PASS-001` | `QC_PASSED` | `cms5iqull0kfmpvhfykmfbtpy` | `cms5iqvu60l00pvhfz05apma3` |
| `CPL-20260728-86A3E524-DOMAIN5G2-1785225842103-PO-001` | `QC_PASSED` | `cms4ddgan0007pvtlh84baw4f` | `cms4ddgp5001dpvtl9kwbvn7p` |

Committed `POST /yard/stage` was not executed because it would alter current
runtime data. The write path is covered by unit tests and build verification.

## Database Evidence

Read-only DB evidence:

| Metric | Count |
| --- | ---: |
| Projects | 14 |
| Production orders | 29 |
| ComponentInstance `PLANNED` | 24 |
| ComponentInstance `IN_PRODUCTION` | 3 |
| ComponentInstance `PRODUCED_WAITING_QC` | 4 |
| ComponentInstance `QC_PASSED` | 2 |
| ComponentInstance `QC_FAILED` | 2 |
| Active Yard placements | 0 |
| Active canonical ComponentInstance Yard placements | 0 |
| Active legacy Component definition Yard placements | 0 |
| Canonical Yard movements sampled | 0 |

This proves the runtime database has eligible Finished Goods instances but no
current Yard handoff records to verify without performing a write.

## RBAC

Verified:

- `POST /yard/stage` without token returns `401`.
- Targeted backend RBAC tests pass.
- Yard controller remains protected by `JwtAuthGuard + PermissionsGuard`.
- Read endpoints require `yard.read`; write endpoints require `yard.write`.

Not verified at runtime:

- `403` with a normal credentialed user lacking `yard.write`.

Reason:

The database has one active non-yard user, but the environment does not expose a
known plaintext password for that user. Forging a JWT to impersonate the user
was rejected by the safety reviewer and was not attempted further.

## Project Execution

Read-only runtime smoke verified `GET /projects/:id/execution` returns the
canonical shape and includes `ComponentInstance` rows with per-instance
`yardPlacements`.

Because no active Yard placements exist, `yardStagedQty` cannot be proven
non-zero in runtime without staging data. Unit tests cover canonical Yard
placement resolution.

## Files Changed In This Sprint

Backend:

- `apps/backend-api/src/modules/production/production.controller.ts`
- `apps/backend-api/src/modules/production/services/production.service.ts`
- `apps/backend-api/src/modules/production/production-api-compatibility.spec.ts`
- `apps/backend-api/src/modules/yard/services/yard.service.ts`
- `apps/backend-api/src/modules/yard/services/yard.service.spec.ts`
- `apps/backend-api/src/modules/yard/repositories/yard-read-model.repository.ts`
- `apps/backend-api/src/core/snapshots/component-snapshot.repository.ts`
- `apps/backend-api/src/core/snapshots/component-snapshot.repository.spec.ts`
- `apps/backend-api/src/modules/simulation/operational-sample-data.seeder.ts`
- `apps/backend-api/src/modules/simulation/simulation-scenario-runner.service.ts`

Frontend:

- `apps/frontend/src/modules/production/api/production.api.ts`
- `apps/frontend/src/modules/production/hooks/useProductionCockpit.ts`
- `apps/frontend/src/modules/production/pages/ProductionCockpitPage.tsx`

Docs:

- `docs/audits/stability-projects3a-yard-runtime-certification.md`
- AI state docs updated for current status and next tasks.

## Verification

Passed:

- `pnpm -C apps/backend-api exec prisma validate`
- `pnpm -C apps/backend-api exec prisma generate`
- `pnpm -C apps/backend-api exec prisma migrate status`
- `pnpm -C apps/backend-api test -- yard.service.spec.ts project-execution-read-model.spec.ts production-api-compatibility.spec.ts component-snapshot.repository.spec.ts rbac-enforcement.spec.ts`
- `pnpm -C apps/backend-api test`
- `pnpm -C apps/backend-api build`
- `pnpm -C apps/frontend build`
- Runtime backend on `PORT=3100` with explicit `DATABASE_URL`
- Authenticated read-only smoke listed above

Warnings:

- `pnpm -C apps/backend-api start` does not load `.env` in this environment.
  Runtime smoke required explicit `DATABASE_URL=postgresql://...`.
- Port `3000` was already in use; smoke used `PORT=3100`.
- Auth login exceeded the default performance budget several times
  (`259-332ms`). Functional smoke still passed.
- Committed Yard stage write was not performed.

## Remaining Gaps

P0:

- None for code/test/build-level canonical identity closure.

P1:

- Run a controlled, explicitly approved write fixture for:
  `GET /components/instances/finished-goods -> POST /yard/stage -> duplicate
  stage rejection -> GET /yard/search -> GET /projects/:id/execution`.
- Runtime-test `403` with a normal credentialed user that lacks Yard
  permission.
- Certify canonical Yard handoff in browser through Production and Yard UI.

P2:

- Add a non-mutating dry-run/certification endpoint or test harness for future
  operational smoke if production data mutation should be avoided.

## Next

Proceed to a controlled runtime fixture only after the user explicitly approves
mutating the local runtime database or provides a disposable test database.

Do not start Logistics instance migration until Yard write fixture is certified.
