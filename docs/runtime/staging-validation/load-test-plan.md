# Enterprise Load-test Plan

## Safety And Test Data

Run only on isolated staging with sanitized/generated records and disabled
external side effects. Use a dedicated tenant/data prefix, operator account and
correlation prefix equal to the Validation ID. Never point the load generator at
production. Capture a backup before write scenarios and define cleanup through
business APIs or restore, not ad hoc table deletion.

No load-test framework is added by RFC018. Use the organization's approved
generator. Parameterize it with:

```text
BASE_URL, ACCESS_TOKEN, VALIDATION_ID, SCENARIO, VUS, DURATION,
FIXTURE_DIRECTORY, RESULTS_DIRECTORY
```

Fixture JSON must already pass the current API validators. Canonical commands
must send unique `Idempotency-Key`, `X-Correlation-Id` and `X-Causation-Id`.
Replays intentionally reuse the same idempotency key and identical body.

Generic request template:

```bash
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $VALIDATION_ID-$SCENARIO-$SEQUENCE" \
  -H "X-Correlation-Id: $VALIDATION_ID-$SCENARIO" \
  --data-binary "@$FIXTURE_DIRECTORY/request-$SEQUENCE.json" \
  "$BASE_URL/<validated-route>"
```

## Stages

| Stage | Shape | Purpose |
| --- | --- | --- |
| Smoke | 1 user, 5 minutes | Contract/auth/fixture validation |
| Baseline | Expected average, 15 minutes | Establish normal latency/resource use |
| Ramp | 25/50/75/100% target | Find nonlinear saturation |
| Sustained | 100% target, at least 60 minutes | Queue and memory stability |
| Spike | Approved peak, 10 minutes | Backpressure and recovery |
| Soak | Expected average, 8-24 hours | Leak, bloat, WAL and lag growth |
| Recovery | Stop writes, continue reads | Measure Outbox/projection drain time |

Advance only when the previous stage meets its gate. Abort on data invariant
failure, unauthorized access, duplicate mutation, sustained 5xx growth,
unbounded queue/lag, memory growth without recovery, disk safety reserve breach
or database failover risk.

## Workload Mix

### Inventory

- Create multi-line IMPORT/EXPORT/TRANSFER/ADJUSTMENT transactions through
  `POST /inventory/transactions` using valid warehouse/location fixtures.
- Mix 1, 10, 50 and 100 items per transaction, including repeated stock buckets.
- Read bounded materials, locations, transaction history and detail concurrently.
- Verify transaction/header-line atomicity, location balances, no negative stock
  outside approved rules, Outbox cardinality and idempotent duplicate requests.

### Production

- Create/release/ready/start/pause/resume/complete/close canonical orders through
  `/production/commands` with expected versions.
- Mix Work Order lifecycle, material issue/return and read-model queries.
- Inject stale expected versions and duplicate idempotency keys as negative load.
- Verify no duplicate timeline/Outbox, Inventory posting ownership and eventual
  Production projections.

### QC

- Create/start/result/issue/complete/approve or reject inspections using current
  `/qc` contracts and valid linked entities.
- Mix pass/fail/NCR paths and workspace/history reads.
- Verify an inspection cannot complete twice and KPI/projection lag converges.

### Logistics

- Create dispatch orders, then loading/depart/arrive/receive/complete through
  `/logistics/dispatch-orders` with Yard-ready fixtures.
- Include cancellation and duplicate transition attempts.
- Verify one lifecycle transition, no direct Inventory balance mutation and
  consistent shipment timeline/projection facts.

### Projects

- Create/update projects, generate/bulk-update WBS, add site updates and exercise
  component return only with valid ownership fixtures.
- Mix detail tabs, WBS and projection Query API reads.
- Verify project progress/allocation consistency and no cross-domain writes.

## Read And Dashboard Load

Exercise cursor/no-count projection lists for high-volume reads:

```text
GET /query-api/projections
GET /query-api/projections/health
GET /query-api/projections/<name>?limit=100&withTotal=false&cursor=<opaque>
GET /query-api/modules/<module>/<view>?limit=100&withTotal=false
GET /operations-center/overview
GET /performance/metrics
```

Do not use deep offset/exact-count paths as the high-volume benchmark unless the
test explicitly measures compatibility cost.

## Measurements And Initial Gates

The endpoint budgets already instrumented by SteelTrack are the first-pass
targets, not contractual SLOs: lookup 80 ms, detail 120 ms, dashboard 150 ms,
default 200 ms, search 300 ms and report 1000 ms. Record p50/p95/p99 separately;
the release owner must approve final SLOs before execution.

| Signal | Required evidence | Pass direction |
| --- | --- | --- |
| API latency/errors | Per route/class p50/p95/p99 and status | Within approved SLO; no unexplained 5xx |
| Database latency | Query p50/p95/p99, locks, pool wait | Stable; no sustained lock/pool saturation |
| Replay throughput | scanned/matched events per second | Stable and repeatable |
| Outbox throughput | claimed/dispatched/failed per second, oldest age | Dispatch >= ingress after ramp |
| Projection lag | lag per projection, failures | Returns to approved bound; failures zero |
| Worker utilization | busy time, claims, renewals, reclaim count | Bounded; no ownership conflict |
| CPU/memory | host/container percent, RSS/heap | No monotonic leak or sustained saturation |
| Disk IOPS | latency, throughput, queue depth, free space | Within storage budget/reserve |
| WAL | bytes/time and replica lag | Within retention/RPO capacity |

Application evidence comes from `/performance/metrics`, `/operations-center/overview`,
`/query-api/projections/health` and `/jobs`. Database/host/container/WAL metrics
must come from the staging monitoring platform; SteelTrack does not currently
persist all of them.

## Report

For every stage record fixture version, users/rate, actual throughput, latency,
errors, database/resource graphs, queue/lag recovery time, invariant results and
abort events. Averages alone are insufficient. Keep raw generator output and
correlation IDs for the slowest/error samples.

