# QC Operations Center Readiness Audit

## Result

Status: **NOT READY**

Operations Center currently exposes Inventory, Projects, Production and
Components Platform Health. It has no QC repository query, response section or
snapshot module row.

Required future health shape:

- Repository boundary and coverage.
- Live read-model hit/fallback.
- Dashboard and inspection-summary snapshot freshness.
- `USE_QC_SNAPSHOT` state.
- `qc.*` Outbox pending/failed counts.
- `snapshot.qc.*` jobs and retries.
- Runtime counters and query-budget status.
- Snapshot parity warnings.
- Event routing coverage.

The current database contains no QC Outbox rows or QC snapshot jobs. EPIC150 did
not create traffic or data to alter that state.

