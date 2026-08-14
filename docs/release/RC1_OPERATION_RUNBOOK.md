# SteelTrack V1 RC1 Operation Runbook

Status: **RC1 CONDITIONAL - BASELINE IMPLEMENTED, EXTERNAL ROUTING/DR OPEN**

## Service Map

```text
User Browser
    -> HTTPS Reverse Proxy / Static Frontend
    -> SteelTrack Backend API
        -> PostgreSQL
        -> Persistent attachment storage
        -> DB-backed jobs/Outbox/projections
        -> Optional Redis when configured
```

## Health

| Probe | Purpose | Alert expectation |
| --- | --- | --- |
| `/health/live` | Process liveness only | Restart after repeated failure |
| `/health/ready` | DB/storage/queue/configured Redis | Remove replica from traffic |
| `/health/startup` | Completed Nest bootstrap and dependencies | Block rollout |
| `/metrics` | API, DB, worker, projection and snapshot metrics | Internal Prometheus only |

Do not use readiness failure as a process restart signal. Do not call obsolete
`/system/health`.

## Required Dashboards

- API request rate, 4xx/5xx, p50/p95/p99 and top slow endpoints.
- Node CPU, RSS/heap, event loop, file descriptors and restart count.
- PostgreSQL connections, lock waits, deadlocks, cache hit, temp files,
  checkpoints, vacuum/bloat, disk, WAL and replica lag.
- Job/Outbox pending, failed, oldest age, retries, lease loss and dead letters.
- Projection checkpoint/lag/failure and snapshot freshness/fallback/parity.
- Storage capacity, write failures, backup age and restore verification age.
- Business parity for Inventory, Production, QC, Yard, Logistics and Projects.

## Required Alerts

| Alert | Initial severity |
| --- | --- |
| Readiness unavailable for 2 minutes | P0 |
| 5xx above SLO or p95 above budget for 10 minutes | P1/P0 by impact |
| DB saturation, deadlock or low disk/WAL capacity | P0 |
| Outbox/job oldest age above threshold | P1 |
| Projection failure or increasing lag | P1/P0 by dashboard impact |
| Repeated worker lease loss | P1 |
| Snapshot parity mismatch | P0 for authoritative dashboard |
| Backup failure/age or expired restore drill | P0 |
| Unauthorized spike/login abuse | Security P1/P0 |

Seven Prometheus rules are versioned under `deployment/monitoring/alerts.yml`.
Each still needs a named owner, Alertmanager/on-call destination,
acknowledgement SLA and runbook link in the target environment.

## Daily Operations

- [ ] Health and external synthetic login are green.
- [ ] Database, storage and WAL capacity are within forecast.
- [ ] Outbox/jobs/projections have no failed or stale ownership rows.
- [ ] Snapshot freshness and parity are green.
- [ ] Previous backup completed, checksum exists and is off-host.
- [ ] No critical security advisory or secret-expiry alert is open.
- [ ] ActivityLog volume is consistent with business traffic.

## Backup and Retention

RC1 minimum policy pending business approval:

- Daily encrypted custom/base backup, retained 35 days.
- Weekly verified restore point, retained 13 weeks.
- Monthly archive, retained 13 months.
- Continuous WAL/PITR sized to approved RPO.
- Quarterly full restore and application certification drill.

Retention must be enforced outside the application and must cover both
PostgreSQL and persistent attachment storage. A successful `pg_dump` without a
tested restore does not satisfy the policy.

Repository verification commands:

```bash
scripts/release/backup-database.sh /secure/backup/path
STEELTRACK_BACKEND_IMAGE=<digest> \
  scripts/release/verify-database-restore.sh /secure/backup/path/<dump>
```

The Compose baseline enables WAL archiving with a five-minute archive timeout.
Move archived WAL to encrypted off-host storage before public production.

## Common Incidents

### Readiness Down

1. Remove affected replica from traffic.
2. Read dependency statuses without exposing credentials.
3. Check DB connectivity/locks, storage permissions, queue query and configured
   Redis reachability.
4. Do not restart-loop the entire cluster for a shared dependency outage.

### Queue or Projection Lag

1. Stop replay and preserve failed rows/worker ownership.
2. Confirm leases and attempt counts; do not force ownership changes.
3. Reduce worker count if DB contention is rising.
4. Resume one bounded worker and prove idempotent recovery.

### Dashboard Mismatch

1. Compare DB -> live repository -> snapshot -> API -> frontend.
2. Disable the affected snapshot feature flag if live read is authoritative.
3. Preserve parity evidence; rebuild only after backup and owner approval.

### Slow Database

1. Capture endpoint, query fingerprint, plan, locks and correlation ID.
2. Current slow log labels many background operations as `public/Unknown`;
   obtain exact SQL attribution before changing indexes.
3. Stop high-volume rebuild/replay before modifying production settings.

### Security Incident

1. Block traffic/identity as appropriate and preserve logs.
2. Rotate JWT/database/storage secrets if exposure is suspected.
3. Revoke refresh tokens and disabled compromised accounts.
4. Do not put tokens, request bodies or secrets in incident tickets.

## Disaster Recovery Checklist

- [ ] RPO and RTO are approved by business owners.
- [ ] Current backup checksum and source LSN are known.
- [ ] Off-host backup and WAL are accessible by on-call DB owner.
- [ ] Empty restore target and capacity are available.
- [ ] Restore/PITR commands are tested with current PostgreSQL major version.
- [ ] Critical row-count and domain invariant scripts are versioned.
- [ ] Backend can start with workers disabled against restored DB.
- [ ] DNS/proxy cutover and rollback authority are assigned.
- [ ] Last drill date, duration and defects are recorded.

## Escalation and Evidence

Every incident/release evidence bundle must include Git SHA, image digests,
environment fingerprint without values, health output, correlation IDs, DB/queue
state, dashboard comparison, decision owner and timeline. Screenshots alone are
not sufficient when machine-readable evidence exists.
