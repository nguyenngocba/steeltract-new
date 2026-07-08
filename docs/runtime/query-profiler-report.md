# Query Profiler Report

Date: 2026-07-07

Scope: EPIC 102 / Sprint RT.1.

## Profiler Strategy

The backend `PrismaService` now creates Prisma Client with query event logging:

* `log: [{ emit: 'event', level: 'query' }]`

On every Prisma query event, the runtime metrics service records:

* elapsed duration
* inferred model/table
* inferred action
* Prisma target
* associated request context when available

## Query Identity

Prisma query events provide SQL text, params, duration, and target. To avoid sensitive logging, SteelTrack does not persist SQL or params.

The profiler infers:

* action from the SQL verb: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
* model/table from the first safe table token in `FROM`, `INTO`, or `UPDATE`

This is enough for runtime triage:

* which endpoint is slow
* which table/action is slow
* how many queries happened
* which request exceeded budget

## Budget Behavior

If a single query exceeds the request's budget threshold:

* a warning is recorded in runtime metrics
* backend logger emits a warning
* request behavior is not changed
* request does not fail

## Query Budget Values

Configured in `apps/backend-api/src/core/performance/query-budget.ts`:

* Dashboard: 150 ms
* Detail: 120 ms
* Lookup: 80 ms
* Search: 300 ms
* Report: 1000 ms
* Default: 200 ms

## Runtime N+1 Heuristic

The runtime foundation tracks duplicate query identities per request.

Current heuristic:

* same `model.action` >= 10 times: MEDIUM warning
* same `model.action` >= 25 times: HIGH warning

This does not prove N+1 by itself, but it gives a live signal for endpoints that need batching/read-model review.

## Known Limitations

* It is a runtime detector, not static code analysis.
* It does not inspect stack traces or raw SQL.
* It intentionally does not block requests.
* It should be combined with the EPIC 101 static audit reports for remediation planning.

