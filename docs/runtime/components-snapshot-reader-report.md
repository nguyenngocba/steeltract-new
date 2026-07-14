# Components Snapshot Reader Report

Date: 2026-07-12

## Read Strategy

`ComponentsSnapshotReadService` uses the shared `DashboardReaderService`:

```text
Feature flag enabled
  -> fresh persisted Component snapshot
  -> parity check
  -> snapshot result

disabled / missing / stale / mismatch
  -> ComponentSnapshotRepository live calculation
  -> repository fallback result
  -> enqueue background snapshot update
```

Supported reads:

- Component dashboard by snapshot date;
- dashboard history;
- Component summary by `componentId`;
- summary collection for foundation consumers.

No public API or frontend was changed in EPIC143. The service is exported from
`ComponentsModule` for a future dashboard cutover without touching workspace
queries.

`USE_COMPONENTS_SNAPSHOT=false` forces repository fallback. Freshness uses the
existing `USE_COMPONENTS_SNAPSHOT_MAX_AGE_SECONDS` convention with the global
snapshot maximum as fallback.

