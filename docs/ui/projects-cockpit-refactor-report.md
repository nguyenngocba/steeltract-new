# Sprint 40PROJ.1 – Projects Cockpit Refactor Report

Date: 2026-06-30

## Scope

Frontend-only refactor of the Projects module cockpit.

Changed:

* `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`

Not changed:

* Backend APIs
* Prisma schema
* Database migrations
* Project business workflows

## Design Source

Projects now follows the Inventory cockpit baseline:

* Inventory Overview
* Inventory Materials
* Inventory Locations

Shared cockpit primitives used:

* `CockpitKpiCard`
* `CockpitChartCard`
* `CockpitTableShell`
* `DataTablePagination`
* `CockpitEmptyState`
* `CockpitRecentList`
* `CockpitStatusList`

## Cockpit Layout

Root layout:

* `w-full`
* `min-w-0`
* `flex-1`
* `space-y-1`

Grid spacing:

* `gap-1`

The module now starts with actionable navigation, filters, KPI cards, analytics widgets, and the Projects table. Decorative module headers were removed from the primary workspace.

## KPI Cards

The main Projects cockpit renders:

* Tổng công trình
* Đang triển khai
* Hoàn thành
* Quá hạn tiến độ
* Giá trị thực hiện

All KPI cards use `CockpitKpiCard` and the existing industrial cockpit theme.

## Analytics

Added cockpit widgets using existing runtime data:

* Trạng thái công trình
* Tiến độ theo công trình
* Giá trị theo công trình
* Công trình sắp hoàn thành
* Công trình chậm tiến độ
* Hoạt động gần đây

No fake data or random values were introduced. Empty datasets render explicit cockpit empty states.

## Table

The Projects table now follows the Inventory stock table style:

* Transparent shell
* `h-[520px]`
* `min-w-[1150px]`
* `table-fixed`
* compact row spacing
* cockpit pagination

Clicking a row opens the project detail workspace drawer.

## Route Tabs

Existing route-backed tabs remain intact:

* `/projects`
* `/projects/list`
* `/projects/progress`
* `/projects/components`
* `/projects/materials`
* `/projects/costs`
* `/projects/documents`
* `/projects/logs`
* `/projects/reports`

Placeholder routes remain explicit where backend foundations do not yet exist.

## Limitations

* Project costs/documents/logs still require deeper backend-backed workspaces.
* Project return workflows are not implemented as backend transactions in this sprint.
* Schedule hierarchy is derived from existing component/material runtime data because there is no persisted milestone/task model yet.

## Verification

* `pnpm -C apps/frontend build` passed.
* `pnpm -C apps/backend-api build` passed.
