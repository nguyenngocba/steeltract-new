# RFC015 Enterprise Production Deployment Readiness

Status: **IMPLEMENTED - CONDITIONALLY DEPLOYMENT READY**  
Date: 2026-07-17

## Implemented

- Added fail-fast production configuration validation before Nest application
  creation. Production now requires a PostgreSQL `DATABASE_URL`, non-default
  32+ character `JWT_SECRET`, explicit non-wildcard `CORS_ORIGINS`, valid port,
  absolute storage path, strict boolean feature flags and positive worker/
  snapshot timing values.
- Replaced fixed port/open CORS bootstrap with validated host/port, CORS
  allowlist, optional proxy trust and environment-aware log levels.
- Enabled Nest shutdown hooks so `SIGTERM`/`SIGINT` trigger the RFC014 worker
  drain and module disposal lifecycle.
- Added unauthenticated deployment probes: `/health/live` checks process
  liveness without dependencies; `/health/ready` checks the PostgreSQL
  connection and returns HTTP 503 when unavailable.
- Removed JWT payload console logging from the authentication strategy.
- Added a reproducible multi-stage Node 22 Alpine backend image. It runs through
  `tini`, uses the non-root `node` account, persists uploads outside the image
  and includes a liveness healthcheck.
- Added a production Compose definition that runs `prisma migrate deploy` as a
  one-shot gate before starting the API, requires immutable image/env/storage
  inputs, exposes readiness health and grants a 60-second shutdown window.
- Locked Corepack to exact `pnpm@11.1.3`; range-based package-manager metadata
  previously made the container build fail before dependency installation.
- Added a secrets-free production environment template and an explicit
  `migrate:deploy` package command.

## Deployment Decisions

- Migrations do not run inside each API replica. The one-shot migration service
  must complete successfully before API startup, preventing replica migration
  races and keeping application rollback independent from schema deployment.
- Outbox/Background processing remains controlled by `JOB_WORKER_ENABLED`.
  Replay is never automatic at startup. Production operators must deliberately
  assign worker-enabled replicas and invoke replay only through approved tools.
- Rollback uses the previous immutable backend image. Additive migrations remain
  in place, following the existing expand/contract policy; destructive automatic
  database rollback is not introduced.
- Secrets are injected through the deployment environment file/secret store and
  are not baked into the image. The application rejects known placeholder or
  default JWT secrets in production.
- No Kubernetes manifests exist in the repository, so Kubernetes-specific
  rollout was not invented. The liveness/readiness HTTP contracts are ready for
  future Kubernetes probes.

## Verification Evidence

- Backend build: PASS
- Frontend build: PASS
- Full backend regression: PASS, 70/70 suites and 185/185 tests
- Deployment configuration tests: PASS
- Invalid production startup fail-fast: PASS
- Docker Compose interpolation/config validation: PASS
- Docker image build: PASS
- Image metadata: 190,199,243 bytes, non-root `node`, liveness healthcheck PASS
- Prisma validate inside production image: PASS
- `git diff --check`: PASS
- Staged files / commit: none

## Remaining Release Gates

- PostgreSQL at `localhost:5432` was unavailable during the final live startup
  smoke. The application correctly refused startup, but an HTTP readiness PASS
  and graceful `SIGTERM` smoke against a reachable staging database remain
  mandatory before deployment.
- RFC013 migration `20260717190000_enterprise_data_scalability_indexes` remains
  pending. The migration job will apply it, but lock duration and query plans
  must first be validated on a production-size clone.
- TLS termination, secret rotation, image signing/SBOM publication, registry
  retention and centralized log/metrics shipping are infrastructure concerns
  not represented in this repository and remain deployment-platform gates.
- Legacy route authorization remains the RFC014 compatibility backlog; this
  sprint did not change business API access semantics.

Final assessment: **CONDITIONALLY DEPLOYMENT READY**. Build artifacts, startup
validation, probes, shutdown integration and migration ordering are implemented
and validated. Production release is not approved until staging PostgreSQL,
pending migration, live readiness/shutdown and external platform controls pass.
