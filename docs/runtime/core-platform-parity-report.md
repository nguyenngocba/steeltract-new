# Core Platform Parity Report

## EPIC174 Certification Rerun

Status: **PASS - CORE PLATFORM v1.0 CERTIFIED**

## Shared Pattern Parity

| Pattern | Inventory | Components | Production | QC | Yard |
| --- | --- | --- | --- | --- | --- |
| Service -> Repository -> Prisma | PASS | PASS | PASS | PASS | PASS |
| Workspace live read model | PASS | PASS | PASS | PASS | PASS |
| Dashboard snapshot-first | PASS | PASS | PASS | PASS | PASS |
| Shared Snapshot Reader/Writer | PASS | PASS | PASS | PASS | PASS |
| Shared dispatcher | PASS | PASS | PASS | PASS | PASS |
| Module runtime counters | PASS | PASS | PASS | PASS | PASS |
| Operations Center health | PASS | PASS | PASS | PASS | PASS |
| Central feature flag | PASS | PASS | PASS | PASS | PASS |
| Atomic command Outbox | PASS | PASS | PASS | PASS | PASS |
| Audit/activity atomicity | PASS | PASS | PASS | PASS | PASS |

## Metric Naming

Components, Production, QC and Yard follow the same module prefix:

`<module>SnapshotHit`, `<module>SnapshotMiss`, `<module>ReadModelHit`,
`<module>FallbackCount`, `<module>AverageAgeSeconds`,
`<module>AverageLagMs`.

Inventory now exposes `inventorySnapshotHit/Miss`, `inventoryReadModelHit`,
`inventoryFallbackCount`, `inventoryAverageAgeSeconds` and
`inventoryAverageLagMs`. Existing granular material/location counters remain
compatible.

## Feature Flags

Central mapping is consistent:

- `USE_INVENTORY_SNAPSHOT`
- `USE_COMPONENTS_SNAPSHOT`
- `USE_PRODUCTION_SNAPSHOT`
- `USE_QC_SNAPSHOT`
- `USE_YARD_SNAPSHOT`

All use the same default-enabled and max-age semantics through
`SnapshotFeatureFlagService`.
