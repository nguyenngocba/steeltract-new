# Runtime Metrics Report

Date: 2026-07-07

Scope: EPIC 102 / Sprint RT.1.

## What Was Added

SteelTrack now has a backend runtime metrics foundation built into the existing `core/performance` module.

Implemented:

* Global NestJS HTTP interceptor registered with `APP_INTERCEPTOR`.
* Request-level metrics stored in process memory.
* Prisma query event profiling.
* Query budget warning capture.
* Slow query detector.
* Runtime health snapshot service.

No UI, workflow, DTO, API contract, business logic, Prisma schema, or migration changes were made.

## Request Metrics Captured

Each HTTP request records:

* endpoint
* HTTP method
* status code
* total request duration
* Prisma query count
* SQL total duration
* longest SQL duration
* longest query identity when inferable
* heap memory delta
* peak heap used during request boundary
* response size from `content-length` when available
* timestamp
* query budget class
* query budget threshold
* budget exceeded marker
* duplicate query warning candidates

## Implementation Files

* `apps/backend-api/src/core/performance/runtime-metrics.interceptor.ts`
* `apps/backend-api/src/core/performance/performance-metrics.service.ts`
* `apps/backend-api/src/core/performance/query-budget.ts`
* `apps/backend-api/src/core/performance/runtime-health.service.ts`
* `apps/backend-api/src/core/prisma/prisma.service.ts`

## Current Metrics Access

Existing route remains:

* `GET /performance/metrics`

The response now includes:

* runtime request counters
* recent request metrics
* slow query counters
* query budget warnings
* duplicate query warnings
* memory peak
* read model hit count
* cache hit count
* existing websocket metrics
* existing cache stats

Existing route remains:

* `GET /performance/health`

This route now includes a runtime snapshot under `runtime`.

## Sensitive Data Policy

The profiler does not log:

* raw SQL
* SQL parameters
* request body
* auth token
* user payload

Slow query logs contain only:

* endpoint
* method
* inferred model/table
* inferred action
* elapsed time
* timestamp

## Known Limitations

* Prisma query events expose SQL duration and target, but not Prisma model/action directly. The current implementation infers model/action from sanitized SQL shape.
* Response size is captured from `content-length` when available; streamed/compressed responses may not expose it.
* Peak memory is measured at request start/end boundary, not with continuous in-request sampling.
* Metrics are process-local and reset when the backend process restarts.
* Multi-instance deployments need a central metrics sink later.

