# EPIC 0.5 Master Backlog Prioritization

This backlog is documentation-only. It uses the completed UI audit as the source of truth.

## Priority Rules

- **P0 Critical**: must complete before moving to the next module. Examples: missing visible page, broken layout, mock/fake data, wrong pagination, missing required table/filter/KPI/backend integration.
- **P1 Production-ready**: required before a module can be considered production-ready. Examples: loading/empty states, export, search, sorting, modal, drawer, validation.
- **P2 Future**: useful improvements after production readiness. Examples: realtime, animation, drill-down, advanced BI, AI.

## Current Completion

| Module | Completion | Basis |
| --- | ---: | --- |
| Inventory | 88% | Four canon pages are strong; secondary pages and reports need certification. |
| Components | 90% | Overview/List and secondary tabs are source/build aligned to Inventory canon; browser visual certification and future route decisions remain. |
| Production | 90% | EPIC 3.2 source/build finalization confirms P0/P1 workspaces are production-ready at source level. Browser visual certification and P2 route/query decisions remain. |
| Projects | 84% | EPIC 4.0 source/build completion aligns active branches to the Inventory canon; authenticated browser certification and P2 route decisions remain. |
| Suppliers | 82% | EPIC 5.0 source/build completion aligns active Supplier list/quality and empty capability workspaces to the Inventory canon; browser certification and backend read contracts remain. |
| QC | 82% | EPIC 6.0 source/build completion adds shared pagination/table shell treatment and removes inert/synthetic UI; browser certification and route/calibration decisions remain. |
| Logistics | 90% | EPIC 8.0 source/build completion aligns all Logistics tabs/routes to the SteelTrack UI Canon with shared pagination, filters, and workspaces; browser certification remains. |
| Planning | 90% | EPIC 9.0 source/build completion registers all Planning tabs/routes and aligns workspace UI to the SteelTrack UI Canon using real data; browser QA pending. |
| Admin | 90% | EPIC 10.0 source/build completion standardizes Settings, Users, Roles, and System Logs to the SteelTrack UI Canon with shared pagination, CockpitKpiCards, and CockpitTableShells; browser QA pending. |

## P0 Critical

| ID | Issue | Module | Status | Severity | Complexity | Dependency |
| --- | --- | --- | --- | --- | --- | --- |
| UI-P0-001 | Browser screenshot harness unavailable, blocking true visual certification across modules | All | Open | High | M | Approved Chromium/Playwright harness |
| UI-P0-002 | Planning module has no visible registered route despite requested module scope | Planning | Implemented (EPIC 9.0) | High | S/M | Product navigation decision |
| UI-P0-003 | Logistics `/vehicles` and `/planning` routes fall back instead of rendering distinct requested workspaces | Logistics | Implemented (EPIC 8.0) | High | M/L | Logistics read contracts or route removal decision |
| UI-P0-004 | EPIC 7.0 global consistency certification remains source-level only without screenshot proof | All | Open | High | M | UI-P0-001 |

## P1 Production-Ready

| ID | Issue | Module | Status | Severity | Complexity | Dependency |
| --- | --- | --- | --- | --- | --- | --- |
| UI-P1-001 | Secondary Inventory pages need internal canon certification | Inventory | Open | Medium | M | Screenshot harness |
| UI-P1-002 | Certify secondary Components tabs against Inventory canon | Components | Implemented - browser QA pending | Medium | S | Screenshot harness |
| UI-P1-003 | Components BOM workspace is partial and not Inventory-canon certified | Components | Implemented - route decision deferred | Medium | S | Components BOM read model/UI decision |
| UI-P1-004 | Production per-mode tables need height, pagination and empty-row parity certification | Production | Implemented - EPIC 3.2 finalized, browser QA pending | High | L | Screenshot harness |
| UI-P1-005 | Production Machines workspace missing or not route-visible | Production | Implemented | Medium | M | Existing machine read contract |
| UI-P1-006 | Projects per-branch visual parity not certified | Projects | Implemented - browser QA pending | High | M | Screenshot harness |
| UI-P1-007 | Replace Suppliers local panel/table/filter classes with shared Inventory/Enterprise primitives | Suppliers | Implemented - browser QA pending | High | M | Screenshot harness |
| UI-P1-008 | Add standard Supplier table pagination | Suppliers | Implemented | Medium | S | Existing client-side read data |
| UI-P1-009 | Add/verify QC pagination instead of rendering up to `limit: 100` rows | QC | Implemented - browser QA pending | High | M | QC read model pagination contract |
| UI-P1-010 | Normalize QC panel/table primitives to Inventory/Enterprise shared surfaces | QC | Implemented at table/pagination level - browser QA pending | Medium | M | UI standard decision |
| UI-P1-011 | Add Logistics standard filters beyond search | Logistics | Implemented (EPIC 8.0) | Medium | M | API filter support |
| UI-P1-012 | Add Logistics pagination and empty rows to dispatch table | Logistics | Implemented (EPIC 8.0) | Medium | M | API or client pagination |
| UI-P1-013 | Audit existing Planning workspace after route decision | Planning | Implemented (EPIC 9.0) | Medium | M | Route activation |
| UI-P1-014 | Normalize Admin Settings local UI classes to shared primitives | Admin | Implemented (EPIC 10.0) | Medium | M | UI standard decision |
| UI-P1-015 | Add Users/Roles standard pagination | Admin | Implemented (EPIC 10.0) | Medium | M | API/client pagination decision |
| UI-P1-016 | Logistics logs/reports need explicit route branch behavior instead of fallback-like behavior | Logistics | Implemented (EPIC 8.0) | Medium | M | Logistics log/report contracts |
| UI-P1-017 | Secondary Inventory pages need table/scroll/pagination parity review after global audit | Inventory | Open | Medium | M | Browser harness |
| UI-P1-018 | Admin System Logs needs focused security/admin UI audit | Admin | Implemented (EPIC 10.0) | Medium | M | Security audit scope |

## P2 Future Improvements

| ID | Issue | Module | Status | Severity | Complexity | Dependency |
| --- | --- | --- | --- | --- | --- | --- |
| UI-P2-001 | Dedicated Inventory Reports workspace absent | Inventory | Open | Medium | M | Inventory report read model/API |
| UI-P2-002 | Inventory Overview KPI variant differs from `!h-[92px]` cards | Inventory | Open | Low | S | Design decision |
| UI-P2-003 | Components Ready Queue lacks full workspace route | Components | Open | Medium | M | Route/API decision |
| UI-P2-004 | Components derived analytics should be reviewed for read-model/dashboard ownership | Components | Open | Medium | M | Read-model/dashboard contract |
| UI-P2-005 | Production Running/Completed/Scrap are filters or derived states, not first-class route tabs | Production | Open | Medium | M | Sidebar/route decision |
| UI-P2-006 | Production non-order modes still use legacy query paths | Production | Open | Medium | M | Query API adoption plan |
| UI-P2-007 | Projects Timeline is not a first-class route | Projects | Open | Medium | M | Route/sidebar decision |
| UI-P2-008 | Project `Budget` requested label differs from implemented `Costs` route | Projects | Open | Low | S | Label decision |
| UI-P2-009 | Project attachment/photo empty states need backend contract to become real data | Projects | Open | Medium | M | Backend read contract |
| UI-P2-010 | Supplier Quotes/PO/Deliveries/Payables/Reports are empty capability states | Suppliers | Open | Medium | L | Supplier read contracts |
| UI-P2-011 | Supplier Ranking/Performance needs full dashboard layout | Suppliers | Open | Medium | M | Supplier evaluation contract |
| UI-P2-012 | QC Pending/Passed/Failed are filters, not first-class route tabs | QC | Open | Medium | M | Sidebar/filter route decision |
| UI-P2-013 | QC Calibration remains empty | QC | Open | Medium | M/L | Calibration backend/read contract |
| UI-P2-014 | Logistics logs/reports routes need explicit branch behavior | Logistics | Open | Medium | M | Log/report contracts |
| UI-P2-015 | Planning Schedule workspace missing as visible page | Planning | Open | Medium | M/L | Planning schedule read contract |
| UI-P2-016 | Admin Dashboard naming maps to Settings overview | Admin | Open | Low | S/M | Navigation decision |
| UI-P2-017 | Admin security capabilities are empty states | Admin | Open | Medium | L | Security backend contracts |
| UI-P2-018 | System Logs should be included in a dedicated Admin/Security visual audit | Admin | Open | Medium | M | Security audit scope |

## Recommended Sequencing

1. Finish Inventory and establish screenshot harness/baseline.
2. Finish Components because it is already closest to Inventory after source-level parity work.
3. Finish Production before lower-maturity operational modules.
4. Finish Projects, Suppliers, QC and Logistics in that order unless business priority changes.
5. Decide Planning visibility before UI implementation.
6. Finish Admin after core operational modules unless a security/compliance release pulls it forward.

## EPIC 7.0 Global UI Consistency Audit Addendum

Generated on 2026-07-21.

Primary outputs:

- `docs/ui/global-ui-consistency-report.md`
- `docs/ui/global-design-debt.md`

Summary:

- Inventory, Components, Production, Projects, Suppliers and QC are
  source-level aligned to the Enterprise UI canon, but remain conditional until
  authenticated screenshots certify spacing, scroll and responsive behavior.
- Logistics and Planning contain the highest remaining visible consistency
  risk.
- Admin is real-data capable but still has mixed primitives and pagination
  gaps.
