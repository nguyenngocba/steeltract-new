# UI Standardization Foundation

Date: 2026-06-13

Scope: Sprint 12A frontend presentation refactor only. No API, database, Prisma, or workflow changes.

## Inventory Pattern Audit

Inventory remains the visual reference for SteelTrack module screens.

Current reusable patterns identified from Inventory Overview and Inventory Stock:

- Page header: route title, short operational description, and primary action area.
- KPI cards: compact dark cards with icon/tone, label, value, and note.
- KPI strip: responsive grid of KPI cards with consistent spacing.
- Analytics cards: dark bordered panels for charts, lists, and supporting operational summaries.
- Charts container: panel-based chart areas with compact legends and steady fixed heights.
- Filter bar: dark panel with search, select filters, and action buttons.
- Search input: shared dark input with subtle border and focus state.
- Data grid: dark table shell, consistent header, row hover, and compact action buttons.
- Pagination: footer controls aligned with Inventory table rhythm.
- Empty state: centered muted message/action inside the table or panel surface.
- Loading state: shared skeleton surface for module pages and panels.

## Shared Module UI

Shared module UI primitives now live under:

- `apps/frontend/src/shared/ui/modules/`

Components:

- `ModulePageHeader`
- `ModuleKpiStrip`
- `ModuleKpiCard`
- `ModuleFilterBar`
- `ModuleAnalyticsPanel`
- `ModuleDataGrid`
- `ModuleEmptyState`
- `ModuleLoadingState`

Shared constants:

- `modulePanel`
- `moduleInput`
- `modulePageStack`
- `moduleGridGap`
- `moduleTableShell`
- `moduleTableHead`
- `moduleTableRow`
- `moduleMutedButton`
- `modulePrimaryButton`

Design rules:

- Keep module cards compact, dark, and operational.
- Prefer the Inventory cockpit spacing/radius/table rhythm.
- Keep shared components generic and domain-neutral.
- Module-specific charts, drawers, and workflow actions remain inside each module until a clear cross-module pattern exists.

## Sprint 12A Migration

Inventory:

- Inventory visual wrappers now delegate to shared module primitives.
- Inventory Stock compact KPI cards now use `ModuleKpiCard`.
- Inventory page behavior, API calls, filters, and business logic are unchanged.

Components:

- Components shared cockpit wrappers now delegate to shared module primitives.
- Components List and Components Stock now use Inventory-style page header and lifecycle KPI strip.
- Lifecycle KPIs are presentation-only and derived from existing frontend data:
  `Tổng cấu kiện`, `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED`.

## Sprint 12B Rollout

Production:

- Production Cockpit page header now uses `ModulePageHeader`.
- Main Production KPI strip now uses `ModuleKpiStrip` and `ModuleKpiCard` through production wrappers.
- Production filter bar now uses `ModuleFilterBar`.
- Production analytics panels now use `ModuleAnalyticsPanel` through `ProductionPanel`.
- Primary Manufacturing Order table now uses `ModuleDataGrid`.

Projects:

- Projects page header now uses `ModulePageHeader`.
- Projects filter bar now uses `ModuleFilterBar`.
- Project KPI strip and runtime cards now use `ModuleKpiStrip` and `ModuleKpiCard`.
- Project table shell and empty state now use `ModuleDataGrid` and `ModuleEmptyState`.
- Project Components runtime cards inherit the same shared KPI card foundation.

Yard:

- Yard cockpit page header now uses `ModulePageHeader`.
- Yard KPI strip now uses `ModuleKpiStrip` and `ModuleKpiCard`.
- Yard filter bar now uses `ModuleFilterBar`.
- Yard occupancy, shipment/operation, and trend analytics panels now use `ModuleAnalyticsPanel`.

Sprint 12B remained presentation-only:

- No API changes.
- No workflow changes.
- No database or Prisma changes.

## Sprint 12C Polish And Performance

Shared UI additions:

- `ModuleFilterBar` is sticky by default, keeping search/filter/status controls available while scrolling without changing module data flow.
- `ModuleKpiCard` supports `onClick` and `active` for frontend-only click-to-filter behavior.
- `ModuleEmptyState` supports icon, description, and optional CTA.
- `ModuleLoadingState` supports `kpi`, `table`, and `analytics` skeleton variants.
- `ModuleDetailDrawer` standardizes detail surface width, header, close action, and scroll behavior.

Rollout:

- Inventory Stock KPI cards filter all/low/out stock status on the frontend.
- Components List and Components Stock lifecycle KPI cards filter by `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
- Production Cockpit status KPI cards filter Manufacturing Orders by status.
- Projects Overview and Project Components KPI cards filter frontend rows by project/component status.
- Components and Projects detail surfaces use `ModuleDetailDrawer`.

Performance:

- Active routes use `React.lazy` and `Suspense`.
- Yard 2D and 3D maps are lazy-loaded from the Yard workspace.
- Main bundle dropped to approximately `380 kB`.
- Remaining large chunk is isolated to the lazy 3D Yard map, which is loaded only when the 3D map tab is opened.

## Remaining UI Debt

- Production, Projects, Yard, and QC still need Sprint 12B rollout.
- Inventory-specific chart helpers remain local until at least one more module needs the same chart abstraction.
- Detail drawers and workflow modals remain module-specific.
- Some older module pages still use local card/table styles and should be migrated gradually without changing workflows.
# EPIC UI001 Update (2026-07-17)

`EnterpriseWorkspace` is now the canonical module-root composition derived
from Inventory. Components shares one wrapper across all tabs; Production, QC,
Yard, Projects, Logistics, Suppliers and Administration use the same root
hierarchy. Existing page business/data composition remains module-owned.
