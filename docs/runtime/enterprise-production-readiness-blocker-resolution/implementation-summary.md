# RFC017 Production Readiness Blocker Resolution

Date: 2026-07-18  
Status: **IMPLEMENTED - DEPLOYMENT MEASUREMENT PENDING**

## Result

The three RFC016 code and rollout-plan blockers are resolved without changing
business behavior, public response contracts, frontend code or the database
schema. Production approval still requires executing the prepared index
migration and operational drills against a representative PostgreSQL clone.

## Blocker 1 - Mutation Authorization

**Resolved.** `JwtAuthGuard` is registered as an application-wide Nest guard.
Every controller route is authenticated by default, including all mutation
endpoints. Only these explicit bootstrap/health paths bypass JWT:

- application liveness/readiness/root health routes;
- `POST /auth/login`;
- `POST /auth/refresh`.

Logout, current-user, business mutations, runtime operations and compatibility
routes remain protected. A single `@Public()` metadata contract replaces the
previous controller-by-controller opt-in policy. Regression tests verify the
global provider, the public allowlist and delegation to Passport for all other
routes.

## Blocker 2 - Safe Execution Lease Recovery

**Resolved.** Background Job and Outbox claims now use an atomic PostgreSQL
`FOR UPDATE SKIP LOCKED` takeover with a bounded lease timeout. The worker:

- assigns a process-unique owner ID;
- reclaims stale `RUNNING` jobs and `DISPATCHING` Outbox rows;
- renews the lease while work is active;
- uses owner-checked compare-and-set updates for complete/fail/dispatch;
- rejects stale-worker completion after ownership changes;
- closes expired JobExecution attempts before starting a reclaimed attempt;
- keeps timer ticks single-flight and drains the active tick at shutdown.

`BACKGROUND_LOCK_STALE_MS` is clamped to 30 seconds through one hour, with a
five-minute default. Heartbeats run at no more than one third of the lease. A
post-commit `job.completed` notification failure is logged but cannot turn an
already completed database operation into a retry.

This is at-least-once execution. Side effects still require the existing
idempotency and projection receipt contracts; the lease prevents concurrent
ownership and stale-owner writes but does not claim exactly-once delivery.

## Blocker 3 - Migration Rollout Preparation

**Prepared, not deployed.** The pending RFC013 migration remains additive and
contains 13 indexes. Every index now uses `CREATE INDEX CONCURRENTLY IF NOT
EXISTS`, the migration declares a five-second lock timeout, and an automated
test rejects destructive statements or non-concurrent index creation.

The migration must run outside an explicit transaction. The approved rollout
sequence is:

1. Restore current production data to a representative PostgreSQL clone and
   record database size, free disk, baseline write latency, WAL rate and replica
   lag.
2. Run one migration job only. Do not start a second deploy/migration process.
3. Monitor `pg_stat_progress_create_index`, blocked sessions, write latency,
   disk, WAL generation and replica lag for each index.
4. Abort on the environment's approved write-latency, replica-lag, disk or WAL
   budget. PostgreSQL cancellation is safe for concurrent builds, but an
   interrupted build can leave an invalid index.
5. Inspect `pg_index.indisvalid`. Remove an invalid artifact with `DROP INDEX
   CONCURRENTLY`, mark the Prisma migration rolled back, and rerun only after
   capacity is restored.
6. After success, run `prisma migrate status`, query-plan smoke tests and API
   readiness checks before enabling normal rollout progression.

Rollback does not require application rollback because these are additive
performance indexes. If rollback is operationally required, drop the 13 indexes
concurrently in a separately reviewed maintenance script. Never wrap concurrent
create/drop operations in one transaction.

The current local database reports 77 migrations and only
`20260717190000_enterprise_data_scalability_indexes` pending. No production
deployment or production-scale WAL/lock measurement was performed by RFC017.

## Verification

- Backend regression: **PASS**, 72/72 suites and 194/194 tests.
- Focused auth/lease/migration tests: **PASS**, 4/4 suites and 14/14 tests.
- Backend build: **PASS**.
- Frontend build: **PASS**; existing Vite environment/chunk warnings remain.
- Prisma validate: **PASS**.
- Migration review: **PASS** for additive/online SQL and rollback procedure.
- Migration deployment: **NOT RUN**, explicitly outside this sprint.
- Mutation security policy: **PASS** by global deny-by-default guard and public
  allowlist tests.
- Lease recovery: **PASS** by owner/reclaim/renewal regression coverage.
- Live authenticated HTTP smoke: **BLOCKED**, local PostgreSQL was unavailable
  during application startup at the final smoke attempt.
- `git diff --check`: **PASS** after final documentation update.
- Commit/stage: **NONE**.

## Certification Position

RFC016's three P0 implementation blockers are closed. Final production
certification remains **CONDITIONALLY READY** until the concurrent migration,
multi-worker crash recovery, authenticated API smoke, startup/readiness and
graceful-shutdown drills pass in a stable production-like environment.
