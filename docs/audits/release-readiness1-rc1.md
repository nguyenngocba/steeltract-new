# RELEASE.READINESS.1 - RC1 Release Readiness Audit

Date: 2026-08-14  
Audited commit: `0c1e19f06b920bc6ad81b50fe7193bc5d258d5b4`  
Branch: `feature/shared-cockpit-foundation`  
Mode: audit/documentation only  
Decision: **NO-GO**

## Executive Summary

SteelTrack's business runtime, projection foundation, database schema and core
application builds are healthy enough to form a release candidate baseline.
They are not sufficient for an RC1 release. The release engineering, security,
recovery and observability controls remain incomplete.

The decisive blockers are independently reproducible:

1. The deployed backend/frontend dependency graph still contains one critical
   and ten unique high advisories.
2. The frontend production Docker image does not build and production Compose
   contains no frontend, reverse proxy or TLS service.
3. A frontend-local `.env` contains server-only secret keys, is mode `0644`,
   and is included by the frontend Docker build context because that context
   has no `.dockerignore`.
4. PostgreSQL has `archive_mode=off`; no clean restore or PITR drill exists.
5. There is no Prometheus exporter/scrape configuration, Grafana dashboard,
   alert routing, centralized structured logging or retention policy.
6. Backend non-mutating lint fails with 1,386 errors; no repository CI workflow
   enforces test, lint, build, image, security or release gates.

RC1 must not be tagged or deployed, including internal deployment, until every
P0 is closed and re-certified in an isolated staging environment.

## Readiness Scorecard

| Area | Result | Evidence |
| --- | --- | --- |
| Backend tests/build | PASS | 97 suites, 333 tests; build PASS |
| Frontend tests/build | PASS WITH WARNINGS | 4 files, 12 tests; build PASS; chunk/env warnings |
| Database schema | PASS | Prisma validate PASS; 93 migrations current |
| Projection runtime | PASS/PARTIAL COVERAGE | 25 checkpoints, zero active failures; six projections not initialized |
| Health probes | PASS | Production-mode live/ready/startup all returned HTTP 200 |
| Backend image | PASS WITH RELEASE GAPS | Build PASS; non-root; 191 MB; unsigned/unscanned |
| Frontend image | FAIL | Real Docker build exits at `pnpm install`; no static serving stage |
| Production Compose | FAIL AS COMPLETE STACK | Valid backend/migrate contract only; no frontend/proxy/TLS |
| Dependency security | FAIL | Deployed graph: 1 critical, 10 unique high |
| Application security edge | FAIL | No security headers, rate limit, TLS contract or CSP |
| Secrets | FAIL | Server keys present in frontend-local build context; no secret-manager evidence |
| Backup/restore/PITR | FAIL | Local dumps exist; archive mode off; restore/PITR not certified |
| Monitoring/alerts | FAIL | Internal diagnostics only; no external collection/alert ownership |
| Logging | FAIL | Console/payload logs; no structured centralized retention/redaction |
| Lint/CI | FAIL | Backend 1,386 errors; frontend 384 warnings; no CI workflow |
| License/SBOM | FAIL | No LICENSE/NOTICE/SBOM; two dependencies report unknown metadata |
| Release documentation | PARTIAL | Strong draft guides, but stale candidate data and starter READMEs |

## Phase 1 - Application Review

### Backend

Positive controls:

- Production configuration fails closed for missing/non-PostgreSQL database
  URL, weak/default JWT secret and wildcard/missing production CORS origins.
- Global JWT authentication is enabled; refresh tokens are hashed, rotated and
  revoked on replay/logout. Access and refresh TTLs are 15 minutes and 30 days.
- Backend tests and build pass.
- The backend image is multi-stage, runs as `node`, uses `tini`, exposes a
  healthcheck and builds successfully. Local audit image digest:
  `sha256:505cf7234b1ed51eda4bf7fb2b12a3b94c60b8f6751df90bfa29d3f9168ac95d`.

Release gaps:

- No Helmet/security-header middleware, request rate limiting or compression
  is configured in the Nest bootstrap.
- Login and refresh endpoints have no brute-force throttle/account lockout.
- Global `ValidationPipe` does not enable whitelist/forbid/transform controls;
  typed Zod routes mitigate this only where explicitly used.
- Legacy component upload routes have no explicit file-size or MIME allowlist.
- The legacy `/transactions` controller logs complete POST bodies.
- Several runtime services use direct `console.*` output instead of a
  structured, redacted logger.

### Frontend

Positive controls:

- TypeScript/Vite production build and Vitest pass.
- API calls have a finite 30-second timeout and token refresh is serialized.

Release gaps:

- API fallback is hardcoded to `http://172.168.53.116:3000`; Socket.IO falls
  back to `http://localhost:3000`. A missing production build variable can
  silently target the wrong environment.
- Access and refresh tokens are stored in `localStorage`; without CSP this
  materially increases XSS impact.
- Frontend build warns that `NODE_ENV=production` is incorrectly supplied via
  `.env` and emits a 964 KB minified React Three vendor chunk.
- Lint exits zero only because all 384 findings are warnings; unused code and
  hook dependency findings remain.

## Phase 2 - Security and Secrets

### Dependency audit

Registry audit was run on 2026-08-14 against 877 production/optional
dependencies.

| Scope | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| Entire workspace | 1 | 24 | 46 | 6 |
| Backend API paths | 1 | 5 | 6 | 1 |
| Frontend paths | 0 | 8 | 18 | 4 |
| Experimental backend paths | 0 | 9 | 18 | 2 |
| pnpm package-manager paths | 0 | 8 | 6 | 0 |

The deployed backend/frontend union has one critical and ten unique high
advisories. P0 packages include `form-data` through the Telegram/request stack,
`xlsx`, `multer`, `ws`, `socket.io-parser`, `axios` and `react-router`. The
pinned `pnpm@11.1.3` also has eight high tooling advisories.

### Secret boundary

- Tracked files include only development/production frontend variable files
  and the backend example; no private `.env`, key or certificate is tracked.
- Local backend, frontend and experimental `.env` files are mode `0644`.
- The frontend-local `.env` contains `DATABASE_URL` and `JWT_SECRET` keys.
- A Docker build using `apps/frontend` as context does not see the root
  `.dockerignore`; with no `apps/frontend/.dockerignore`, `COPY . .` includes
  that file and local `node_modules` in build layers/context.
- No secret-manager integration, rotation evidence or secret-expiry monitoring
  is present.

No secret values are reproduced in this report. Treat the local values as
potentially exposed to image build history and rotate them before any release.

### TLS, CORS and headers

- Production CORS validation is explicit and rejects `*`: PASS.
- `TRUST_PROXY` is configurable: PASS, but correct hop count is not certified.
- TLS termination, HSTS, CSP, clickjacking/content-type protections and secure
  reverse-proxy forwarding headers are absent: FAIL.
- The available Nginx file is a development-style proxy with HTTP only and no
  security headers; production Compose does not use it.

## Phase 3 - Database, Backup and Recovery

### Database state

Read-only runtime evidence:

- PostgreSQL `17.10`.
- Database size approximately 50.0 MB.
- Prisma schema valid; 93 migrations; database up to date.
- `wal_level=replica`, `max_wal_senders=10`.
- `archive_mode=off`, archive command disabled, zero archived WAL files.

### Backup

Four local custom-format dumps were found in `/tmp`; the newest is dated
2026-08-10. They are useful development checkpoints, not a production backup
chain. There is no automated schedule, encryption, immutable off-host copy,
retention enforcement, checksum catalog, backup-age alert or attachment-storage
backup evidence.

### Restore and PITR

- No clean database restore with application/read-model invariant comparison
  has been completed.
- No measured RPO/RTO exists.
- PITR is impossible in the audited database configuration because WAL archive
  is disabled.
- Migration rollback is intentionally forward-only, but no previous immutable
  image digest and restored-database rollback rehearsal is certified.

Result: **database schema ready; disaster recovery not ready**.

## Phase 4 - Projection, Workers and Monitoring

Current read-only database state:

- Background jobs: 867 completed, no active failed/queued/running rows.
- Outbox: 2,548 dispatched, no active pending/failed rows.
- Snapshot jobs: 103 completed.
- Dashboard snapshots: 40 authoritative/fresh, 2 non-authoritative/stale.
- Projection checkpoints: 25; active projection failures: 0.

This proves current worker state is healthy, not that production monitoring is
ready. Six registered projections remain uninitialized, and the repository has
no externally collected projection/worker freshness SLO.

Available operational surfaces:

- `/health/live`, `/health/ready`, `/health/startup`.
- Authenticated performance, Operations Center and projection health endpoints.
- Database-backed job/outbox/projection/snapshot state.

Missing production controls:

- Prometheus-compatible exporter and scrape configuration.
- Grafana dashboards and versioned alert rules.
- Alertmanager/on-call routing and ownership.
- External synthetic health/login checks.
- Backup age, disk, WAL, database saturation, 5xx, latency, queue age, lease
  loss, projection lag/failure and snapshot staleness alerts.
- Centralized structured log shipping, correlation search, redaction and
  retention policy.

Readiness currently proves database and storage reachability. It does not prove
that worker heartbeats are current or that projection/outbox lag is within SLO.

## Phase 5 - Docker, Compose and Reverse Proxy

### Backend image

- Real build: PASS.
- Multi-stage/non-root/tini/healthcheck: PASS.
- Size: 190,999,752 bytes.
- Image is local only, not vulnerability-scanned, SBOM-attested, signed or
  pushed by digest.

### Frontend image

Real build: **FAIL**.

The build stops at `RUN pnpm install` with `ERR_PNPM_IGNORED_BUILDS`. Even if
that were corrected, the Dockerfile runs `pnpm prisma generate`, exposes port
3000 and starts `node dist/main`; a Vite frontend needs a build stage followed
by an approved static server serving `dist`.

### Production Compose

Compose interpolation succeeds only when required image, external env-file and
storage-path variables are provided. Its operational scope is limited to:

- one-shot Prisma migration container;
- backend container bound to loopback by default;
- bind-mounted attachment storage;
- readiness healthcheck.

It has no frontend, database ownership contract, reverse proxy, TLS, certificate
renewal, frontend/API network routing or backup service. This may be acceptable
only if those are explicitly supplied by a separate, audited platform contract;
no such contract/evidence exists here.

## Phase 6 - Production vs Development Configuration

Production-positive:

- Strict backend startup validation.
- Explicit production logging levels and worker/snapshot flags.
- External env-file requirement in Compose.
- Loopback backend bind by default.

Configuration gaps:

- No typed validation for Redis URL, database pool/timeouts or attachment size
  policy at deployment boundary.
- Development and production frontend variable ownership is split across
  `apps/.env.*` and `apps/frontend/.env`, with invalid server keys in frontend
  scope.
- No immutable environment fingerprint artifact is generated.
- No CI check proves placeholders fail, required production variables exist,
  or frontend bundles contain no secret/private fallback.

## Phase 7 - License, NOTICE and Documentation

- Root package declares ISC, backend is `UNLICENSED`, frontend has no license
  field, and no repository `LICENSE` or `NOTICE` file exists.
- Dependency inventory includes `pause` and `sylvester` with unknown license
  metadata. No approved allow/deny policy or attribution review exists.
- No CycloneDX/SPDX SBOM or image signature/provenance artifact exists.
- RC1 deployment, rollback and operation guides are useful and correctly mark
  their gates open.
- RC1 release notes refer to stale candidate commit `0094767...`, 90 migrations
  and old test counts; current commit is `0c1e19f...` with 93 migrations.
- Backend/frontend READMEs remain unmodified framework starter documentation.
- There is no root product README, installation guide or published/versioned
  OpenAPI contract.

## P0 - Must Close Before RC1

1. Remediate or formally risk-accept every critical/high advisory in deployed
   backend/frontend paths; upgrade the vulnerable package manager used by CI.
2. Replace the frontend Dockerfile with a reproducible frozen-lockfile static
   image, add frontend/edge routing to the production deployment contract and
   prove immutable digest deployment.
3. Remove and rotate server credentials from frontend scope/build context;
   introduce a secret-manager/external secret contract and restrictive file
   permissions.
4. Implement and stage-certify TLS, HSTS, CSP, security headers, login/API rate
   limiting and upload limits.
5. Enable encrypted off-host backups and WAL archiving; complete clean restore
   and PITR drills with approved RPO/RTO and canonical invariant comparison.
6. Provide external metrics/log collection, dashboards, versioned alert rules
   and owned on-call routing for API, DB, storage, backup, jobs, outbox,
   projections and snapshots.
7. Repair backend ESLint configuration/source findings and add CI enforcing
   lint, test, typecheck, build, migration, audit, image and release gates.
8. Freeze a new candidate commit/tag only after SBOM, scan, signatures,
   deployment manifests and approval evidence are attached.

## P1 - Required for Production Operations

1. Remove payload/debug console logging and establish structured redaction,
   correlation, retention and audit-search policy.
2. Move browser tokens toward a secure cookie/BFF model or document a reviewed
   CSP-based mitigation; add issuer/audience/key-rotation policy.
3. Certify worker heartbeat/lag semantics in readiness or dedicated SLO probes.
4. Back up and restore attachment storage together with database metadata.
5. Define database pool, statement timeout, lock timeout and capacity budgets.
6. Resolve frontend hook/unused warnings and large-chunk warning under an
   accepted warning/performance budget.
7. Replace starter READMEs, update RC1 candidate metadata, publish API/install/
   upgrade documentation and execute all release checklists with named owners.
8. Publish license policy, NOTICE/attribution bundle and resolve unknown-license
   dependencies.

## P2 - Post-RC1 Improvements

1. Isolate or remove `apps/backend-experimental` from the release workspace and
   SBOM after ownership review.
2. Consolidate duplicate/legacy dependencies and archived UI surfaces.
3. Add longer soak/load tests, direct browser form-depth coverage and artifact
   retention automation.
4. Reduce backend image size by pruning build-only workspace dependencies.

## Verification Evidence

| Check | Result |
| --- | --- |
| Prisma validate | PASS |
| Prisma migrate status | PASS, 93 migrations current |
| Backend tests | PASS, 97 suites / 333 tests |
| Backend build | PASS |
| Backend lint, read-only | FAIL, 1,386 errors / 103 warnings |
| Frontend tests | PASS, 4 files / 12 tests |
| Frontend build/typecheck | PASS with env/chunk warnings |
| Frontend lint | PASS with 384 warnings |
| Backend Docker image | PASS, non-root, 191 MB |
| Frontend Docker image | FAIL at dependency install |
| Production Compose render | PASS for backend/migrate only |
| Production-mode health probes | live/ready/startup HTTP 200 |
| Dependency audit | FAIL, 1 critical / 10 unique high deployed advisories |
| Backup presence | PARTIAL, local dumps only |
| Clean restore/PITR | FAIL / not certified; archive mode off |
| External monitoring/alerts | FAIL / absent |
| LICENSE/NOTICE/SBOM | FAIL / absent |

The production-mode backend was started temporarily on port 3100 with workers
disabled, then stopped after probe collection. No business endpoint was called
and no database mutation, migration, source change, stage or commit occurred.

## Final Decision

### RC1: **NO-GO**

- **Can RC1 be tagged? NO.** Candidate provenance, security, lint, image and
  recovery gates fail.
- **Can RC1 be deployed internally? NO.** There is no buildable frontend image
  or complete deployment/edge contract, and critical/high advisories remain.
- **Can RC1 be deployed to production? NO.** Security edge, secrets, DR,
  observability and operational ownership are not certified.

Business/runtime/projection completion should be retained as the engineering
baseline. Open a release-blocker remediation sprint, execute the P0 matrix in
isolated staging, run at least one restore/PITR drill and an operational soak,
then issue a new immutable candidate and repeat this audit.
