# Inventory Design Pattern Analysis

Inventory defines a dense operational cockpit rather than a marketing page.

| Layer | Canonical pattern |
|---|---|
| Shell | `OperationalShell` with dark radial/linear workspace background |
| Hierarchy | breadcrumb/eyebrow, compact H1, one-line description, right actions |
| Navigation | horizontally scrollable module tabs with one blue active state |
| KPI | compact responsive strip using `CockpitKpiCard` |
| Analytics | framed `CockpitChartCard` with real empty state |
| Filters | controlled inputs inside `ModuleFilterBar` |
| Table | `CockpitTableShell`, fixed headers and shared pagination |
| Detail | right `ModuleDetailDrawer`; centered placement for complex modal work |
| States | shared skeleton, truthful empty/error/offline/permission states |

The page owns data and domain semantics. Shared components own spacing,
surface, hierarchy and responsive behavior. No shared component fetches data or
calculates business metrics.
