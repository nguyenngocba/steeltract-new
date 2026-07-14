# Yard Dashboard Certification

Date: 2026-07-13

Status: **ADR011 PASS**

## Active Sources

| Surface | Source | Result |
|---|---|---|
| Yard KPI strip | `/yard/dashboard` -> Snapshot Reader | PASS |
| Capacity/status distribution | Dashboard snapshot fields | PASS |
| Movement distribution | Dashboard snapshot payload | PASS |
| Zone utilization | Dashboard snapshot payload | PASS |
| Maps, slots, placements, movements and cranes | `/yard/read-model/workspace` | PASS |

Yard keeps one composed page, but dashboard cards/charts no longer derive from
the workspace response. Operator maps and actions remain live. The persisted
snapshot currently stores monthly totals and movement distribution, not a
historical time series; the existing no-data state is therefore shown for the
trend instead of falling back to live dashboard aggregation.

`YardSnapshotReadService` keeps the approved missing/stale fallback and
background rebuild behavior. Feature flag and Snapshot Engine semantics are
unchanged.
