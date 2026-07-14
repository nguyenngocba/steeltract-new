# EPIC160 - Yard Operations Center Readiness

Operations Center currently has no Yard Platform Health section and its global
snapshot list contains Inventory, Projects, Dispatch, Production, Components and
QC only.

Missing Yard signals:

- repository boundary status;
- live read-model hit/fallback;
- snapshot count, freshness, hit/miss, age and lag;
- `USE_YARD_SNAPSHOT` state;
- `yard.*` Outbox pending/failed counts;
- Yard snapshot job active/failed counts;
- event routing coverage;
- snapshot parity result.

**Assessment: 0%, NOT READY.** Integration should occur only after EPIC161-163
establish atomic events, bounded live read models and Core Snapshot Foundation.
No new Operations Center UI is required.

