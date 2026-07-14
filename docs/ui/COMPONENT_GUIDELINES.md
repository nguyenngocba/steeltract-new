# SteelTrack Component Guidelines

## Selection Rules

1. Search `shared/ui/cockpit` and `shared/ui/modules` before creating UI.
2. Reuse a component only when its semantics and rendered presentation match.
3. Keep query state and mutation behavior in hooks/pages, never in visual shells.
4. Keep domain labels and status rules close to the domain module.
5. Prefer composition over adding page-specific boolean props to shared UI.

## KPI

Use `CockpitKpiCard` for cockpit metrics. Do not introduce another generic
`MetricCard`, `KpiCard`, or `OverviewMetricCard`. A local wrapper is acceptable
only when it performs domain formatting or preserves an already approved visual
variant that the shared card cannot express without changing other consumers.

## Tables And Pagination

- Wrap operational tables with `CockpitTableShell`.
- Use `DataTablePagination` for new tables.
- Inventory legacy density uses `InventoryPagination` with an explicit
  `containerClassName`; this is a presentation-preserving adapter.
- Pagination receives page metadata and callbacks. It must not fetch data.
- Do not duplicate page-window calculations in page files.

## Filters

Use `ModuleFilterBar` as the shell. Search, filter, and sort state remains page
owned and must continue to follow server-side contracts where implemented.
Do not move React Query behavior into `ModuleFilterBar`.

## Drawers

Use `ModuleDetailDrawer` for detail and transaction surfaces. Local components
such as `InboundDetailDrawer` are domain compositions, not duplicate drawer
frameworks, when they render `ModuleDetailDrawer` internally.

Rules:

- `sm`: compact detail/return request;
- `md`: standard operational detail;
- `lg`: project or complex transaction workspace;
- desktop opens from the right; mobile uses the shared full-width behavior;
- body scrolling and header behavior remain owned by the shared drawer.

## Status Badges

There is no single safe status mapper for every domain. Use the generic shared
badge only for neutral/info/success/warning/danger semantics. Keep mappings such
as Return Request, stock health, and transaction type domain-local until one
typed mapping contract is approved. Do not infer color from arbitrary strings.

## Loading And Empty States

- `ModuleLoadingState`: page/table/analytics loading.
- `ModuleEmptyState`: workflow or table empty state.
- `CockpitEmptyState`: compact analytics widget.
- Empty state copy must describe absence of real data; never generate chart data.

Do not add one-line placeholder skeletons under alternate shared folders. The
active shared loading primitives are under `shared/ui/modules`.

## Review Checklist

- Existing layout, class names, section order, and responsive behavior preserved.
- Shared component has no API/business dependency.
- No duplicate pagination/window algorithm.
- No new generic Card/Badge/Table component when a canonical primitive exists.
- Loading, empty, error, and disabled states remain reachable.
- Keyboard and close behavior remain unchanged for drawers.
- Frontend build and `git diff --check` pass.

