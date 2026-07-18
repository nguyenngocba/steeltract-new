# Staging Validation Checklist

Use this checklist for one immutable release candidate. Do not reuse evidence
from another image, database restore or configuration revision.

## Run Identity

| Field | Required value |
| --- | --- |
| Validation ID | `STG-YYYYMMDD-NNN` |
| Image digest | Immutable registry digest, not a mutable tag |
| Git revision | Full SHA represented by the image |
| Database restore ID | Backup name, checksum and restore timestamp |
| Migration state | Output of `prisma migrate status` |
| Environment fingerprint | Non-secret config checksum |
| Start/end time | UTC timestamps |
| Operators | Deploy, database, security and test owners |

Store command output, JSON responses, database samples, dashboards and operator
sign-off under one evidence directory named with the Validation ID. Never store
secrets, access tokens or production personal data in the evidence bundle.

## Entry Gates

- [ ] Staging is isolated from production integrations and uses sanitized data.
- [ ] The database size and cardinality represent the intended production load.
- [ ] Backup and restore have been validated before any destructive replay.
- [ ] The backend image is immutable, non-root and has a recorded digest/SBOM.
- [ ] `DATABASE_URL`, `JWT_SECRET`, CORS and storage settings come from staging
      secrets; no value from `.env.example` is used literally.
- [ ] At least two operator identities exist: authorized and deliberately
      unauthorized. A separate admin identity is available for recovery only.
- [ ] Worker topology is declared: API-only replicas and the exact number of
      `JOB_WORKER_ENABLED=true` replicas.
- [ ] Replay is disabled at startup.
- [ ] Abort owner, communication channel and maintenance window are confirmed.

## Build And Artifact

- [ ] `pnpm -C apps/backend-api exec prisma validate` passes.
- [ ] `pnpm -C apps/backend-api build` passes.
- [ ] `pnpm -C apps/frontend build` passes.
- [ ] `pnpm -C apps/backend-api test` passes.
- [ ] Image signature/digest matches the deployment manifest.
- [ ] Container runs as `node`, uses `tini`, and has the expected healthcheck.
- [ ] `docker compose -f deployment/docker-compose.production.yml config`
      validates using staging-only environment values.

## Backup And Restore Gate

- [ ] A pre-migration custom-format backup and SHA-256 checksum exist.
- [ ] Global roles/grants required by the application are captured separately.
- [ ] Backup restores into a new, empty validation database.
- [ ] Restore row-count and invariant checks pass.
- [ ] Restored application reaches `/health/ready` without using production.
- [ ] Measured restore time fits the approved RTO; backup timestamp fits RPO.

Follow [rollback-procedure.md](./rollback-procedure.md).

## Migration Gate

- [ ] Preflight disk, connection, lock, WAL and replica-lag baselines recorded.
- [ ] Exactly one migration job runs.
- [ ] Concurrent index progress and invalid indexes are monitored.
- [ ] Lock duration, write latency, WAL bytes and replica lag stay within the
      approved environment budget.
- [ ] `prisma migrate status` reports no pending or failed migration afterward.
- [ ] Readiness and query-plan smoke pass after migration.

Follow [migration-validation.md](./migration-validation.md).

## Deployment And Health

- [ ] Migration service completes before API replicas start.
- [ ] `GET /health/live` returns HTTP 200 without a database dependency.
- [ ] `GET /health/ready` returns HTTP 200 and `checks.database=up`.
- [ ] Stopping PostgreSQL makes readiness return 503 while liveness remains 200.
- [ ] Restoring PostgreSQL returns readiness to 200 without data corruption.
- [ ] Startup logs contain no secret or JWT payload.
- [ ] Static storage is mounted at the expected persistent path.

## Authenticated API Smoke

- [ ] Login returns an access token for the authorized staging operator.
- [ ] Login and refresh are public; logout and `/auth/me` require a token.
- [ ] Anonymous GET to a business endpoint returns 401.
- [ ] Anonymous POST/PATCH/PUT/DELETE to every controller family returns 401.
- [ ] Invalid/expired tokens return 401.
- [ ] An authenticated user without the required permission receives 403 on
      permission-controlled Jobs/Projects routes.
- [ ] Authorized reads and mutations preserve their existing contracts.
- [ ] `Idempotency-Key` replay does not duplicate timeline, audit or Outbox rows
      on canonical command endpoints.

Use the smoke procedure in [operational-runbook.md](./operational-runbook.md).

## Workload And Read Platform

- [ ] Inventory, Production, QC, Logistics and Projects scenarios pass smoke,
      ramp, sustained, spike and recovery stages.
- [ ] API/database latency, errors, CPU, memory, disk IOPS and WAL are captured.
- [ ] Outbox throughput and oldest pending age recover to baseline after load.
- [ ] Projection lag returns to the approved bound and active failure count is 0.
- [ ] No new N+1 or query-budget warnings appear in `/performance/metrics`.
- [ ] Replay resume and idempotency pass for every registered projection.
- [ ] Snapshot/read-model parity warnings are reviewed, not silently ignored.

Follow [load-test-plan.md](./load-test-plan.md) and
[replay-validation.md](./replay-validation.md).

## Multi-worker And Recovery

- [ ] Two worker instances have distinct worker IDs.
- [ ] A paused worker renews its lease while healthy.
- [ ] Killing a worker leaves claimed work unavailable until lease expiry.
- [ ] One competing worker reclaims stale work after the configured timeout.
- [ ] The stale owner cannot complete/fail the reclaimed row.
- [ ] Job/Outbox side effects remain idempotent after takeover.
- [ ] Retry and dead-letter behavior matches configured maximum attempts.
- [ ] No `RUNNING`/`DISPATCHING` row remains stale after the recovery window.

## Graceful Shutdown

- [ ] Send `SIGTERM` during an active worker tick.
- [ ] No new tick starts after shutdown begins.
- [ ] The active tick drains within the 60-second deployment grace period, or
      its lease is later recovered safely.
- [ ] Readiness is removed before traffic termination.
- [ ] Restart produces no duplicate domain mutation or projection receipt.

## Exit Decision

**PASS** requires every P0 checkbox, zero unexplained data invariant failures,
zero unauthenticated mutation, zero active projection failure, successful
restore, and accepted migration/load/recovery evidence.

**CONDITIONAL** is allowed only for a documented external observability or
capacity limitation with owner and deadline. Security, data integrity,
migration recovery, backup restore and duplicate business mutation cannot be
waived. Otherwise classify the release **FAIL**, preserve evidence and execute
the rollback procedure.

