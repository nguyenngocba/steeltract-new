# UI Consistency Checklist

- [x] Inventory remains the only visual canon.
- [x] Active target modules use the enterprise workspace hierarchy.
- [x] Breadcrumb, title, description and primary actions share one contract.
- [x] Route tabs and local Settings tabs share one responsive surface.
- [x] KPI framework delegates to `CockpitKpiCard`.
- [x] Existing shared chart, table, filter, pagination and drawer primitives remain canonical.
- [x] Loading, empty, no-permission, error and offline states have shared presentations.
- [x] No API, React Query, workflow or business calculation moved into shared UI.
- [x] Inventory application pages were not redesigned.
- [x] Frontend TypeScript/build passed after rollout.

Visual review must still cover real long labels, narrow mobile viewports and
modal focus behavior during the later pixel-polish/accessibility phase.
