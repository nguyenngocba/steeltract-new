# SteelTrack Enterprise UI Design System

Status: **CANON EXTRACTED - DOCUMENTATION STANDARD**  
Reference implementation: **Inventory active routes**

## Authority

This design system governs future Production, QC, Yard, Logistics, Projects,
Suppliers and Administration presentation. It extracts Inventory's mature
operational language without redesigning Inventory or changing business/API
behavior.

Source priority:

1. this design-system documentation;
2. `EnterpriseModulePage` and `EnterpriseWorkspace`;
3. `shared/ui/cockpit`;
4. `shared/ui/modules`;
5. active Inventory `pages/tabs/*` implementations;
6. legacy/stub Inventory files are excluded.

## Enterprise Page Contract

Every module page uses the shared shell, max-width workspace, breadcrumb/header,
optional tabs, KPI band, toolbar, bounded primary surface, supporting analytics
and shared overlays. Workspace pages are dense, quiet and optimized for repeated
operator action. They are not landing pages.

## Component Contract

- KPI: `CockpitKpiCard`, operational or executive variant.
- Chart: `CockpitChartCard` with explicit height and complete states.
- Toolbar: `ModuleFilterBar` with search/filter/action hierarchy.
- Table: `CockpitTableShell`/module shell plus `DataTablePagination`.
- State: shared loading/empty/no-permission/error/offline components.
- Detail: `ModuleDetailDrawer`.
- Form/command modal: shared overlay behavior and Inventory transaction layout.
- Icons: Lucide where available; icon actions require accessible names.

Do not create `ProductionKpiCard`, `QcToolbar`, `YardPagination` or equivalent
module-specific layout primitives.

## Visual Language

Dark neutral/slate surfaces, restrained cyan borders, blue primary actions and
semantic emerald/amber/red accents define the system. Typography is Inter with
compact 10-14px operational text, 24px page titles and stable KPI values. The
spacing scale is 4/8/12/16/24/32px and major cards/overlays use a 16px radius.

## Interaction Contract

Server state changes only after confirmed commands. Loading preserves geometry;
failure preserves operator input; toast communicates transient outcome while
timeline/audit carries durable history. Every workflow is keyboard reachable,
has visible focus and distinguishes empty, filtered-empty, offline, forbidden
and error states.

## Responsive Contract

Base layouts stack, tables/tabs scroll within their own surface, overlays become
full-width, and stable font/control dimensions remain unchanged. `md` introduces
KPI/form columns, `xl` operator splits and `2xl` large analytics refinements.

## Adoption Gate

A module is UI-compliant only when:

- it reuses shared primitives and tokens;
- it follows the page hierarchy and density rules;
- tables/forms/overlays implement required states and accessibility;
- no synthetic KPI/trend is presented as real data;
- desktop/mobile screenshots show no overlap or overflow;
- it introduces no module-specific duplicate of a canonical component.

Detailed standards:

1. [Workspace](./01-workspace.md)
2. [KPI cards](./02-kpi-cards.md)
3. [Charts](./03-charts.md)
4. [Data tables](./04-data-table.md)
5. [Forms](./05-forms.md)
6. [Drawers](./06-drawers.md)
7. [Modals](./07-modals.md)
8. [Timeline](./08-timeline.md)
9. [Design tokens](./09-design-tokens.md)
10. [Interactions](./10-interactions.md)
11. [Responsive](./11-responsive.md)
12. [Consistency review](./12-consistency-review.md)

