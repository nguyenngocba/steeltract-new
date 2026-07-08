# EPIC107 SNAP.1 - Persisted Snapshot Engine

Date: 2026-07-07

## Scope

SNAP.1 introduces the persisted snapshot foundation for SteelTrack without changing UI, workflow, existing API contracts, or business logic.

The implementation adds:

- PostgreSQL-backed snapshot tables for Inventory, Projects, and Logistics dispatch dashboards.
- Snapshot repositories as the only access layer for persisted snapshot reads/writes.
- Snapshot writer service for background rebuild/update execution.
- Snapshot reader service with hit/miss/lag metric recording.
- Snapshot validator service with warning-only persisted-vs-source comparison.
- Snapshot rebuilder integration so rebuild jobs no longer return `skipped`.

## Persisted Snapshot Tables

### InventoryDashboardSnapshot

Purpose: warehouse-level inventory dashboard snapshot by date.

Key fields:

- `warehouseId`
- `warehouseCode`
- `snapshotDate`
- `totalMaterials`
- `totalStock`
- `availableStock`
- `reservedStock`
- `lowStockCount`
- `movementToday`
- `movementMonth`
- `inventoryValue`
- `updatedAt`

Unique key:

- `warehouseId + snapshotDate`

### ProjectDashboardSnapshot

Purpose: project runtime dashboard snapshot.

Key fields:

- `projectId`
- `progress`
- `delayedTaskCount`
- `completedTaskCount`
- `activeTaskCount`
- `materialProgress`
- `componentProgress`
- `logisticsProgress`
- `costProgress`
- `healthScore`
- `updatedAt`

Unique key:

- `projectId`

### DispatchDashboardSnapshot

Purpose: dispatch-order dashboard snapshot.

Key fields:

- `dispatchOrderId`
- `projectId`
- `loadingCount`
- `inTransitCount`
- `arrivedCount`
- `completedCount`
- `delayCount`
- `updatedAt`

Unique key:

- `dispatchOrderId`

## Engine Flow

```text
Domain Event / Manual Rebuild
  -> SnapshotUpdateDispatcher
  -> BackgroundJobManager
  -> background_jobs
  -> JobWorkerService
  -> SnapshotRebuilder
  -> SnapshotWriterService
  -> SnapshotRepository
  -> persisted snapshot table
  -> SnapshotValidatorService warning-only check
```

## Atomic Update Policy

Snapshot writes use Prisma transactions and `upsert`.

The implementation does not perform:

```text
delete snapshot
insert snapshot
```

Instead, each snapshot row is updated in place or created if missing. This preserves compatibility with future readers and avoids temporary gaps during rebuild.

## Runtime Metrics Integration

`PerformanceMetricsService` now tracks:

- snapshot hits
- snapshot misses
- snapshot rebuild count
- average rebuild time
- snapshot lag
- max snapshot lag

Runtime analytics windows include those counters in 5m/1h/24h summaries.

## Smoke Verification

Runtime path verified through `JobsModule`:

```text
SnapshotUpdateDispatcher.requestRebuild()
JobWorkerService.processDueJobs()
SnapshotRebuilder.rebuild()
SnapshotWriterService.rebuild()
```

Result:

```json
{
  "processed": 1,
  "counts": {
    "inventory": 2,
    "projects": 1,
    "dispatch": 0
  }
}
```

Notes:

- Inventory persisted 2 warehouse snapshots from real warehouse/location stock data.
- Projects persisted 1 project snapshot from real project/task data.
- Dispatch persisted 0 rows because the current validation database has no `dispatch_orders` rows. No fake dispatch snapshot was created.

## Compatibility

Dashboard endpoints have not been switched to snapshots in SNAP.1.

This is intentional. SNAP.1 prepares the persisted foundation so the next sprint can move dashboard reads without changing business logic.

