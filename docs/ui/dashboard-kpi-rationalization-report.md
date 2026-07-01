# Dashboard KPI Rationalization Report

Date: 2026-06-27

## Scope

Rationalized the Executive Dashboard / KPI Chính tab to use real operational data only.

No API contract, backend service, Prisma schema, database migration, or workflow changes were introduced.

## Removed

- Removed decorative top KPI values that were not tied to live module data.
- Removed hardcoded alert and recent activity timestamps (`2 phút trước`, `14:28`).
- Removed reliance on static trend labels in the Dashboard KPI strip.

## Added / Changed

### Inventory

KPI now uses Inventory Audit rows:

- Giá trị tồn kho
- Khối lượng tồn
- Mã vật tư
- Sắp hết hàng
- Hết hàng

Charts/panels:

- Biến động nhập - xuất - tồn kho from Inventory transactions and available movement fallback.
- Dự báo tồn kho from current stock and recent net movements.
- Bổ sung vật tư from current stock, minimum stock, and outbound usage.

Sources:

- `useInventoryAudit()`
- `useInventoryTransactions({})`
- `GET /dashboard/cockpit` movement fallback

### Production

Added real Production panel:

- Lệnh đang chạy
- Hoàn thành hôm nay
- Chậm tiến độ
- Chờ vật tư
- Hiệu suất hoàn thành

Sources:

- `useProductionOrders()`

### Components

Existing pipeline panel remains real-data based:

- `Component.status`
- open Production Orders

Sources:

- `useComponents()`
- `useProductionOrders()`

### Yard

Existing Yard occupancy panel remains real-data based:

- slot count
- occupied slots
- occupancy rate
- placement/move/remove movement counts

Sources:

- `useYardMetricsRuntime()`
- `useYardMovementsRuntime()`

### Projects

Added real Projects panel:

- Công trình đang triển khai
- Trễ tiến độ
- Giá trị hợp đồng
- Cấu kiện đang sản xuất / delivered pipeline signal
- Vật tư đang sử dụng by material transaction value

Sources:

- `GET /projects/runtime`

### Suppliers

Added real Suppliers panel:

- NCC hoạt động
- NCC có giao dịch kho
- NCC đã đánh giá
- Điểm đánh giá
- Cảnh báo đánh giá

Sources:

- `GET /suppliers/cockpit/summary`
- `GET /suppliers/cockpit/evaluations`

### QC

Existing QC trend panel remains real-data based:

- passed
- rework
- failed
- open NCR
- pass rate

Sources:

- `GET /qc/cockpit`

## Missing Data Handling

Where module datasets are empty, panels render empty states instead of fake rows:

- `ModuleEmptyState`
- explicit text: data will appear after operational records exist

## Remaining Gaps

- Logistics has no real dashboard KPI panel yet because the Logistics backend foundation is still missing.
- Supplier purchase orders, open payables, and late deliveries are not shown as fake values; they need real Purchasing/Payables APIs.
- Project schedule and monthly tonnage charts need persisted schedule baselines before they can be accurate.
- Dashboard drill-through and persisted preferences remain Dashboard Phase S2.

## Verification

- `pnpm -C apps/frontend build`: PASS.
- `pnpm -C apps/backend-api build`: PASS.
