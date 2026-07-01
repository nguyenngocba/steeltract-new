# Navigation Yard/Logistics Fix Report

Date: 2026-06-27

## Scope

Fixed route and tab synchronization for:

- Yard Management / Bãi tập kết
- Logistics / Vận chuyển

No backend, API, Prisma, schema, migration, or business workflow changes were introduced.

## Yard

Required tabs are now route-backed:

| Tab | Route | Component |
| --- | --- | --- |
| Tổng quan bãi | `/yard` | `YardPage` |
| Vị trí bãi | `/yard/locations` | `YardPage` |
| Cấu kiện trong bãi | `/yard/components` | `YardPage` |
| Nhật ký di chuyển | `/yard/movements` | `YardPage` |
| Live Tracking | `/yard/tracking` | `YardPage` |
| Lịch sử | `/yard/history` | `YardPage` |

Changes:

- Replaced hash navigation (`/yard#...`) with real URL routes.
- Changed `YardPage` active tab derivation from local/hash state to `location.pathname`.
- Added route entries in `AppRouter`.
- Synchronized both sidebar navigation config files.
- Added runtime placeholder/content views for components, movements, tracking, and history instead of redirecting to Dashboard.

## Logistics

Required tabs are now route-backed:

| Tab | Route | Component |
| --- | --- | --- |
| Tổng quan | `/logistics` | `LogisticsPage` |
| Kế hoạch giao hàng | `/logistics/planning` | `LogisticsPage` |
| Xe vận chuyển | `/logistics/vehicles` | `LogisticsPage` |
| Điều phối | `/logistics/dispatch` | `LogisticsPage` |
| Theo dõi | `/logistics/tracking` | `LogisticsPage` |
| Nhật ký | `/logistics/logs` | `LogisticsPage` |
| Báo cáo | `/logistics/reports` | `LogisticsPage` |

Changes:

- Removed dead menu references to `/logistics/routes` and `/logistics/gps`.
- Added route entries in `AppRouter`.
- Changed `LogisticsPage` active tab derivation from local state to `location.pathname`.
- Added placeholder/report views where a dedicated operational page does not yet exist.
- Synchronized both sidebar navigation config files.

## Validation Matrix

Expected behavior after the fix:

- Sidebar expanded: parent module and child route highlight correctly.
- Sidebar collapsed: parent module route remains correct.
- Refresh: active tab is preserved because it is URL-derived.
- Browser Back/Forward: active tab follows route history.
- Direct URL: route opens the correct module tab instead of falling through to Dashboard.

## Known Limitations

- Logistics still uses its current frontend-local shipment dataset because no dedicated Logistics backend foundation exists yet.
- Some Logistics tabs share the same table/panel presentation until operational APIs are implemented.
- Yard tab views reuse existing runtime data and do not restore legacy 3D/inbound/outbound hash tabs because the requested navigation set is now route-first.

## Verification

- `pnpm -C apps/frontend build`: PASS.
- `pnpm -C apps/backend-api build`: PASS.
