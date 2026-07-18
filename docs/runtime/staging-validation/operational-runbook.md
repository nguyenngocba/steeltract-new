# Staging Operational Runbook

## 1. Prepare

1. Assign Validation ID, incident channel and deploy/database/security owners.
2. Record immutable image digest, Git SHA and sanitized database restore ID.
3. Create an encrypted evidence directory; exclude tokens and secrets.
4. Verify [staging-validation-checklist.md](./staging-validation-checklist.md)
   entry gates and complete the restore drill.
5. Record worker topology and set replay disabled.

## 2. Build And Configuration

```bash
pnpm -C apps/backend-api exec prisma validate
pnpm -C apps/backend-api build
pnpm -C apps/frontend build
pnpm -C apps/backend-api test
git diff --check
```

Validate required production variables against `apps/backend-api/.env.example`.
Use a non-default 32+ character JWT secret, PostgreSQL URL, explicit CORS list,
absolute storage path and valid boolean/numeric flags. Never print secrets.

## 3. Backup, Migration And Deploy

1. Run the backup/restore gate in [rollback-procedure.md](./rollback-procedure.md).
2. Run [migration-validation.md](./migration-validation.md).
3. Start the API only after the one-shot migration job succeeds:

```bash
docker compose -f deployment/docker-compose.production.yml config
docker compose -f deployment/docker-compose.production.yml up migrate
docker compose -f deployment/docker-compose.production.yml up -d backend
```

Use staging environment variables for image, env file, storage and bind address.

## 4. Health And Authentication Smoke

```bash
curl --fail-with-body "$BASE_URL/health/live"
curl --fail-with-body "$BASE_URL/health/ready"

curl --fail-with-body -H 'Content-Type: application/json' \
  --data-binary "@$FIXTURE_DIRECTORY/login.json" \
  "$BASE_URL/auth/login"
```

Extract tokens with an approved secret-safe tool and do not persist them in
shell history/evidence. Verify anonymous business mutation denial:

```bash
curl --silent --output /dev/null --write-out '%{http_code}\n' \
  -H 'Content-Type: application/json' -d '{}' \
  "$BASE_URL/inventory/transactions"
```

Expected result is 401, before body validation. Repeat a generated route matrix
for every POST/PATCH/PUT/DELETE controller family. Then verify an authorized
read, authorized fixture mutation, idempotent replay, unauthorized 403 on a
permission-controlled route, `/auth/me` and logout.

## 5. Monitoring Baseline

Capture these authenticated endpoints before, during and after every test:

```text
GET /performance/health
GET /performance/metrics
GET /operations-center/overview
GET /query-api/projections/health
GET /jobs?page=1&limit=100
GET /telemetry
```

Required dashboards:

- API traffic: rate, status, p50/p95/p99, timeout and top slow endpoint.
- PostgreSQL: query latency, sessions/pool, locks, deadlocks, cache hit, temp
  files, checkpoints, vacuum/bloat, disk and replication lag.
- Runtime: CPU, RSS/heap, event-loop/container restart and storage usage.
- Pipeline: Outbox ingress/dispatch/failure/oldest age, Job state/retries/stale
  leases, projection lag/checkpoint/failure and snapshot freshness/fallback.
- Deployment: replica readiness, restart, image digest and migration status.

Required alerts route to an owned channel for: readiness down, 5xx/latency SLO,
database saturation/deadlock, low disk, WAL/replica lag, stale lease, dead letter,
Outbox age, projection failure/lag, restart loop and backup failure/age.

Current application performance samples are in-memory with a 24-hour window.
Long-term dashboards and alerts require external metric/log shipping; staging
validation is conditional until that platform captures the listed signals.

## 6. Load, Replay And Worker Recovery

Run [load-test-plan.md](./load-test-plan.md) by stage. Run
[replay-validation.md](./replay-validation.md) separately from peak write load
unless explicitly testing contention.

Multi-worker drill:

1. Start two worker-enabled instances and prove distinct worker IDs.
2. Schedule known idempotent Job and Outbox fixtures.
3. Kill one owner after claim; retain the row/worker/timestamp evidence.
4. Before lease expiry, prove the second worker does not own the row.
5. After `BACKGROUND_LOCK_STALE_MS`, prove one takeover and heartbeat renewal.
6. Resume/terminate the stale process and prove owner-checked update rejection.
7. Verify one business side effect/projection receipt and queue recovery.

## 7. Graceful Shutdown Drill

Start an observable worker task, send `SIGTERM`, and measure drain. The current
Compose grace period is 60 seconds. Require no new tick, either clean completion
inside the window or later safe lease recovery, and no duplicate effect after
restart. Verify readiness/liveness behavior during dependency failure separately.

## 8. Evidence And Decision

The evidence bundle must contain configuration fingerprint, migration/backup
outputs, API security matrix, raw load results, dashboard exports, replay hashes,
worker ownership timeline, shutdown timing, issues and approvals. Use the exit
rules in the main checklist. Never approve from screenshots alone when raw
machine-readable evidence is available.

## Incident Actions

On a P0 failure: stop load, freeze promotion, preserve correlation IDs/logs,
prevent additional worker/replay activity, assess data integrity and follow
[rollback-procedure.md](./rollback-procedure.md). Do not improvise schema or
business-data repairs during validation.

