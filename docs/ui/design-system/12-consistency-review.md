# 12. Inventory Consistency Review

## Method

The review covers active Inventory routes and shared primitives they import.
Legacy/stub files were recorded but excluded from the canon.

## Findings

| Severity | Inconsistency | Canonical direction |
| --- | --- | --- |
| High | `InventoryTabWorkspace` returns `null`, so active tabs lack consistent breadcrumb/header hierarchy | Use `EnterpriseWorkspace` and `ModulePageHeader` in a separate approved rollout |
| High | Modal/drawer accessibility lacks uniform dialog role, focus trap, Escape and restoration | Centralize overlay behavior before cross-module adoption |
| High | Browser `window.confirm` is used for delete/dirty state | Use enterprise confirmation dialog |
| Medium | KPI implementations exist at 108, 118 and 128px plus legacy cards | Standardize on operational 108 and executive 128 variants |
| Medium | `InventoryPagination` duplicates `DataTablePagination` | Adopt shared pagination only |
| Medium | Inputs use 32, 36 and 44px without consistently documented context | Apply dense/filter/form size rules |
| Medium | Forms often rely on placeholder instead of visible labels | Add persistent labels and error associations |
| Medium | Tables vary in sticky header, keyboard row action and shell borders | Apply DataTable composition and accessibility contract |
| Medium | Charts mix custom SVG, CSS, Recharts, static data and empty stubs | Only active real-data charts are references; converge container/state rules |
| Medium | `MaterialDrawer` is a centered modal despite its name | Classify overlays by behavior and rename only in a later refactor |
| Low | Compact pages mix `gap-1` with standard `gap-3/4` and occasional larger gaps | Keep one density per visual band |
| Low | Close/edit/delete actions mix text, Lucide icons and emoji | Use Lucide icons plus accessible names/tooltips |
| Low | Radius varies from 6px to 24px in legacy surfaces | Use tokenized 6/8/12/16px scale; no new 24px cards |
| Low | Focus CSS is injected independently in modal portals | Move to shared control/overlay focus tokens |
| Low | Timeline implementations use tables, custom rows and a helper named `mockDataOffsetDotHack` | Use ordered semantic timeline standard |

## UI003 Remediation Status

UI003 resolved the active-route header hierarchy, page rhythm, KPI wrapper,
duplicate pagination algorithm, active browser confirmations and shared
transaction modal/detail drawer accessibility contract. It also added sticky
Inventory table headers and deterministic donut rendering. Placeholder-only
labels in legacy Location forms, specialized local report overlays and
pixel/screen-reader runtime certification remain explicitly recorded rather
than being treated as canonical behavior.

## Non-canonical Inventory Files

The repository contains parallel generations: old `InventoryPage`, empty
workspace/pages, static telemetry, null chart/table components and placeholder
feature folders. They are not approved UI patterns even though they live inside
the Inventory module.

## Recommended Sequence

1. Treat this documentation and existing `shared/ui/cockpit`/`modules` as the
   implementation contract for new modules.
2. Add overlay/accessibility primitives in a dedicated shared-component sprint.
3. Replace duplicate Inventory wrappers incrementally without visual change.
4. Add Storybook/component tests only through a separately approved tooling
   decision; no new framework is introduced here.
5. Validate active Inventory pages with desktop/mobile screenshots and keyboard
   navigation before claiming pixel-level certification.

## UI002 Decision

Inventory is the Golden Standard for operational composition, density, dark
surface language, KPI/table/filter philosophy and read-after-write feedback. It
is not a blanket approval of every file or inconsistency inside the module.
