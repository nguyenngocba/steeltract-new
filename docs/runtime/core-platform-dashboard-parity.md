# Core Platform Dashboard Parity

Date: 2026-07-13

## Certification Matrix

| Module | Dashboard primary | Missing/stale fallback | Background enqueue | Workspace primary | Result |
|---|---|---|---|---|---|
| Inventory | Persisted snapshot | Repository live read model | Yes | Repository live read model | PASS |
| Production | Persisted snapshot metrics | Repository live read model | Yes | Repository live read model | PASS |
| Components | `ComponentDashboardSnapshot` | Repository calculation | Yes | Repository live read model | PASS |
| QC | `QcDashboardSnapshot` | Repository calculation | Yes | Repository live read model | PASS |
| Yard | `YardDashboardSnapshot` | Repository live read model | Yes | Repository live read model | PASS |

## ADR011 Result

All five Core Platform modules now expose active snapshot-first dashboard paths
while operator workspaces remain live. Components, QC and Yard use additive API
routes, so previous clients remain compatible.

EPIC173 closes Certification Gate P1-1. Core Platform v1.0 remains blocked only
on EPIC174 atomic Outbox and runtime naming parity, followed by the final EPIC170
certification rerun.
