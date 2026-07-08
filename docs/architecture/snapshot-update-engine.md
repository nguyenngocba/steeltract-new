# EPIC105 / Sprint DE.3 - Snapshot Update Engine

Date: 2026-07-07

Scope:

- Define the common snapshot update interface for Inventory, Projects, and Logistics.
- Define the Snapshot Rebuilder contract.
- No implementation or migration in this sprint.

## Design Goals

The Snapshot Update Engine standardizes how modules update derived read models.

The engine must be:

- idempotent;
- scoped;
- measurable;
- rebuildable;
- safe to run asynchronously;
- compatible with existing API contracts.

## Core Interfaces

Recommended TypeScript contracts for a future implementation:

```ts
export type SnapshotModule = 'inventory' | 'projects' | 'logistics' | 'dashboard';

export type SnapshotUpdateReason =
  | 'domain-event'
  | 'manual-rebuild'
  | 'scheduled-rebuild'
  | 'stale-snapshot'
  | 'fallback-miss';

export interface SnapshotUpdateScope {
  module: SnapshotModule;
  snapshotType: string;
  scopeId?: string;
  projectId?: string;
  inventoryItemId?: string;
  warehouseId?: string;
  dispatchOrderId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface SnapshotUpdateRequest {
  scope: SnapshotUpdateScope;
  reason: SnapshotUpdateReason;
  sourceEventId?: string;
  sourceWatermark?: string;
  requestedAt: string;
  priority?: number;
}

export interface SnapshotUpdateResult {
  scope: SnapshotUpdateScope;
  generatedAt: string;
  sourceWatermark?: string;
  rowsRead: number;
  durationMs: number;
  status: 'updated' | 'skipped' | 'failed';
  error?: string;
}
```

## Module Updaters

Recommended interface:

```ts
export interface SnapshotUpdater {
  supports(scope: SnapshotUpdateScope): boolean;
  update(request: SnapshotUpdateRequest): Promise<SnapshotUpdateResult>;
  rebuild(request: SnapshotRebuildRequest): Promise<SnapshotRebuildResult>;
}
```

### Inventory Updater

Snapshot types:

- `InventoryDashboardSnapshot`
- `MaterialDailyMovementSnapshot`
- `MaterialLocationBalanceSnapshot`

Triggers:

- `inventory.transaction.created`
- `inventory.stock.changed`
- `inventory.return.received`
- `inventory.material.updated`

Incremental scope examples:

- item + date for material movement;
- warehouse + date for warehouse distribution;
- global for dashboard compose.

Fallback rule:

- If the incremental scope cannot be resolved safely, enqueue a scoped rebuild instead of producing a partial snapshot.

### Projects Updater

Snapshot types:

- `ProjectRuntimeSnapshot`
- `ProjectTaskHealthSnapshot`
- `ProjectCostSnapshot`

Triggers:

- `project.task.created`
- `project.task.updated`
- `project.task.deleted`
- `project.schedule.changed`
- `project.material.changed`
- `project.component.changed`
- `project.cost.changed`
- `project.inspection.changed`
- `inventory.return.received` when linked to a project.

Incremental scope:

- `projectId` is mandatory.
- task-level updates should roll up to project snapshot.

Fallback rule:

- Missing `projectId` should mark the job failed with a validation error; it should not run a global project rebuild silently.

### Logistics Updater

Snapshot types:

- `LogisticsDispatchSnapshot`
- `DispatchOrderSnapshot`
- `DispatchCapacitySnapshot`

Triggers:

- `logistics.dispatch.created`
- `logistics.dispatch.changed`
- `logistics.dispatch.completed`
- `project.component.changed` when shipment state changes.

Incremental scope:

- dispatch order;
- project;
- date window.

Fallback rule:

- If Logistics tables are sparse or not fully adopted, return an explicit empty snapshot and record low coverage instead of fabricating operational data.

## Snapshot Rebuilder

The rebuilder is responsible for full and scoped rebuilds.

Recommended request:

```ts
export interface SnapshotRebuildRequest {
  module: SnapshotModule;
  snapshotType?: string;
  scopeId?: string;
  fromDate?: string;
  toDate?: string;
  reason: SnapshotUpdateReason;
  requestedBy?: string;
  dryRun?: boolean;
}
```

Recommended phases:

1. Validate module/snapshot type.
2. Determine rebuild scope.
3. Read bounded source data.
4. Compute payload.
5. Compare with existing snapshot when present.
6. Upsert snapshot.
7. Emit `snapshot.updated`.
8. Record rebuild metrics.

## Staleness Policy

Suggested freshness targets:

| Snapshot | Freshness Target |
| --- | --- |
| Inventory dashboard | 1-5 minutes |
| Material daily movement | 15 minutes plus nightly reconciliation |
| Material location balance | near-real-time after stock mutation |
| Project runtime | 5 minutes |
| Project task health | 1-5 minutes after task/resource changes |
| Logistics dispatch | 1 minute for active dispatches |
| Executive dashboard | 5 minutes |

If a snapshot is stale:

- return fallback query during early migration;
- enqueue rebuild;
- record `snapshot miss` or `stale snapshot` runtime metric.

## Data Quality Rules

- Do not invent values.
- Do not overwrite source records.
- Keep fallback source queries available.
- Store source watermark so rebuilds are explainable.
- Snapshot payloads must be versioned before public dependency grows.

## First Implementation Recommendation

Start with Inventory:

1. `InventoryDashboardSnapshot`.
2. `MaterialDailyMovementSnapshot`.
3. `snapshot.inventory.rebuild` job.
4. Parity comparison between snapshot payload and current live aggregate.

Projects and Logistics should follow only after Inventory parity and monitoring are stable.
