# EPIC163 - Yard Snapshot Foundation

## Result

**Status: APPROVED, MIGRATION PENDING DEPLOYMENT**

Yard now inherits the shared Snapshot Engine used by Inventory, Production,
Components and QC. Two additive domain snapshots were introduced:

- `YardDashboardSnapshot`: global daily KPI/analytics summary.
- `YardWorkspaceSnapshot`: reusable global/per-zone layout and capacity summary.

The existing operator-generated `YardSnapshot` remains unchanged as a manual
layout audit artifact. It is not reused as a Core Platform snapshot because its
workflow and payload semantics differ.

## Architecture

`Yard Outbox -> Event Publisher -> Event Consumer -> SnapshotUpdateDispatcher -> Background Job -> SnapshotWriterService -> YardSnapshotRepository`

No snapshot is written in a Yard HTTP transaction. No fake rows or backfill were
created. The additive migration is generated and validated but intentionally
not deployed in this sprint.

Workspace operator routes remain on `YardReadModelRepository` under ADR011.

