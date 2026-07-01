# Yard Advanced Workspace Report

Date: 2026-06-27

## Scope

Sprint 80YARD.1 expanded Yard Management into a route-backed Smart Component Yard workspace.

No backend, API contract, Prisma schema, database migration, npm package, or business workflow changes were introduced.

## Routes Added

| Workspace | Route | Data Source |
| --- | --- | --- |
| Tổng quan | `/yard` | Yard metrics, slots, movements, cranes |
| Bản đồ 2D | `/yard/map-2d` | Yard zones, slots, placements |
| Bản đồ 3D | `/yard/map-3d` | Yard slots and stack levels |
| Vị trí bãi | `/yard/locations` | Yard slots, movements, metrics |
| Cấu kiện | `/yard/components` | Yard slot placements |
| Điều phối | `/yard/dispatch` | Available slots, overloaded zones |
| Live Tracking | `/yard/tracking` | Yard movements and current slots |
| Heatmap | `/yard/heatmap` | Zone utilization and slot occupancy |
| Timeline | `/yard/timeline` | Yard movements |
| Lịch sử | `/yard/history` | Yard movements with filters |

All tabs derive active state from `location.pathname`, so refresh, direct URL, and browser Back/Forward remain synchronized.

## Navigation Changes

Updated:

- `apps/frontend/src/app/router/AppRouter.tsx`
- `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
- `apps/frontend/src/app/config/navigation.config.ts`
- `apps/frontend/src/modules/yard/config/yard-tabs.ts`
- `apps/frontend/src/modules/yard/pages/YardPage.tsx`
- `apps/frontend/src/modules/yard/components/YardTabWorkspace.tsx`

Sidebar now presents:

- Tổng quan
- Bản đồ 2D
- Bản đồ 3D
- Vị trí bãi
- Cấu kiện
- Điều phối
- Live Tracking
- Heatmap
- Timeline
- Lịch sử

## Workspace Details

### Overview

KPI strip now uses real runtime values:

- Occupied Slots
- Available Capacity
- Components In Yard
- Movements Today
- Overloaded Zones

The previous decorative trend defaults were removed. Movement trend now renders from real `yard_movements`; if no movements exist, an explicit empty message is shown.

### 2D Map

The 2D workspace uses the existing `YardOperationalMap2D` and real zone/slot placement data.

Supported:

- zone grid
- slot occupancy colors
- capacity indicators
- zone/slot drill-down through existing Yard detail dialog

### 3D Map

The 3D workspace was initially restored in Sprint 80YARD.1 as a pseudo-3D CSS workspace.

Superseded note:

- Sprint 80YARD.1R restored the existing `YardOperationalMap3D` GLB/R3F implementation.
- See `docs/ui/yard-3d-restoration-report.md` for the final restored 3D path.

Important:

- No `three.js`
- No `react-three-fiber`
- No new packages
- No fake coordinates

Because current `YardSlotRuntime` does not expose slot coordinates, the temporary pseudo-3D view grouped real slots by zone and rendered them in actual slot order. Stack layers used real `currentStackLevel` and `maxStackLevel`.

This temporary implementation is no longer active after Sprint 80YARD.1R.

### Locations

Table-first workspace with:

- slot list
- stack usage
- placement count
- occupancy bar
- top occupied locations
- capacity efficiency
- recently moved locations derived from movement source/destination slots

### Components

Table-first placement workspace showing real components currently in Yard slots.

### Dispatch

Dispatch workspace is intentionally conservative:

- No pending dispatch workflow is invented.
- Pending moves render a `CockpitEmptyState`.
- Suggested destinations are real available slots.
- Conflicts are real zones with occupancy >= 90%.

### Live Tracking

Uses real `yard_movements` and current slot data.

### Heatmap

Uses real zone utilization and slot utilization calculations.

### Timeline

Uses real movement events only:

- inbound / PLACE
- movement / MOVE
- outbound / REMOVE

### History

Adds real filters over `yard_movements`:

- component code
- location / zone
- movement type
- date

Project filter is not implemented because current movement records do not expose project fields. No project data is fabricated.

## UI Standardization

Applied existing cockpit foundation:

- `CockpitKpiCard`
- `CockpitChartCard`
- `CockpitTableShell`
- `DataTablePagination`
- `CockpitSidebarStats`
- `CockpitRecentList`
- `CockpitStatusList`
- `CockpitEmptyState`
- `COCKPIT_SHELL`

Layout remains fluid with:

- `w-full`
- `min-w-0`
- `flex-1`
- `space-y-1`
- `gap-1`

## Known Limitations

- Current slot runtime does not expose physical slot coordinates. Sprint 80YARD.1R restores the existing 3D component, which uses its original computed grid layout from runtime slot sequence.
- Dispatch has no backend pending move/approval model yet.
- Current movement records do not expose project fields, so History cannot filter by project without backend/API support.
- Formal shipment/outbound documents remain future work.

## Verification

- `pnpm -C apps/frontend build`: PASS.
- `pnpm -C apps/backend-api build`: PASS.
