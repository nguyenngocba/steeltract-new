# Production Workspace Review

## Scope

The active Production surface is one route-driven `ProductionCockpitPage` used
by all `/production/*` routes. `ProductionOverviewPage` and
`ProductionWorkspacePage` now alias that canonical workspace instead of
returning placeholder markup.

## Inventory Canon Adoption

- `EnterpriseWorkspace` owns title, description, breadcrumbs, actions and tabs.
- Cockpit KPI, chart, table, pagination, filter and detail-drawer primitives are
  shared with the Inventory visual language.
- Operational content follows header, KPI, filter, table/panel and drawer/modal
  order without a second page hero.
- Primary query paths expose explicit loading, empty and error presentation.
- Tables retain bounded horizontal overflow and server/read-model pagination
  where the existing API provides it.

## Route Audit

The workspace covers Overview, Orders, Planning, BOM, Warehouse, Execution,
Reservations, Material Ledger, Material Issues, Consumption and Logs with real
API data. Incidents and Reports remain truthful empty states because no
approved Production workflow/API exists for either capability. No mock rows or
invented commands were added.

## Boundary

No route, API, DTO, React Query key, permission or Production business rule was
changed. Inventory remains the visual reference and was not modified by UI005.
