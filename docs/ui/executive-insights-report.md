# Sprint 70EXEC.2 - Executive Insights & Control Tower

Date: 2026-06-29

## Scope

Extended the Executive Dashboard into an Executive Control Tower.

No Prisma schema changes, no migrations, no fake data, and no generated demo rows.

## Backend Changes

Extended `GET /dashboard/executive-cockpit` to return:

- `health`
- `executiveSummary`
- `recommendations`
- `trends`
- `activities`
- `notifications`

Added services:

- `DashboardInsightService`
- `DashboardRecommendationService`

Existing services remain:

- `DashboardMetricsService`
- `DashboardActivityService`
- `DashboardNotificationService`

## Health Score Rules

Health score starts from 100 per module and subtracts risk weights.

Modules:

- Inventory
- Production
- Yard
- QC
- Suppliers
- Projects

Inventory:

- Out of stock subtracts 18 points per material.
- Low stock subtracts 7 points per material.

Production:

- Delayed order subtracts 15 points per order.
- Reservation shortage subtracts 5 points per shortage line.

Yard:

- Occupancy over 75% reduces score progressively.
- Occupancy over 90% marks overload risk.

QC:

- Open NCR subtracts 18 points per row.
- Failed/rework/rejected inspection subtracts 10 points per row.

Suppliers:

- Open purchase order subtracts 3 points per order.
- Late delivery is currently reported as `0` because there is no canonical late-delivery field.

Projects:

- Delayed project subtracts 14 points per project.

Status mapping:

- `85-100` -> normal
- `65-84` -> warning
- `<65` -> critical

## Forecast Rules

The 7-day executive summary reuses Sprint 70EXEC.1 rolling forecast data:

- Inventory shortage uses stock by `inventory_location_stocks` and 30/90 day export consumption.
- Production risk uses BOM required quantity, net issued quantity, and active inventory stock.
- Yard capacity uses real yard slot count and active placements.
- QC risk uses open NCR rows.
- Project risk uses delayed project rows.
- Purchase summary uses open purchase orders.

No AI/ML model is used.

## Recommendation Rules

Rules engine output:

- If `daysUntilStockout <= 7`, recommend `Nhập vật tư`.
- If production risk has missing materials, recommend `Ưu tiên cấp vật tư`.
- If Yard occupancy is above 90%, recommend `Điều phối lại vị trí`.
- If open NCR exists, recommend `Xử lý NCR`.
- If delayed projects exist, recommend `Rà soát tiến độ`.
- Non-information notifications can also produce follow-up actions when fewer than 12 actions exist.

## Activity Rules

Recent Activities now support both:

- module grouping
- chronological timeline

Sources:

- Inventory transactions
- Production logs
- Yard movements
- QC inspections
- Purchase orders
- Projects

## Notification Rules

Notification Center keeps the three priority groups:

- Critical
- Warning
- Information

Counters are read from the backend response. The UI does not calculate fake counts.

## Query Strategy

Frontend uses one React Query request:

```ts
getDashboardExecutiveCockpit()
```

Backend aggregates the response through services. React renders DTOs only.

## UI Layout

KPI Chính now starts with:

Row 1:

- Health Score
- Executive Summary
- Suggested Actions

Row 2:

- Activities by module
- Notification Center

The existing KPI/charts remain below the Control Tower section.

## Performance Considerations

- Query windows remain bounded.
- Executive cards use count/list queries with `take` limits.
- Forecasts reuse the existing 90-day bounded transaction window.
- Future scale work should introduce daily summary/read-model tables if transaction volume becomes high.

## Known Limitations

- CAPA is not implemented as a first-class Prisma model, so the control tower currently reports QC/NCR rather than CAPA.
- Supplier late deliveries require canonical delivery due/actual fields.
- Yard overload is currently global occupancy; zone-specific overload can be added when zone capacity rules are formalized.
- Suggested actions are recommendations only; they do not create purchase requests, dispatch tasks, or QC assignments yet.

## Verification

- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed.
