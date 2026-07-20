# Components Design Mapping

Status: IMPLEMENTED

## Inventory To Components

Inventory's "material availability" maps to Components' "component lifecycle
and readiness".

- Material count KPI -> total components.
- Stock status KPI -> stock / production / ready / shipped states.
- Inventory table -> component catalog and component workspace rows.
- Warehouse distribution -> lifecycle/status distribution.
- Stock trend -> component activity trend.
- Recent materials/transactions -> recent components and timeline history.

## Changes Applied

Components Overview now uses the same dense table language as Inventory:
compact sticky-style header tokens, smaller row padding and a summary strip
below the table/side analytics grid.

Components List no longer starts with a standalone action bar. Create
Component, Create Production Order and Create BOM now live in the filter
toolbar, where Inventory places operational actions. The table rows and header
also use the shared enterprise table tokens.

Components Reports now includes a compact summary strip under the chart row, so
the page has the same KPI -> chart/table -> summary rhythm as Inventory.

## Reasoning

Components already used shared components, but the ordering still felt
module-local. The action bar before KPIs made the workspace feel like a CRUD
screen. Moving actions into the toolbar and tightening the table rhythm makes
Components feel like a first-class ERP workspace while retaining Components'
own data and commands.

No backend, API, React Query, DTO, route, permission or business behavior was
changed.

