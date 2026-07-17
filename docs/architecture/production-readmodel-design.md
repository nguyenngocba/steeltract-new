# Production Read Model Design

Date: 2026-07-17  
Status: **PROPOSED - NO CODE CHANGE**

## ADR011 Boundary

```text
Operator workspace -> Repository Live Read Model
Dashboard/analytics -> Persisted Snapshot -> Repository fallback
```

The existing implementation already follows this split:

- `GET /production/read-model/cockpit` is a bounded repository live read model.
- `GET /production/metrics` is snapshot-first with repository fallback and a
  background refresh request.

EPIC186 must not replace both paths with one generic read model.

## Required Live Read Models

| Surface | Source | Required shape |
| --- | --- | --- |
| Production Orders | Repository | Bounded list, filters, stable sort, lifecycle and stage summary |
| Work Orders | Repository | Parent order, child order counts, quantity progress and current bottleneck |
| Operator queue | Repository | Ready/in-progress stage rows by work center and priority |
| Production detail | Repository | Order, stages, tasks, logs, material status and quantity reconciliation |
| Completion review | Repository | Planned/completed/rejected/scrap/remaining with provenance |

## Dashboard Snapshots

The existing `ProductionDashboardSnapshot`, `ProductionOrderSnapshot`, and
`WorkCenterSnapshot` remain the dashboard/analytics sources. Future Work Order
summary may be added only after its aggregate schema and events are approved.

## Aggregation Ownership

- Repository computes workspace KPI, filtering, sorting and pagination.
- Snapshot writer computes dashboard analytics asynchronously.
- React renders response data and must not derive business totals from an
  incomplete page.
- Material balance remains based on the Production material ledger and
  Inventory-owned posting evidence.

## Quantity Projection

After domain approval, one projection should expose:

```text
plannedQty
startedQty
completedQty
rejectedQty
scrapQty
remainingQty
```

The formula and ownership are intentionally not frozen here. In particular,
`remainingQty` cannot be defined until rejected/rework semantics and unit of
measure are approved.

## Compatibility

Prefer additive read-model endpoints or additive fields. Existing Production
Order and Cockpit contracts must remain valid. No new endpoint is authorized by
this assessment.

