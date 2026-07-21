# EPIC 7.0 Global UI Consistency Report

Date: 2026-07-21

Status: **AUDIT COMPLETE - DOCUMENTATION ONLY**

Reference canon:

- Inventory Overview
- Inventory Materials
- Inventory Inbound
- Inventory Outbound

This report compares visible SteelTrack modules against the current Inventory
UI canon. It does not authorize implementation by itself.

## Executive Summary

The highest-consistency group is Inventory, Components, Production, Projects,
Suppliers and QC. These modules now share the same broad rhythm: KPI row,
filter/search surface, dominant table/hero workspace, right analytics rail and
bottom analytics/empty state area.

The remaining inconsistency is concentrated in three places:

- Missing browser screenshot certification across all modules.
- Logistics and Planning still lag behind the operational workspace standard.
- Admin has real data surfaces but uses mixed UI primitives and incomplete
  pagination.

## Global Difference Matrix

| Module | Page | Component | Difference | Severity | Suggested Fix |
| --- | --- | --- | --- | --- | --- |
| All | All audited pages | Browser certification | No approved authenticated screenshot harness, so visual parity is source-level only. | High | Add an approved Playwright/Chromium visual QA harness and certify core breakpoints. |
| Inventory | Secondary pages | Layout/table/chart | Locations, Transactions, Returns, Transfer, Stock Take, Adjustments, Alerts and Audit are functional but not certified against the four canon pages. | Medium | Run Inventory internal canon pass before declaring every Inventory tab golden. |
| Inventory | Overview | KPI cards | Overview uses a documented older KPI height variant while Materials/Inbound/Outbound use compact `!h-[92px]` cards. | Low | Either freeze Overview as an allowed canon variant or normalize KPI height in a dedicated Inventory polish pass. |
| Inventory | Reports | Route/workspace | No dedicated Inventory Reports workspace exists; reports are embedded in other pages. | Low | Decide whether Inventory Reports should become a first-class route. |
| Components | Overview/List | Browser QA | Source-level parity is strong, but screenshots are still pending. | Medium | Capture authenticated screenshots against Inventory Inbound/Materials. |
| Components | BOM | Route/workspace | BOM is supported through Production/BOM and modal paths, not a dedicated Components BOM workspace. | Medium | Decide whether BOM needs first-class Components route/read model. |
| Components | Ready Queue | Route/workspace | Ready Queue is embedded in overview, not a full route. | Low | Keep embedded if operationally sufficient, or create route after read-contract approval. |
| Components | Analytics | Read/data ownership | Some analytics are derived from read data rather than a certified dashboard/read-model contract. | Medium | Confirm read-model/dashboard ownership before further chart expansion. |
| Production | Running/Completed/Scrap | Route/workspace | These are filters/derived views rather than first-class route tabs. | Medium | Product decision: keep as filters or add routes without duplicating sidebar navigation. |
| Production | Non-order modes | Query/read path | Some workspaces still use legacy query hooks instead of a fully unified Query API path. | Low | Handle in a separate Query API adoption pass, not UI polish. |
| Production | All modes | Browser QA | EPIC 3.2 finalized source-level readiness, but screenshot certification is pending. | Medium | Capture authenticated screenshots for all visible Production modes. |
| Projects | Timeline | Route/workspace | Timeline appears in detail drawer/logs, not a first-class route. | Medium | Decide whether Timeline belongs in sidebar or should remain entity-level context. |
| Projects | Budget | Labeling | Requested Budget maps to implemented Costs route. | Low | Align route label if product wording chooses Budget. |
| Projects | Attachments/photos | Empty state | Detail attachment/photo surfaces remain empty until backend contracts exist. | Low | Define read contract before replacing controlled empty states. |
| Suppliers | Purchase/Payables/Reports | Empty capability workspace | Several tabs are complete empty workspaces because no read contracts exist. | Medium | Define supplier read contracts before adding data widgets. |
| Suppliers | Ranking/Performance | Analytics depth | Ranking/performance exists mainly through right rail and Quality view, not a dedicated full BI page. | Low | Expand after supplier evaluation contract matures. |
| QC | Pending/Passed/Failed | Route/workspace | These are status-filter workflows, not first-class routes. | Medium | Product/navigation decision before adding route tabs. |
| QC | Calibration | Empty state | Calibration is intentionally empty due to missing backend read contract. | Low | Define calibration read contract before UI data work. |
| QC | Tables | Browser QA | Shared table shell and pagination are implemented, but screenshot parity remains pending. | Medium | Capture screenshots for `/qc`, `/qc/production`, `/qc/inbound`, `/qc/final` and NCR/report routes. |
| Logistics | Vehicles | Route/workspace | `/logistics/vehicles` falls back instead of rendering a distinct workspace. | High | Add real vehicle workspace only after logistics vehicle read contract is approved, or remove route. |
| Logistics | Planning | Route/workspace | `/logistics/planning` falls back instead of rendering distinct planning workspace. | High | Add real logistics planning workspace/read contract, or remove route. |
| Logistics | Dispatch table | Pagination/table density | Dispatch table lacks certified standard pagination and stable empty rows. | Medium | Add shared `DataTablePagination` or equivalent approved component. |
| Logistics | Filters | Toolbar/filter | Search exists, but status/date/project/vehicle filters are missing. | Medium | Add only filters supported by the current API contract. |
| Logistics | Logs/Reports | Route behavior | Logs/reports routes need explicit branch behavior rather than fallback-like behavior. | Medium | Define route behavior and data ownership before UI rollout. |
| Planning | Module route | Visibility | Planning source files exist but no visible `/planning` route is registered in the audited router. | High | Decide whether to register Planning or intentionally hide it. |
| Planning | All pages | Certification | KPI/table/filter/chart states cannot be certified as visible UI. | High | Activate route first, then perform focused Planning UI audit. |
| Admin | Settings | UI primitives | Settings still uses local panel/input/action/table classes in places. | Medium | Normalize to shared Enterprise/Inventory primitives. |
| Admin | Users/Roles | Pagination | Users and Roles use real data but lack standard pagination. | Medium | Add approved shared pagination after API/client paging decision. |
| Admin | Security capabilities | Empty states | MFA, sessions, API tokens, devices and IP whitelist are empty capability states. | Low | Define security read contracts before data UI. |
| Admin | System Logs | Audit coverage | System Logs exists but needs a focused Admin/Security audit. | Medium | Include System Logs in Admin security UI audit. |

## Category Findings

### Layout

PASS at source level for Inventory, Components, Production, Projects,
Suppliers and QC. Logistics is close but not canon-equal. Planning is not
visible. Admin is mixed.

### Spacing And Typography

The mature modules mostly use shared cockpit/module primitives. Remaining risk
is in Settings, Logistics and secondary Inventory pages where local classes or
older variants still exist.

### KPI Cards

Most operational modules use `CockpitKpiCard`. Remaining drift:

- Inventory Overview older KPI variant.
- Admin Settings `MiniKpi`.
- Logistics needs screenshot verification for exact height/spacing.

### Tables And Pagination

Strong in Inventory, Components, Production, Projects, Suppliers and QC. Open
gaps:

- Logistics dispatch pagination/empty rows.
- Admin Users/Roles pagination.
- Secondary Inventory certification.

### Empty States

Controlled empty states are now preferred across Suppliers, QC, Projects and
Production. Remaining debt is mostly backend-contract related, not fake data.

### Responsive And Scroll Behavior

Source-level structure suggests consistency in the mature modules, but this
cannot be certified without browser screenshots at standard breakpoints.

## Certification Status

| Module | Source-level UI consistency | Browser certification | Overall |
| --- | --- | --- | --- |
| Inventory | Strong | Pending for secondary pages | Conditional |
| Components | Strong | Pending | Conditional |
| Production | Strong | Pending | Conditional |
| Projects | Strong | Pending | Conditional |
| Suppliers | Strong | Pending | Conditional |
| QC | Improved/Strong | Pending | Conditional |
| Logistics | Partial | Pending | Not ready |
| Planning | Not visible | Not possible | Not ready |
| Admin | Partial | Pending | Conditional |

