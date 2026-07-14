# QC Snapshot Reader Report

## Read Strategy

`QcSnapshotReadService` uses the shared `DashboardReaderService`:

```text
QC Dashboard/Inspection Summary
  -> persisted snapshot when enabled and fresh
  -> live QcSnapshotRepository calculation on disabled/missing/stale/mismatch
  -> enqueue snapshot.qc.update after fallback
```

`USE_QC_SNAPSHOT` uses the existing default-enabled and max-age semantics. The
dashboard comparison checks all persisted KPI fields. Mismatch returns live
repository data and emits the existing parity warning behavior.

The service is exported by `QcModule` for future dashboard consumers. Existing
QC endpoints and frontend were not cut over or changed in this sprint.

