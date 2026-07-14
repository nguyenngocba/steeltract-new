# EPIC162 - Yard Server Aggregation Report

## Migrated Aggregations

- total, occupied and available slots;
- active placements and total weight;
- movement totals by PLACE/MOVE/REMOVE/ADJUST;
- movement totals for the current day;
- 30-day movement trend from persisted movement dates;
- overloaded/warning zone counts and zone utilization;
- available crane count;
- top component distribution;
- movement history total and page metadata;
- actual QC queue status from `qc_inspections`.

Frontend cards and charts bind these fields directly. They no longer derive
business totals from the first 12 movement rows or an unbounded slot payload.

No synthetic point is inserted when history is empty. Trend is an empty array,
and existing empty presentation is used.

## Query Safety

All list payloads are bounded. Slot and movement ordering is stable; movement
ordering uses `createdAt DESC, id DESC`. No query loop or per-row database query
was introduced. QC inspections are fetched once for the visible Component IDs.

No scalability claim beyond these structural controls is made without load
benchmarking.

