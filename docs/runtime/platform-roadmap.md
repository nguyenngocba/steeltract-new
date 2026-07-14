# Core Platform Remediation Roadmap

## Gate 1 - Transaction Integrity (P0)

One focused sprint:

- move Inventory Return command, Activity Log and domain Outbox into repository
  transactions;
- replace Components post-commit `component.updated` with repository-owned
  atomic Outbox;
- classify Production legacy stage/staging events and move persistent events
  into their owning transactions without duplicating canonical events;
- add rollback/idempotency tests.

Exit gate: no persistent domain event is written after business commit.

## Gate 2 - ADR011 Completion (P0)

One focused sprint:

- restore Inventory Materials to a repository live list while retaining
  snapshots for dashboard/analytics;
- introduce bounded Production workspace endpoints and remove client business
  aggregation/unbounded `GET /production` from active Cockpit;
- preserve existing API contracts additively where required.

Exit gate: active operator routes provide strong read-after-write and bounded
server pagination.

## Gate 3 - Dashboard Snapshot Cutover (P1)

One focused sprint:

- expose Components, QC and Yard dashboard endpoints through their existing
  snapshot readers;
- route active dashboard consumers to those endpoints;
- prove hit, missing/stale fallback and background enqueue behavior;
- confirm Production Cockpit dashboard sections use its existing snapshot
  metrics/read path.

Exit gate: registered snapshot foundation is exercised by active routes.

## Gate 4 - Runtime and Documentation Parity (P1/P2)

One certification sprint:

- add Inventory module-level metric aliases or normalize the published contract
  without removing granular material/location metrics;
- add automated architecture checks for repository ownership, active read path,
  feature flags and atomic Outbox;
- separate Business completeness from Core Platform compliance in AI-state;
- rerun builds, focused transaction/read-path tests and runtime smoke checks.

## Logistics Decision

EPIC180 may begin as an audit only. Repository/Read Model/Snapshot/Runtime
implementation for Logistics should wait until Gates 1-3 pass, otherwise the
new module would inherit a template that is not yet certified.
