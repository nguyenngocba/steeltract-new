# MES Data Audit

Date: 2026-06-22

Scope:

- Production Orders
- Material Issues
- Reservations
- Consumptions
- Components
- BOM
- Inventory Transactions
- Inventory Transaction Items

Constraints:

- Audit only.
- No backend change.
- No frontend workflow change.
- No API change.
- No schema change.
- No migration.

## Executive Conclusion

Priority:

**A. Costing path first**

1. 20A Costing Engine
2. 20B Component Cost Analysis
3. 20C Project Cost Control

Reason:

- Material costing data is already materially usable:
  `ProductionMaterialConsumption` records consumed/scrap quantities.
  `InventoryTransactionItem` persists `unitPrice` and `totalAmount`.
  `ComponentCosting` already stores estimated/actual material cost and total cost.
- Shopfloor data exists as a foundation, but is not yet complete enough for a true MES shopfloor dashboard:
  stages have start/end fields, workers, machines, and work centers, but stage history is only current-state plus logs, not a normalized transition/event history.
  There is no reliable operator time, machine runtime, downtime, work-center queue event stream, or labor/machine rate source.

## Shopfloor Readiness

Status:

**Partial foundation, not full MES-ready.**

Current strengths:

- Production Orders store planned and actual-ish lifecycle timestamps.
- Production Stages store planned and actual-ish stage timestamps.
- Production Tasks can be assigned to worker, work center, and machine.
- WorkCenter and Machine master models exist.
- ProductionLog can record workerId, machineId, quantity, event type, message, and createdAt.

Current limitations:

- There is no dedicated immutable stage transition history table.
- Stage lifecycle history is inferred from `ProductionStage.status`, `startedAt`, `completedAt`, and `ProductionLog`.
- Worker/operator ids are strings, not consistently related to a User/Employee model.
- Machine/work-center assignment exists, but machine runtime, downtime, cycle time, and rate data are not present.
- Production Schedule is planned capacity/time, not actual shopfloor execution telemetry.

## Costing Readiness

Status:

**Ready for next development phase, especially material costing.**

Current strengths:

- `InventoryTransactionItem.unitPrice` and `totalAmount` are persisted and were hardened in Sprint 15B.
- Average material cost is derivable from priced positive inventory transaction items.
- `ProductionMaterialConsumption` stores consumedQty and scrapQty per production order/material.
- Component costing service already calculates:
  `(consumedQty + scrapQty) * average material cost`.
- `ComponentCosting` persists estimatedMaterialCost, actualMaterialCost, laborCost, machineCost, overheadCost, estimatedCost, actualCost, and varianceCost.
- Components persist `estimatedCost` and `actualCost`.
- Project cost can be partially derived from shipped/installed component costs and project-linked inventory transaction values.

Current limitations:

- Labor, machine, and overhead costs are stored but currently zero/manual future inputs.
- There is no labor rate table.
- There is no machine hourly rate table.
- There is no actual operator time or machine runtime to multiply by rates.
- Project cost is not yet a formal ledger; it is derivable from component costs and inventory transactions.

## Field Audit

| Question | Field | Table | Module | Relationship | Readiness |
| --- | --- | --- | --- | --- | --- |
| Actual Start Time | `startedAt` | `production_orders` | Production | Production Order lifecycle | Partial |
| Actual End Time | `completedAt` | `production_orders` | Production | Production Order lifecycle | Partial |
| Actual Start Time | `startedAt` | `production_stages` | Production | Stage belongs to Production Order | Partial |
| Actual End Time | `completedAt` | `production_stages` | Production | Stage belongs to Production Order | Partial |
| Actual Start Time | `startedAt` | `production_tasks` | Production | Task belongs to Production Order and optional Stage | Partial |
| Actual End Time | `completedAt` | `production_tasks` | Production | Task belongs to Production Order and optional Stage | Partial |
| Worker / Operator | `assignedWorkerId` | `production_stages` | Production | Assigned worker for stage | Partial |
| Worker / Operator | `assignedWorkerId` | `production_tasks` | Production | Assigned worker for task | Partial |
| Worker / Operator | `workerId` | `production_logs` | Production | Log actor/worker on order/stage event | Partial |
| Machine | `machineId` | `production_stages` | Production | Stage assigned to Machine | Partial |
| Machine | `machineId` | `production_tasks` | Production | Task assigned to Machine | Partial |
| Machine | `machineId` | `production_schedules` | Production | Planned machine capacity window | Partial |
| Machine | `machineId` | `production_logs` | Production | Logged machine on production event | Partial |
| Workcenter | `workCenterId` | `production_stages` | Production | Stage assigned to WorkCenter | Partial |
| Workcenter | `workCenterId` | `production_tasks` | Production | Task assigned to WorkCenter | Partial |
| Workcenter | `workCenterId` | `production_schedules` | Production | Planned work-center capacity window | Partial |
| Production Line | none explicit | n/a | Production | Could be modeled as WorkCenter, but no explicit line model | Gap |
| Stage History | `status`, `startedAt`, `completedAt` | `production_stages` | Production | Current stage state per order/stage | Partial |
| Stage History | `type`, `message`, `createdAt`, `stageId` | `production_logs` | Production | Event notes for order/stage | Partial |
| Stage History | dedicated transition rows | none | Production | No immutable transition history model | Gap |
| Component Cost | `consumedQty`, `scrapQty` | `ProductionMaterialConsumption` | Production | Actual material usage by productionOrderId/inventoryItemId | Strong |
| Component Cost | `unitPrice`, `totalAmount` | `inventory_transaction_items` | Inventory | Material valuation source by inventoryItemId | Strong |
| Component Cost | `quantity`, `wastePercent` | `BOMItem` | BOM/Production | Estimated material demand | Strong |
| Component Cost | `estimatedMaterialCost`, `actualMaterialCost`, `estimatedCost`, `actualCost`, `varianceCost` | `ComponentCosting` | Components | Component linked to productionOrderId | Strong |
| Project Cost | `projectId` | `components` | Components/Projects | Components linked to Project | Partial |
| Project Cost | `estimatedCost`, `actualCost` | `components` | Components/Projects | Component cost visible by project | Partial |
| Project Cost | `projectId` | `inventory_transactions` | Inventory/Projects | Project-linked material movement | Partial |
| Project Cost | `totalAmount` | `inventory_transaction_items` | Inventory/Projects | Line valuation through transaction.projectId | Partial |
| Project Cost | formal project cost ledger | none | Projects | No dedicated project cost control ledger | Gap |

## Module Findings

### Production Orders

Relevant fields:

- `plannedStartAt`
- `plannedEndAt`
- `startedAt`
- `completedAt`
- `delayedAt`
- `delayReason`
- `currentStageCode`
- `status`
- `projectId`
- `componentId`
- `bomId`

Assessment:

- Good for high-level production lifecycle.
- Not enough by itself for shopfloor cycle time or worker/machine utilization.

### Production Stages

Relevant fields:

- `code`
- `name`
- `sequence`
- `status`
- `workCenterId`
- `machineId`
- `assignedWorkerId`
- `plannedStartAt`
- `plannedEndAt`
- `startedAt`
- `completedAt`
- `qualityStatus`

Assessment:

- Strong skeleton for stage board and basic timeline.
- Missing immutable transition history, actual labor time, actual machine runtime, downtime, hold reasons, and rework cycles.

### Production Tasks

Relevant fields:

- `stageId`
- `status`
- `workCenterId`
- `machineId`
- `assignedWorkerId`
- `plannedStartAt`
- `plannedEndAt`
- `startedAt`
- `completedAt`

Assessment:

- Useful for future dispatching and assignment.
- Current audited workflows do not yet rely on tasks as the primary MES execution unit.

### Production Logs

Relevant fields:

- `productionOrderId`
- `stageId`
- `type`
- `message`
- `quantity`
- `workerId`
- `machineId`
- `createdAt`

Assessment:

- Useful as event notes.
- Not enough as the sole source for stage history because logs are semi-structured messages rather than normalized transition records.

### Material Issues

Relevant fields:

- `productionOrderId`
- `reservationId`
- `reservationLineId`
- `inventoryItemId`
- `warehouseId`
- `zoneId`
- `slotId`
- `level`
- `issuedQty`
- `returnedQty`
- `issuedBy`
- `issuedDate`
- `status`

Assessment:

- Strong for production material control and traceability.
- No unit cost or total amount fields on issue itself.
- Cost should continue to derive from inventory valuation and production consumption, not issue rows alone.

### Reservations

Relevant fields:

- Header: `reservationNo`, `productionOrderId`, `bomId`, `status`, `reservedBy`, `reservedAt`, `expiresAt`, `releasedAt`
- Lines: `inventoryItemId`, `bomItemId`, `warehouseId`, `zoneId`, `slotId`, `level`, `requiredQty`, `reservedQty`, `issuedQty`, `returnedQty`, `status`

Assessment:

- Strong planning/availability model.
- Good for readiness and shortage.
- Not a costing source by itself.

### Consumptions

Relevant fields:

- `productionOrderId`
- `inventoryItemId`
- `issuedQty`
- `consumedQty`
- `scrapQty`
- `returnedQty`
- `createdBy`
- `createdAt`

Assessment:

- Strong actual material usage model.
- Best current foundation for component material costing.
- Missing operator/machine/stage attribution for precise shopfloor cost distribution.

### Components

Relevant fields:

- `projectId`
- `status`
- `plannedDate`
- `installedDate`
- `estimatedCost`
- `actualCost`
- `productionOrders`
- `costing`

Assessment:

- Good target entity for component cost analysis.
- Already bridges Production and Projects.
- Cost fields are current summary values, not a detailed cost ledger.

### BOM

Relevant fields:

- BOM header: `productCode`, `productName`, `projectId`, `estimatedWeight`, `version`, `status`
- BOM item: `materialId`, `quantity`, `wastePercent`, `category`
- Routing step: `stepNo`, `stepName`, `workshop`, `expectedHours`, `qcRequired`

Assessment:

- Good estimated-material and rough routing source.
- Routing has expected hours but no actual hours/rates.

### Inventory Transactions

Relevant fields:

- Header: `type`, `direction`, `performedBy`, `approvedBy`, `referenceModule`, `referenceId`, `projectId`, `supplierId`, `warehouseId`, `zoneId`, `transactionDate`
- Items: `inventoryItemId`, `quantity`, `unitPrice`, `totalAmount`, `warehouseId`, `zoneId`, `slotId`, `level`

Assessment:

- Strong valuation and movement foundation.
- Project material cost can be derived through `inventory_transactions.projectId` plus item `totalAmount`.
- Production material cost can be derived through material average cost and consumption.

## Answers To Required Questions

### 1. Actual Start Time / Actual End Time

Yes, partially.

- `production_orders.startedAt`
- `production_orders.completedAt`
- `production_stages.startedAt`
- `production_stages.completedAt`
- `production_tasks.startedAt`
- `production_tasks.completedAt`

Limitation:

- These are lifecycle timestamps, not full MES event history.
- There is no separate actual-time history table for repeated start/stop/pause/rework cycles.

### 2. Worker / Operator / Employee

Yes, partially.

- `production_stages.assignedWorkerId`
- `production_tasks.assignedWorkerId`
- `production_logs.workerId`
- `ProductionMaterialIssue.issuedBy`
- `ProductionMaterialConsumption.createdBy`

Limitation:

- Worker fields are raw string ids in the audited models.
- There is no clear Employee domain model or labor-rate model tied to costing.

### 3. Machine / Workcenter / Production Line

Yes for Machine and WorkCenter. No explicit Production Line model.

- `work_centers`
- `machines`
- `production_stages.workCenterId`
- `production_stages.machineId`
- `production_tasks.workCenterId`
- `production_tasks.machineId`
- `production_schedules.workCenterId`
- `production_schedules.machineId`
- `production_logs.machineId`

Limitation:

- Machine runtime and downtime are not captured.
- Production Line can be approximated as WorkCenter, but not explicitly modeled.

### 4. Stage History

Partially.

- Current state per stage exists in `production_stages`.
- Basic event notes exist in `production_logs`.
- Stage start/complete timestamps exist.

Gap:

- No dedicated immutable `ProductionStageEvent` or `ProductionExecutionTimeline` table.
- No normalized transition rows such as `Planning -> Cutting -> Assembly -> Welding -> Painting -> Finished`.

### 5. Component Cost

Yes, sufficiently for material costing.

Available data:

- BOM planned materials: `BOMItem.quantity`, `BOMItem.wastePercent`
- Actual material usage: `ProductionMaterialConsumption.consumedQty`, `scrapQty`
- Inventory valuation: `InventoryTransactionItem.unitPrice`, `totalAmount`
- Persisted component costing: `ComponentCosting`
- Component summary: `Component.estimatedCost`, `Component.actualCost`

Current gap:

- Labor/machine/overhead cost fields exist but are zero/manual because labor time, machine runtime, and rate tables are missing.

### 6. Project Cost

Partially.

Available data:

- Component-to-project relationship: `Component.projectId`
- Component summary costs: `Component.estimatedCost`, `Component.actualCost`
- Inventory transaction project relationship: `InventoryTransaction.projectId`
- Inventory line value: `InventoryTransactionItem.totalAmount`

Gap:

- No formal Project Cost Ledger.
- No project budget, committed cost, actual cost, variance, WIP, or cost-code model.
- Component cost and inventory project material movements can support an initial project cost view, but not full project cost control.

## Gaps

Shopfloor gaps:

- No immutable stage transition history model.
- No start/stop/pause/resume event stream.
- No downtime records.
- No machine runtime history.
- No labor time capture.
- No worker/employee rate model.
- No machine rate model.
- No explicit production line model.
- Stage and task worker ids are not clearly joined to an Employee domain.

Costing gaps:

- Labor, machine, and overhead cost inputs are not operationally captured.
- Project cost is derived, not ledgered.
- No project cost codes or WBS/cost breakdown.
- No costing approval/version history.
- No accounting-grade Decimal schema for cost precision yet; current models use Float.

## Recommendations

Recommended direction:

**Prioritize Costing before deeper Shopfloor.**

Why:

- Material cost path is already available and mostly implemented.
- Costing can deliver immediate business value using reliable existing data.
- Shopfloor dashboards beyond the current Kanban need new canonical execution events and runtime telemetry.

Recommended next sprints:

1. **20A Costing Engine**
   - Formalize material cost calculation service.
   - Add reusable cost aggregation by production order, component, and project.
   - Keep labor/machine/overhead as optional/manual until rate/runtime data exists.

2. **20B Component Cost Analysis**
   - Expand Component cost breakdown and variance analysis.
   - Add component cost trend, BOM vs actual, scrap impact, and unplanned material cost.
   - Add costing warnings and review state.

3. **20C Project Cost Control**
   - Aggregate project cost from component actual cost and project-linked inventory transaction items.
   - Add project cost dashboard: planned, actual, variance, material cost, component cost, pending/unknown cost.
   - Document gaps before adding a formal Project Cost Ledger.

Deferred Shopfloor path:

- 19D Shopfloor Dashboard
- 19E Execution Timeline
- 20A Workcenter Monitoring

These should wait until a canonical shopfloor event/timeline model is designed.

## Roadmap

### Phase 20A: Costing Engine

Goal:

- Make cost calculation reusable and auditable using existing consumption and inventory valuation data.

Data used:

- `ProductionMaterialConsumption`
- `InventoryTransactionItem`
- `BOMItem`
- `ComponentCosting`
- `Component`

Output:

- Cost by production order.
- Cost by component.
- Cost by material.
- Cost variance by BOM vs actual.

### Phase 20B: Component Cost Analysis

Goal:

- Make component cost explainable to production and management.

Output:

- Material cost breakdown.
- Scrap cost.
- Unplanned material cost.
- BOM variance.
- Actual vs estimated cost.

### Phase 20C: Project Cost Control

Goal:

- Aggregate existing component and inventory costs into a project control view.

Output:

- Project material cost.
- Project component cost.
- Project estimated vs actual.
- Missing-cost warnings.

### Future Shopfloor Phase

Before building deeper Shopfloor:

- Add/define a canonical execution event model.
- Decide whether production line is a first-class model or WorkCenter subtype.
- Add worker/employee domain and rates.
- Add machine runtime/downtime records.
- Add stage transition history.

