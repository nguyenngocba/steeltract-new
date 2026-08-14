# SYSTEM.RELEASE.1 - Production Hardening

Date: 2026-08-14  
Baseline commit: `0c1e19f06b920bc6ad81b50fe7193bc5d258d5b4`  
Decision: **RC1 CONDITIONAL GO**

## Executive Result

All repository-controlled P0 gates from `RELEASE.READINESS.1` are closed. The
deployed backend/frontend dependency graph and both runtime images have zero
known Critical/High findings, the complete TLS Compose stack runs, a clean
database can apply all 93 migrations, backup restore parity is proven, and the
test/typecheck/build gates pass.

Promotion is conditional because three production controls are owned outside
this repository: immutable image signing, off-host backup/WAL custody, and
Alertmanager/on-call notification routing. Internal staging deployment is
approved. Public production deployment requires those controls and owner
sign-off.

## P0 Closure

| Gate | Result | Evidence |
| --- | --- | --- |
| Dependency security | PASS | deployed graph: Critical 0, High 0 |
| Frontend production image | PASS | multi-stage, non-root UID 101, health endpoint, 64.3 MB |
| Production Compose | PASS | PostgreSQL, migration, backend, frontend, TLS proxy; optional Prometheus/Grafana |
| Secret boundary | PASS | no tracked candidate; sensitive context patterns excluded; bundle scan clean |
| TLS and headers | PASS | HTTP 308; HTTPS 200; HSTS/CSP/frame/content/referrer/permissions headers |
| Auth rate limiting | PASS | normal invalid login 401; burst returns 429 |
| Backup and restore | PASS | checksum, disposable restore, catalog parity, application read-only smoke |
| Observability | PASS | JSON request log/correlation ID, Prometheus metrics, Grafana, seven alert rules |
| SBOM and image scan | PASS | backend/frontend SPDX SBOM; runtime images Critical 0, High 0 |
| CI release gate | PASS (configured) | test/typecheck/build/dependency/secret/Prisma/image/SBOM/Trivy gates |

## Security Evidence

### Dependencies

Command:

```bash
bash scripts/release/dependency-audit.sh
```

Result:

```text
critical=0 high=0 scope=backend-api,frontend,package-manager
```

Security upgrades include patched Axios, React Router, Multer, DOMPurify,
form-data, Socket.IO parser and WebSocket versions. The unused Telegram service
and dependency were removed. pnpm is pinned to `11.21.0`.

The non-deployed `apps/backend-experimental` workspace still has six unique
High advisories: `fast-uri` (three advisories), `hono`, `ip-address`, and
`sharp`. It is excluded from the production image and release dependency gate.
It must not be deployed and remains P1 maintenance debt.

### Secrets

```bash
bash scripts/release/secret-audit.sh
```

Result:

```text
tracked_secret_candidates=0 docker_context_sensitive_files=excluded
```

Root Docker context excludes `.env*`, private keys, certificates and common
secret containers. Runtime secrets are injected through external env/secret
files. No secret value is recorded in this report.

### Rate Limiting

- Nest auth throttle: login 10/minute; refresh 30/minute.
- Reverse proxy supplies a second auth burst boundary and returns 429.
- There is no password-reset endpoint in the current Auth controller, so no
  reset route exists to throttle.
- Unit evidence: `auth-rate-limit.spec.ts` passes.
- Runtime burst evidence: six 401 responses followed by fourteen 429 responses.

## Production Images

| Image | Digest | User | Size | Trivy Critical/High |
| --- | --- | ---: | ---: | --- |
| Backend | `sha256:fd6f49e74ea08a0215af7299539fcc6d461f9696b5b517962a0598986a753ff4` | node | 132,495,341 B | 0 / 0 |
| Migration | `sha256:63956e3612f759b351a3d5058788cde08fc8d1b1dae0e448e147997da80f0537` | node | 600,064,475 B | one-shot tool image |
| Frontend | `sha256:241174074f61737a05b1122c2f9b43fb3b477fc3ac540705749a9815bce023d4` | 101 | 64,284,439 B | 0 / 0 |

The frontend serves static Vite assets through unprivileged Nginx. The backend
runtime contains only production dependencies, generated Prisma client and
compiled output. Upload storage is externalized through `STORAGE_ROOT` and is
writable by the non-root process.

SBOM checksums:

```text
backend de8715bce28797df434bb4cafdc61194b9ce3d459f5c804842c4aa7dfcaebb8b
frontend 1ffacaa1a6654eab01d66dde7bc95daa1331ccc4f556019c770b683cee6d5d15
```

Image signing is not implemented because no registry identity/OIDC signing
authority is configured. Mitigation: deploy by recorded digest, retain SBOM and
scan evidence, and require registry admission/signing before public production.

## Compose, TLS and Runtime

Production contract: `deployment/docker-compose.production.yml`.

Runtime services verified healthy:

```text
postgres, backend, frontend, reverse-proxy, prometheus, grafana
```

Observed edge behavior:

```text
HTTP /        -> 308
HTTPS /       -> 200
/api/health/ready -> ready; database/storage up
Prometheus target -> up
Grafana database  -> ok (12.4.1)
```

Headers verified: HSTS, X-Content-Type-Options, Referrer-Policy,
X-Frame-Options, Permissions-Policy and Content-Security-Policy. API and Socket
URLs default to the current origin in production; no private-host fallback is
embedded in the frontend.

## Migration Hardening

Existing database result:

```text
93 migrations found
Database schema is up to date
No pending migrations to apply
```

A clean PostgreSQL 17 database originally failed at immutable migration
`20260717190000_enterprise_data_scalability_indexes` because Prisma attempted
`CREATE INDEX CONCURRENTLY` inside a transaction (`P3018`, PostgreSQL 25001).
The migration file/checksum was not modified.

The production migration runner now fails closed except for that exact
migration and exact database error. It applies the approved index SQL through
`psql` outside a transaction, records it through `prisma migrate resolve`, then
continues normal Prisma deployment. Disposable clean-database evidence:

```text
93 applied migrations
13 concurrent indexes created
fresh migration exit 0
rerun: no pending migrations
```

Any unrelated migration failure still exits non-zero.

## Backup, Restore and PITR

Backup evidence:

```text
file: steeltrack-20260814T040243Z.dump
format: PostgreSQL custom
SHA-256: 81886b676bc01a33b26c31c984c86cba6973910dd81ffc478d0bd33c090eb92d
retention metadata: 35 days
```

Disposable PostgreSQL restore evidence:

```text
checksum PASS
all public table row counts match
backend read-only readiness smoke PASS
observed restore certification duration: about 25 seconds on local 50 MB DB
```

Policy:

- Daily full backup, retained 35 days.
- Weekly verified restore, retained 13 weeks.
- Monthly archive, retained 13 months.
- PostgreSQL Compose enables `wal_level=replica`, `archive_mode=on` and a
  five-minute archive timeout.
- Target RPO: 5 minutes after WAL is copied to durable off-host storage.
- Target RTO: 60 minutes; local measured database/application smoke is under
  one minute and excludes infrastructure provisioning/DNS.

Current Compose WAL archive resides with the PostgreSQL data volume. Public
production requires an off-host encrypted WAL/archive destination and a tested
PITR point selection. The current setup proves configuration, not site-loss
survivability.

## Observability

Implemented backend metrics:

- process uptime;
- database availability;
- HTTP request count and accumulated duration by route/status class;
- active projection failures and maximum lag;
- failed snapshot jobs;
- failed/dead worker jobs.

Request completion logs are structured JSON and carry validated/generated
`X-Request-Id` correlation. Request bodies and credentials are not logged by
the new middleware.

Prometheus configuration and seven rules validate with `promtool`: API down,
DB down, projection failure, snapshot failure, worker failure, high 5xx rate
and high average latency. Grafana provisioning and the operations dashboard
load successfully. Alertmanager receiver/on-call routing is environment-owned
and remains a production condition.

## Verification Matrix

| Verification | Result |
| --- | --- |
| Backend tests | PASS, 98 suites / 334 tests |
| Frontend tests | PASS, 4 files / 12 tests |
| Backend typecheck | PASS |
| Frontend typecheck | PASS |
| Backend build | PASS |
| Frontend build | PASS with existing 964 KB Three.js chunk warning |
| Prisma validate/generate | PASS |
| Migration status | PASS, 93 current |
| Clean database migration | PASS, 93 applied |
| Dependency gate | PASS, Critical 0 / High 0 deployed scope |
| Secret gate | PASS |
| Backend image scan | PASS, Critical 0 / High 0 |
| Frontend image scan | PASS, Critical 0 / High 0 |
| SBOM checksums | PASS |
| Compose render/start | PASS |
| TLS/headers | PASS |
| Rate limiting | PASS |
| Backup/restore/parity | PASS |
| Prometheus/Grafana/rules | PASS |
| `git diff --check` | PASS |
| Staged files | none |

## Remaining Risk

### P0

None within repository-controlled scope.

### P1 - Conditions Before Public Production

1. Push immutable images to the approved registry and sign/verify them.
2. Configure encrypted off-host full backup and WAL archive; execute PITR drill.
3. Connect Prometheus alerts to Alertmanager/on-call and test delivery.
4. Run the release workflow in hosted CI and retain its artifacts/attestations.
5. Complete 24-hour staging soak and peak-load validation.

### P2

1. Upgrade or isolate `apps/backend-experimental` dependencies.
2. Reduce the 964 KB React Three frontend chunk.
3. Extend structured logging to legacy service-local console output.
4. Add centralized log shipping and retention controls.

## Rollback Notes

- Deploy and roll back by immutable image digest.
- Stop rollout on migration uncertainty, failed readiness, rising projection
  lag, restore mismatch or security gate failure.
- Schema rollback remains restore/forward-fix based; never automatically reverse
  an applied migration.
- Before promotion, retain the pre-deploy backup checksum, WAL position,
  previous backend/frontend digests and environment fingerprint without values.

## Final Decision

**RC1 CONDITIONAL GO** for controlled internal staging and release-candidate
tagging. **Public production remains blocked** until all P1 production
conditions above have named owners and passing external evidence.
