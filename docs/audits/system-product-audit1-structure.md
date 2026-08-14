# SYSTEM.PRODUCT.AUDIT.1 - Structure and Domain Audit

Audit date: 2026-08-14  
Mode: source inspection and read-only runtime/API verification  
Decision: **YELLOW - canonical core exists, but active legacy read paths remain**

## Scope and method

- Inspected the registered Nest modules/controllers, Prisma relations, domain
  services, read models, frontend routes, API clients and permission gates.
- Used Semble first for semantic discovery, followed by exact `rg` searches.
- Started the existing backend/frontend only for read-only API and browser
  checks. No business command was sent.
- Infrastructure P0 items named in the sprint are intentionally excluded.

## Module inventory

| Module | Canonical source/mutation | API/read model used by active UI | Status | Evidence / concern |
|---|---|---|---|---|
| Dashboard | Per-module read models plus historical snapshots | `/inventory/overview`, Production cockpit, Projects runtime, QC cockpit, Logistics dashboard | YELLOW | Main page uses real APIs, but filters and several labels do not represent the same measure. Legacy `/dashboard/*` remains active. |
| Executive/History | `dashboard_snapshots`, watermarks, monthly rollups | `/history/*` | GREEN/YELLOW | Latest snapshot is authoritative and parity=true; Logistics and Dispatch daily snapshots remain stale. |
| Projects | Project, requirement, WBS, ComponentInstance relations | `/projects/runtime`, `/projects/:id/execution` | RED | Runtime summary still derives delivered/installed counts from legacy `Component.status`. |
| Procurement | Supplier -> PR -> PO -> InventoryPostingService receipt | `/procurement/workspace` | GREEN backend / RED frontend | Canonical backend is present; routed Procurement UI is entirely hardcoded and does not call it. |
| Inventory | Signed transaction ledger and location balances | `/inventory/overview`, `/inventory/materials`, `/inventory/transactions` | GREEN | Posting paths centralize stock deltas; database cache/location/ledger parity is exact. |
| Production | Requirement/BOM/PO/Execution/ComponentInstance | `/production/read-model/cockpit`, `/production/commands/*` | GREEN/YELLOW | Canonical command/read model exists, but legacy mutation routes remain in `production.controller.ts`. |
| Components | Definition, revision, BOM, requirement, physical instance | `/components/read-model/*`, `/components/foundation/*`, `/components/instances/finished-goods` | RED | Canonical foundation exists, but overview/report/snapshot calculations still use `Component.status`; legacy create defaults to `STOCK`. |
| QC | Physical ComponentInstance + FINAL inspection + NCR | `/qc/read-model/workspace`, `/qc/cockpit` | YELLOW | Physical workspace is canonical. Cockpit aggregates inspection records and legacy queue fallback fields, producing different semantics from physical-state KPI. |
| Finished Goods | `FinishedGoodsEligibilityService` over ComponentInstance | `/components/instances/finished-goods` | GREEN | UI stock page uses physical instances. Legacy component stock summaries still coexist elsewhere. |
| Yard | ComponentInstance eligibility and active placement | `/yard/read-model/workspace`, `/yard/dashboard` | GREEN/YELLOW | Canonical staging/return/dispatch lineage exists. Legacy Component status compatibility remains in Yard service/repository. |
| Logistics | Yard-staged ComponentInstance -> dispatch -> delivery/install | `/logistics/dispatch-*` | GREEN | All 13 component dispatch lines have `componentInstanceId`; no definition-only dispatch line exists. |
| Master Data | Canonical dictionaries/UOM/Warehouse/Supplier | `/master-data/*`, `/suppliers` | YELLOW | CRUD and Warehouse dependency protection exist; generic dependency inspection is Warehouse-only and dictionary listing is unpaginated. |
| Settings | System catalog and master-data workspaces | `/system/*`, `/master-data/*` | GREEN/YELLOW | Real data and guarded writes; presentation differs from operational modules. |
| Users/Roles | System admin services and 93-permission catalog | `/system/users`, `/system/roles`, `/system/role-matrix` | GREEN | Shared route/sidebar/API enforcement exists. |
| Activity Log | `activity_logs` | `/system/activity-logs` | YELLOW | Real log source. Actor is null on 220 fixture/system business events, reducing accountability. |
| Operations/Backup | Runtime, jobs, health, metrics | `/operations-center`, `/health/*`, `/metrics` | GREEN for application runtime | Release/off-host trust is excluded by sprint instruction. |

## Canonical dependency map

```text
Supplier
  -> ProcurementService / ProcurementRepository
  -> Purchase Request -> Purchase Order
  -> InventoryPostingService
  -> InventoryTransaction + InventoryLocationStock

Project -> ProjectComponentRequirement
  -> Component engineering definition -> Revision -> Released BOM
  -> ProductionOrder -> ProductionExecution
  -> ComponentInstance -> FINAL QCInspection/NCR
  -> FinishedGoodsEligibilityService
  -> YardItemPlacement
  -> DispatchItem.componentInstanceId
  -> Delivery -> Installation

Business events -> Projection checkpoints -> Dashboard snapshots
  -> HistoricalDashboard API -> Historical UI
```

## P0 structural findings

### S-01 - Routed Procurement UI bypasses the canonical domain read model

- Severity: **RED / P0**
- Backend source is real: `GET /procurement/workspace` returned 200 with 39
  receipts and canonical summary data.
- Active route renders static arrays in:
  - `apps/frontend/src/modules/procurement/components/ProcurementCockpit.tsx:1`
  - `apps/frontend/src/modules/procurement/components/SupplierRuntimePanel.tsx:1`
  - `apps/frontend/src/modules/procurement/components/PurchaseOrdersPanel.tsx:1`
- Recommendation: bind the routed workspace to the existing Procurement API
  and use controlled empty states. Do not create another backend flow.

### S-02 - Component definition state still drives physical metrics

- Severity: **RED / P0**
- `components-read-model.repository.ts:335` and the overview aggregation near
  line 798 group `ComponentStatus.STOCK/READY/SHIPPED/DELIVERED`.
- `components.service.ts:156` still defaults legacy create to `STOCK`.
- `ComponentsOverviewPage.tsx:457`, `:670`, `:781` use `STOCK` fallback.
- `ComponentsReportsPage.tsx:49` reconstructs stock/ready/shipped from rows.
- Snapshot repositories under `core/snapshots` repeat this model.
- Recommendation: definition dashboards use lifecycle/revision/requirements;
  physical dashboards use ComponentInstance and eligibility only.

### S-03 - Project execution summary still reads Component.status

- Severity: **RED / P0**
- `projects.service.ts:1080`, `:1777` and runtime metric construction count
  READY/SHIPPED/DELIVERED/INSTALLED from Component definitions.
- Runtime evidence: `/projects/runtime` reported zero delivered/installed while
  the database contained two `ComponentInstance.state=INSTALLED` rows.
- Recommendation: migrate project execution summary to requirement quantities,
  physical instances and dispatch/install lineage.

### S-04 - Legacy physical delivery/install endpoints remain callable

- Severity: **RED / P0**
- `POST /components/:id/deliver` and `/components/:id/install` are registered in
  `components.controller.ts:124` and `:131`.
- Projects frontend still calls them in `projects.api.ts:571` and `:576`.
- Recommendation: move all active UI to Logistics/ComponentInstance commands,
  then mark these compatibility endpoints deprecated and non-navigable.

### S-05 - Dashboard backend contains a second legacy truth model

- Severity: **RED / P0**
- `/dashboard/cockpit`, `/dashboard/construction-progress`, `/analytics` and
  `/forecast` count `Component.status` in `dashboard.controller.ts`.
- `logisticsActive` in `/dashboard/cockpit` is a Yard movement count, not an
  active dispatch count.
- Main Dashboard currently bypasses most of these routes, but they remain live
  and can be consumed by other clients.
- Recommendation: retire or rewrite these endpoints against canonical module
  read models; publish one metric contract per business question.

## P1 structural findings

| ID | Finding | Evidence | Recommendation |
|---|---|---|---|
| S-06 | Parallel Production mutation surface | Legacy `/production/:id/*` and canonical `/production/commands/*` are both registered. | Define canonical command ownership and deprecate old commands after consumer inventory. |
| S-07 | Dead duplicate controller files | Unregistered `yard/controllers/yard.controller.ts`, `workflow/controllers/workflow.controller.ts`, and Purchasing `supplier.controller.ts` duplicate active prefixes. | Remove only after import/registration proof; until then classify as dead code. |
| S-08 | Generic master dependency API is incomplete | `DictionariesService.dependencies()` supports only Warehouse. | Add authoritative dependency contracts for category/type/usage/UOM before exposing destructive actions. |
| S-09 | Dictionary read does not apply base pagination | DTO accepts page/limit, but `DictionariesService.findAll()` calls unbounded `findMany`. | Apply server pagination with a backward-compatible response contract. |
| S-10 | Warehouse topology is partial | Warehouse and Zone are canonical, but material locations remain stock buckets with zone/slot/level fields rather than a complete Warehouse -> Zone -> Row -> Slot -> Level master. | Decide and document V1 topology; do not infer locations from free text. |
| S-11 | Snapshot coverage is mixed | Components/Yard dashboard endpoints returned runtime fallback metadata with `fallbackReason=missing`; two enterprise snapshots are stale. | Repair snapshot generation/coverage without changing business truth. |

## Legacy and hard-code scan

Active source (tests and archived trees excluded):

| Search | Classification |
|---|---|
| `Component.status`, STOCK/READY/SHIPPED/DELIVERED decisions | **BUSINESS RISK** in Dashboard, Projects, Components and snapshots; compatibility in Yard/Production |
| `runtime.inspections` | No active match |
| `runtime.metrics` | Safe project runtime object name, not the removed QC frontend aggregation |
| `MAIN` / `PRODUCTION` | No active warehouse-code equality check found; remaining matches are module names/enums/labels |
| `supplierName` / `itemName` | **SAFE COMPATIBILITY** in canonical Procurement writes when FK fields are present; **LEGACY** if used as identity by older consumers |
| `mock` / `fake` / `dummy` | No active word-level source match outside tests; hardcoded arrays were found by data-flow inspection rather than naming |
| `TODO` | Enum member `ProductionTaskStatus.TODO`, not an unfinished comment |
| `FIXME` | No active match |

## Structure score

**Architecture: 79/100**  
**Canonical Domain: 68/100**

The forward physical path is materially canonical and runtime-proven. The
score is held below production-grade because active read models and endpoints
still present Component definitions as physical inventory/progress, while the
routed Procurement UI is disconnected from its completed backend domain.
