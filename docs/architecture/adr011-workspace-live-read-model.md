# ADR011 - Workspace Live Read Model

Date: 2026-07-11
Status: Accepted

## Problem

SteelTrack now has persisted snapshots and background update infrastructure. Snapshots are excellent for dashboards, but they can be briefly stale after a write. Operator workspaces need a stronger promise: after a user creates or updates business data, the active workspace must show the committed state without F5, tab switching, polling tricks, or retry masking.

Inventory EPIC118.5.1 exposed the risk: Materials refetched after an outbound transaction, but the API response still used a fresh-by-age material snapshot. The UI looked stale even though React Query had done its job.

## Context

SteelTrack uses:

- Repository Pattern;
- persisted snapshots;
- Background Engine;
- Event/Outbox;
- React Query;
- Operations Center runtime metrics.

The platform needs a clear rule so future modules do not misuse snapshots for live operator workspaces.

## Decision

Adopt this enterprise rule:

```text
Workspace Pages -> Repository Live Read Model -> Strong Read-after-Write
Dashboard / Cockpit / Analytics -> Persisted Snapshot -> Eventual Consistency
```

Workspace pages include editable grids, transaction forms, operator queues, detail drawers with actions, and any list where users expect immediate reflection of their own writes.

Dashboard pages include KPI cards, analytics, trends, executive views, health summaries, and cockpit overviews.

## Consequences

Positive:

- Operators see committed data immediately in workspaces.
- Snapshot lag no longer breaks workflow confidence.
- Dashboards can scale independently through background snapshots.
- Module design becomes easier to review: each screen must declare consistency class.

Negative:

- Some modules need two read paths: live workspace read model and snapshot dashboard read model.
- Live workspace endpoints still require pagination, indexing, and query budgets.
- Existing Project detail snapshots must be reclassified because some tabs behave like workspaces.

## Trade-offs

The decision favors correctness in operator workspaces over maximum read performance. Performance remains controlled through server-side pagination, query budgets, repositories, and focused read models. Dashboards keep the high-scale snapshot strategy because they do not require immediate post-write consistency.

## Enforcement

During review:

- If a screen has operator actions or editable data, snapshot-first primary reads are a violation unless explicitly justified.
- If a screen is dashboard-only, request-time aggregate over large transaction tables is a violation unless bounded and temporary.
- Every new module screen must classify itself as `Workspace`, `Dashboard`, `Hybrid`, or `Operations`.

## Related Standards

- `docs/architecture/workspace-read-model-standard.md`
- `docs/architecture/dashboard-snapshot-standard.md`
- `docs/architecture/enterprise-read-model-rollout.md`
- Inventory EPIC118.5.1 root cause reports
