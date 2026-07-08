# EPIC105 / Sprint DE.3 - Snapshot Rebuild Report

Date: 2026-07-07

Scope:

- Define how snapshot rebuilds should run, be measured, and fail safely.
- No snapshot rebuild job was implemented in this sprint.

## Current Runtime State

SteelTrack currently uses:

- runtime aggregation for many dashboard/detail reads;
- process-local cached read model for Inventory dashboard sources;
- runtime analytics for endpoint/query/read-model effectiveness;
- background job tables and worker foundation;
- EPIC106 executable snapshot job plumbing;
- no persisted snapshot tables yet.

## Rebuild Modes

### Full Rebuild

Purpose:

- initial snapshot backfill;
- data repair;
- nightly reconciliation;
- post-migration validation.

Examples:

```text
snapshot.inventory.rebuild global
snapshot.projects.rebuild projectId=<id>
snapshot.dashboard.compose global
```

### Scoped Rebuild

Purpose:

- refresh one material, one project, one dispatch, or one date window.

Examples:

```text
Inventory item VAL-MAT-002 changed
Project PRJ-001 task updated
Dispatch order DISP-001 completed
```

### Incremental Update

Purpose:

- update the smallest affected snapshot after a domain event.

Examples:

```text
inventory.transaction.created
project.material.changed
logistics.dispatch.changed
```

## Rebuild Workflow

```text
Schedule job
  -> claim job
  -> validate scope
  -> read source data with bounded query
  -> calculate snapshot
  -> dry-run compare when requested
  -> upsert snapshot
  -> record rebuild metrics
  -> emit snapshot.updated
```

## Required Metrics

Each rebuild should record:

- module;
- snapshot type;
- scope id;
- reason;
- startedAt;
- finishedAt;
- durationMs;
- rows read;
- rows written;
- source watermark;
- status;
- fallback used;
- error class/message when failed.

Runtime analytics should later consume:

- rebuild count;
- average rebuild duration;
- p95 rebuild duration;
- rebuild failure count;
- dead-letter count;
- snapshot hit/miss/fallback ratio.

## Query Budget

Suggested rebuild budgets:

| Rebuild | Budget |
| --- | --- |
| Incremental inventory update | 500 ms |
| Scoped material movement rebuild | 2 s |
| Inventory dashboard full rebuild | 10 s |
| Project runtime scoped rebuild | 5 s |
| Logistics dispatch scoped rebuild | 3 s |
| Dashboard compose | 2 s |
| Global full rebuild | background-only, no request budget |

Full rebuilds must never run inline inside user requests.

## Safety Rules

- Rebuilds must be idempotent.
- Rebuilds must not mutate business source tables.
- Rebuilds must not invent missing operational data.
- If source data is missing, produce empty/partial snapshot with warnings rather than fake values.
- Rebuilds must tolerate duplicate jobs.
- Rebuild failures must not rollback completed business workflows.

## First Rebuild Candidate

Recommended first job:

```text
snapshot.inventory.rebuild
```

Reason:

- Inventory has the highest transaction growth risk.
- Current dashboard/material analytics already have clear source query boundaries.
- Snapshot output can be compared against the existing `DashboardInventoryReadModelService` without changing frontend contracts.

## Validation Plan

Before enabling snapshots as default:

1. Run rebuild in dry-run mode.
2. Compare snapshot output to current live aggregation.
3. Record differences by field.
4. Fix calculation gaps.
5. Enable snapshot read with fallback.
6. Monitor snapshot hit/miss/fallback metrics.
7. Only then reduce live aggregate usage.

## Known Blockers

- Snapshot tables do not exist yet.
- Outbox persistence needs hardening before multi-instance event delivery.
- Current long-range runtime analytics are memory-only.
- Some modules still need repository coverage before snapshot source queries are clean enough.

## EPIC106 Implementation Status

Implemented:

- `snapshot.*` job handling in `JobWorkerService`.
- `SnapshotRebuilder` acceptance path.
- Rebuild metrics result shape.
- Safe skipped result while snapshot tables are unavailable.

Not implemented yet:

- persisted snapshot tables;
- snapshot upsert writer;
- snapshot-first API read path;
- parity comparison runner.

## Outcome

DE.3 established the rebuild design. EPIC106 adds executable background plumbing. The next implementation sprint should create the first persisted Inventory snapshot tables and a single rebuild writer path with parity checks.
