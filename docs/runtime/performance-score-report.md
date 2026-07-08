# Performance Score Report

Date: 2026-07-07

Scope: EPIC 103 – Runtime Analytics Foundation.

## Goal

Score each module from observed runtime signals so SteelTrack can track whether performance improves from sprint to sprint.

## Score Inputs

Current score uses:

* average endpoint latency
* average Prisma query count
* slow query request count
* query budget exceeded count

The score is intentionally simple and rule-based.

## Current Modules

The runtime scorer classifies endpoints into:

* Inventory
* Projects
* Logistics
* Dashboard
* Production
* Yard
* QC
* Components
* Suppliers
* System

Classification is based on endpoint path.

## Output

Available in:

* `/performance/metrics`
  * `analytics.windows['5m'].performanceScore`
  * `analytics.windows['1h'].performanceScore`
  * `analytics.windows['24h'].performanceScore`

Each row includes:

* module
* score
* request count
* average latency
* average SQL count
* slow query request count
* budget exceeded count

## Current Limitation

Scores are meaningful only after representative traffic has exercised the target module.

No fake baseline values are generated.

