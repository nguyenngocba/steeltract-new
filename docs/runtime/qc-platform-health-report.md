# EPIC154 - QC Platform Health Report

## Operations Center Contract

`OperationsCenterService.overview()` now returns an additive `qc` health section covering:

| Area | Signal |
| --- | --- |
| Repository | QC repository boundary coverage |
| Read model | live read hits and snapshot fallback count |
| Snapshot | row counts, newest update, freshness, hit/miss ratio, age, lag |
| Runtime | QC counters are registered in the shared runtime service |
| Feature flag | `USE_QC_SNAPSHOT` state |
| Background | active and failed `snapshot.qc*` jobs |
| Event routing | pending and failed `qc.*` outbox events |
| Parity | warning-only validator readiness |

No Operations Center UI was changed. Existing clients remain compatible because the payload addition is optional and additive.

## Current Operational Interpretation

A deployment with no persisted QC snapshots correctly reports snapshot health as critical/missing until real QC traffic creates or rebuilds snapshots. This is an operational state, not synthetic health data.

Event freshness remains **partial**: only already-approved QC events are routed. EPIC154 does not invent missing create/approve/reject/NCR-update workflow events.

