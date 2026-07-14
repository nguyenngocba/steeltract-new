# EPIC163 - Yard Snapshot Reader Report

## Reader Paths

`SnapshotReaderService` now supports persisted Yard Dashboard and Workspace
summary reads exclusively through `YardSnapshotRepository`.

`YardSnapshotReadService.dashboard()` uses the shared `DashboardReaderService`:

1. read fresh persisted `YardDashboardSnapshot`;
2. validate optional parity against `YardReadModelRepository`;
3. on missing/stale/mismatch, return the repository live result;
4. enqueue a background update for missing/stale snapshot.

`workspaceSummary()` supports persisted global/per-zone summaries with live
repository fallback and background enqueue. It is foundation-only and is not
used by the operator workspace.

`USE_YARD_SNAPSHOT` and `USE_YARD_SNAPSHOT_MAX_AGE_SECONDS` follow existing
feature-flag semantics. No public API or frontend was changed.

