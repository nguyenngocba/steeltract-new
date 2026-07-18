# RFC016 Enterprise Production Certification

Date: 2026-07-18  
Status: **NOT READY**

## Certification Decision

SteelTrack has a substantial enterprise foundation and passes its current
build/regression suite, but it is **not certified for production deployment**.
The decision is blocked by code-level authorization gaps on active business
mutation routes, crash recovery gaps for claimed background work, and an
undeployed migration whose production lock/runtime impact has not been proven.

This RFC changed no application code, schema, migration, API, business rule or
frontend. The result is based on source inspection, existing runtime evidence
and verification against the current worktree.

## Bounded Context Certification

| Context | Classification | Justification |
| --- | --- | --- |
| Inventory | **NOT READY** | Mature transaction/Outbox/read-model foundation, but `InventoryController`, zone, category, unit and material-type mutation routes have no JWT guard. |
| Components | **CONDITIONALLY READY** | Canonical command API is authenticated and supports idempotency/concurrency; legacy compatibility mutations remain alongside the aggregate path and still require operator/cutover certification. |
| Production | **CONDITIONALLY READY** | Authenticated canonical and compatibility APIs, aggregate versioning, atomic Outbox and material ownership tests pass; full operator lifecycle and production-volume certification remain pending. |
| QC | **NOT READY** | Canonical internal command boundary exists, but active checklist, inspection, result, issue, approval/rejection and NCR mutations are exposed by an unguarded controller. |
| Yard | **CONDITIONALLY READY** | Main workspace controller is JWT-protected and canonical commands are idempotent/versioned; a duplicate compatibility controller exposes Yard reads and the domain has not completed production operator certification. |
| Logistics | **CONDITIONALLY READY** | Controller is authenticated and canonical internal command service is atomic/idempotent; public compatibility routes and end-to-end Yard handoff still lack operator certification. |
| Projects | **NOT READY** | Template routes are protected, but project create/update, material return, WBS and site-update mutation routes are not guarded. |

## Platform Certification Matrix

| Area | Classification | Evidence and limitation |
| --- | --- | --- |
| Architecture ownership and boundaries | **READY** | AD-015 through AD-019, repository ownership, owner command services and CQRS boundaries are present. |
| Startup configuration | **READY** | Production fails fast on invalid database URL, JWT secret, CORS, flags and runtime limits. Prisma connects during module initialization. |
| Startup sequence | **CONDITIONALLY READY** | Compose gates API startup on one-shot migration. A live startup attempt failed closed when local PostgreSQL became unavailable, so successful staging startup is not certified. |
| Deployment configuration | **CONDITIONALLY READY** | Non-root image and validated Compose definition exist; TLS ingress, secret manager, registry policy, signing/SBOM and centralized telemetry are external unresolved gates. |
| Migration safety | **NOT READY** | Prisma reports 77 migrations with `20260717190000_enterprise_data_scalability_indexes` pending. Its additive `CREATE INDEX` statements are not concurrent and have no production-size lock/WAL budget evidence. |
| Outbox atomicity | **READY** | Canonical command paths persist business mutation, activity/audit and domain Outbox in owner repository transactions; focused regression coverage passes. |
| Replay safety | **CONDITIONALLY READY** | Projection receipts, checkpoints, keyset batches, bounded runs and retry/dead-letter records are implemented. Production-volume replay, archive restore and WAL throughput are unproven. |
| Durable idempotency | **CONDITIONALLY READY** | Canonical Component, Production, QC, Yard, Logistics and Projects command boundaries reject conflicting key reuse. Not every legacy compatibility mutation requires an idempotency key. |
| Optimistic concurrency | **CONDITIONALLY READY** | Canonical aggregates enforce expected version/CAS semantics. Legacy generic update routes remain compatibility paths without a uniform version contract. |
| Authorization boundaries | **NOT READY** | No global auth guard exists. Inventory, QC and core Projects mutation controllers expose write operations without `JwtAuthGuard`; this is a release-blocking security defect. |
| Background worker execution | **CONDITIONALLY READY** | Single-flight ticks, atomic `SKIP LOCKED` claims, bounded retries and graceful in-process drain exist. Worker topology remains an operator deployment decision. |
| Failure recovery | **NOT READY** | Stale `RUNNING` jobs and `DISPATCHING` Outbox rows are warning-only. There is no owner-checked lease expiry/reclaim path, so a process crash can strand claimed work. |
| Retry and dead letter | **CONDITIONALLY READY** | Outbox/jobs/projections use bounded retry and dead-letter states; recovery/re-drive procedures have not been exercised on staging volume. |
| Health endpoints | **CONDITIONALLY READY** | `/health/live` is process-only and `/health/ready` checks PostgreSQL with HTTP 503 fallback. Unit tests pass, but live readiness could not complete against the intermittent local database. |
| Graceful shutdown | **CONDITIONALLY READY** | Nest shutdown hooks and worker active-tick drain are implemented and tested. A live `SIGTERM` smoke could not run because application startup failed on database connectivity. |
| Docker artifact | **READY** | `steeltrack-backend:rfc015` exists, is 190,199,243 bytes, runs as `node`, uses `tini` and has a liveness healthcheck. Compose config validation passes. |
| Data scalability | **CONDITIONALLY READY** | Bounded/keyset reads and additive indexes are prepared; 100M/1B-row latency, replay, archive and restore claims are not certified. |
| Observability | **CONDITIONALLY READY** | Runtime metrics, Operations Center, correlation IDs and safe structured errors exist. External alerting, log/metric shipping and SLO paging are not demonstrated. |
| Build and regression | **READY** | Backend and frontend builds pass; backend regression passes 70/70 suites and 185/185 tests; Prisma schema validates. |

## Release Blockers

### P0 - Authorization

Apply and verify a deny-by-default authentication/permission policy for every
business route. At minimum, secure all Inventory, QC and Projects mutations and
remove or explicitly authorize duplicate compatibility controllers. Run
anonymous/role-matrix API tests before certification rerun.

### P0 - Claimed Work Recovery

Implement owner-checked heartbeat/lease expiry and safe reclaim for stale
Background Jobs and Outbox rows. Prove no duplicate execution under process
kill, pause, retry and competing-worker tests.

### P0 - Migration Gate

Validate the pending RFC013 index migration on a production-size clone. Capture
lock duration, blocked writes, WAL volume, execution time and rollback/abort
criteria before `prisma migrate deploy` is approved.

## Conditional Operational Gates

1. Run image startup, readiness and `SIGTERM` drain against stable staging
   PostgreSQL with the intended worker topology.
2. Run complete operator workflows for all seven bounded contexts, including
   duplicate request and stale-version cases.
3. Run production-volume replay, queue crash recovery, load, archive and restore
   drills with measured SLOs.
4. Integrate target-platform TLS, secret rotation, immutable registry tags,
   signing/SBOM, centralized logs/metrics and alerts.

## Verification Evidence

- Backend build: **PASS**
- Frontend build: **PASS** (existing Vite environment/chunk warnings remain)
- Backend regression: **PASS**, 70/70 suites and 185/185 tests
- Prisma validate: **PASS**
- Migration status: **FAIL**, one of 77 migrations pending
- Compose validation: **PASS**
- Docker image metadata: **PASS**, non-root plus healthcheck
- Live startup/readiness/shutdown smoke: **BLOCKED**, local PostgreSQL became unavailable during startup
- `git diff --check`: **PASS** after certification documentation
- Application/schema/frontend changes in RFC016: **NONE**
- Commit/stage: **NONE**

## Final Result

**ENTERPRISE PRODUCTION CERTIFICATION: NOT READY**

The architecture and test baseline are credible, but production certification
cannot be granted while unauthenticated business mutations exist and claimed
background work can be stranded after a crash. Resolve all P0 gates and rerun
RFC016 against a stable production-like environment.
