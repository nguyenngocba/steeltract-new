# Sprint 70EXEC.1 - Executive Cockpit Intelligence Tabs

Date: 2026-06-29

## Scope

Implemented three Executive Dashboard tabs:

- `Biểu đồ xu hướng`
- `Hoạt động gần đây`
- `Thông báo`

The implementation avoids fake data, `Math.random()`, hardcoded trends, and React-side business aggregation for the new tabs.

## Data Flow

```text
PostgreSQL
-> DashboardMetricsService / DashboardActivityService / DashboardNotificationService
-> GET /dashboard/executive-cockpit
-> React Query
-> Dashboard cockpit tabs
```

## KPI Prediction Rules

### Material shortage forecast

Source tables/models:

- `inventory_items`
- `inventory_location_stocks`
- `inventory_transactions`
- `inventory_transaction_items`

Rules:

- Current stock uses summed `inventory_location_stocks.quantity`, falling back to `inventory_items.quantity` only when no location stock exists.
- 30-day and 90-day consumption use `EXPORT` transaction quantities.
- Average daily usage prefers 30-day consumption and falls back to 90-day consumption.
- Days until stockout = `currentStock / averageDailyUsage`.
- Recommended reorder quantity = max of:
  - `(minimumStock * 2) - currentStock`
  - `(averageDailyUsage * 30) - currentStock`

### Production stop risk

Source models:

- `production_orders`
- `boms`
- `bom_items`
- `production_material_issues`
- `inventory_location_stocks`

Rules:

- Required material = `BOMItem.quantity * (1 + wastePercent / 100) * ProductionOrder.quantity`.
- Net issued = `issuedQty - returnedQty`.
- Available stock uses active inventory location stock.
- Shortage = `requiredQty - issuedQty - availableQty`.
- Orders with shortage rows appear in the risk panel.

### Consumption trends

Source models:

- `inventory_transactions`
- `inventory_transaction_items`

Rules:

- Increasing/decreasing compares the last 30 days with the previous 30 days.
- Abnormal consumption flags rows where the current 30-day usage is meaningfully higher than the previous 30-day window.

### Inventory projection

Rules:

- Daily inbound = 30-day `IMPORT + RETURN` quantity / 30.
- Daily outbound = 30-day `EXPORT` quantity / 30.
- Average daily net = inbound - outbound.
- Forecast horizons expose 7, 30, and 90 day projections using rolling average only.

## Activity Sources

The unified activity timeline reads:

- Inventory: `inventory_transactions`
- Production: `production_logs`
- Yard: `yard_movements`
- QC: `qc_inspections`
- Purchasing: `purchase_orders`
- Projects: `projects`

Returned activity rows include module, type, title, description, entity code, event timestamp, relative time, and severity.

## Notification Rules

Priority levels:

- `Critical`
- `Warning`
- `Information`

Rules:

- Inventory out of stock -> Critical.
- Inventory below minimum stock -> Warning.
- Delayed or overdue production order -> Critical/Warning.
- Yard occupancy above 90% -> Warning; full occupancy -> Critical.
- Failed/rework/rejected QC inspection -> Critical.
- Delayed/on-hold project -> Warning/Information.
- Open purchase orders -> Warning/Information.
- Persisted `notifications` rows are included and normalized by severity.

## Query Strategy

- One frontend query: `getDashboardExecutiveCockpit()`.
- One backend route: `GET /dashboard/executive-cockpit`.
- The endpoint executes the three services in parallel.
- The Dashboard tab state is URL driven through `?tab=trends`, `?tab=activities`, and `?tab=notifications`.

## Performance Considerations

- Current reads are capped with `take` limits for executive panels.
- The service avoids returning full operational records to the frontend.
- Forecast calculations use bounded 90-day windows.
- Future optimization can add persisted daily summary tables if transaction volume grows.

## UI Notes

- Uses existing cockpit primitives: `CockpitKpiCard`, `CockpitChartCard`, and `ModuleEmptyState`.
- Empty states use: `Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ.`
- Sidebar Dashboard entries now route to the corresponding Dashboard query tab.

## Verification

- `pnpm -C apps/frontend build` passed.
- `pnpm -C apps/backend-api build` passed.
- Search verification found no `Math.random()` or `dailyRate = 10` in Dashboard frontend/backend modules.

## Known Limitations

- Production stop risk depends on BOM linkage and material issue rows being present.
- Supplier/purchasing notifications are limited to existing `purchase_orders` fields; late delivery requires richer delivery dates.
- Yard overload uses configured yard slot count and active placements; zone-level capacity rules can be added later.
