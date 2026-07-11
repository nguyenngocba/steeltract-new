# Dashboard Snapshot Standard

Status: ACTIVE
Date: 2026-07-11

## Rule

Dashboard, cockpit, analytics, trend, and KPI screens should prefer **Persisted Snapshots** with repository/runtime fallback.

```text
Dashboard / Cockpit / Analytics
-> Persisted Snapshot
-> Eventual consistency
-> Repository/runtime fallback when missing, stale, disabled, or parity-warning
```

## Applies To

Snapshots are appropriate for:

- KPI cards;
- dashboard overviews;
- cockpit summaries;
- trend charts;
- executive summaries;
- analytics widgets;
- status distributions;
- module health summaries;
- Operations Center snapshot/runtime health panels.

## Snapshot Reader Strategy

Use the existing strategy layer where available:

```text
DashboardReaderService.read(...)
  -> SnapshotReaderStrategy
  -> RuntimeAggregateStrategy fallback
```

Do not scatter ad hoc:

```ts
if (snapshot) {
  ...
} else {
  ...
}
```

inside individual services when the shared strategy can own freshness, confidence, fallback, and metrics.

## Freshness Contract

Dashboards are allowed **eventual consistency**:

- snapshot writes run through background workers;
- UI may lag by a few seconds/minutes depending on module SLA;
- missing/stale snapshots fall back to runtime aggregate;
- snapshot age/confidence/fallback should be observable through runtime metrics and Operations Center.

## Fallback Contract

Fallbacks must be safe and bounded:

- use repository-backed runtime aggregate;
- keep API response contract stable;
- record snapshot miss/stale/fallback metrics;
- do not return fake values;
- do not hide parity warnings.

## Forbidden Dashboard Behavior

Dashboards should not:

- aggregate millions of transaction rows at request time;
- load full workspace lists into the browser to compute KPIs;
- fabricate trends when history is missing;
- use `Math.random()` or synthetic operational data;
- silently turn missing metrics into `0` when that changes business meaning.

## Difference From Workspace Reads

| Surface | Data source | Consistency |
| --- | --- | --- |
| Dashboard / Cockpit / Analytics | Persisted Snapshot first | Eventual |
| Workspace / Grid / Queue / Form | Repository Live Read Model | Strong read-after-write |

## Current Reference Implementations

- Inventory Overview: snapshot/read-model endpoint, with repository fallback.
- Dashboard Inventory: `DashboardInventoryReadModelService` through dashboard reader strategy.
- Projects runtime dashboard: `ProjectDashboardSnapshot` through `DashboardReaderService`.
- Logistics dispatch dashboard: `DispatchDashboardSnapshot` through `DashboardReaderService`.
- Operations Center: runtime/system observability and snapshot health, not an operator workspace.

## Review Checklist

Before approving a dashboard:

- Is a persisted snapshot available or planned?
- Does the service use `DashboardReaderService` where applicable?
- Is runtime fallback bounded and repository-backed?
- Are snapshot hit/miss/age/fallback metrics recorded?
- Are missing historical datasets rendered as empty/missing, not fabricated?
- Does the dashboard avoid frontend aggregation over capped lists?
