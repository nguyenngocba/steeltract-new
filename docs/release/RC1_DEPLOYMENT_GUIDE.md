# SteelTrack V1 RC1 Deployment Guide

Status: **RC1 CONDITIONAL GO - EXTERNAL PRODUCTION CONDITIONS OPEN**

## Deployment Invariants

- Deploy immutable image digests, never mutable tags.
- Run migrations once before application replicas.
- Never execute destructive schema rollback automatically.
- Keep replay disabled during deployment.
- Run worker-enabled replicas deliberately and with bounded concurrency.
- Preserve database, Outbox, projection and ActivityLog evidence.

## Entry Gate

- [x] SYSTEM.RELEASE.1 repository-controlled P0 gates pass.
- [ ] Zero critical/high advisories in deployed production graph, or signed risk
      acceptance with compensating controls and expiry.
- [ ] Backend lint and frontend lint policy pass.
- [ ] Backend and frontend immutable images are built, scanned and signed.
- [ ] SBOM and license attribution are published for both images.
- [x] Frontend image serves static Vite `dist` through unprivileged Nginx.
- [x] Reverse proxy/TLS/HSTS/CSP/security headers are validated.
- [x] Production API and socket defaults use the current origin.
- [x] Secrets are stored outside source/image build contexts.
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
- [ ] Set `VITE_API_URL`/`VITE_SOCKET_URL` only for a deliberate cross-origin deployment
- [ ] No `DATABASE_URL` or JWT secret exists in frontend build context
- [ ] Cosign verification is pinned to the exact release-workflow identity and
      GitHub Actions OIDC issuer, or to an operations-owned KMS/HSM public key

## Backup and Migration

1. Freeze release writes or enter the approved migration window.
2. Capture custom-format DB backup, globals, checksum, source LSN and timestamp.
3. Verify the archive catalog and restore into a new isolated database.
4. Compare schema, critical row counts and canonical invariants.
5. Record restore duration against RTO and backup age against RPO.
6. Inspect every pending migration for `DROP`, `TRUNCATE`, `DELETE`, long locks
   and non-concurrent index creation.
7. Run one migration job using the dedicated production migration image. This
   runner preserves immutable migration checksums and handles the approved
   concurrent-index migration outside a transaction:

```bash
docker compose -f deployment/docker-compose.production.yml up --abort-on-container-exit migrate
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

## Production Compose Contract

Start from `deployment/.env.production.example`. Supply immutable backend,
migration and frontend image references, an external backend env file, and
secret-file paths for PostgreSQL, TLS and Grafana. The supported production
entrypoint verifies all three Cosign signatures and rejects mutable image tags
before invoking Compose:

```bash
set -a
. deployment/.env.production
set +a
scripts/release/deploy-verified.sh config --quiet
scripts/release/deploy-verified.sh up -d
```

The preferred signing authority is the keyless release workflow at
`.github/workflows/production-trust.yml`. Production must configure both
`COSIGN_CERTIFICATE_IDENTITY` and `COSIGN_CERTIFICATE_OIDC_ISSUER`; the identity
must exactly name this repository, this workflow file and the deployed release
tag. The accepted issuer is `https://token.actions.githubusercontent.com`.
The deploy gate also supports `COSIGN_PUBLIC_KEY_PATH` for an operations-owned
KMS/HSM-backed key. A local developer key, disabled transparency verification,
or a mutable image tag is not an accepted production trust configuration.

The signing workflow publishes immutable GHCR digests, SBOMs and vulnerability
scan evidence before signing. It verifies the accepted signature and proves
that unsigned images, a mismatched digest, a mismatched workflow identity and a
mutable tag are rejected. Deployment still requires the target environment to
run `deploy-verified.sh`; CI signing alone is not deployment authorization.

Enable monitoring by passing `--profile observability` after the script name.
`STEELTRACK_ALERTMANAGER_CONFIG_FILE` must point to an operations-owned config
with the approved on-call receiver. The repository test receiver is only for
the `certification` profile and must not be used as a production destination.
