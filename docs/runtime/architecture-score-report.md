# Architecture Score Report

Date: 2026-07-07

Scope: EPIC 103 – Runtime Analytics Foundation.

## Goal

Expose a runtime architecture score that indicates whether a module is moving toward enterprise-scale readiness.

## Current Score Inputs

Runtime-measured:

* query budget status
* average SQL count
* read model/cache signal
* N+1/duplicate-query signal

Not runtime-measured yet:

* repository coverage
* persisted read model coverage
* index coverage
* partition readiness

These remain documented in:

* `docs/audit/epic-100-repository-layer-audit.md`
* `docs/audit/enterprise-query-audit.md`
* `docs/audit/enterprise-index-audit.md`
* `docs/architecture/data-growth-5-year-plan.md`

## Output

Available in:

* `/performance/metrics`
  * `analytics.windows['5m'].architectureScore`
  * `analytics.windows['1h'].architectureScore`
  * `analytics.windows['24h'].architectureScore`

Each module row includes:

* score
* repositoryCoverage
* readModelCoverage
* queryBudget
* nPlusOneStatus

## Interpretation

High score means:

* observed requests are within query budget
* no strong runtime N+1 signal
* read model/cache reuse is observed

Low score means:

* budget exceeded
* high SQL count
* weak/no read-model signal

## Future Work

To make architecture score stricter:

* combine runtime analytics with static repository coverage reports
* integrate index audit findings
* persist metrics across 7/30/90-day windows
* score snapshot freshness and fallback rates

