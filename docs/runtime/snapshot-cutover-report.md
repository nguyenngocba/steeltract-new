# EPIC107 SNAP.2 - Snapshot Read Cutover

Date: 2026-07-08

## Scope

SNAP.2 routes dashboard reads through a snapshot-first strategy layer while preserving existing UI, workflow, business logic, and API contracts.

Cutover targets:

- Inventory dashboard data through `DashboardInventoryReadModelService.getCockpitInventory()`
- Projects dashboard data through `GET /projects/runtime`
- Logistics dashboard data through `GET /logistics/dispatch-dashboard`

## Strategy Flow

```text
Dashboard service
  -> DashboardReaderService.read(...)
  -> SnapshotReaderStrategy
  -> RuntimeAggregateStrategy fallback
```

No controller or dashboard service owns ad-hoc `if snapshot else runtime` branching.

## Freshness

Freshness is computed from persisted snapshot `updatedAt`.

Returned internally by the strategy:

- `ageSeconds`
- `isStale`
- `confidence`

Default max age:

```text
SNAPSHOT_MAX_AGE_SECONDS=900
```

Module-specific overrides:

```text
USE_INVENTORY_SNAPSHOT_MAX_AGE_SECONDS
USE_PROJECT_SNAPSHOT_MAX_AGE_SECONDS
USE_DISPATCH_SNAPSHOT_MAX_AGE_SECONDS
```

## Feature Flags

Snapshot reads are enabled by default and can be disabled per dashboard:

```text
USE_INVENTORY_SNAPSHOT=true
USE_PROJECT_SNAPSHOT=true
USE_DISPATCH_SNAPSHOT=true
```

Set a flag to `false` to force runtime aggregate fallback.

## Fallback Conditions

The strategy falls back to runtime aggregate when:

- feature flag is disabled
- snapshot is missing
- snapshot is stale
- parity comparison detects mismatched business values

Fallback does not change response shape.

## Runtime Metrics

Runtime metrics now include:

- snapshot hit
- snapshot miss
- snapshot fallback
- snapshot stale
- snapshot age
- snapshot confidence

## Verification

After refreshing real snapshots through the background job path:

Inventory smoke:

```json
{
  "inventoryTotal": 21473.4,
  "lowStockCount": 9,
  "snapshots": {
    "hits": 2,
    "misses": 0,
    "fallbacks": 0,
    "stale": 0,
    "averageAgeSeconds": 11,
    "averageConfidence": 100
  }
}
```

Projects smoke:

```json
{
  "projects": 1,
  "averageProgress": 50,
  "snapshots": {
    "hits": 2,
    "misses": 0,
    "fallbacks": 0,
    "stale": 0,
    "averageConfidence": 100
  }
}
```

Logistics smoke:

```json
{
  "waiting": 0,
  "recent": 0,
  "snapshots": {
    "hits": 0,
    "misses": 2,
    "fallbacks": 1
  }
}
```

Logistics fallback is expected in the current dataset because there are no dispatch orders, therefore no dispatch snapshot rows.

