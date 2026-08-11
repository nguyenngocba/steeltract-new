# SteelTrack V1 RC1 Deployment Guide

Status: **BLOCKED UNTIL SYSTEM.FREEZE.1 P0 GATES PASS**

## Deployment Invariants

- Deploy immutable image digests, never mutable tags.
- Run migrations once before application replicas.
- Never execute destructive schema rollback automatically.
- Keep replay disabled during deployment.
- Run worker-enabled replicas deliberately and with bounded concurrency.
- Preserve database, Outbox, projection and ActivityLog evidence.

## Entry Gate

- [ ] Freeze audit decision is GO.
- [ ] Zero critical/high advisories in deployed production graph, or signed risk
      acceptance with compensating controls and expiry.
- [ ] Backend lint and frontend lint policy pass.
- [ ] Backend and frontend immutable images are built, scanned and signed.
- [ ] SBOM and license attribution are published for both images.
- [ ] Frontend image serves static Vite `dist` through an approved server.
- [ ] Reverse proxy/TLS/HSTS/CSP/security headers are validated.
- [ ] Production API URL and socket URL contain no hardcoded private fallback.
- [ ] Secrets are stored outside source/image; exposed local credentials rotated.
- [ ] Backup restore/PITR drill meets approved RPO/RTO.
- [ ] Monitoring and alert routing are receiving staging signals.
- [ ] 24-hour snapshot parity and 80%-peak load gates pass.

## Required Artifacts

Record before deployment:

```text
Release ID:
Git SHA:
Backend image digest:
Frontend image digest:
SBOM digest:
Database backup ID/checksum/LSN:
Migration count/hash:
Environment fingerprint (no values):
Rollback image digests:
Incident channel:
Release owner:
Database owner:
Security owner:
```

## Configuration Checklist

- [ ] `NODE_ENV=production`
- [ ] PostgreSQL `DATABASE_URL` supplied by secret manager
- [ ] `JWT_SECRET` random, 32+ characters, rotated for this environment
- [ ] `CORS_ORIGINS` explicit HTTPS origins only
- [ ] `TRUST_PROXY` matches exact proxy hop count
- [ ] `STORAGE_ROOT` persistent, writable and backed up
- [ ] `JOB_WORKER_ENABLED` enabled only on selected replicas
- [ ] Lease/poll/snapshot values reviewed against staging measurements
- [ ] Redis URL supplied only if Redis is an actual required dependency
- [ ] `VITE_API_URL` and `VITE_SOCKET_URL` injected at frontend build time
- [ ] No `DATABASE_URL` or JWT secret exists in frontend build context

## Backup and Migration

1. Freeze release writes or enter the approved migration window.
2. Capture custom-format DB backup, globals, checksum, source LSN and timestamp.
3. Verify the archive catalog and restore into a new isolated database.
4. Compare schema, critical row counts and canonical invariants.
5. Record restore duration against RTO and backup age against RPO.
6. Inspect every pending migration for `DROP`, `TRUNCATE`, `DELETE`, long locks
   and non-concurrent index creation.
7. Run one migration job:

```bash
docker compose -f deployment/docker-compose.production.yml up migrate
```

8. Require exit 0, then run `prisma migrate status` against production.

## Application Rollout

1. Deploy backend canary with workers disabled.
2. Verify `/health/startup`, `/health/live`, `/health/ready`.
3. Run login, `/auth/me`, one authorized read, 401 and 403 checks.
4. Enable one bounded worker; verify queue, Outbox and projection lag.
5. Deploy remaining backend replicas.
6. Deploy frontend immutable image behind HTTPS reverse proxy.
7. Confirm SPA fallback, cache headers, API CORS and WebSocket upgrade.
8. Run the read-only smoke, then one idempotent business mutation fixture.
9. Watch error rate, p95/p99, DB locks, queue age and memory for 30 minutes.

## Go-Live Checklist

- [ ] Business REST workflow passes in target environment.
- [ ] Browser login/navigation/logout passes with production assets.
- [ ] Inventory conservation and physical ComponentInstance lineage pass.
- [ ] QC, Finished Goods, Yard, Dispatch and Project dashboards change.
- [ ] ActivityLog contains exactly one row per certified mutation.
- [ ] No stale Yard placement remains after dispatch.
- [ ] No projection parity or idempotency conflict appears.
- [ ] Health probes are stable across replica restart.
- [ ] Backup-age and restore-readiness alerts are green.
- [ ] Security, DB, operations and business owners sign approval.

## Stop Conditions

Stop promotion and follow `RC1_ROLLBACK_GUIDE.md` for any P0, migration
uncertainty, data mismatch, duplicate mutation, rising queue/projection lag,
readiness instability, critical security alert or missing recovery evidence.
