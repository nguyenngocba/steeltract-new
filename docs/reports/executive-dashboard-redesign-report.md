# EPIC 12.4 Executive BI Portal Final Redesign

Date: 2026-07-22

Status: **IMPLEMENTED - FRONTEND BUILD PASS**

## Objective

Transform the SteelTrack landing dashboard from a single executive page into a
scalable Executive BI Portal.

Reference specifications:

- `docs/ui-reference/kpi chinh.png`
- `docs/ui-reference/chi tiet bang.png`

## Files Modified

- `apps/frontend/src/modules/dashboard/pages/DashboardPage.tsx`
- `docs/reports/executive-dashboard-redesign-report.md`
- `docs/ui/ui-review/executive-dashboard-review.md`
- `docs/ai-state/CHANGELOG_AI.md`
- `docs/ai-state/PROJECT_STATUS.md`
- `docs/ai-state/CURRENT_STATE.md`
- `docs/ai-state/NEXT_TASKS.md`

## New Components

Implemented inside `DashboardPage.tsx` as page-local BI primitives:

- `ExecutiveKpiCard`
- `ExecutiveFilterBar`
- `ExecutiveChartCard`
- `ExecutiveAnalyticsPortal`
- `DonutChart`
- `DualBarChart`
- `LineOrBarChart`
- `RankingBars`
- `StatusMatrix`
- `RecentActivity`
- `RiskTable`

They are intentionally local to the dashboard until the next module proves the
analytics framework should become shared.

## Architecture

The dashboard now has two layers:

1. Executive Cockpit:
   - Exactly 8 KPI cards.
   - Each KPI has its own color identity, icon, status badge and real-data
     sparkline/empty history state.
   - Large visual groups prioritize charts over text.

2. Executive BI Portal:
   - Inventory Analytics.
   - Inbound Analytics.
   - Outbound Analytics.
   - Production Analytics.
   - Quality Analytics.
   - Projects Analytics.
   - Dispatch Analytics.

Each analytics page has its own title, KPIs, distribution, ranking, activity
feed and compact detail table while sharing the same BI shell.

## Removed / Replaced

- Removed hardcoded headline KPI values such as fixed inventory value,
  fixed inbound/outbound value and fixed QC pass rate.
- Removed hardcoded monthly chart arrays.
- Removed generic fullscreen detail data blocks with static rows.
- Removed dead `Xuất Excel` action from the analytics portal because no export
  workflow is wired in the current frontend.
- Replaced synthetic trend charts with real grouped data or the standard
  `Dữ liệu chưa khả dụng` state.

## Reused APIs

- `useInventoryOverview`
- `useInventoryAudit`
- `getInventoryItems`
- `useInventoryTransactions`
- `productionApi.orders`
- `getQcCockpit`
- `getProjectsRuntime`
- `getDispatchDashboard`
- `getDispatchOrders`
- `useWarehouses`

## New Charts

- Inventory value by warehouse donut.
- Inbound vs Outbound dual bar chart.
- Inventory quantity by material group donut.
- Project progress distribution.
- QC result distribution.
- Dispatch status distribution.
- Domain-specific trend/ranking/status matrix charts inside the BI portal.

## Screenshots

No new screenshots were captured in this run because the workspace does not
have an approved authenticated browser screenshot harness. The implementation
was compared directly against the two committed reference images using visual
inspection and source-level layout checks.

## Remaining Backend Limitations

- Historical BI quality depends on available transaction/order timestamps in
  existing read APIs.
- Export is not implemented because no existing export contract was identified
  for the Executive BI portal.
- Some domain-specific analytics fall back to `Dữ liệu chưa khả dụng` when the
  current backend does not expose authoritative series, distribution or table
  data.

## Verification

- `pnpm -C apps/frontend build`: PASS.
- `pnpm -C apps/backend-api build`: pending final gate.
- `git diff --check`: pending final gate.

