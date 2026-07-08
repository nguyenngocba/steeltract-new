# EPIC115 - Project Runtime Metrics Report

Date: 2026-07-08

## Metrics Added

Runtime metrics now expose Project-specific counters:

- `projectSnapshotHit`
- `projectSnapshotMiss`
- `projectReadModelHit`
- `projectFallbackCount`

These are available through the existing runtime metrics snapshot and Operations Center overview payload.

## Operations Center

`GET /operations-center/overview` now includes an additive `projects` platform-health section:

- repository health
- read model health
- snapshot health
- event/outbox health
- background job health
- runtime tracking state
- project/task/template counts

No UI contract or existing response fields were removed.

## Runtime Notes

Project snapshot lag and age still use the shared snapshot lag/age samples because the Core Platform metrics service tracks these as a global snapshot stream. The new Project-specific hit/miss/fallback counters allow Project health to be separated from Inventory and Logistics.

