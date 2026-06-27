# Components Final Polish Report

Date: 2026-06-27

Scope:

- Components List
- Components Overview
- Components Production
- Components Stock
- Components Material Stock
- Components Transfers
- Components Internal QC
- Components History

Verification target:

```bash
pnpm -C apps/frontend build
```

## Screenshot Audit

Runtime screenshots were not captured in this pass. The audit below is based on source review of the rendered layout classes and data bindings after Sprint 20C.15. Recommended manual screenshot set for final visual approval:

| Viewport | Sidebar | Pages |
| --- | --- | --- |
| 1366x768 | Expanded | List, Overview, Production, Stock |
| 1366x768 | Collapsed | Material Stock, Transfers |
| 1920x1080 | Expanded | Internal QC, History |
| 2560x1440 | Expanded | All tabs side-by-side with Inventory Materials |

## Summary

The Components module now mostly follows the Inventory cockpit pattern:

- Root layout uses `w-full min-w-0 flex-1 space-y-1`.
- Main workspaces use 9/3 desktop split where applicable.
- KPI cards use `CockpitKpiCard` executive presentation.
- Data tables use `CockpitTableShell` and `DataTablePagination`.
- Sidebar widgets use `CockpitChartCard` with `COCKPIT_HEIGHTS.CHART_SM`.
- Decorative page headers were removed from the audited tabs.

Remaining inconsistencies are mostly density and data-source issues, not major layout drift.

## Table Density Audit

Target:

- 14-16 visible rows.
- `text-[13px]`.
- body rows `py-2`.

| Page | Page size | Table text | Body row padding | Status |
| --- | ---: | --- | --- | --- |
| Components List | 14 | `text-[13px]` | `py-1` | Needs final density pass |
| Components Overview | 14 | `text-[13px]` | `py-1` | Needs final density pass |
| Components Production | 14 | `text-[13px]` | `py-1` | Needs final density pass |
| Components Stock | 14 | `text-[13px]` | `py-1` | Needs final density pass |
| Components Material Stock | 14 | `text-[13px]` | `py-2` | OK |
| Components Transfers | 14 | `text-[13px]` | `py-2` | OK |
| Components Internal QC | 14 | `text-[13px]` | `py-2` | OK |
| Components History | 14 | `text-[13px]` | `py-2` | OK |

Finding:

Core tabs from Sprint 20C.12 still use denser `py-1` rows. This improves row count but does not match Sprint 20C.15A's explicit `py-2` rule. A controlled follow-up should change body rows to `py-2` and verify whether 14 rows still fit at 1080p with the current KPI/filter/header stack.

## Sidebar Widget Audit

Target:

- No dead dark boxes.
- Use full `h-[170px]`.
- Include meaningful secondary metrics.

| Page | Sidebar widgets | Height | Secondary metrics | Status |
| --- | --- | --- | --- | --- |
| Components List | Phân loại, Tiến độ sản xuất, Theo dự án, Cấu kiện gần đây | Mostly cockpit heights | Project and recent component context | Minor layout exception: first widget sits beside table, remaining widgets in next row |
| Components Overview | Tổng hợp, Hoạt động, Thống kê | `CHART_SM` | Type distribution, recent activity, profile ranking | OK; activity bars are synthetic trend display |
| Components Production | Tiến độ, Theo dự án, Gần đây | `CHART_SM` | Completion rate, routing flow, recent/delayed orders | OK; "Theo dự án" is currently process-flow text, not true project aggregation |
| Components Stock | Giá trị tồn, Theo trạng thái, Cảnh báo | `CHART_SM` | Yard count, weight, lifecycle warning | OK |
| Components Material Stock | Thiếu vật tư, Giá trị, Giao dịch gần đây, Top vật tư khả dụng | `CHART_SM` | Shortage count, stock value, recent transaction IDs | Has 4 widgets; useful but slightly taller than the requested 3-widget sidebar |
| Components Transfers | Điều chuyển hôm nay, Theo trạng thái, Gần đây | `CHART_SM` | Today count, status count, recent destination | OK |
| Components Internal QC | Đạt QC, Không đạt, Gần đây | `CHART_SM` | Pass/fail/pending counts from local rows | Visually OK; data is mock |
| Components History | Hoạt động hôm nay, Theo loại, Gần đây | `CHART_SM` | Done/active/fail counts from local rows | Visually OK; data is mock |

## Empty State Audit

Target:

- Centered.
- Icon.
- Title.
- Description.

| Page | Empty state coverage | Status |
| --- | --- | --- |
| Components List | Table empty and reusable `RankList` empty states | OK |
| Components Overview | Table empty and profile widget empty states | OK |
| Components Production | Table, recent activity, stage drawer empty states | OK |
| Components Stock | Table and warning empty states | OK |
| Components Material Stock | Table, recent transaction, top material, drawer history empty states | OK |
| Components Transfers | Table and recent activity empty states | OK |
| Components Internal QC | Table and recent activity empty states | OK |
| Components History | Table and recent activity empty states | OK |

Finding:

Some empty states use emoji string icons, while others use lucide icons. Both render correctly through `ModuleEmptyState`, but Inventory mostly favors lucide. For visual consistency, migrate emoji icons to lucide in a low-risk pass.

## Action Toolbar Audit

Target:

- Align with Inventory header actions.
- Same button style.
- Same spacing.

| Page | Actions | Status |
| --- | --- | --- |
| Components List | `Tạo cấu kiện`, `Tạo lệnh sản xuất`, `Tạo BOM` | Present and right aligned; primary button matches shared style, production button has custom emerald variant |
| Components Overview | No create action | Acceptable for overview, but quick action parity with Inventory could be improved |
| Components Production | No create action | Should expose `Tạo lệnh sản xuất` if workflow allows existing modal reuse |
| Components Stock | Drawer action `Xem vị trí trong bãi`; no top action | Acceptable for stock view |
| Components Material Stock | Return action in drawer only | Acceptable; no top create action needed |
| Components Transfers | No top action | Should expose `Tạo điều chuyển` only after real workflow exists in Components scope |
| Components Internal QC | No top action | Should expose `Tạo kiểm tra QC` only after real API/workflow exists |
| Components History | No top action | No action expected |

Finding:

The action toolbar is strongest in Components List. Other tabs are operational read views and currently do not expose create workflows. Avoid adding fake buttons until real flows/API ownership are confirmed.

## Displayed Metrics Audit

### Real Aggregates

| Page | Metrics | Source |
| --- | --- | --- |
| Components List | total, running, completed, waiting material, delayed, weight, material readiness | `useComponents`, `useProductionOrders`, `useProductionBoms`, `useProductionIssues`, `calculateComponentMaterialReadiness` |
| Components Overview | status counts, type distribution, top profiles, recent orders | `useComponents`, `useProductionOrders`, `useYardSlotsRuntime` |
| Components Production | total orders, running, waiting, completed, delayed, completion rate | `useProductionOrders` |
| Components Stock | lifecycle counts, yard placement, total weight, estimated value | `useComponents`, `useYardSlotsRuntime`, `useProductionOrders`, `useProductionBoms`, `useInventoryAudit` |
| Components Material Stock | production stock buckets, available, warning count, value, recent production transactions | `useInventoryItems`, `useInventoryAudit`, `useProductionIssues`, `useInventoryTransactions` |
| Components Transfers | movement count, today's movements, recent movements | `useYardMovementsRuntime` |

### Mock / Demo Values

| Page | Mock/demo item | Current risk | TODO backend integration |
| --- | --- | --- | --- |
| Components Overview | KPI deltas such as `+8,6%`, `+18,2%`; mini bar values `[260..1480]` | Can be mistaken for real trend | Add historical component status/change endpoint or derive from component creation/status timeline |
| Components Production | KPI trendData arrays are synthetic | Sparkline implies history that may not exist | Add production order history/status trend endpoint or hide sparkline when no history exists |
| Components List | Create modal uses `nextLocalCode('CPL')` | Local code generation may diverge from backend ERP numbering | Backend-owned component numbering endpoint or server-generated code on create |
| Components List | Filter options include static projects `PO-2506-014`, `PO-2506-015` and static locations | Users may not see real projects/locations | Populate filter options from actual `projects`, component locations, and production state |
| Components Internal QC | Entire `qcRows` array and all KPI values `1.248`, `1.086`, `98`, etc. | Page looks real but is demo-only | Replace with QC runtime API for component inspections |
| Components History | Entire `historyRows` array and all KPI values `5.281`, `4.562`, etc. | Page looks real but is demo-only | Add component timeline/history endpoint or bind to existing component timeline records |
| Components Transfers | `Nguồn dữ liệu = YARD MOVE`, `Cập nhật = LIVE` | Operational labels are acceptable, but not numeric business KPI | Add transfer document/workflow counters if Components transfer becomes independent from Yard |
| Components Material Stock | `reserved = 0` with note `chờ allocation backend` | Correctly marked as missing backend integration | Bind to reservation allocation once API exposes component material reservations |

## Remaining Inconsistencies

1. Components List main table is not wrapped in `CockpitChartCard`, unlike the other tabs. It intentionally mirrors Inventory Materials' table-first style, but this differs from the rest of Components.
2. Components List has table + one right widget in row 1, then three analytics panels in row 2. This matches the previous cockpit alignment request, but differs from the strict 3-widget right sidebar pattern.
3. Components Material Stock has four right widgets instead of the requested three. The fourth widget is useful, but it extends the sidebar beyond the 560px table height.
4. Some drawer/detail content still uses older local shells and inline style gaps. This is outside the main tab workspace but should be normalized later.
5. Some core tables use `py-1` body padding. If changed to `py-2`, row count at 1080p needs a real screenshot pass.

## Recommendations

P0:

- Replace mock data in Components Internal QC and Components History before users treat those pages as live operational truth.
- Add visible "demo data" marker or hide those tabs until backend binding exists.

P1:

- Normalize row padding to `py-2` across List, Overview, Production, and Stock, then verify 14 visible rows at 1080p.
- Replace synthetic KPI deltas and sparklines with real historical aggregates or remove trend text.
- Populate Components List filters from real runtime data, not static options.

P2:

- Convert remaining emoji empty-state icons to lucide icons.
- Bring drawer internals under the cockpit/module shell standard.
- Decide whether Components Material Stock should keep four useful sidebar widgets or strictly follow three.

P3:

- Add route-level screenshot regression checks for Components tabs compared against Inventory Materials and Inventory Overview.

