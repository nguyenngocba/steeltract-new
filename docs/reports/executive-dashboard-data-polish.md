# Executive Dashboard Business Data Polish

Date: 2026-07-22

Scope: frontend data mapping only. Backend contracts, APIs, schema and business logic were not changed.

## Widget Verification Matrix

| Widget | Backend endpoint | Source fields | Aggregation method | Visualization | Empty state |
| --- | --- | --- | --- | --- | --- |
| KPI row | `/inventory/overview`, `/inventory/audit`, `/inventory/transactions`, `/production/orders`, `/projects/runtime`, `/logistics/dispatch-dashboard`, `/logistics/dispatch-orders`, `/qc/cockpit` | Inventory `summary.totalValue`, audit `inventoryValue/currentStock`, transactions `totalAmount/value`, production `status`, projects `progress/status`, dispatch `status/trend`, QC `metrics/trend` | Existing totals plus 30-day real daily grouping where date fields exist | 8 KPI cards with compact values and real trend line | Delta shows `-` when history is insufficient |
| Giá trị tồn kho theo loại vật tư | `/inventory/audit` | `materialType`, `category`, `materialUsageType`, `inventoryValue`, `currentStock`, `averageCost` | Group by material type. Value = `inventoryValue` or `currentStock * averageCost` fallback | Donut with currency center and legend value/percent | `Dữ liệu giá trị tồn kho theo loại vật tư chưa khả dụng` |
| Giá trị nhập - xuất | `/inventory/overview`, fallback `/inventory/transactions` | `movementTrend.date`, `movementTrend.inboundValue`, `movementTrend.outboundValue`; fallback transaction `createdAt/date`, `totalAmount/value/totalValue` | Prefer backend movement trend grouped by month. Fallback groups real transaction rows by month | Dashboard mini trend line; popup dual bar chart | `Dữ liệu lịch sử chưa khả dụng` |
| Tồn kho theo nhóm vật tư | `/inventory/audit` | `category`, `materialType`, `materialUsageType`, `inventoryValue`, `currentStock`, `averageCost` | Group the same dataset by normalized material group. Value = inventory value, not quantity | Donut with currency center and legend value/percent | `Dữ liệu giá trị tồn kho theo nhóm vật tư chưa khả dụng` |
| Dự án theo tiến độ | `/projects/runtime` | `progress`, `delayedOrders`, `status` | Bucket projects by progress: on-track, watch, not-started | Donut | `Dữ liệu dự án chưa khả dụng` |
| Trạng thái chất lượng QC | `/qc/cockpit` | `metrics.passed`, `metrics.failed`, `metrics.rework`, `metrics.inProgress`, `metrics.pending` | Use only positive backend counts | Donut | `Dữ liệu QC chưa khả dụng` |
| Giao hàng theo trạng thái | `/logistics/dispatch-orders` | `status` | Count real dispatch orders by status | Donut | `Dữ liệu giao nhận chưa khả dụng` |
| Cảnh báo & rủi ro hoạt động | `/inventory/audit`, `/qc/cockpit`, `/logistics/dispatch-orders`, `/projects/runtime` | Inventory `currentStock/minimumStock`, QC `openNcrs`, dispatch `plannedAt/status`, projects `delayedOrders` | Generate alerts only from real negative/low stock, late/cancelled dispatch, open NCR and delayed project conditions | Risk table | `Không có cảnh báo` |

## Notes

- Latest hotfix: the empty `Giá trị nhập kho`, `Giá trị xuất kho` and
  `Sản xuất đang chạy` cards were caused by frontend data normalization, not a
  backend contract change. The Dashboard previously assumed flat arrays and
  header-level amount/date fields. It now unwraps nested/paginated payloads,
  reads transaction line totals from `items[]` when header amounts are missing,
  recognizes canonical inbound/outbound type aliases, and anchors KPI
  sparklines to the newest backend timestamp. Analytics detail panels also no
  longer render the heavy left accent strip.
- Currency values in Executive Dashboard chart centers and legends now use compact Vietnamese formatting, for example `158.3 tỉ`, `12.6 tỉ`, `850 triệu`.
- Percent values are rendered with one decimal place.
- Inventory type/group charts no longer use quantity for value charts.
- QC and delivery status charts do not fabricate placeholder states; they render only when backend rows have positive values.
- The import/export value widget now renders a period comparison chart with a currency axis, paired inbound/outbound bars, legend and a bottom metric table for inbound value, outbound value and variance.
- The operational risk panel now includes a numeric alert summary for low-stock materials, negative stock, open NCR and late dispatches before the detail table.
- Executive KPI drill-down pages use a calmer slate/cyan palette and Vietnamese section/status labels to reduce eye strain.
- The six main dashboard chart panels and the operational risk panel now have their own hover treatment and dedicated enlarged popups instead of reusing the top KPI drill-down portal.
- Enlarged popups add domain-specific detail tables: inventory material rows, import/export period rows, project rows, QC inspection rows, dispatch rows and low-stock alert rows.
- Header quick search, LIVE badge and manual refresh controls were removed to recover horizontal dashboard space.
- Time filtering now supports `Hôm nay`, `7 ngày`, `30 ngày` and a custom date range. Presets are anchored to the newest timestamp available in the dashboard datasets, so seeded historical data can still be filtered predictably.
- Top KPI drill-downs now open as a smaller modal overlay instead of replacing the entire dashboard page.
- The dashboard import/export card now uses a compact zig-zag trend visualization; the popup keeps the requested large grouped bar chart and metric table.
- Popup detail tables apply semantic color emphasis to currency, percentage, status, warning and variance values.
