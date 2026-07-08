# EPIC104 / Sprint DE.2 - Persisted Snapshot Architecture

Date: 2026-07-07

Scope:

- Design persisted snapshot architecture for Enterprise-scale SteelTrack.
- Do not create snapshot tables in this sprint.
- Preserve current API contracts and workflows.

## Objective

SteelTrack dashboards and detail workspaces should eventually read precomputed snapshots instead of repeatedly aggregating high-volume transaction tables.

The service contract should stay stable:

```text
Controller
  -> Service
    -> Snapshot read model when fresh
    -> fallback source query when snapshot missing/stale
```

Business logic and workflow should not depend on whether the data came from live aggregation or a persisted snapshot.

## Candidate Snapshots

| Snapshot | Source Tables | Primary Consumers | Refresh Mode |
| --- | --- | --- | --- |
| `InventoryDashboardSnapshot` | `inventory_items`, `inventory_location_stocks`, `inventory_transactions`, `inventory_transaction_items` | Inventory dashboard, Dashboard executive panels | Event-driven + scheduled rebuild |
| `MaterialDailyMovementSnapshot` | `inventory_transaction_items`, `inventory_transactions` | Material Detail analytics, forecast panels | Daily rollup + incremental append |
| `MaterialLocationBalanceSnapshot` | `inventory_location_stocks`, Inventory transaction ledger | Material detail, warehouse locations, inbound/outbound validation | Event-driven after stock mutation |
| `ProjectRuntimeSnapshot` | `projects`, `project_tasks`, allocations, components, returns | Projects list, Project Detail overview | Event-driven + background rebuild |
| `ProjectTaskHealthSnapshot` | `project_tasks`, dependencies, allocations, inspections, costs | Project command center, scheduling warnings | Event-driven after task/resource/cost change |
| `LogisticsDispatchSnapshot` | `dispatch_orders`, delivery events, components, projects | Logistics workspace, dispatch detail | Event-driven after dispatch update |
| `DashboardExecutiveSnapshot` | Module-level snapshots, notifications, activity logs | Executive dashboard/control tower | Scheduled compose from module snapshots |

## Snapshot Metadata

Every persisted snapshot should carry:

- `snapshotKey`
- `scopeId` when scoped, such as `projectId` or `inventoryItemId`
- `generatedAt`
- `sourceWatermark`
- `version`
- `payload`
- `stale`
- `refreshReason`

This allows the API to report freshness without changing existing DTO payloads. Freshness metadata can be internal first, then optionally surfaced later.

## Refresh Triggers

Inventory:

- Inventory transaction created.
- Inventory transaction item created.
- Location stock changed.
- Return request received/rejected/accepted.

Projects:

- Project task created/updated/deleted.
- Task dependency changed.
- Material/component allocation changed.
- Return request lifecycle changed.
- Inspection/cost changed.

Logistics:

- Dispatch order created/updated.
- Component shipment/delivery/install state changes.
- Dispatch allocation changes.

Dashboard:

- Compose from module snapshots on interval.
- Refresh immediately for critical operational changes when needed.

## Read Path

Preferred read path:

```text
Request
  -> snapshot lookup
  -> if fresh: return snapshot payload
  -> if stale/missing: run current repository source query
  -> optionally enqueue snapshot rebuild
```

This preserves current behavior while allowing snapshots to be introduced gradually.

## Rebuild Strategy

Recommended phases:

1. Create snapshot tables for Inventory only.
2. Backfill snapshots from current source queries.
3. Add background rebuild job for one module.
4. Add source/fallback telemetry:
   - snapshot hit
   - snapshot miss
   - stale snapshot
   - fallback query
5. Move Projects and Logistics after Inventory snapshot parity is proven.

## Compatibility Rules

- Do not remove existing repository source queries.
- Do not change public DTO shape while introducing snapshots.
- Keep snapshot payload versioned.
- Keep fallback queries available for rebuild, validation, and emergency bypass.
- Compare source query vs snapshot output before enabling snapshot as default.

## No Migration in DE.2

No snapshot migration was created in this sprint. DE.2 is a design/foundation step only. The first persisted snapshot migration should be a separate sprint with parity tests and rollback guidance.

## Recommended First Migration

When approved, start with:

- `InventoryDashboardSnapshot`
- `MaterialDailyMovementSnapshot`

Reason:

- Inventory has the highest transaction growth risk.
- Dashboard and Material Detail repeatedly aggregate transaction and location stock data.
- Snapshot correctness can be validated against existing Inventory APIs without changing UI.
