# EPIC173 Dashboard Snapshot Cutover Report

Date: 2026-07-13

Status: **APPROVED**

## Cutover

Three additive endpoints now expose the existing shared Dashboard Reader:

| Module | Dashboard endpoint | Primary source | Fallback |
|---|---|---|---|
| Components | `GET /components/dashboard` | `ComponentDashboardSnapshot` | Component snapshot repository calculation |
| QC | `GET /qc/dashboard` | `QcDashboardSnapshot` | QC snapshot repository calculation |
| Yard | `GET /yard/dashboard` | `YardDashboardSnapshot` | Yard repository live read model |

Each service already uses `DashboardReaderService`. A fresh enabled snapshot is
returned with `source=snapshot`. Disabled, missing, stale or parity-mismatched
snapshots return `source=runtime`; missing/stale reads enqueue the existing
background snapshot update. No Snapshot Engine behavior was changed.

## UI Boundary

Presentation was not redesigned. Existing pages now bind dashboard KPI and
analytics to the additive dashboard endpoints. Embedded tables, filters, maps,
inspection queues and operator actions remain repository live workspace reads.
Snapshot payloads without a historical/profile analytic field render the
existing empty state rather than silently using another dashboard aggregation.

## Compatibility

- Existing workspace and legacy endpoints remain unchanged.
- No API response was removed or changed.
- No schema, migration, backfill or fake data was introduced.
- Inventory, Production, Logistics, Runtime, Feature Flags and Operations Center
  were not modified.

## Verification

- Snapshot/controller focused suites: 6 suites, 8 tests PASS.
- Backend build: PASS.
- Frontend build: PASS.
- `git diff --check`: PASS.
