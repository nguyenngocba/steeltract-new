# SYSTEM.INTEGRITY.2 - SteelTrack V1 Runtime Certification & Canonical Freeze Audit

Date: 2026-08-03

Mode: certification/audit. No source-code, schema, migration, staging or commit
action was performed in this sprint.

## Executive Summary

Overall result: **CONDITIONALLY READY / NOT V1 FREEZE READY**

SteelTrack has the major canonical backend foundations in place for
Components, Production, QC, Yard and Logistics. The strongest evidence is that
new Logistics write paths now operate on `ComponentInstance`, QC module content
uses the physical instance read model, and Finished Goods eligibility is
instance-based.

V1 freeze cannot be certified yet because the runtime database does not
currently contain a complete physical chain through Yard, Dispatch, Delivery
and Installation, and several legacy read surfaces still derive business facts
from `Component.status` / `STOCK`.

Estimated engineering completion: **88%**

Estimated V1 freeze readiness: **72%**

## Runtime Database Evidence

Read-only Prisma inspection was executed against the current runtime database.

| Metric | Count |
| --- | ---: |
| Projects | 14 |
| ProjectComponentRequirement | 25 |
| ProductionOrder | 29 |
| ComponentInstance | 35 |
| QCInspection | 7 |
| InventoryTransaction | 153 |
| DispatchItem | 0 |
| Active Yard placements | 0 |
| Installed ComponentInstances | 0 |
| Finished Goods eligible instances | 2 |
| Users | 7 |
| Roles | 6 |

ComponentInstance state distribution:

| State | Count |
| --- | ---: |
| PLANNED | 24 |
| IN_PRODUCTION | 3 |
| PRODUCED_WAITING_QC | 4 |
| QC_PASSED | 2 |
| QC_FAILED | 2 |

Certification impact:

- Finished Goods eligibility can be proven with real data.
- Full runtime chain `Finished Goods -> Yard -> Dispatch -> Delivery ->
  Installation` cannot be certified from existing data because Yard,
  Dispatch and Installed counts are all zero.
- A disposable `SYSTEM-INTEGRITY2-*` fixture is required to certify the write
  chain end-to-end.

## Canonical Source-Of-Truth Certification

| Area | Status | Evidence |
| --- | --- | --- |
| Material Master | GREEN | Canonical master-data workspaces and APIs exist from SYSTEM.MASTERDATA.1 / SYSTEM.1A. |
| Inventory receipt / stock | YELLOW | Inventory transactions exist. Legacy inventory dictionary endpoints still lack explicit `PermissionsGuard`. |
| Production stock transfer | YELLOW | OPS3A/OPS3A2 certified PRODUCTION stock source, but not recertified in this audit with a fresh end-to-end fixture. |
| Project requirement | GREEN | `ProjectComponentRequirement` exists and runtime DB has 25 rows. |
| Component definition | GREEN | Component is now engineering definition in canonical Components UI/workflow. |
| Production order | GREEN | Runtime DB has 29 ProductionOrders and canonical Production workspace/read-model work has passed previous tests. |
| Physical instance | GREEN | Runtime DB has 35 `ComponentInstance` rows and canonical state vocabulary is present. |
| QC final inspection | GREEN/YELLOW | QC module now reuses the Components physical QC workspace. Checklist/disposition command enablement still has P1 work. |
| Finished Goods | GREEN | `GET /components/instances/finished-goods` is the canonical source; runtime DB has 2 eligible instances. |
| Yard stage | YELLOW | Canonical `/yard/stage` path exists, but current DB has 0 active placements. |
| Dispatch / Delivery | YELLOW | LOGISTICS.3 source/tests canonicalized to `DispatchItem.componentInstanceId`, but current DB has 0 dispatch rows. |
| Installation | RED/YELLOW | `ComponentInstance.installedAt` path exists in Logistics completion, but runtime DB has 0 installed instances. |

## API / RBAC Audit

| Surface | Status | Evidence |
| --- | --- | --- |
| Logistics | GREEN | `LogisticsController` is guarded by `JwtAuthGuard` + `PermissionsGuard`; writes require `logistics.write`. |
| Components canonical reads | GREEN | Components/QC and Finished Goods use physical instance read models. |
| Projects execution | YELLOW | Source still exposes `dispatchCanonical: false` in `apps/backend-api/src/modules/projects/services/project-execution-read-model.ts`. |
| Inventory legacy dictionaries | RED | `inventory/categories`, `inventory/material-types`, `inventory/units`, `inventory/zones` controllers are registered without `UseGuards` / `RequirePermissions`. |
| Material movements legacy API | RED | `apps/backend-api/src/modules/material-movements/material-movements.controller.ts` exposes `GET` and `POST` without guards. |
| Runtime 401/403 smoke | BLOCKED | Backend boot reached application startup but port `3000` was already in use; no clean HTTP RBAC certification was completed in this sprint. |

## Component.status Legacy Findings

`Component.status` still affects some business-facing read surfaces.

Evidence:

- `apps/backend-api/src/modules/dashboard/dashboard.controller.ts` still uses
  `status: 'STOCK'` for dashboard filtering.
- `apps/backend-api/src/modules/components/repositories/components-read-model.repository.ts`
  still references `ComponentStatus.STOCK`.
- `apps/backend-api/src/modules/components/repositories/components.repository.ts`
  and `apps/backend-api/src/modules/components/services/components.service.ts`
  still create/read legacy `Component.status = STOCK` compatibility values.
- `apps/backend-api/src/core/snapshots/component-snapshot.repository.ts` still
  calculates stock from `ComponentStatus.STOCK`.
- `apps/frontend/src/modules/components/pages/tabs/ComponentsOverviewPage.tsx`
  still renders a `Tồn kho` KPI from `statusCounts.stock`.
- `apps/frontend/src/modules/components/pages/tabs/ComponentsReportsPage.tsx`
  still filters rows where `row.status === 'STOCK'`.

Certification: **Component.status remains a compatibility field, but it still
affects dashboard/reporting read semantics. This is a P0 freeze blocker for
physical inventory accuracy.**

## Dashboard / Executive BI Audit

| Dashboard surface | Status | Finding |
| --- | --- | --- |
| Components overview | RED | Physical inventory-like KPI still uses `statusCounts.stock`. |
| Component snapshot repository | RED | Snapshot stock count still uses `ComponentStatus.STOCK`. |
| Executive / backend dashboard | RED | Dashboard controller still contains `status: 'STOCK'`. |
| Inventory timeline helper | P2 | `mockDataOffsetDotHack()` is a naming/design-debt issue; audit did not prove fake operational data from that helper. |
| Logistics dashboard | GREEN/YELLOW | LOGISTICS.3 removed fake logistics charts, but browser runtime not certified. |

Dashboard fake-data verdict: **YES / PARTIAL**. Fake or legacy-derived
dashboard semantics still exist. Any executive/component physical stock metric
must be migrated to `ComponentInstance` / Finished Goods read models before
freeze.

## End-To-End Workflow Certification

| Step | Status | Evidence |
| --- | --- | --- |
| Material Master | GREEN | Existing canonical master data implementation. |
| Receipt MAIN | YELLOW | Inventory transaction data exists, but not linked to a fresh V1 certification fixture in this sprint. |
| Transfer PRODUCTION | YELLOW | Prior OPS3A/OPS3A2 source-of-truth work exists; not recertified end-to-end here. |
| Project | GREEN | 14 Project rows exist. |
| Requirement | GREEN | 25 ProjectComponentRequirement rows exist. |
| Component Definition | GREEN | Canonical definition model exists. |
| Production BOM | YELLOW | BOM foundation exists; full runtime fixture was not executed. |
| Production Order | GREEN | 29 ProductionOrder rows exist. |
| Release / Execution | YELLOW | Physical instances exist in PLANNED / IN_PRODUCTION / PRODUCED_WAITING_QC states. |
| QC PASS | GREEN | 2 QC_PASSED instances exist. |
| Finished Goods | GREEN | 2 finished-goods eligible instances exist. |
| Yard Stage | RED/YELLOW | 0 active Yard placements. |
| Dispatch | RED/YELLOW | 0 DispatchItems. |
| Delivery | RED/YELLOW | 0 DELIVERED/installed runtime rows. |
| Installation | RED | 0 installed ComponentInstances. |
| Project Completion | YELLOW | Project execution read model exists; downstream dispatch remains marked non-canonical. |

## Module Readiness

| Module | Backend | API/RBAC | Frontend/UI | Canonical SOT | Readiness |
| --- | --- | --- | --- | --- | ---: |
| Inventory | YELLOW | RED/YELLOW | GREEN/YELLOW | YELLOW | 78% |
| Components | GREEN/YELLOW | GREEN | GREEN/YELLOW | YELLOW | 82% |
| Production | GREEN | GREEN/YELLOW | GREEN/YELLOW | GREEN/YELLOW | 86% |
| QC | GREEN | GREEN/YELLOW | GREEN/YELLOW | GREEN | 84% |
| Projects | YELLOW | GREEN/YELLOW | YELLOW | YELLOW | 74% |
| Yard | GREEN/YELLOW | GREEN/YELLOW | YELLOW | GREEN/YELLOW | 78% |
| Logistics | GREEN | GREEN | GREEN/YELLOW | GREEN/YELLOW | 82% |
| System/RBAC | GREEN/YELLOW | RED/YELLOW | GREEN/YELLOW | YELLOW | 76% |
| Dashboard/BI | YELLOW | YELLOW | YELLOW | RED/YELLOW | 60% |

## P0 Remaining

1. Close legacy RBAC gaps on `/inventory/categories`,
   `/inventory/material-types`, `/inventory/units`, `/inventory/zones` and
   `/material-movements`; add no-token, insufficient-permission and authorized
   route tests.
2. Remove physical inventory/finished-goods metrics derived from
   `Component.status`, `ComponentStatus.STOCK`, `READY`, `SHIPPED`,
   `DELIVERED` or `INSTALLED`.
3. Convert dashboard and component snapshot/read-model stock semantics to
   canonical `ComponentInstance` / Finished Goods sources.
4. Update Projects execution downstream dispatch/delivery read model so
   canonical Logistics data is no longer reported as `dispatchCanonical: false`.
5. Run a disposable `SYSTEM-INTEGRITY2-*` runtime fixture through Yard,
   Dispatch, Delivery, Installation and Project execution read model.

## P1 Remaining

- Browser smoke for Inventory, Components, Production, QC, Projects, Yard,
  Logistics and Dashboard with authenticated data.
- Runtime RBAC 401/403/authorized certification after resolving the port/server
  startup conflict.
- Final QC checklist result entry and enabled disposition commands after
  authoritative checklist completion.
- Project material read-model cleanup separating requirements, reservation,
  issue, production consumption and project shipment.
- Logistics material/project issue boundary decision.
- Performance review remediation for capped/offset read-model patterns before
  high-volume V1 operation.

## P2 Remaining

- Advanced dashboard analytics and richer charts from canonical read models.
- Historical/dashboard snapshot cleanup for legacy component status semantics.
- Browser automation hardening for every module route.
- Long-term cursor pagination and archival tuning on large read surfaces.

## Legacy Endpoints To Remove Or Guard

- `GET/POST/PUT/DELETE /inventory/categories`
- `GET/POST/PUT/DELETE /inventory/material-types`
- `GET/POST/PUT/DELETE /inventory/units`
- `GET/POST/PUT/DELETE /inventory/zones`
- `GET/POST /material-movements`

Recommended first action: guard them with canonical permissions for V1
compatibility, then decide later whether to remove or delegate them to
canonical master-data APIs.

## Certification Answers

1. Engineering Completion: **88%**
2. V1 Freeze Readiness: **72%**
3. P0 remaining: **5**
4. P1 remaining: **6**
5. P2 remaining: **4**
6. Does `Component.status` still affect business? **YES**, in dashboard,
   snapshots, Components overview/reports and legacy read/create paths.
7. Any read model not canonical? **YES**, Projects downstream dispatch flag,
   Components/dashboard stock metrics and component snapshot repository.
8. Any dashboard fake data? **YES/PARTIAL**, legacy-derived dashboard metrics
   and at least one helper with mock naming remain; fake operational values
   were not fully eliminated from all dashboard surfaces.
9. Legacy endpoints to remove? **YES**, inventory legacy dictionaries and
   material movements listed above.
10. Sprints remaining to V1 Freeze: **4 focused sprints**:
    P0 RBAC closure, dashboard/read-model canonical cleanup, full runtime E2E
    disposable fixture certification, and browser/performance freeze audit.

## Verification

| Check | Result |
| --- | --- |
| Source audit | PASS |
| Runtime DB read-only audit | PASS |
| Backend build | PASS |
| Frontend build | PASS - Vite chunk-size warning remains |
| Backend HTTP startup | WARNING - application boot reached startup, but port 3000 was already in use |
| RBAC runtime HTTP 401/403/authorized | NOT VERIFIED |
| Full end-to-end fixture | NOT VERIFIED - no Yard/Dispatch/Installed data in current DB |
| git diff --check | PASS |
| Source code changes | NONE |
| Schema changes | NONE |
| Migrations | NONE |
| Stage/commit | NONE |

## Final Certification

SteelTrack V1 should **not be frozen yet**. The canonical architecture is close,
but the platform still needs the P0 closures above before the claim "all
business-visible physical flow is canonical and runtime-certified" is true.
