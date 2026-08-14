# SYSTEM.PRODUCT.AUDIT.1 - UI and UX Audit

Audit date: 2026-08-14  
Runtime: real local backend, database and authenticated admin browser session

## Browser evidence

Playwright/Chromium loaded 17 representative routed workspaces at each of:

- 1366x768
- 1440x900
- 1600x900
- 1920x1080

Result: **68/68 route-viewports rendered; 0 page errors; 0 console errors; 0
document-level horizontal overflow.** Ephemeral screenshots and machine results
were retained under `/tmp/steeltrack-product-audit1` for this audit session.

This proves render stability, not operational correctness. No create/edit/delete
action was executed because this sprint is audit-only.

## Cross-module scorecard

| Workspace | Operability | Readability | Consistency | Density | Error prevention | Status |
|---|---|---|---|---|---|---|
| Dashboard | YELLOW | YELLOW | GREEN | YELLOW | YELLOW | YELLOW |
| History | GREEN | GREEN | GREEN | GREEN | GREEN | GREEN |
| Inventory | GREEN | GREEN | GREEN | GREEN | GREEN | GREEN |
| Components | YELLOW | YELLOW | GREEN | GREEN | YELLOW | YELLOW |
| Finished Goods | GREEN | GREEN | GREEN | YELLOW | GREEN | GREEN |
| Production | GREEN | YELLOW | GREEN | GREEN | GREEN | YELLOW |
| QC | GREEN | YELLOW | GREEN | GREEN | GREEN | YELLOW |
| Yard | GREEN | YELLOW | GREEN | GREEN | GREEN | YELLOW |
| Logistics | GREEN | YELLOW | GREEN | GREEN | GREEN | YELLOW |
| Projects | GREEN | YELLOW | GREEN | GREEN | YELLOW | YELLOW |
| Suppliers | RED | YELLOW | GREEN | GREEN | RED | RED |
| Procurement | RED | YELLOW | RED | RED | RED | RED |
| Settings/Master Data | GREEN | GREEN | YELLOW | GREEN | GREEN | YELLOW |
| Users/Roles | GREEN | GREEN | GREEN | GREEN | GREEN | GREEN |
| Operations Center | GREEN | GREEN | GREEN | GREEN | GREEN | GREEN |

## What is consistent

- Shared `EnterpriseWorkspace`/`EnterpriseModulePage`, `CockpitKpiCard`,
  `CockpitTableShell`, `ModuleDetailDrawer` and shared pagination are widely
  reused (14-33 active pages/components per primitive).
- The cockpit palette, compact rows, sticky table headers, status badges and
  right-side analytics are visually coherent across Inventory, Production,
  Components, QC, Yard, Logistics and Projects.
- All audited widths avoid page-level horizontal scroll.
- Real loading/empty-state primitives are present in core operational modules.

## P0 UI/UX findings

### U-01 - Procurement is a disconnected prototype

- Severity: **RED / P0**
- It uses a different black/zinc card design, oversized English title, 24px
  padding and large rounded cards instead of the Industrial Cockpit system.
- KPI values 28/16/9/5, supplier names/scores and purchase orders are static.
- No toolbar, filters, table, pagination, loading, error or empty state exists.
- Empty `CostInsightPanel` and `SupplierRuntimeTable` components confirm an
  unfinished routed workspace.

### U-02 - Suppliers presents generated rows as operational facts

- Severity: **RED / P0**
- Quotes, POs, deliveries, payables, activity logs and reports are generated
  from Supplier rows or hardcoded fallbacks in `SuppliersPage.tsx`.
- The UI is polished enough to appear authoritative, increasing decision risk.
- Replace with real APIs or controlled `Chưa có dữ liệu`; do not retain visual
  fake rows as examples in the active route.

### U-03 - Dashboard filters overpromise their scope

- Severity: **RED / P0**
- The global date/warehouse/project controls visually imply all KPI/chart data
  is filtered. Several KPI remain current snapshot/month values or filter only
  client-side loaded lists.
- The UI needs explicit live/as-of semantics or API-backed filter propagation.

## P1 visual and usability findings

| Finding | Browser evidence | Recommendation |
|---|---|---|
| Header truncation at 1366px | Suppliers, Production, Components, Yard, Projects and QC titles render as `Workspace ...` ellipses because global search/actions consume the row. | Give title a stable minimum, collapse secondary topbar controls, and expose full title via tooltip/accessible name. |
| KPI labels truncate aggressively | Six-card rows show partial uppercase labels; Dashboard project card also renders long fixture code inside sparkline area. | Keep a fixed KPI contract: short title, separate value/unit, no raw entity identifiers in sparkline labels. |
| Terminology is mixed | `WAITING QC`, `PASSED`, `USE-AS-IS`, `SCRAP`, `Instance`, `Component`, `Production Order`, `READY TO RELEASE` coexist with Vietnamese text. | Publish a Vietnamese domain glossary; preserve codes only in secondary text/tooltips. |
| Fixture codes dominate tables | Long `SYSTEM-*` values consume the first columns in every module. | Clean fixture data for UAT and preserve ellipsis/title behavior. |
| Sidebar consumes ~279px at 1366 | Main work area becomes compressed although document overflow is prevented. | Default compact sidebar for operational roles or persist user preference. |
| Logistics status cells show icon-like empty circles on some rows | Captured in the 1366 Logistics table. | Ensure every canonical return status has a label/tone mapping and accessible text. |
| Yard charts expose internal language | `movement thật`, `slot bãi tập kết`, mixed code labels. | Replace developer wording with operator terminology. |
| Emoji remain in active operational UI | Production empty state uses `📦`; Inventory warning/success messages use `⚠️`/`✅`; Projects default template uses `★`. | Use Lucide/shared status icons with `aria-hidden` and adjacent text. |
| Giant page components | Production 4,245 lines, Suppliers 4,180, Projects 3,975, Dashboard 2,709. | Split by tab/read model/action boundary without changing visual behavior. |

## Forms, feedback and accessibility

- Core operational forms use labels, validation pipes and shared feedback, but
  full destructive-action and keyboard workflows were not executed in this
  read-only sprint.
- Route-level access, button counts and rendered controls were inspected; a
  complete WCAG keyboard/screen-reader certification remains P1.
- Icon-only toolbars generally have titles/labels in newer shared components;
  legacy inline buttons and emoji are inconsistent.

## UI scores

**UI Consistency: 78/100**  
**UX Usability: 73/100**

The operational cockpit foundation is coherent and stable at all requested
desktop widths. Procurement, fake Supplier sub-workspaces, misleading global
filters, title truncation and mixed terminology prevent an enterprise-grade
rating.
