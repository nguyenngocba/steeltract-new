# SNAP.1 Snapshot Reader Report

Date: 2026-07-07

## Reader Components

Implemented:

- `SnapshotReaderService`
- `InventorySnapshotRepository.findLatest`
- `ProjectSnapshotRepository.findLatest`
- `DispatchSnapshotRepository.findLatest`

## Access Rule

Snapshot reads go through repositories only.

No dashboard endpoint has been switched to snapshot reads in SNAP.1.

## Metrics

Reader calls record:

- snapshot hit
- snapshot miss
- snapshot lag

These counters are exposed through the existing runtime metrics and runtime analytics summaries.

## Future Switch Path

The next dashboard read migration can use:

```text
Dashboard service
  -> SnapshotReaderService
  -> SnapshotRepository
```

If snapshot miss occurs, the existing runtime aggregate path can remain as fallback until persisted snapshots are fully trusted.

