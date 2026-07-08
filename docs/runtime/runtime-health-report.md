# Runtime Health Report

Date: 2026-07-07

Scope: EPIC 102 / Sprint RT.1.

## RuntimeHealthService

Added:

* `RuntimeHealthService`

Purpose:

* expose a consolidated runtime snapshot from `PerformanceMetricsService`
* keep health/status consumers away from low-level metric mutation APIs

## Health Signals

The runtime snapshot currently tracks:

* uptime
* request count
* average response time
* slow request count
* slow query count
* recent slow queries
* recent query budget warnings
* duplicate-query/N+1 candidates
* read model hits
* cache hits
* memory RSS
* heap used
* heap total
* peak heap used
* websocket emitted/dropped/deduped counters

## Read Model / Cache Metrics

Instrumented:

* `DashboardInventoryReadModelService` records a read-model hit when its 30-second snapshot cache is reused.
* `CacheService` records a cache hit when an unexpired in-memory cache entry is returned.

This starts answering whether foundation read models are reducing repeated live aggregation.

## Runtime Access

Current routes:

* `GET /performance/health`
* `GET /performance/metrics`

No new public workflow API was introduced.

## Production Notes

Metrics are process-local.

For multi-instance deployment, route the same metric events to:

* OpenTelemetry
* Prometheus
* structured logs
* or a central metrics collector

No external dependency was added in this sprint.

