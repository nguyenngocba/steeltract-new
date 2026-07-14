# QC Dashboard Certification

Date: 2026-07-13

Status: **ADR011 PASS**

## Active Sources

| Surface | Source | Result |
|---|---|---|
| `/qc/dashboard` KPI | `QcDashboardSnapshot` through Snapshot Reader | PASS |
| QC defect aggregate | Snapshot payload | PASS |
| QC result trend | Snapshot payload | PASS |
| Overview/operator tabs | `/qc/read-model/workspace` | PASS |
| Inspection rows and production queue embedded in Dashboard | Live workspace read model | PASS |

Only the explicit Dashboard route consumes snapshot metrics. QC Overview,
Inbound, Production, Final, NCR and other operator workspaces remain live.
Embedded queue/table sections keep strong read-after-write semantics while the
dashboard KPI/trend remain eventual.

`QcSnapshotReadService` preserves snapshot freshness checks, warning-only parity,
repository fallback and background enqueue. Unsupported dashboard analytics use
the existing empty state; no hardcoded or synthetic data was introduced.
