# Runtime Recommendation Report

Date: 2026-07-07

Scope: EPIC 103 – Runtime Analytics Foundation.

## Rule-Based Recommendation Engine

No AI or machine learning was added.

Recommendations are produced from simple runtime rules:

### High SQL Count

If an endpoint has high average SQL count:

Recommendation:

* batch queries
* preload data through repositories
* move cockpit endpoint to a read model

### Latency Spike

If p95 latency is much higher than average:

Recommendation:

* inspect slow queries
* inspect payload size
* review endpoint branch behavior

### Duplicate Lookup

If the same model/action executes frequently in a window:

Recommendation:

* request-level cache
* batching
* repository preloading

### Low Read Model Effectiveness

If read model/cache reuse is low:

Recommendation:

* increase snapshot coverage
* route cockpit endpoints through existing read models
* verify cache TTL is useful for real operator usage

## Output

Available in:

* `/performance/metrics`
  * `analytics.windows['5m'].recommendations`
  * `analytics.windows['1h'].recommendations`
  * `analytics.windows['24h'].recommendations`

## Behavior

Recommendations do not:

* fail requests
* change workflow
* mutate business data
* create tasks automatically

They are diagnostic only.

