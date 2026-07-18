# RFC012 Enterprise Data Scalability Foundation

Status: **IMPLEMENTED - CONDITIONALLY READY**  
Date: 2026-07-17

## Implemented

- Added deterministic composite indexes for Inventory transaction history,
  reference lookup, Outbox claim/replay, projection feeds, Dispatch history and
  Production material history. The migration is additive and remains pending;
  no production migration was deployed in this sprint.
- Made Outbox claiming deterministic with `id` as the final ordering key.
- Made projection replay resumable from its durable checkpoint. Replay now
  advances past irrelevant events, uses keyset batches, and has bounded batch
  and per-run event limits.
- Added backward-compatible keyset pagination to projection Query API lists.
  Existing page/total behavior remains the default; high-volume consumers can
  use opaque `cursor` and `withTotal=false` to avoid deep offset scans and exact
  counts.
- Added an explicit storage lifecycle policy for hot retention, immutable warm
  Parquet archives, ten-year cold retention, legal holds, archive checksums and
  projection-watermark safety.

## Dataset Audit

| Dataset | Current rows | Current read shape | Foundation result |
| --- | ---: | --- | --- |
| Inventory transactions | 104 headers / 117 lines | Bounded history; offset compatibility paths remain | Composite history/reference indexes prepared |
| Activity log | 460 | Existing module/entity time indexes | Retention policy defined |
| Outbox | 90 | Retry claim and replay | Deterministic claim and resumable keyset replay |
| Projection store | 142 documents / 206 receipts | Page/total list and point lookup | Optional keyset/no-count list added |
| Dispatch history | 0 | Shipment/order history | Composite order/time index prepared |
| Production material ledger | 0 | Order/material history | Composite order/item time indexes prepared |

The runtime database is too small to prove large-scale latency or partition
benefit. No 100M/1B-row readiness claim is made from these counts.

## Storage Strategy

- **Hot:** operational PostgreSQL data with bounded queries; policy defaults are
  730 days for transaction/timeline facts, 180 days for activity/projection
  receipts and 90 days for dispatched Outbox records.
- **Warm:** immutable encrypted Parquet with checksums. Export must be verified
  and every affected projection checkpoint must be beyond the archive boundary
  before hot deletion.
- **Cold:** ten-year retained archive; legal hold always overrides deletion.
- **Partitioning:** review monthly range partitioning only after a candidate
  table reaches 50M rows and production-like `EXPLAIN ANALYZE` proves benefit.
  Physical partitioning was intentionally not applied to the current small
  tables because PostgreSQL parent/foreign-key conversion needs a separate
  zero/low-downtime rollout.

## Remaining Scale Gates

- Offset compatibility and exact totals remain available and can still be
  expensive on deep pages. New high-volume consumers must adopt cursor mode.
- Projection `state` filtering is JSON-path based and has no dedicated scalar
  index. Promote only proven high-cardinality filters through a separate
  additive schema/index RFC.
- Warm/cold export, restore drills and replay from archived Outbox segments are
  policy, not yet an operational worker. Hot Outbox data must not be deleted
  until that worker and restore verification exist.
- Physical partitioning, online index rollout, archive deletion and database
  vacuum tuning require production-size evidence and an operations runbook.
- Legacy repositories outside the Enterprise Query API still contain bounded
  offset paths and several direct Prisma reads. They were not bulk-refactored
  because RFC012 prohibits business and architecture redesign.

## Verification Evidence

- Backend build: PASS
- Prisma schema validation/generation: PASS
- Projection tests: PASS, 13/13
- Replay/resume/keyset/idempotency tests: PASS
- Frontend build: PASS
- `git diff --check`: PASS
- Additive migration deployment: NOT RUN (prepared only)
- Full backend regression suite: 62/64 suites PASS (163/165 tests). The two
  failures are pre-existing test-harness defects outside RFC012:
  `inventory-read-model.adr011.spec.ts` does not mock
  `recordInventoryReadModelHit`, and `app.controller.spec.ts` contains no test.
  Neither file was changed by this sprint.

Final assessment: the bounded query/replay foundation is **CONDITIONALLY
READY**. SteelTrack is not certified for hundreds of millions or billions of
records until production-like load, archive/restore and partition rollout gates
are completed.
