# Component Manufacturing Workflow Audit

Status: READ-ONLY AUDIT  
Scope: Sprint B-J after Sprint A Engineering Release Gate  
Date: 2026-07-27

## 1. Executive Summary

SteelTrack already contains a substantial manufacturing backbone. Sprint B-J should not be treated as a greenfield implementation.

Estimated current workflow completeness: **68-75% architectural coverage, 50-60% end-to-end operational enforcement**.

What already exists:

- Component aggregate with revision lifecycle, engineering BOM definition, release evidence, content hash, optimistic concurrency, and idempotency.
- Legacy Production BOM models (`BOM`, `BOMItem`, `BOMRoutingStep`) used by production reservation and issue flows.
- Production Order, Work Order, Execution, Completion, Scrap, Rework, Reservation, Issue, Return, Consumption, and Production Material Ledger models.
- Inventory transaction primitives and `InventoryPostingService` for production issue/return stock movements.
- QC inspections, results, issues, NCRs, defect metadata, and production/component/project references.
- Yard zone/row/slot/placement/movement architecture.
- Logistics dispatch/shipment aggregate over `DispatchOrder`, `DispatchItem`, and `DispatchEvent`.
- Project delivery tracking, site receipt, acceptance, component allocation, and installed component records.

Biggest missing capabilities:

- A formal bridge between `ComponentBomDefinition.lines` and production `BOM/BOMItem`.
- Authoritative production admission gates that compute material reservation and material issue state instead of trusting caller-supplied booleans.
- A single canonical definition of "Finished Goods" across Component status, QC result, Production completion, and Yard placement.
- Stronger prevention of duplicate material issue in legacy direct issue paths.
- Clear Project-owned installation workflow connected to delivered Logistics facts and component allocation.

Sprint B conclusion: **B. Existing BOM requires extension/integration**.

Sprint B should **not** create a third BOM architecture. Existing engineering BOM and production BOM must be integrated:

- `ComponentBomDefinition` is the engineering-owned, revisioned, released BOM source.
- `BOM/BOMItem/BOMRoutingStep` is the production execution BOM currently used by reservation and issue.
- Sprint B should define a controlled materialization/mapping path from released engineering BOM to production BOM.

## 2. Current Manufacturing Architecture

Current bounded-context ownership observed in code/schema:

| Module | Owns | Key implementation |
| --- | --- | --- |
| Components | Component identity, lifecycle, revisions, engineering BOM, release evidence | `Component`, `ComponentRevision`, `ComponentBomDefinition`, `ComponentReleaseEvidence`, `ComponentCommandService` |
| Inventory | On-hand stock, location balance, audited stock movement | `InventoryTransaction`, `InventoryTransactionItem`, `InventoryLocationStock`, `InventoryPostingService` |
| Production | Manufacturing order lifecycle, work orders, execution, reservation, issue, consumption, scrap, rework | `ProductionOrder`, `WorkOrder`, `ProductionExecution`, `ProductionMaterialReservation`, `ProductionMaterialIssue`, `ProductionMaterialConsumption`, `ProductionMaterialLedger`, `ProductionCommandService`, `ProductionService` |
| QC | Inspection result, NCR, quality decision | `QcInspection`, `QcResult`, `QcIssue`, `NonConformanceReport`, `QcService` |
| Yard | Physical placement and movement after QC release | `YardZone`, `YardRow`, `YardSlot`, `YardItemPlacement`, `YardMovement`, `YardService` |
| Logistics | Dispatch, loading, departure, delivery | `DispatchOrder`, `DispatchItem`, `DispatchEvent`, `LogisticsCommandService` |
| Projects | Project execution, site receipt, acceptance, installation/allocation state | `ProjectTaskComponentAllocation`, `ProjectTaskInspection`, `ProjectCommandService`, `ProjectsService` |

Important existing split:

- Engineering BOM: `ComponentBomDefinition.lines` JSON attached to a `ComponentRevision`.
- Production BOM: relational `BOM`, `BOMItem`, `BOMRoutingStep` attached to `ProductionOrder` and `ProductionMaterialReservation`.

This split is workable if formalized. It becomes dangerous if Sprint B creates another BOM layer.

## 3. Current End-to-End Workflow

Observed current flow:

1. Component can be created through canonical command as `ComponentLifecycleState.DRAFT`.
2. Component revision can be created, reviewed, approved, validated with BOM, and released.
3. Sprint A now gates Production Order creation on released component/revision/BOM basis.
4. Legacy Production Order creation creates `DRAFT` orders and production stages.
5. Legacy Production has `release`, `ready`, `start`, `pause`, `resume`, `complete`, `close`, `cancel`.
6. Canonical Production command path supports create/release/ready/start/complete/close plus Work Orders, Execution, Completion, Scrap, Rework.
7. Production reservation can be created from production `BOMItem`, reserved against production warehouse location stock, and tracked in `ProductionMaterialReservationLine`.
8. Material issue can be created from reservation lines and posts Inventory `EXPORT` through `InventoryPostingService`.
9. Consumption records actual production usage and does not reduce Inventory again.
10. Return posts Inventory `RETURN` through `InventoryPostingService`.
11. Production completion does not automatically become Finished Goods.
12. `stageToYard` requires Production Order `COMPLETED`, linked Component, and approved/passed QC inspection.
13. Yard placement records component physical placement.
14. Logistics shipment/dispatch can include components and delivery facts.
15. Project command layer can track delivery, record site receipt, complete acceptance, and project completion.
16. Legacy Component service can directly deliver/install component status.

## 4. Target End-to-End Workflow

Target workflow for gap analysis:

```text
Engineering
  -> Component DRAFT
  -> Engineering Review
  -> BOM Ready
  -> Released for Production
  -> Production Order PLANNED
  -> Material Reservation
  -> Material Issue
  -> Production Order RELEASED
  -> Production Execution
  -> QC Inspection
  -> Finished Goods
  -> Yard
  -> Delivery
  -> Installation
```

Semantic rule retained:

- Creating a Production Order is not release/start.
- Material reservation should protect available stock, not mutate on-hand.
- Material issue should mutate on-hand through Inventory.
- Completion should not automatically mean Finished Goods.

## 5. Gap Analysis - Sprint B Through J

### Sprint B - Bill of Materials

Existing coverage:

- `ComponentRevision` and `ComponentBomDefinition` support revisioned engineering BOM with content hash and lifecycle.
- `ComponentCommandService.replaceEngineeringBom`, `validateEngineeringBom`, and `releaseRevision` already enforce validated BOM and matching content hash.
- `BOM`, `BOMItem`, `BOMRoutingStep` support production material/routing and are consumed by reservation and production stages.
- `BOMItem` supports material, quantity, waste percent, category.

Gaps:

- `ComponentBomDefinition.lines` is JSON, so material line semantics are not strongly typed at DB level.
- Production `BOM` is not formally derived from released `ComponentBomDefinition`.
- Production `BOM.status` is free text.
- Alternative materials/effective date are not clearly relational in production BOM.
- No explicit lineage field from production `BOM` to `ComponentBomDefinition`.

Recommended action: **EXTEND / INTEGRATE**.

No third BOM model. Add a bridge/mapping design in Sprint B implementation design, likely by materializing released engineering BOM into existing production `BOM/BOMItem` or by adding lineage fields if required.

### Sprint C - Material Reservation

Existing coverage:

- `ProductionMaterialReservation`, `ProductionMaterialReservationLine`.
- Reservation statuses: `DRAFT`, `RESERVED`, `PARTIALLY_ISSUED`, `ISSUED`, `CANCELLED`, `EXPIRED`.
- Reservation lines carry `requiredQty`, `reservedQty`, `issuedQty`, `returnedQty`, status, and warehouse/zone/slot/level.
- `ProductionReservationService.preview` computes required, available, already reserved, reservable, shortage.
- `reserve()` uses `Serializable` transaction and ledger `RESERVE`.
- Active reservations reduce availability by subtracting reserved quantities from production warehouse stock during preview.

Gaps:

- Reservation currently requires Production Order statuses `RELEASED`, `READY`, `IN_PROGRESS`, `PAUSED`. Target says reservation can occur before release if order is planned after Engineering Release. This is a semantic conflict to resolve.
- No database-level unique constraint preventing multiple active reservations per order/BOM/material bucket.
- Concurrency is protected by serializable transaction but not by row-level stock locking.
- Production command `readyOrder` trusts `materialGatePassed` boolean from caller.

Recommended action: **REUSE / EXTEND**.

### Sprint D - Material Issue

Existing coverage:

- `ProductionMaterialIssue` with reservation links and warehouse/zone/slot/level traceability.
- `MaterialIssueService.issueFromReservation` issues from active reservation lines only.
- Issue posts Inventory `EXPORT` via `InventoryPostingService.issueMaterial`.
- Return posts Inventory `RETURN` via `InventoryPostingService.returnMaterial`.
- Production material ledger records `ISSUE` and `RETURN`.
- Inventory posting validates location stock before issue and updates `InventoryLocationStock`.

Gaps:

- `ProductionMaterialIssue.status` is free text.
- `MaterialIssueService.create` can create direct issues and post if status is `ISSUED`; it is not strictly reservation-first.
- Duplicate issue prevention relies on reservation line remaining quantity logic, not a durable idempotency key on issue commands.
- No explicit production-order-level "all required materials issued" gate enforced inside start/release command.

Recommended action: **REUSE / HARDEN**.

No new inventory movement system.

### Sprint E - Production Order

Existing coverage:

- `ProductionOrder` has DRAFT/PLANNED/RELEASED/READY/IN_PROGRESS/PAUSED/COMPLETED/CLOSED/CANCELLED.
- Canonical command API supports create, release, ready, start, pause, resume, complete, close, cancel.
- Legacy API supports similar lifecycle.
- Sprint A gates creation on Engineering release.
- Canonical command path stores `componentRevisionId`, `bomDefinitionId`, content hash metadata.

Gaps:

- Legacy `create` requires DRAFT, while target mentions PLANNED after Engineering Release.
- Canonical `createOrder` writes DRAFT.
- Material gates are currently external booleans in canonical `readyOrder` and `startOrder`.
- Legacy `start` still plans missing BOM issues and creates issues after transition, matching older PROD-003 but potentially conflicting with target "start only after issue".

Recommended action: **INTEGRATE / HARDEN**.

Do not redesign Production Order. Align semantics by adding computed admission gates at release/ready/start.

### Sprint F - Production Execution

Existing coverage:

- `WorkOrder`, `ProductionExecution`, `ProductionCompletion`, `ProductionScrap`, `ProductionRework` exist.
- Enums cover planned/ready/running/paused/completed/cancelled patterns.
- Canonical command service creates Work Orders on release, starts execution on start, records completion, scrap, rework.
- Legacy `ProductionStage`, `ProductionTask`, `ProductionSchedule`, `ProductionLog` cover stages, machines, work centers, schedules, logs.

Gaps:

- Two execution representations exist: legacy stages/tasks/logs and canonical WorkOrder/Execution.
- Operator/machine/work center/shift are present in parts of legacy stage/task/log, but canonical execution linkage should be checked before UI/API rollout.
- Start-time gates still depend on caller-provided `volatileGatesPassed`.

Recommended action: **REUSE / INTEGRATE**.

### Sprint G - Quality Control

Existing coverage:

- QC checklists, checklist items, inspections, results, issues, attachments, NCR.
- QC status supports `DRAFT`, `PENDING`, `IN_PROGRESS`, `PASSED`, `FAILED`, `APPROVED`, `REJECTED`, `CANCELLED`.
- Inspection links to production order, production stage, component, project.
- NCR has productionOrderId, componentId, severity, rootCause, correctiveAction, disposition, defect metadata from recent defect work.
- `stageToYard` requires passed/approved QC.

Gaps:

- Rework/Scrap/Use As Is disposition is stored as free-text disposition in NCR, not a strict enum in Prisma.
- QC completion does not appear to automatically transition component to a Finished Goods state/projection.
- Need a canonical handoff from production completion to QC inspection creation/requirement.

Recommended action: **REUSE / EXTEND**.

Do not create manufacturing-specific QC duplicate states.

### Sprint H - Finished Goods

Existing coverage:

- Component `status` includes `READY`, `STOCK`, `SHIPPED`, `DELIVERED`, `INSTALLED`.
- `stageToYard` marks component staged from production and sets status `STOCK`.
- Components read models count stock/ready/delivered/installed in several places.
- Production `createComponentFromProductionOrder` requires net issued material.
- QC gate exists before Yard staging.

Gaps:

- "Finished Goods" is not a dedicated model or canonical state.
- Existing `ComponentStatus.STOCK` is overloaded: legacy inventory, yard stock, and sometimes delivered/installed are presented as inventory-like.
- QC Passed does not independently produce a Finished Goods fact.
- Need to prevent DRAFT/Production/QC Failed components from component inventory consistently across all read paths.

Recommended action: **INTEGRATE**.

Answer: SteelTrack does **not** need a new `FinishedGoods` model at this point. Finished Goods should be a state/projection from existing facts: Production completion + QC passed/approved + Component status/projection + optional Yard placement. A new aggregate would duplicate ownership.

### Sprint I - Yard Management

Existing coverage:

- Yard zones, rows, slots, stack level, placement, movement, crane, snapshots.
- Yard service supports place/move/remove/search and slot capacity checks.
- Production `stageToYard` places a component into Yard after Production completed + QC approved.

Gaps:

- Yard model is separate from Inventory warehouse/location model; this is acceptable for component yard, but integration language must be explicit.
- Loading readiness/release for logistics is not strongly expressed on Yard placement beyond metadata/staged quantities.
- No explicit "yard release reference" generation in Yard service, although Logistics command expects `yardReleaseReference`.

Recommended action: **REUSE / EXTEND**.

Do not create a second Yard model.

### Sprint J - Delivery & Installation

Existing coverage:

- Logistics uses `DispatchOrder`, `DispatchItem`, `DispatchEvent`, and `LogisticsCommandService`.
- Shipment creation records yard release references in loading checklist metadata.
- Dispatch supports DRAFT -> planned/loading/in transit/received/completed style lifecycle.
- Projects command service tracks delivery, site receipt, acceptance.
- Component service has direct `deliver` and `install`.
- ProjectTaskComponentAllocation stores `assignedAt`, `installedAt`, `returnedAt`, status, cost.

Gaps:

- Delivered/Installed ownership is split between Component legacy service and Projects command layer.
- No strict chain observed from `logistics.shipment.delivered` to Project site receipt to Component install state.
- `ComponentStatus.SHIPPED` does not exist in Prisma enum, but code references it in some services. This is a P0/P1 consistency risk to verify in build/runtime context.
- Installation should be Project-owned and then reflected into Component projection/status through an integration path.

Recommended action: **INTEGRATE / HARDEN**.

## 6. Reuse Matrix

| Capability | Existing Prisma Model/Enum | Repository | Service | Controller/API | Frontend | Current Coverage | Gap | Recommended Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Component identity | `Component`, `ComponentLifecycleState` | `ComponentsRepository` | `ComponentCommandService`, `ComponentsService` | `/components`, `/components/commands` | Components module | Strong | Legacy create/status still coexist | REUSE |
| Component revision | `ComponentRevision`, `ComponentRevisionState` | `ComponentsRepository` | `ComponentCommandService` | `/components/commands/:id/revisions` | Components module | Strong | UI adoption not audited here | REUSE |
| Engineering BOM | `ComponentBomDefinition` | `ComponentsRepository` | `ComponentCommandService` | `/components/commands/:id/revisions/:revisionId/bom/*` | Components module | Strong | JSON line semantics; production mapping missing | EXTEND |
| Production BOM | `BOM`, `BOMItem`, `BOMRoutingStep` | `BomRepository` | `BOMService` | `/production/boms` | Production module | Strong for production | Not linked to released engineering BOM | INTEGRATE |
| Reservation | `ProductionMaterialReservation`, `ProductionMaterialReservationLine` | `ProductionReservationRepository` | `ProductionReservationService` | `/production/:id/reservations`, `/production/reservations/:id/*` | Production module | Strong | Status semantics vs planned order conflict | EXTEND |
| Available stock | `InventoryLocationStock`, active reservations | `InventoryRepository`, `ProductionReservationRepository` | `ProductionReservationService.preview` | `/production/:id/reservation-preview` | Production module | Partial/strong | Not centralized as Inventory available projection | REUSE |
| Material issue | `ProductionMaterialIssue`, `InventoryTransaction` | `MaterialIssueRepository`, `InventoryRepository` | `MaterialIssueService`, `InventoryPostingService` | `/production/reservations/:id/issue`, `/production/material-issues` | Production module | Strong | Direct issue path can bypass reservation-first intent | HARDEN |
| Material return | `ProductionMaterialIssue`, `InventoryTransaction` | `MaterialIssueRepository` | `MaterialIssueService` | `/production/material-issues/:id/return` | Production module | Strong | Status free text | REUSE |
| Consumption | `ProductionMaterialConsumption` | `ProductionConsumptionRepository` | `ProductionConsumptionService` | `/production/:id/consume` | Production module | Strong | Needs integration with completion gate | REUSE |
| Production order | `ProductionOrder`, `ProductionOrderStatus` | `ProductionOrderRepository`, `ProductionRepository` | `ProductionCommandService`, `ProductionService` | `/production/commands/orders`, `/production` | Production module | Strong | Legacy/canonical split | INTEGRATE |
| Work order | `WorkOrder`, `ProductionWorkOrderState` | `WorkOrderRepository`, `ProductionOrderRepository` | `ProductionCommandService` | `/production/commands/work-orders/*` | Production module | Strong | Legacy stages coexist | INTEGRATE |
| Execution | `ProductionExecution` | `ProductionOrderRepository` | `ProductionCommandService` | Command API | Production module | Strong | Operator/machine/work center completeness needs implementation design | REUSE |
| QC inspection | `QcInspection`, `QcResult`, `QcIssue`, `NonConformanceReport` | `QcRepository` | `QcService`, `QcCommandService` | `/qc/*` | QC module | Strong | Finished Goods handoff missing | INTEGRATE |
| Finished Goods | `Component.status`, QC + Production + Yard facts | `ComponentsRepository`, Production/QC/Yard repos | Components/Production/Yard services | Mixed | Components/Production/Yard | Partial | No canonical projection/fact | INTEGRATE |
| Yard placement | `YardZone`, `YardSlot`, `YardItemPlacement`, `YardMovement` | `YardRepository` | `YardService` | `/yard`, `/production/:id/stage-to-yard` | Yard/Production | Strong | Yard release reference/loading readiness | EXTEND |
| Dispatch/delivery | `DispatchOrder`, `DispatchItem`, `DispatchEvent` | `LogisticsRepository` | `LogisticsCommandService`, `LogisticsService` | `/logistics/dispatch-orders/*` | Logistics | Strong | Delivered -> site receipt automation | INTEGRATE |
| Installation | `ProjectTaskComponentAllocation`, `Component.status`, `Component.installedDate` | `ProjectsRepository`, `ComponentsRepository` | `ProjectCommandService`, `ProjectsService`, `ComponentsService` | `/projects/:id/site-update`, `/components/:id/install` | Projects/Components | Partial | Ownership split | HARDEN |

## 7. Schema Impact Matrix

| Sprint | Existing Schema Coverage | Missing Data Requirement | Migration Required? | Reason | Risk |
| --- | --- | --- | --- | --- | --- |
| B BOM | High | Engineering BOM -> production BOM lineage; alternative material/effective date if not represented in JSON | UNKNOWN - NEEDS IMPLEMENTATION DESIGN | Could be solved with JSON mapping, metadata, or additive lineage fields | Medium |
| C Reservation | High | Strong uniqueness/idempotency for active reservation by order/material/bucket | UNKNOWN - NEEDS IMPLEMENTATION DESIGN | Service can enforce, DB constraints may be safer | Medium |
| D Issue | High | Enum/idempotency for issue status; stricter reservation-first command identity | UNKNOWN - NEEDS IMPLEMENTATION DESIGN | Existing status is string | Medium |
| E Production Order | High | None obvious for gates | NO | Existing fields cover statuses and engineering basis | Medium |
| F Execution | High | Shift/operator/workstation completeness may need fields if not in metadata | UNKNOWN - NEEDS IMPLEMENTATION DESIGN | Some fields exist in legacy stage/task/log but not necessarily canonical execution | Medium |
| G QC | High | Strict disposition enum if required | UNKNOWN - NEEDS IMPLEMENTATION DESIGN | Current NCR disposition is string/metadata | Low/Medium |
| H Finished Goods | Medium | Canonical finished-goods projection/fact | NO initially | Prefer projection/state from existing facts | High if duplicated |
| I Yard | High | Yard release/loading readiness reference | UNKNOWN - NEEDS IMPLEMENTATION DESIGN | May fit metadata/outbox, may need additive fields | Medium |
| J Delivery/Installation | Medium | Canonical installation receipt/fact per component allocation | UNKNOWN - NEEDS IMPLEMENTATION DESIGN | Existing Project/component install paths overlap | High |

## 8. Business Invariant Catalogue

| Invariant | Current classification | Evidence | Recommendation |
| --- | --- | --- | --- |
| Unreleased Component cannot enter Production | EXISTING | Sprint A checks `ComponentLifecycleState.ACTIVE`, current released revision, released BOM | Keep |
| Production Order creation is separate from release/start | EXISTING | `create` writes DRAFT; separate release/start endpoints | Keep; clarify PLANNED semantics |
| Production execution cannot begin without required material conditions | PARTIAL | `readyOrder`/`startOrder` accept gate booleans; legacy start auto-issues missing BOM material | Move gate computation into backend service |
| Reservation reduces available, not on-hand | EXISTING | Reservation preview subtracts active reservations; no Inventory transaction on reservation | Keep |
| Material Issue reduces on-hand and creates Inventory movement | EXISTING | `InventoryPostingService.issueMaterial` posts EXPORT and updates stock/location | Keep |
| Production consumption does not reduce Inventory again | EXISTING | Consumption records production-side usage | Keep |
| Failed QC cannot enter Finished Goods/Yard | PARTIAL | `stageToYard` requires passed/approved QC; no standalone Finished Goods fact | Define Finished Goods projection/gate |
| QC Passed moves component toward Finished Goods | PARTIAL | QC can pass/approve; staging to yard checks QC; component state transition not canonical | Add integration event/process |
| Only QC-approved components may enter Yard-ready state | EXISTING/PARTIAL | `stageToYard` gate exists for production staging | Verify all yard entry paths |
| Only eligible physical components may be loaded for Dispatch | PARTIAL | Logistics accepts yardReleaseReference metadata; Yard release fact not strongly modeled | Extend Yard release |
| Delivered and Installed are distinct | EXISTING/PARTIAL | Dispatch received/completed; Project site receipt/acceptance; Component delivered/install endpoints | Consolidate ownership |
| Installation is Project-owned | PARTIAL | Project site update/allocation exist, but Component service also installs directly | Route future install through Projects |

## 9. Cross-Module Ownership Map

| Business fact | Owner | Readers/Subscribers | Must not write directly |
| --- | --- | --- | --- |
| Engineering release state | Components | Production, Projects, Dashboard | Production, QC, Yard, Logistics |
| BOM engineering definition | Components | Production | Inventory, QC, Yard, Logistics |
| Production BOM execution materialization | Production, derived from Components | Inventory reservation, Production UI | Components should not mutate production execution BOM after release |
| On-hand stock | Inventory | Production, Dashboard | Production, Components, QC, Yard, Logistics |
| Reserved material | Production, using Inventory availability facts | Inventory read model, Dashboard | Inventory should not own production intent |
| Material issue movement | Inventory owns stock mutation; Production owns issue intent | Production, Dashboard | Production must not directly decrement stock |
| Consumption/scrap inside Production | Production | Components costing, QC, Dashboard | Inventory should not treat consumption as second stock decrement |
| Inspection result/NCR | QC | Production, Components, Yard, Projects | Production/Components must not set QC decisions |
| Finished Goods eligibility | Derived cross-module fact; likely Production+QC+Components projection | Yard, Logistics, Projects | Avoid new standalone owner unless necessary |
| Yard physical location | Yard | Logistics, Dashboard | Inventory/Production/QC |
| Dispatch/delivery | Logistics | Projects, Dashboard | Yard/Projects must not dispatch |
| Site receipt/installation | Projects | Components, Dashboard | Logistics should not install components |

## 10. API / Service / Repository Architecture

Current architecture by flow:

| Flow | Controller | Service | Repository | Notes |
| --- | --- | --- | --- | --- |
| Component engineering | `ComponentCommandController` | `ComponentCommandService` | `ComponentsRepository` | Strong command-side model |
| Component legacy CRUD | `ComponentsController` | `ComponentsService` | `ComponentsRepository` | Legacy status paths can conflict with canonical lifecycle |
| Production legacy lifecycle | `ProductionController` | `ProductionService` | `ProductionRepository`, `ProductionOrderRepository` | Rich but legacy; contains auto-issue behavior |
| Production command lifecycle | `ProductionCommandController` | `ProductionCommandService` | `ProductionOrderRepository` | Strong aggregate/idempotency/concurrency; gates partly caller-supplied |
| Reservation | `ProductionController` | `ProductionReservationService` | `ProductionReservationRepository` | Reusable for Sprint C |
| Issue/return | `ProductionController` | `MaterialIssueService` | `MaterialIssueRepository`, `InventoryPostingService` | Reusable for Sprint D |
| Consumption | `ProductionController` | `ProductionConsumptionService` | `ProductionConsumptionRepository` | Reusable |
| QC | `QcController` | `QcService`, `QcCommandService` | `QcRepository` | Reusable |
| Yard | `YardController`, `ProductionController.stageToYard` | `YardService`, `ProductionService` | `YardRepository`, Production repos | Reusable |
| Logistics | `LogisticsController` | `LogisticsCommandService`, `LogisticsService` | `LogisticsRepository` | Reusable |
| Projects | `ProjectsController` | `ProjectCommandService`, `ProjectsService` | `ProjectsRepository` | Reusable, but install ownership needs alignment |

Business logic in frontend:

- Not exhaustively audited here, but frontend should not be the sole source for material gate booleans (`materialGatePassed`, `volatileGatesPassed`).

Future invariant location:

- Engineering release: `ComponentCommandService` and Production creation validation.
- BOM materialization: Component/Production application service boundary.
- Reservation availability: `ProductionReservationService`.
- Issue stock mutation: `MaterialIssueService` + `InventoryPostingService`.
- Production start gates: `ProductionCommandService` / `ProductionService`, computed server-side.
- QC disposition: `QcService` / `QcCommandService`.
- Yard entry: `ProductionService.stageToYard` or orchestration service calling Yard after QC.
- Delivery/site receipt/install: Logistics publishes, Projects records receipt/install acceptance, Components reflect status.

## 11. Data Integrity & Concurrency Risks

| Risk | Severity | Why |
| --- | --- | --- |
| Caller-supplied material gates can admit Production without computed reservation/issue proof | P1 | `readyOrder` and `startOrder` accept booleans |
| Legacy `start` auto-issues missing BOM materials after transition | P1 | Conflicts with target "start only after issue"; may produce issue side effects outside explicit operator step |
| Direct material issue path can post `ISSUED` without reservation-first workflow | P1 | `MaterialIssueService.create` supports direct issued path |
| Production `BOM` and engineering `ComponentBomDefinition` can diverge | P1 | No formal lineage/materialization bridge |
| Finished Goods is not canonical | P1 | Component `STOCK` can mean multiple things |
| Installed state ownership split | P1 | Component service and Projects service both affect installed facts/status |
| `ProductionMaterialIssue.status` and `BOM.status` are free-text | P2 | Harder state validation and reporting |
| Active reservation uniqueness not DB-enforced | P2 | Serializable transaction helps, but constraints would reduce duplicate risk |
| Yard release reference is metadata-level | P2 | Logistics expects yard release references but Yard does not strongly own the release fact |
| `ComponentStatus.SHIPPED` references found in code but enum shown lacks `SHIPPED` | P0/P1 | Potential compile/runtime inconsistency depending generated client/current branch state |

## 12. Existing Duplication / Overlap Findings

1. **Engineering BOM vs Production BOM**
   - Not bad by itself, but currently lacks a formal bridge.
   - Do not add another BOM.

2. **Legacy Production stages/tasks vs canonical Work Orders/Execution**
   - Both are useful, but release/start semantics must not diverge.

3. **Component inventory vs Finished Goods vs Yard stock**
   - Component `STOCK` is overloaded.
   - Finished Goods should become a projection/fact, not a new aggregate unless later proven necessary.

4. **Component install vs Project site update**
   - Installation should be Project-owned; Component should reflect it.

5. **Direct issue vs issue-from-reservation**
   - Direct path exists for compatibility but should not be the preferred manufacturing workflow.

## 13. Dependency Map

Recommended actual dependencies:

1. Sprint B must settle BOM integration first because reservation consumes `BOMItem`.
2. Sprint C can reuse current reservation after BOM mapping is clear.
3. Sprint D can harden issue-from-reservation and make explicit issue required before start.
4. Sprint E should align Production Order lifecycle gates after C/D.
5. Sprint F should align canonical execution with legacy stage/task data after E.
6. Sprint G should connect production completion to QC requirement.
7. Sprint H should define Finished Goods projection from Production+QC+Component facts.
8. Sprint I should extend Yard release/readiness after H.
9. Sprint J should align Logistics delivery with Projects site receipt/installation after I.

## 14. Risk Register

| ID | Severity | Finding | Recommended mitigation |
| --- | --- | --- | --- |
| R1 | P0/P1 | `ComponentStatus.SHIPPED` references while enum excerpt lacks `SHIPPED` | Verify generated Prisma/client and build state before implementation; replace with valid transition if needed |
| R2 | P1 | Production material gates are caller-supplied | Compute gates server-side from reservations/issues |
| R3 | P1 | BOM divergence between engineering and production | Build explicit materialization/lineage |
| R4 | P1 | Legacy start auto-issues material | Move toward explicit issue-before-start gate |
| R5 | P1 | Finished Goods is overloaded as `STOCK` | Define projection/state semantics |
| R6 | P1 | Project installation ownership split | Route installation through Projects and reflect to Component |
| R7 | P2 | Free-text production issue/BOM statuses | Consider additive enum hardening only after design |
| R8 | P2 | Yard release reference not strongly modeled | Add Yard release concept or standardized metadata/event in Sprint I |

## 15. Recommended Implementation Order

Recommended order:

1. **Sprint B1 - BOM Integration Design/Implementation**
   - Map released `ComponentBomDefinition` to existing `BOM/BOMItem/BOMRoutingStep`.
   - Decide whether lineage fields are required.

2. **Sprint C1 - Reservation Gate Alignment**
   - Allow reservation at correct Production Order state if business approves.
   - Compute available = production warehouse on-hand - active reservations.

3. **Sprint D1 - Explicit Issue from Reservation**
   - Make issue-from-reservation the canonical path.
   - Keep direct issue only as compatibility/admin path if needed.

4. **Sprint E1 - Production Admission Gates**
   - Production release/ready/start gates compute reservation and issue state.
   - Eliminate trust in frontend booleans for core invariants.

5. **Sprint F1 - Execution Alignment**
   - Align WorkOrder/Execution with stage/task UI and logs.

6. **Sprint G1 - QC Handoff**
   - Create/require QC inspection after completion.
   - Use QC-owned decision.

7. **Sprint H1 - Finished Goods Projection**
   - Define Finished Goods as eligible fact/projection, not new model.

8. **Sprint I1 - Yard Release**
   - Stage only Finished Goods, create yard release reference/readiness.

9. **Sprint J1 - Delivery and Installation Integration**
   - Logistics delivery -> Project site receipt -> Project acceptance/install -> Component reflection.

## 16. Sprint B Detailed Implementation Plan

Conclusion: **B. Existing BOM requires extension/integration**.

Why:

- `ComponentBomDefinition` already has the correct engineering ownership, revision binding, state, and content hash.
- `BOM/BOMItem/BOMRoutingStep` already has the relational material lines required by reservation/issue.
- Reservation code already depends on production `BOMItem`; replacing it would cause broad churn.
- A third BOM model would duplicate existing business concepts and increase divergence risk.

Recommended Sprint B implementation approach:

1. Audit `ComponentBomDefinition.lines` payload shape from DTO/tests.
2. Define a stable mapping contract from engineering BOM line JSON to production `BOMItem`.
3. Materialize a production `BOM` only from a released `ComponentRevision`/`ComponentBomDefinition`.
4. Preserve `contentHash` lineage:
   - At minimum in `BOM` metadata/status/version if no schema change.
   - Prefer additive lineage fields only if implementation design proves necessary.
5. Do not allow production BOM mutation that invalidates released engineering hash without a new revision.
6. Ensure `ProductionOrder.bomId` points to the materialized production BOM matching `componentRevisionId`/`bomDefinitionId`.
7. Add tests for:
   - released engineering BOM materializes once idempotently;
   - changed released revision creates/switches a new production BOM;
   - reservation preview uses the materialized BOM;
   - content hash mismatch rejects Production Order/BOM binding.

Expected schema migration for Sprint B: **UNKNOWN - NEEDS IMPLEMENTATION DESIGN**.

Likely no migration is required for a first integration if lineage can live in metadata/version. A small additive migration may be justified if production BOM must query by `componentRevisionId` or `bomDefinitionId` at scale.

## 17. Epic B-J Roadmap

| Sprint | Goal | Primary action |
| --- | --- | --- |
| B | BOM integration | Integrate released engineering BOM with production BOM; avoid third BOM |
| C | Reservation | Reuse reservation model; align state and availability |
| D | Issue | Use issue-from-reservation and InventoryPostingService |
| E | Production gates | Compute release/ready/start material gates server-side |
| F | Execution | Align WorkOrder/Execution with stages/tasks/machines |
| G | QC | Connect completion to QC-owned inspection/disposition |
| H | Finished Goods | Define projection/state from Production + QC + Component facts |
| I | Yard | Reuse Yard placement; add release/readiness reference if needed |
| J | Delivery/Installation | Integrate Logistics delivery with Projects site receipt/install |

## Final Audit Position

Sprint B-J should proceed as integration and hardening work, not foundation rebuild.

Do not duplicate:

- BOM models.
- Inventory movement.
- Reservation models.
- Production material ledger.
- QC state machine.
- Yard location model.
- Logistics dispatch model.
- Project installation model.

The next task should be **Sprint B1 - BOM Integration Design/Implementation**, starting with the exact shape and lifecycle of `ComponentBomDefinition.lines` and how it becomes the existing relational `BOM/BOMItem` used by Production reservation.
