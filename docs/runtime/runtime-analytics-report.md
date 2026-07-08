# Runtime Analytics Report

Date: 2026-07-07

Scope: EPIC 103 – Runtime Analytics Foundation.

## Mission

SteelTrack now aggregates runtime instrumentation into in-memory analytics so future optimization can be driven by observed data instead of assumptions.

No UI, workflow, business logic, Prisma schema, migration, or public business API contract was changed.

## Runtime Analytics Aggregator

Implemented in:

* `apps/backend-api/src/core/performance/performance-metrics.service.ts`
* `apps/backend-api/src/core/performance/runtime-analytics.service.ts`

The aggregator reads the existing RT.1 metrics stream and computes sliding-window analytics.

Windows:

* 5 minutes
* 1 hour
* 24 hours

Metrics per window:

* request count
* endpoint rankings
* average latency
* p95 latency
* p99 latency
* max latency
* average SQL count
* average SQL time
* slow query count
* average memory delta
* query rankings
* read model effectiveness
* performance score by module
* architecture score by module
* rule-based recommendations

## Runtime Data Source

Input comes from:

* HTTP request interceptor
* Prisma query profiler
* query budget warnings
* slow query detector
* cache hit counters
* read model hit counters

No runtime analytics are persisted yet.

## Access

Runtime analytics are included under:

* `GET /performance/metrics`
  * `analytics.windows['5m']`
  * `analytics.windows['1h']`
  * `analytics.windows['24h']`
  * `analytics.topSlowEndpoints`
  * `analytics.topQueries`
  * `analytics.runtimeTrend`

No new UI was added.

## Trend Limitation

7-day, 30-day, and 90-day trend answers require persisted runtime metrics.

Current EPIC103 behavior:

* 24-hour in-memory trend is available.
* 7-day, 30-day, and 90-day trend fields explicitly return `available: false`.
* The reason states that persisted metrics are required.

This avoids fabricating trend data from incomplete process memory.

