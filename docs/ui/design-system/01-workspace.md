# 01. Enterprise Workspace

## Canon Sources

- `shared/runtime-tabs/EnterpriseModulePage.tsx`
- active Inventory routes in `modules/inventory/pages/tabs/`
- `shared/ui/modules` and `shared/ui/cockpit`

Legacy/stub `InventoryPage`, `InventoryWorkspacePage`, `InventoryTabWorkspace`
and placeholder feature files are not design references.

## Shell

Every operational page uses `OperationalShell` inside `EnterpriseModulePage`:

- viewport-height application shell with fixed sidebar/topbar;
- independently scrolling main region;
- dark blue radial/linear workspace background;
- `min-h-screen`, `p-3`, `text-slate-100`;
- centered content capped at `1800px`;
- full-width, `min-w-0` descendants to prevent overflow.

Do not wrap page sections in an additional outer card. KPI cards, toolbars,
tables and analytics are peers inside the workspace.

## Hierarchy

Required order for a complete module workspace:

1. breadcrumb, page title/description and primary action;
2. module tabs when the module has sibling routes;
3. KPI strip;
4. filter/action toolbar;
5. primary table, map or operator surface;
6. supporting analytics/activity;
7. drawer/modal portals outside normal flow.

Inventory tab pages currently omit a visible page header because
`InventoryTabWorkspace` returns `null`. This is an Inventory inconsistency, not
permission for future modules to omit hierarchy. New modules use
`EnterpriseWorkspace`/`ModulePageHeader`.

## Density And Spacing

- Workspace edge: 12px (`p-3`).
- Compact cockpit vertical rhythm: 4px (`space-y-1`).
- Normal page/header rhythm: 12px (`space-y-3`).
- Compact dashboard grid: 4px (`gap-1`).
- Forms and standard module layouts: 12-16px (`gap-3`/`gap-4`).
- Panel internal padding: 12px compact, 16px normal.
- Modal/drawer body padding: 20-24px.

Use compact rhythm only for scan-heavy KPI/chart/table compositions. Do not mix
`gap-1` and `gap-6` inside the same visual band.

## Layout Patterns

- KPI: `grid-cols-1`, then 3-5 columns at `md`; executive modules may use six at
  `2xl`.
- Toolbar: one column initially, 12-column grid at `xl`.
- Main split: stack first; use explicit `xl:grid-cols-[...]` for operator form
  plus preview/pending panel.
- Analytics: 12-column grid at `xl`; use `col-span` to express importance.
- Tables/maps: stable height tokens and internal scrolling, never viewport-width
  scaling.

## Responsive Breakpoints

- Base/mobile: one column, full-width overlays, horizontal table/tab scroll.
- `md`: KPI columns, three-part pagination, two-column form groups.
- `xl`: toolbar grid and operational split panes.
- `2xl`: six-column KPI/analytics refinements and 1800px wide transaction modal.

## Usage Rules

- Preserve the current dark operational language; do not create marketing hero
  layouts or decorative page cards.
- Keep actions near the data they affect.
- Maintain stable panel/table dimensions so loading and empty states do not
  move adjacent content.
- One page owns one dominant workflow. Supporting panels must remain secondary.

