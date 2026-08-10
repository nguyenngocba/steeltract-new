# SYSTEM.RUNTIME.1 Production Runtime & Browser Certification

Date: 2026-08-10

## Certification Result

| Area | Result | Evidence |
| --- | --- | --- |
| Backend runtime | GREEN | Dedicated process on `127.0.0.1:3100`; 73-call REST fixture completed |
| Frontend runtime | GREEN | Vite/Playwright loaded 17 operational routes |
| PostgreSQL | GREEN | PostgreSQL 17.10; Prisma schema valid; 90 migrations up to date |
| Authentication | GREEN | Real login, refresh rotation, expired/reused token rejection |
| RBAC | GREEN | 8 personas, 54/54 checks, explicit 401/403/200 evidence |
| Canonical REST workflow | GREEN | Forward lifecycle plus reverse Logistics and Production stock return |
| Database/API parity | GREEN | 15/15 read-only DB assertions |
| Dashboard/read-model parity | YELLOW | All dashboards changed, but Yard snapshot logged five parity mismatches |
| Browser rendering | GREEN | One Playwright scenario, 17 screenshots, no runtime/HTTP errors |
| Browser mutation workflow | NOT CERTIFIED | Receipt through reverse flow was REST-certified, not clicked end to end |
| V1 RC1 | NO-GO | Browser mutations, deployment probes and Yard parity remain incomplete |

## Environment

- Node.js `v22.22.3`; pnpm `11.1.3`.
- Backend: NestJS certification process on port `3100`, using a runtime-only
  random JWT secret.
- Frontend: Vite on port `4173`, configured by Playwright to call port `3100`.
- Database: local PostgreSQL `17.10`, database `steeltrack`, schema `public`.
- Browser: Playwright `1.61.0`, Chromium.
- Runtime evidence files are permission-restricted under `/tmp`; passwords and
  JWT secrets are not written to repository documentation.

The repository has no conventional `/health`, readiness or liveness endpoint;
`GET /health` returned 404. Business APIs and authenticated cockpit reads were
used to prove application availability. A deployment probe contract remains an
operational gap.

## Accounts and Bootstrap

The insecure bootstrap behavior was removed:

- Seed no longer resets `admin` to `123`.
- Creating a missing administrator requires
  `STEELTRACK_BOOTSTRAP_ADMIN_PASSWORD` with at least 12 characters and upper,
  lower, digit and symbol classes.
- Existing credentials are preserved unless an explicit secure rotation value
  is supplied.
- The login form no longer pre-fills `admin/123`.

Runtime users were created through authenticated System APIs with random strong
passwords and canonical roles/permissions:

1. System Administrator
2. Inventory
3. Production Planner
4. Production Operator
5. QC Inspector
6. Warehouse
7. Logistics
8. Project Manager

Credentials are stored only in `/tmp/runtime1-user-credentials.json` with mode
`0600`. Stale runtime fixture users were blocked before the successful run.

## Browser

Playwright logged in with a real JWT, loaded and screenshotted:

- Executive Dashboard
- Inventory, Inbound and Transfer
- Components definitions and Finished Goods
- Production, Orders and Execution
- QC and Final QC
- Yard and Yard Components
- Logistics and Dispatch
- Projects

Result: one test passed in 48.752 seconds; 17 screenshots were retained under
`test-results/runtime1/`. The harness failed on console exceptions, page
exceptions, request failures or HTTP responses `>= 400`; none occurred in the
final run. Logout was exercised when the control was available.

Runtime blockers found and fixed during browser execution:

- React emitted an invalid `<colgroup>` whitespace warning because JSX comments
  created text nodes. Comments were removed without changing table layout.
- Components Finished Goods and Yard picker requested `limit=200` while the
  canonical API maximum is 100, producing hidden HTTP 400 responses. Both
  callers now use 100.
- Vitest initially collected Playwright specs. `e2e/**` is now excluded from
  Vitest and owned only by Playwright.

Limitation: the browser test certifies authentication, rendering, API loading
and logout. It does not automate every mutation from Receipt through Reverse
Flow. Those mutations are certified through REST only, so the mandatory full
browser business workflow is not yet proven.

## REST Workflow

Retained final fixture: `SYSTEM-RUNTIME1-1786339882640`.

The harness performed 73 authenticated calls and 13 assertions with zero
failures:

`Receipt -> Transfer to Production -> Project -> Component Requirement ->
Revision/BOM -> Engineering Release -> Production Order -> Reservation ->
Issue -> Execution -> Consumption -> Production Completion -> QC PASS ->
Finished Goods -> Yard -> Dispatch -> Delivery -> Installation -> Return to
Yard quarantine -> Return unused Production material to MAIN`.

Important outcomes:

- Exact receipt replay returned the original transaction.
- Same idempotency key with a different payload returned HTTP 409.
- Quantity one generated exactly one physical `ComponentInstance`.
- ProductionOrder, WorkOrder and ProductionExecution reached `COMPLETED`.
- FINAL checklist/result and canonical QC decision reached `PASSED`.
- QC PASS exposed the physical instance through Finished Goods.
- Dispatch closed the original Yard placement before taking custody.
- Delivery and completion moved the instance through Delivered and Installed.
- Reverse Logistics returned it to a new active Yard placement in
  `PRODUCED_WAITING_QC`, preventing immediate reuse without QC.
- Unused Production material was returned to MAIN through an Inventory
  transaction.

## RBAC and Security

The identity harness recorded 54 passing checks:

- No-token mutation: 401.
- Each operational role: its allowed read returned 200.
- Each operational role: an unrelated protected read returned 403.
- Refresh token rotation: 201.
- Reuse of the rotated refresh token: 401.
- Refreshed access token: 200.
- Disabled user login: 401; re-enabled user restored afterward.
- Cryptographically valid but expired JWT: 401.

No default insecure credential was added.

## Database and Read Models

The DB harness is read-only. It imports Prisma solely for `findUnique` and
`findMany`; it performs no mutation or raw write.

All 15 assertions passed:

- REST material ID exists in DB.
- `InventoryItem.quantity = 95`.
- Sum of `InventoryLocationStock.quantity = 95`.
- Requirement links the correct Project and Component definition.
- One requirement links one ProductionOrder and one ComponentInstance.
- ProductionOrder points to the canonical requirement.
- WorkOrder and ProductionExecution are completed.
- Instance execution is completed.
- Instance links the FINAL inspection.
- QC inspection/result are passed.
- DispatchItem points to ComponentInstance, not Component definition.
- Original Yard placement has `removedAt`.
- Returned instance has one new active Yard placement.
- Reverse state is `PRODUCED_WAITING_QC`.
- Related ActivityLog records exist.

Inventory conservation is PASS: receipt 100 minus production consumption 5
equals 95; transaction movement, denormalized item quantity and location stock
agree.

## Dashboard

Baseline and final JSON differed for every dashboard checked:

- Inventory overview: changed.
- Production cockpit: changed.
- QC workspace: changed.
- Yard dashboard: changed.
- Logistics dashboard: changed.
- Executive cockpit: changed.

The Project execution read model returned the retained Project lineage.
However, the backend logged:

`Snapshot parity warning yard/YardDashboardSnapshot: 5 mismatch(es)`.

The endpoint remained available and changed after the workflow, but snapshot
and live Yard sources were not fully equal. Dashboard certification is
therefore PARTIAL, not GREEN. This proves response deltas and core lineage, not
pixel-level or snapshot-level correctness of every KPI/chart.

## ActivityLog

The final workflow produced 44 activity records in its execution window and 24
records directly linked by fixture entity IDs. Covered actions include:

- Inventory posting and idempotency conflict
- Component revision/BOM validation, review, approval and release
- Production order/work-order/execution lifecycle
- Material reservation, issue and consumption
- Production completion/finalization
- QC inspection/result/completion
- Yard placement and dispatch release
- Dispatch create/depart/receive/install
- Return request/depart/Yard receipt

The production module uses the shared ActivityLog plus its operational
ProductionLog/timeline. No duplicate receipt posting was created by exact
idempotent replay.

## Performance

- Maximum REST latency in the final workflow: 363.30 ms.
- Calls at or above 500 ms: zero.
- Final fixture background INSERT latency reached approximately 3.16 seconds;
  all certification attempts contained a maximum around 4.59 seconds in
  `docs/runtime/slow-query.log`.
- Production cockpit payload: approximately 335-338 KB.
- System ActivityLog payload: approximately 218 KB.
- Inventory zones payload: approximately 143 KB.
- Executive cockpit payload: approximately 53 KB.

No runtime timeout or browser request failure occurred. Hotspots to address
before larger production volume:

1. Production cockpit returns deeply nested payloads around 338 KB.
2. `/system/activity-logs` is an oversized broad read for certification and
   needs a bounded/paginated query contract.
3. Zone and Yard slot reads return large collections.
4. Frontend build still warns about the approximately 964 KB React Three chunk.
5. Snapshot processing logged one lease-loss warning during shutdown/rebuild;
   no API failure resulted, but worker recovery should be observed under load.

No broad performance refactor was made in this sprint.

## Verification

- Prisma validate: PASS.
- Prisma generate: PASS.
- Prisma migrate status: PASS, 90 migrations, database up to date.
- Backend tests: PASS, 92 suites / 308 tests.
- Frontend tests: PASS, 2 files / 4 tests.
- Playwright: PASS, 1 test / 17 operational screenshots.
- Backend build: PASS.
- Frontend build: PASS.
- `git diff --check`: PASS.
- Staged files: none at report creation.

The error logs printed by two backend worker tests are expected failure/lease
recovery scenarios; Jest reported all tests passing.

## Remaining Blockers

### P0

1. Automate the entire mutation workflow through browser controls. Current
   browser evidence proves login/render/logout only.
2. Add/certify a deployment health/readiness/liveness contract; `/health` is
   not registered.
3. Resolve and replay the five Yard dashboard snapshot parity mismatches, then
   re-certify the Yard and Executive read models.

### P1

1. Certify the remaining reverse branches in one fresh runtime pass: supplier
   return, QC FAIL/rework/re-QC, scrap and installed-component removal.
2. Add a supported fixture cleanup/archive process. Failed harness iterations
   created partial `SYSTEM-RUNTIME1-*` records through public APIs; direct DB
   cleanup was intentionally prohibited.
3. Bound large cockpit, ActivityLog, zone and Yard payloads.

## Final Answers

1. **Browser as a real user:** PARTIAL. Login, 17 workspaces and logout are
   proven; full browser mutation workflow is not.
2. **Complete REST operation:** YES for the retained forward workflow plus
   Logistics and Production-stock reverse path.
3. **Dashboard runtime reflection:** PARTIAL. All six compared reads changed,
   but Yard snapshot/live parity logged five mismatches.
4. **ActivityLog completeness:** YES for the certified path, with 44 records in
   the workflow window; remaining reverse branches were not executed.
5. **Database correctness:** YES for the retained fixture; 15/15 assertions and
   inventory conservation passed.
6. **API correctness:** YES for the certified contracts; 73 calls completed and
   idempotency/RBAC error contracts behaved correctly.
7. **Read-model correctness:** PARTIAL. Direct DB/API lineage passed, but Yard
   snapshot parity did not.
8. **RBAC correctness:** YES for the tested matrix; 54/54 checks passed.
9. **Remaining production blocker:** YES. Full browser workflow, deployment
   probes and Yard snapshot parity are not certified.
10. **SteelTrack V1 RC1 release:** **NO-GO** until all P0 items are closed.
