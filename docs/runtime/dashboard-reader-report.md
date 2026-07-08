# Dashboard Reader Strategy Report

Date: 2026-07-08

## Components

Added:

- `DashboardReaderService`
- `SnapshotReaderStrategy`
- `RuntimeAggregateStrategy`
- `SnapshotFeatureFlagService`
- `dashboard-reader.types.ts`

## Contract

Dashboard callers use:

```ts
dashboardReader.read({
  module,
  snapshotType,
  loadSnapshot,
  readSnapshot,
  readRuntime,
  compare,
})
```

The reader returns:

- existing dashboard data
- internal source metadata

The metadata is used for runtime metrics and is not added to public API responses.

## Repository Boundary

Snapshot data is read through:

- `SnapshotReaderService`
- snapshot repositories

No dashboard service queries snapshot Prisma models directly.

## Parity Guard

When `SNAPSHOT_PARITY_CHECK` is enabled, the strategy compares snapshot-derived business values with runtime aggregate values.

If mismatched:

- warning is logged
- runtime aggregate is returned
- request does not crash
- no fake data is returned

## Production Rollout

Each module can be rolled out independently by setting:

- `USE_INVENTORY_SNAPSHOT`
- `USE_PROJECT_SNAPSHOT`
- `USE_DISPATCH_SNAPSHOT`

