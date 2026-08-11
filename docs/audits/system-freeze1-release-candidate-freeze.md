# SYSTEM.FREEZE.1 - SteelTrack V1 RC1 Release Candidate Freeze

Date: 2026-08-10  
Audited commit: `0094767e7b95bbb9f295359c3fd46eab4be5aaab`  
Mode: audit/documentation only  
Decision: **NO-GO**

## Executive Summary

SteelTrack has passed the canonical business runtime certification, but the
current repository does not satisfy release engineering, security, recovery or
operability gates. RC1 must not be tagged or deployed until the P0 items in this
report are closed and independently re-verified.

| Area | Result | Release impact |
| --- | --- | --- |
| Business runtime | PASS | Canonical forward workflow and dashboards certified |
| Prisma/migrations | PASS | 90 migrations, runtime database up to date |
| Tests/build/typecheck | PASS | Backend 313 tests, frontend 4 tests |
| Lint | FAIL | Backend 4,010 errors; frontend 384 warnings |
| Dependency security | FAIL | Deployed graph: 1 critical, 10 high advisories |
| Production packaging | FAIL | No deployable frontend service/reverse proxy contract |
| Backup creation | PARTIAL | Fresh dump readable; restore/PITR not certified |
| Monitoring | PARTIAL | In-process metrics exist; no external collection/alerts |
| Security controls | FAIL | Advisories, missing headers/rate limit, frontend secret exposure risk |
| Documentation | PARTIAL | Rich architecture docs; product READMEs and release procedures incomplete |

## Phase 1 - Release Freeze Audit

### Source markers

- No active `FIXME` or debug marker was found.
- The three `TODO` matches are a real `ProductionTaskStatus.TODO` value and two
  archived UI status strings, not unresolved comments.
- Active production source contains 8 backend and 10 frontend
  `console.log`/`console.debug` calls. The legacy `/transactions` controller
  logs complete request bodies, which is unsuitable for production.
- Certification scripts contain four intentional console outputs.

### Archived and legacy code

- Excluded frontend archives remain in the repository:
  `_archived` 1.3 MB, `_legacy_modules` 312 KB, cleanup backups 72 KB.
- `apps/backend-experimental` remains in the pnpm workspace and contributes
  dependency/advisory noise despite not being in the production Compose stack.
- Registered compatibility surfaces remain, including `/transactions`,
  `MaterialMovementsModule`, `SimulationModule`, legacy component/production
  compatibility routes and `POST /production/:id/stage-to-yard` (correctly
  returns `410 Gone`). Do not delete these without consumer evidence.
- Backup frontend classes are empty placeholders; the System capability source
  correctly labels backup as `NOT_IMPLEMENTED`.

### Unused/dead code signal

- Frontend lint reports extensive unused imports, variables, actions and
  components across Analytics, Components, Suppliers and Yard.
- TypeScript explicitly disables unused-local/parameter checks and strict mode
  in frontend; backend also disables several strict checks.
- Static analysis cannot prove a repository/service is dead solely from symbol
  search. Removal requires route/import coverage and runtime telemetry.

### Lint evidence

- Frontend: exit 0, **0 errors / 384 warnings**.
- Backend read-only lint: exit 1, **4,010 errors / 100 warnings**. Some errors
  are ESLint project-service configuration failures for excluded spec files;
  many others are formatting and unsafe-type findings. The configured
  `pnpm lint` includes `--fix`, so the freeze audit intentionally used a
  non-mutating ESLint invocation.
- Root `pnpm test` fails because root `package.json` still contains the default
  `Error: no test specified` script. No CI workflow exists in the repository.

## Phase 2 - Dependency Audit

`pnpm audit --prod --json` queried the current registry on 2026-08-10.

### Deployed backend/frontend graph

| Severity | Unique advisories |
| --- | ---: |
| Critical | 1 |
| High | 10 |
| Moderate | 24 |
| Low | 5 |

P0/high-impact packages include:

- `form-data@2.3.3` through `node-telegram-bot-api`: critical unsafe multipart
  boundary plus CRLF injection advisories.
- `xlsx@0.18.5`: prototype pollution and ReDoS.
- `multer@2.1.1`: nested-field and aborted-upload denial of service.
- `socket.io-parser@4.2.6` and transitive `ws`: memory exhaustion.
- `react-router@7.15.1`: denial of service and RSC CSRF advisory.
- `axios@1.16.1`: inherited proxy configuration advisory.
- `pnpm@11.1.3`: tooling path traversal/credential advisories; fixed line is
  11.4.0 or later for the reported issues.

`apps/backend-experimental` adds another 29 advisories and should be removed
from the release workspace or explicitly isolated before generating an SBOM.

### Version and duplication findings

- Prisma is consistently 6.19.3 in the production backend, but the experimental
  backend uses Prisma 7.8.0.
- Root/frontend use TypeScript 6 while backend uses 5.9.x.
- Both `bcrypt` and `bcryptjs` are direct backend dependencies; active auth uses
  `bcryptjs`. Ownership should be consolidated after compatibility review.
- `@types/react-router-dom@5` is installed while runtime React Router is v7.
- No direct package is marked deprecated by `pnpm outdated`, but the Telegram
  dependency brings the abandoned `request` stack.

### License findings

- Most production dependencies are MIT/Apache/BSD/ISC.
- `pause@0.0.1` (via Passport) has unknown license metadata.
- `sylvester` unknown license and LGPL libvips are in experimental/image paths.
- No approved license policy, attribution bundle or release SBOM exists.

## Phase 3 - Production Configuration

### Positive controls

- Production startup validates PostgreSQL URL, a non-default JWT secret of at
  least 32 characters, explicit non-wildcard CORS, absolute storage path and
  worker/snapshot flags.
- Backend image is multi-stage, non-root, uses `tini` and has a healthcheck.
- Production Compose gates backend startup on one-shot `prisma migrate deploy`,
  binds backend to localhost by default and grants 60 seconds for shutdown.
- Compose interpolation succeeds when an absolute external env-file path is
  supplied.

### Blocking gaps

- Production Compose contains only migration and backend services. It contains
  no frontend, database, reverse proxy or TLS termination contract.
- The frontend Dockerfile is not a valid Vite production image: it runs
  frontend-local `prisma generate` and starts `node dist/main` rather than
  serving static `dist` assets. It is not referenced by production Compose.
- Frontend production build warns that `NODE_ENV=production` is incorrectly set
  in `.env`; `apps/.env.production` does not define a production API URL.
- Frontend API falls back to hardcoded `http://172.168.53.116:3000` and socket
  runtime falls back to localhost.
- There is no repository Nginx, systemd or Kubernetes deployment definition.
- No HTTPS/HSTS/CSP/security-header middleware is present. No compression or
  application rate limiting is configured.
- `apps/healthcheck.sh` still calls obsolete `/system/health` rather than the
  new `/health/live`, `/health/ready` and `/health/startup` contracts.

### Secret handling

- `.env` files are ignored and not tracked, and `.dockerignore` excludes them
  for a root-context build.
- Local `apps/frontend/.env` nevertheless contains database and JWT material.
  A frontend-context Docker build has no local `.dockerignore` and could copy
  it into an image. Rotate those credentials and remove server secrets from all
  frontend environments before packaging.
- Production must use a secret manager or root-owned external env file; the
  checked-in `.env.example` values are placeholders and intentionally fail
  production startup validation.

## Phase 4 - Backup and Restore

### Evidence collected

- Existing custom-format dumps from June 2026 have readable archive catalogs.
- A fresh read-only dump was created at `/tmp/steeltrack-rc1-freeze.dump`:
  2.1 MB, 1.44 seconds, SHA-256
  `ccc226b0a78c10dfe3180854149611c22868a1517a7caf3239ac8a5a08d7d7f7`.
- `pg_restore --list` completed successfully with PostgreSQL client 17.10.

### Gaps

- No automated backup job, off-host encrypted storage, retention enforcement,
  backup-age alert or PITR/WAL policy is implemented in this repository.
- No clean-database restore was executed; restore time, RTO, row-count parity,
  application readiness after restore and PITR are unverified.
- Existing backup files have no adjacent committed checksum/evidence bundle and
  are development snapshots, not a production retention chain.

Result: **backup creation PARTIAL; disaster recovery NOT CERTIFIED**.

## Phase 5 - Monitoring

### Available

- `/health/live`, `/health/ready`, `/health/startup` are production-grade and
  runtime-certified.
- In-process performance metrics, slow-query logging, Operations Center,
  telemetry, snapshot fallback and projection/job health surfaces exist.
- Runtime logs include business ActivityLog and correlation IDs at canonical
  command boundaries.

### Missing

- No Prometheus scrape configuration/export format, Grafana dashboards, alert
  rules, centralized structured-log shipper or owned notification routing.
- Metrics are process-local and reset on restart; slow query data is written to
  a repository path rather than durable operational storage.
- There is no external uptime, backup-age, disk/WAL, queue age, stale lease,
  projection lag, 5xx or latency alert certification.

## Phase 6 - Performance

- Runtime business certification saw a maximum business API latency of
  458.82 ms; login and several list endpoints exceeded local budgets.
- `docs/runtime/slow-query.log` contains 214 entries: 99 at or above 1 second,
  18 at or above 3 seconds, maximum 6,535 ms. Most recent heavy rows are
  background raw `INSERT`/unknown queries, so instrumentation does not identify
  the exact table/query plan needed for remediation.
- Snapshot workers emitted safe lease-loss warnings under concurrent load.
- Frontend build succeeds but `vendor-react-three` is 964.42 KB minified and
  triggers the 500 KB chunk warning. Total built frontend is approximately
  45 MB including assets.
- Existing index/scalability foundations are extensive, but no current
  production-size 80%-peak load report satisfies the enterprise release policy.

No speculative index was added during freeze.

## Phase 7 - Security

### Passing controls

- Global JWT guard, canonical permission guards and runtime RBAC matrix passed
  54/54 checks (401, 403, role success, disabled user, expired JWT).
- Access tokens expire in 15 minutes; refresh tokens expire in 30 days, are
  hashed in DB, rotated transactionally and reject replay.
- Production secret and CORS validation fail fast.

### Risks

- Critical/high dependency advisories are P0.
- Refresh/access tokens are persisted in browser `localStorage`, increasing
  impact of any XSS. No CSP is configured.
- Login has no application rate limit/account lockout. Password creation policy
  is only minimum 8 characters; no breached-password or MFA enforcement exists.
- Refresh tokens are returned in JSON rather than secure, HTTP-only cookies.
- Static `/uploads` is publicly served and legacy component upload routes do not
  show explicit file-size/MIME limits equivalent to the attachment module.
- Legacy `/transactions` logs request payloads.

## Phase 8 - Documentation

### Available

- Architecture, domain, RBAC, API contract, migration, staging, replay and
  runtime audit documentation is comprehensive.
- This sprint adds deployment, rollback and operations procedures under
  `docs/release/`.

### Gaps

- Backend and frontend READMEs are unchanged Nest/Vite starter templates.
- No generated OpenAPI/Swagger specification or versioned external API catalog.
- Existing enterprise release policy contains old `Component READY` semantics
  inconsistent with canonical physical `ComponentInstance` lifecycle.
- No concise installation/upgrade guide tied to immutable image digests exists
  outside the new RC1 draft guide.

## Phase 9 - Production Checklist Status

The executable checklists are in:

- `docs/release/RC1_DEPLOYMENT_GUIDE.md`
- `docs/release/RC1_ROLLBACK_GUIDE.md`
- `docs/release/RC1_OPERATION_RUNBOOK.md`

All P0 entries must have owner, timestamp and machine-readable evidence. A
checkbox without evidence is not acceptance.

## Verification Matrix

| Command/gate | Result |
| --- | --- |
| Prisma validate | PASS |
| Prisma generate | PASS |
| Prisma migrate status | PASS, 90 migrations current |
| Backend tests | PASS, 94 suites / 313 tests |
| Frontend tests | PASS, 2 files / 4 tests |
| Backend build | PASS |
| Frontend build | PASS with env/chunk warnings |
| Frontend typecheck | PASS |
| Frontend lint | PASS with 384 warnings |
| Backend lint (non-mutating) | **FAIL, 4,010 errors / 100 warnings** |
| Dependency audit | **FAIL, 1 critical / 10 high deployed advisories** |
| Production Compose config | PASS with absolute external env file |
| Fresh backup/catalog/checksum | PASS |
| Restore/PITR drill | **NOT RUN / FAIL gate** |
| `git diff --check` before docs | PASS |
| Stage/commit by this sprint | NONE |

The initial `pnpm -C apps/backend-api test -- --runInBand` invocation was
syntactically incorrect and treated `--runInBand` as a pattern. The canonical
`pnpm -C apps/backend-api exec jest --runInBand --silent` rerun passed and is the
result reported above.

## Final Questions

1. **Can RC1 be tagged? NO.** Security audit and backend lint gates fail.
2. **Can RC1 be deployed internally? NO.** The full frontend deployment contract
   is absent and known critical/high advisories remain.
3. **Can RC1 be deployed to production? NO.** Security, restore, TLS/proxy,
   monitoring/alerting and packaging controls are incomplete.
4. **Remaining P0:** deployed dependency advisories; backend lint gate;
   frontend production image/static serving and API URL contract; secret
   rotation/frontend secret removal; restore/PITR certification; HTTPS/security
   headers/rate limiting; external monitoring and alert ownership.
5. **Remaining P1:** console/payload logging cleanup; frontend lint warnings;
   stale health script; CI orchestration; 80%-peak load test; slow background
   query attribution; SBOM/license review; starter README replacement; legacy
   endpoint consumer inventory.
6. **Remaining P2:** archive cleanup, root workspace consolidation, direct
   Playwright form depth, long-term test artifact publishing.
7. **Technical debt:** weak TypeScript strictness, 467 controller/route markers,
   compatibility modules, experimental workspace coupling and large frontend
   chunks.
8. **Security risk:** **HIGH** until advisories and client/server secret boundary
   are corrected.
9. **Operational risk:** **HIGH** because restore/PITR and external alerts are
   not certified.
10. **Go-live recommendation:** keep commit `0094767` as a business-runtime
    checkpoint only. Open a release-blocker remediation sprint, re-run this
    matrix on an isolated staging environment for at least 24 hours, then issue
    a new freeze decision. Do not tag or deploy this commit as RC1.
