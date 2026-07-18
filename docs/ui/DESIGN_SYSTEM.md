# SteelTrack Frontend Design System

Status: active foundation, presentation locked by each approved workspace.

## Purpose

This document defines the reusable presentation foundation for Inventory and
future operational modules. It standardizes component ownership and composition;
it does not authorize visual redesign.

## Canonical Layers

```text
shared/ui/cockpit       dense KPI, chart, table, pagination, cockpit empty state
shared/ui/modules       filter bars, drawers, loading/empty states, module controls
module/components       domain composition only
module/pages            data binding, page state, workflow orchestration
```

## Canonical Components

| Need | Component | Canonical import | Notes |
|---|---|---|---|
| KPI | `CockpitKpiCard` | `@/shared/ui/cockpit` | Use for cockpit KPI strips; preserve approved state/height props. |
| Analytics frame | `CockpitChartCard` | `@/shared/ui/cockpit` | Chart title/action/frame, not chart business logic. |
| Table viewport | `CockpitTableShell` | `@/shared/ui/cockpit` | Scroll shell only; table columns remain module-owned. |
| Standard pagination | `DataTablePagination` | `@/shared/ui/cockpit` | Default shared cockpit pagination. |
| Inventory compatibility pagination | `InventoryPagination` | `InventoryVisuals` | Preserves existing Inventory density through `containerClassName`. |
| Filter composition | `ModuleFilterBar` | `@/shared/ui/modules` | Filters remain controlled by the page. |
| Detail surface | `ModuleDetailDrawer` | `@/shared/ui/modules` | Right-side, full-height drawer; use `sm/md/lg`. |
| Loading | `ModuleLoadingState` | `@/shared/ui/modules` | Shared KPI/table/analytics skeleton. |
| Generic empty state | `ModuleEmptyState` | `@/shared/ui/modules` | For module workflows and tables. |
| Cockpit empty state | `CockpitEmptyState` | `@/shared/ui/cockpit` | For compact cockpit widgets. |
| Generic semantic badge | `StatusBadge` | `components/ui-system` | Use only when its tone mapping matches the domain. |
| Enterprise page | `EnterpriseWorkspace` | `@/shared/ui/enterprise` | Breadcrumb, header, actions and route/local tabs. |
| Complete page state | `EnterpriseWorkspaceStatePanel` | `@/shared/ui/enterprise` | Loading, empty, no-permission, error and offline. |

## Inventory Composition

Inventory keeps the established Industrial Cockpit presentation. Shared
components own shell behavior; pages own labels, columns, datasets, status
semantics, chart series, and workflows.

Inventory is the Enterprise Design Canon. Other modules use
`EnterpriseWorkspace`; Inventory may retain its approved compatibility wrappers
where replacing them would alter presentation.

Approved root composition:

```tsx
<InventoryTabWorkspace>
  <KpiRow />
  <Analytics />
  <ModuleFilterBar />
  <CockpitTableShell>
    <table />
  </CockpitTableShell>
  <DataTablePagination />
</InventoryTabWorkspace>
```

Existing approved pages may use `InventoryPanel` and `InventoryPagination` as
compatibility adapters. Migration must preserve their rendered classes.

## Tokens

Use `COCKPIT_HEIGHTS`, `COCKPIT_SHELL`, `moduleInput`, and the existing shared
button classes. Do not copy token strings into new page-local components.

Current Inventory density conventions:

- page stack and grids follow the approved page, generally `gap-1`/`space-y-1`;
- KPI sizing comes from `COCKPIT_HEIGHTS`;
- table shells remain transparent and scrollable;
- drawers use the shared `sm/md/lg` sizing system;
- numeric values use tabular formatting where the approved component provides it.

## Non-Goals

- No business calculation in shared presentation components.
- No API or React Query call in shared presentation components.
- No page-specific status mapping in a generic badge.
- No visual migration solely to make two components share a name.
- No deletion of legacy files without import and route verification.
