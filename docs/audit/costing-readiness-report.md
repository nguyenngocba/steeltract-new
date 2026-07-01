# Costing Readiness Report

Date: 2026-06-29

## Current Costing Assets

Available data:

- `InventoryTransactionItem.quantity`
- `InventoryTransactionItem.unitPrice`
- `InventoryTransactionItem.totalAmount`
- `ProductionMaterialIssue.issuedQty`
- `ProductionMaterialIssue.returnedQty`
- `ProductionMaterialConsumption.consumedQty`
- `ProductionMaterialConsumption.scrapQty`
- `BOMItem.quantity`
- `BOMItem.wastePercent`
- `ProductionOrder.quantity`
- `ComponentCosting`
- Read-only Costing API:
  - `GET /production/orders/:id/cost`
  - `GET /components/:id/cost`
  - `GET /projects/:id/cost`

## Readiness by Cost Type

| Cost Area | Readiness | Assessment |
|---|---:|---|
| Material Cost | Ready/Partial | Strong source data after transaction valuation hardening. Needs broader verification on real data. |
| Component Material Cost | Partial | ComponentCosting and costing breakdown exist. Needs history/versioning and source trace UI. |
| Production Order Cost | Partial | Read model can calculate material issue valuation. Needs approved cost snapshot at lifecycle milestones. |
| Project Material Cost | Partial | Can roll up from components and project inventory usage. Needs budgets, baselines, and contracts. |
| Labor Cost | Not Ready | Workers/tasks exist but no labor time and rate capture. |
| Machine Cost | Not Ready | Work centers/machines exist but no runtime, downtime, rates, or cost allocation. |
| Overhead Cost | Not Ready | No overhead pools or allocation rules. |
| Rework/QC Cost | Not Ready | QC issues/NCR exist but no cost capture linked to rework. |
| Yard/Logistics Cost | Not Ready | Yard movements exist but no handling/dispatch cost model; Logistics lacks backend foundation. |

## Transaction Quality

Strengths:

- Inventory item valuation is now persisted for future operational transaction items.
- Historical backfill strategy was documented and partially executed in previous sprints.
- Production material issue paths write Inventory transaction valuation.

Risks:

- Legacy records may still have reconciliation issues outside valuation fields.
- Imported historical records may not have trustworthy unit prices.
- Transaction source of cost must be explicit in UI and API: actual issue cost vs average-cost fallback.

## Ledger Quality

Strengths:

- `ProductionMaterialLedger` tracks reservation and material movement events.
- `CONSUME`, `ISSUE`, `RETURN`, `RESERVE`, `RELEASE` exist as event types.

Gaps:

- `ADJUST` writer is not fully operationalized.
- Inventory does not yet have an immutable slot-level ledger equivalent.
- Ledger and issue/consumption reconciliation need scheduled integrity checks.

## Production Traceability

Ready:

- ProductionOrder -> BOM -> BOMItem.
- ProductionOrder -> MaterialIssue.
- ProductionOrder -> MaterialConsumption.
- ProductionOrder -> Component.

Gaps:

- Actual stage/runtime cost is not captured.
- Worker/machine assignments are not consistently costed.

## Recommendation

Costing is ready for a material-cost engine and component/project material-cost analysis. It is not ready for full actual manufacturing cost until labor, machine, overhead, and rework capture are designed.

Next costing sprints:

1. Component Cost Analysis UI with source trace.
2. Project Cost Control with material budget/baseline.
3. Labor/Machine capture design before implementation.

