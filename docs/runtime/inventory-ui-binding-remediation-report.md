# Inventory UI Binding Remediation Report

Date: 2026-07-09  
Sprint: EPIC118.1

## Result

The Inventory Overview and Materials workspaces no longer use
`GET /inventory/audit` as their normal UI source. Existing layout, cards, charts,
tables, drawer structure, colors, and spacing were preserved.

## Changes

- Added additive read endpoints:
  - `GET /inventory/overview`
  - `GET /inventory/materials`
- Kept `GET /inventory/audit` unchanged for diagnostics and legacy consumers.
- Removed the synthetic inventory-value trend. Missing historical snapshots now
  produce an empty chart state.
- Bound today inbound, outbound, and transfer quantity/value to repository
  aggregates rather than the latest 200 client-side transactions.
- Renamed the misleading “Kiểm kê tháng này” metric to “Điều chỉnh tháng này”
  because current persisted transactions cannot distinguish stocktake adjustments
  from other adjustments.
- Replaced the false “Chênh lệch tồn kho” percentage with real low/out-of-stock
  counts.
- Material Detail transaction/log tabs now request only one server page when open.
- Transaction attachments are loaded only after clicking a transaction attachment
  control and are scoped by transaction ID.

## Preserved Boundaries

- No schema or migration.
- No stock mutation or workflow change.
- Material Detail and Location snapshot-first paths remain intact.
- Repository remains the only Inventory persistence/query boundary.
- Snapshot writers, Outbox, and Background Engine were not changed.

## Remaining Limits

- Pagination is offset-based. It is suitable for the current operator table but
  should move to cursor pagination when deep pages over a high-write,
  million-row material/history dataset become a measured problem.
- Snapshot fallback for an individual material uses canonical live location
  balances. Snapshot summary reads remain dependent on the existing background
  snapshot freshness policy.
- Runtime request logs reported Prisma query count as zero during smoke tests, so
  SQL-count evidence is unavailable until profiler instrumentation is corrected.

