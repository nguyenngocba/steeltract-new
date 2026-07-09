# Inventory Overview Snapshot Cutover Report

## Read Path

```text
InventoryOverviewPage
  -> useInventoryOverview
  -> GET /inventory/overview
  -> InventoryService
  -> InventoryReadModelService
  -> InventoryRepository
  -> InventoryMaterialSnapshot / InventoryDashboardSnapshot
```

The endpoint uses persisted material snapshots for current stock, warehouse
distribution, value, material usage, and MAIN warehouse stock status. Time-bounded
repository aggregates supply real inbound/outbound/transfer activity. Historical
stock-value points come only from persisted dashboard snapshot dates; the current
material snapshot is appended as a real current point when today's dashboard row
does not yet exist.

## KPI Source

| Metric | Backend truth | API field | UI field | Result |
|---|---|---|---|---|
| Total materials | active material/snapshot set | `summary.totalItems` | `summary.totalItems` | PASS |
| Total stock | `InventoryMaterialSnapshot(ALL)` | `summary.totalStock` | total quantity KPI | PASS |
| MAIN stock | material snapshot `MAIN` scope | `summary.mainStock` | MAIN analytics | PASS |
| Production stock | material snapshot `PRODUCTION` scope | `summary.productionStock` | production analytics | PASS |
| Inventory value | material snapshot value | `summary.totalValue` | value KPI | PASS |
| Low/out stock | MAIN snapshot vs minimum stock | `lowStock`, `outOfStock` | alert KPIs | PASS |
| Inbound today | transaction-item aggregate | `today.INBOUND` | inbound summary | PASS |
| Outbound today | transaction-item aggregate | `today.OUTBOUND` | outbound summary | PASS |
| Transfer today | positive transfer movement/value | `today.TRANSFER` | transfer summary | PASS |

## Runtime Observation

On the current 23-material dataset:

- `GET /inventory/overview`: approximately 58-62 ms.
- Payload: approximately 2.3 KB.
- Current summary: 23 materials, total stock `21473.4`.
- No synthetic trend points are returned.

These figures are observations from a small database, not enterprise benchmarks.

