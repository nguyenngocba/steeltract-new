# Inventory Historical Chart Parity Report

Date: 2026-07-10

Status: PASS WITH LIMITED HISTORY

## Chart Sources

| UI Area | Source | Synthetic Data | Result |
|---|---|---:|---|
| Inventory value trend | Persisted warehouse dashboard snapshots | No | PASS |
| Inventory quantity trend | Persisted warehouse dashboard snapshots | No | PASS |
| Low-stock KPI sparkline | Persisted `ALL` historical metrics | No | PASS |
| Out-of-stock KPI sparkline | Persisted `ALL` historical metrics | No | PASS |
| Primary stock KPI sparkline | Persisted `ALL` historical metrics | No | PASS |
| Secondary stock KPI sparkline | Persisted `ALL` historical metrics | No | PASS |
| Consumable stock KPI sparkline | Persisted `ALL` historical metrics | No | PASS |
| Material-count KPI sparkline | Persisted `ALL` historical metrics | No | PASS |

## Delta Rules

Delta labels compare the latest persisted point with the previous persisted point.

If fewer than two persisted points exist, the UI shows:

`Chưa có dữ liệu lịch sử`

If two points exist, the label uses:

`so với lần ghi nhận trước`

This removes the previous mismatch where sparse history could be presented as a monthly change.

## Verified Data

Warehouse stock/value history:

- `WAREHOUSE:wh-main-steeltrack`: 4 persisted rows from 2026-07-06 through 2026-07-09.
- `WAREHOUSE:wh-production-steeltrack`: 4 persisted rows from 2026-07-06 through 2026-07-09.

Global historical category/out-of-stock history:

- `ALL`: 1 persisted row on 2026-07-09.

Because only one global point exists, category/out-of-stock deltas are not eligible for a numeric historical comparison yet.

## Parity Result

Latest `ALL` snapshot matches live inventory under the frozen Inventory rule set:

- MAIN stock is used for low/out-of-stock.
- All location stock is used for total and usage-type stock.

Result: PASS.

## Remaining Watch Item

After the next background snapshot cycle creates a second `ALL` row, verify that all eight KPI cards display adjacent-snapshot deltas instead of the insufficient-history message.
