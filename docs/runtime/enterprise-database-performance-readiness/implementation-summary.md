# RFC013 Enterprise Database & Performance Readiness

Status: **IMPLEMENTED - CONDITIONALLY READY**  
Date: 2026-07-17

## Production Improvements

- Replaced Outbox and Background Job two-step claims with one atomic PostgreSQL
  `UPDATE ... FOR UPDATE SKIP LOCKED` statement. Claims are bounded to 500 rows,
  preserve existing priority/time ordering, and no longer allow two workers to
  select the same pending rows before either update commits.
- Replaced Operations Center status-count fan-out with one `GROUP BY` per
  queue. Large table telemetry now uses `pg_stat_user_tables.n_live_tup`
  estimates instead of twelve exact `COUNT(*)` scans and explicitly marks row
  values as estimated.
- Bounded the legacy Background Job list to 100 rows when pagination is omitted
  and added deterministic `id` tie-breakers to job/event history ordering.
- Removed Inventory posting N+1 validation. Material metadata and location
  buckets are loaded in two batch queries, while average inbound cost is now
  aggregated by PostgreSQL instead of loading every historical inbound line
  into Node.js. Validation order, stock rules and monetary formula are unchanged.
- Changed Projection replay checkpointing for unrelated events from one write
  per event to one write per batch. Default replay remains 250 events per batch
  and 100,000 events per invocation, or at most 400 batch checkpoints per run.
- Extended the pending additive scalability migration with query-aligned claim,
  recent-history and Job Execution indexes. No migration was deployed.

## Prisma Model Audit

Static review covered all 127 Prisma models:

| Area | Result |
| --- | --- |
| Primary keys | 110 CUID and 16 UUID generated string keys; no integer hot-spot conversion attempted |
| Relations | 171 declared relations reviewed for leading-key coverage |
| Nullable fields | 658 optional scalar fields; no unsafe `NOT NULL` conversion attempted |
| Declared indexes | 336 model indexes before generated primary/unique indexes |
| Exact redundant definitions | Five Dashboard Snapshot models declare both `@@unique([scopeKey, snapshotDate])` and the same `@@index` |
| FK candidates without leading index | 17 static candidates; no speculative index was added without a demonstrated query shape |

The five redundant Snapshot indexes were not dropped because this sprint allows
additive database changes only. Candidate foreign keys include low-selectivity
or write-only relations where another index would add write amplification; they
require production query statistics before approval.

## Repository And Pagination Audit

- Static discovery found 46 `skip` usages. Projection Query API already has
  additive keyset pagination from RFC012. Background Job compatibility reads
  are now bounded, but existing page/total APIs retain offset pagination to
  avoid an API redesign.
- Exact business totals remain exact. Only operational table-size telemetry was
  changed to catalog estimates.
- The Inventory posting read path no longer performs one material lookup and
  one stock lookup per line/bucket. Write-side stock updates remain serialized
  per aggregate bucket because they are ordered business mutations, not N+1
  reads.
- Eight repository transaction boundaries explicitly use `Serializable`.
  These guard stock, idempotency and aggregate concurrency invariants and were
  retained. Queue claims were shortened instead by moving lock/select/update
  into one atomic statement.
- Large nested includes and legacy direct Prisma reads remain in compatibility
  and snapshot rebuild paths. They require per-endpoint payload evidence rather
  than a broad contract-changing rewrite.

## Index Changes

The pending migration contains additive indexes for:

- Outbox due-claim ordering and recent-event ordering.
- Background Job status/priority/run-time claim and recent-job ordering.
- Job Execution history by job and start time.
- RFC012 transaction, projection, dispatch and Production material history
  query shapes.

Indexes were selected from actual filters and sort order. Prefix indexes already
serving different compatibility queries were retained; no existing index was
dropped.

## Replay Capacity Review

Replay is keyset-based, resumable and bounded. A default invocation scans at
most 100,000 events in 250-event pages. Irrelevant-event checkpoint write
amplification is reduced from up to 100,000 writes to at most 400 writes per
default run. Matching projection events still commit individually to preserve
receipt idempotency and deterministic failure recovery.

No events-per-second estimate is reported: the current PostgreSQL runtime was
unreachable (`P1001`, `localhost:5432`) and the retained dataset is too small for
a production-scale benchmark. Large replay throughput, WAL volume and archive
restore remain operational certification gates.

## Verification

- Backend build: PASS
- Frontend build: PASS
- Prisma validate/generate: PASS
- Focused database/repository/replay tests: PASS, 10/10
- Projection suite: PASS, 13/13
- Static repository and index audit: PASS
- `git diff --check`: PASS
- Staged files / commit: none
- Live `EXPLAIN`: BLOCKED because PostgreSQL runtime is unavailable
- Migration deployment: NOT RUN; additive migration remains pending

Final assessment: the database layer is **CONDITIONALLY READY**. The implemented
changes remove concrete query fan-out, N+1, unbounded compatibility reads,
multi-worker claim races and replay checkpoint amplification. Production-scale
certification still requires a representative database, migration lock-budget
review, `EXPLAIN (ANALYZE, BUFFERS)`, replay load tests and archive/restore drills.
