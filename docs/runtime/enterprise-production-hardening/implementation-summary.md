# RFC014 Enterprise Production Hardening

Status: **IMPLEMENTED WITH OPERATIONAL LIMITATIONS**  
Date: 2026-07-17

## Implemented

- Made the database-backed worker polling loop single-flight. A slow Outbox or
  job batch no longer overlaps the next local timer tick.
- Converted timer-level worker failures from unhandled promise rejections into
  structured NestJS error logs and made module shutdown wait for the active
  batch before disposal.
- Added bounded, non-sensitive persistent error normalization for Background
  Jobs, Job Executions, Outbox retries and Projection failures. Error records no
  longer serialize arbitrary objects, produce `[object Object]`, or grow without
  a 2,000-character bound.
- Extended background recovery validation with warning-only detection of stale
  `RUNNING` jobs and stale `DISPATCHING` Outbox rows. The threshold defaults to
  five minutes and can be configured through `BACKGROUND_LOCK_STALE_MS`, bounded
  between 30 seconds and one hour.
- Protected internal runtime event, performance, telemetry, runtime integrity
  and simulation controllers with the existing JWT boundary. Routes and
  response contracts for authenticated callers are unchanged.

## Audit Conclusions

- Atomic PostgreSQL `FOR UPDATE SKIP LOCKED` claims, bounded batches, retry/dead
  letter states, Projection receipts/checkpoints and process idempotency remain
  intact from RFC012/RFC013.
- Existing `Serializable` transactions are concentrated around stock,
  idempotency and aggregate-concurrency invariants. They were not weakened.
- Automatic stale-lock reclamation was intentionally not added. Background jobs
  do not yet maintain a continuous execution lease, so reclaiming only by age
  could run a valid long operation twice. Operations can now detect this state;
  lease heartbeat and owner-checked recovery require a separate tested change.
- Database query cancellation is not available through the current Prisma
  boundaries. Fake Promise timeouts would return control while SQL continues in
  the pool, so no unsafe timeout wrapper was introduced.
- Runtime integrity endpoints retain exact full-dataset checks. Authentication
  reduces exposure, but these endpoints require a bounded/offline validation
  design before they are safe on a billion-row production database.
- Authentication is not globally enforced in this codebase. This sprint secured
  high-risk operational controllers only; changing all legacy business routes
  would be a public authorization cutover and needs an explicit compatibility
  plan and route inventory.

## Compatibility

- No business rule, workflow, public response shape, schema, migration,
  Projection Engine behavior or frontend source changed.
- No event name, payload contract, retry count or ordering rule changed.
- No files were staged or committed.

## Verification

- Backend build: PASS
- Frontend build: PASS
- Prisma validate: PASS
- Prisma migration status: one pre-existing RFC013 additive index migration is
  pending; RFC014 created and deployed no migration
- Focused hardening tests: PASS
- Projection replay/idempotency regression: PASS
- Full backend regression: PASS, 69/69 suites and 175/175 tests
- `git diff --check`: PASS

Final assessment: **CONDITIONALLY PRODUCTION READY**. Concrete worker lifecycle,
error persistence and operational endpoint exposure risks are fixed. Full
production certification still requires representative database testing,
lease-based stale-work recovery, bounded runtime-integrity scans and an approved
global authorization migration.
