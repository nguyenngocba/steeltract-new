# Performance Readiness Report

Date: 2026-06-29

## Current Strengths

- Many Prisma models have useful indexes on status, date, and relationship fields.
- Frontend uses lazy routes and TanStack Query.
- Shared cockpit pages generally use `useMemo` for frontend aggregation.
- Critical operational tables have core indexes:
  - Inventory transaction type/date/warehouse/zone/project.
  - Inventory location stock item and bucket.
  - Production order status/project/component/bom/current stage.
  - Production material reservation/ledger indexes.
  - Yard slot/placement/movement indexes.
  - QC inspection/result/issue/NCR indexes.
  - Workflow and attachment indexes.

## Current Risks

- Large dashboards still aggregate on demand in backend services.
- Some module pages fetch broad arrays then filter/reduce in React.
- Polling every 4-10 seconds multiplies query load.
- Logistics uses frontend static data, so future real data may expose performance gaps suddenly.
- Read models/snapshots exist in schema, but not every dashboard metric uses persisted rollups.

## 1M Row Scenario

Likely stable if:

- Queries remain bounded by recent date windows.
- Transaction lists are paginated.
- Dashboard queries avoid full-table scans.

Risks:

- Frontend reductions over full module arrays become noticeable.
- Dashboard activity aggregation across modules may slow if not bounded.

## 5M Row Scenario

Required:

- Server-side pagination and filters for all operational grids.
- Composite indexes matching dashboard query predicates.
- Persisted daily/monthly inventory movement summaries.
- Persisted production readiness/cost summaries.
- Persisted Yard occupancy snapshots.

Without this, dashboard and transaction history pages will become slow.

## 10M Row Scenario

Required:

- Read-model tables or materialized views.
- Background aggregation jobs.
- Partition strategy for large append-only tables.
- Query plan verification for every executive KPI/chart.
- Frontend virtualization for long tables.

Tables likely to need special handling:

- `InventoryTransaction`
- `InventoryTransactionItem`
- `ProductionMaterialLedger`
- `ProductionLog`
- `YardMovement`
- `ActivityLog`
- `Notification`
- `Attachment`

## Recommended Performance Roadmap

P0:

- Query plan audit for DashboardMetricsService and DashboardActivityService.
- Add server-side pagination to any remaining broad list APIs.
- Reduce polling by connecting existing event gateways to query invalidation.

P1:

- Create persisted inventory daily movement summary.
- Create production order readiness/cost summary.
- Create yard occupancy daily snapshot job.

P2:

- Add partition/archive plan for append-only logs and transactions.
- Add frontend virtualization where tables can exceed thousands of rows.

