# Inventory Historical Metrics Remediation Report

Date: 2026-07-10

Status: APPROVED WITH LIMITED HISTORY

## Scope

EPIC118.3 remediates the Inventory Overview historical KPI and chart data path. The work preserves the current Inventory UI design and business rules while replacing synthetic historical behavior with persisted snapshot-backed data.

## What Changed

- Historical KPI deltas now compare adjacent persisted snapshots and use the label `so với lần ghi nhận trước`.
- Missing history is rendered as `Chưa có dữ liệu lịch sử`; the frontend no longer fabricates flat series, interpolated points, or transaction-derived category history.
- Overview stock value and quantity trend uses persisted warehouse dashboard snapshots only.
- Overview category, low-stock, out-of-stock, and material-count history uses canonical `InventoryDashboardSnapshot` rows with `scopeKey = 'ALL'`.
- Existing historical rows were not backfilled with guessed category/out-of-stock metrics.

## Runtime Evidence

Migration status:

- `20260709143000_inventory_historical_metrics` applied successfully.
- `prisma migrate status` reports the database schema is up to date.

Persisted historical rows after migration:

| Scope | Rows | First | Last | New metric points |
|---|---:|---|---|---:|
| `ALL` | 1 | 2026-07-09 | 2026-07-09 | 1 |
| `WAREHOUSE:wh-main-steeltrack` | 4 | 2026-07-06 | 2026-07-09 | 0 |
| `WAREHOUSE:wh-production-steeltrack` | 4 | 2026-07-06 | 2026-07-09 | 0 |

The single `ALL` row is intentionally the only source for new historical category/out-of-stock metrics until more real background snapshots are written.

## Parity Check

The latest `ALL` snapshot was compared against live inventory using the frozen MAIN-stock rule for low/out-of-stock status.

| Metric | Snapshot | Live | Result |
|---|---:|---:|---|
| Total materials | 24 | 24 | PASS |
| Total stock | 63080.4 | 63080.4 | PASS |
| Low stock | 6 | 6 | PASS |
| Out of stock | 1 | 1 | PASS |
| Primary material count | 6 | 6 | PASS |
| Primary stock | 9556.9 | 9556.9 | PASS |
| Secondary material count | 13 | 13 | PASS |
| Secondary stock | 46819.5 | 46819.5 | PASS |
| Consumable material count | 5 | 5 | PASS |
| Consumable stock | 6704 | 6704 | PASS |

## Notes

- Historical charts will remain sparse until the Background Engine writes more `ALL` snapshots.
- This is correct behavior: the system now prefers honest missing history over visually pleasing invented history.
- Material and location snapshot parity from Inventory Business Freeze remains protected; EPIC118.3 does not change mutation workflows.

## Verification

- `pnpm -C apps/backend-api exec prisma migrate deploy`: PASS
- `pnpm -C apps/backend-api exec prisma migrate status`: PASS
- `pnpm -C apps/backend-api build`: PASS
- `pnpm -C apps/frontend build`: PASS
- `git diff --check`: PASS
