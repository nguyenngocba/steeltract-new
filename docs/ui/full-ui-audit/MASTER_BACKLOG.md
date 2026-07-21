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
| Components | 78% | Overview/List aligned source-level; secondary tabs and BOM/Ready Queue need finish. |
| Production | 72% | Broad real-data cockpit exists; per-mode parity and Machines gap remain. |
| Projects | 68% | Rich real-data workspaces exist; branch-level parity and timeline/report polish pending. |
| Suppliers | 55% | Real list/quality data exists, but several tabs are controlled empty states and local UI classes remain. |
| QC | 62% | Real QC workspace exists; pagination, local primitives and empty calibration remain. |
| Logistics | 58% | Real dispatch data exists; vehicles/planning/logs/reports and pagination/filtering gaps remain. |
| Planning | 20% | Source files exist but no visible route is registered in the audited router. |
| Admin | 64% | Settings/Users/Roles are real-data surfaces; security/admin gaps and pagination remain. |

## P0 Critical

| ID | Issue | Module | Status | Severity | Complexity | Dependency |
| --- | --- | --- | --- | --- | --- | --- |
| UI-P0-001 | Browser screenshot harness unavailable, blocking true visual certification across modules | All | Open | High | M | Approved Chromium/Playwright harness |
| UI-P0-002 | Planning module has no visible registered route despite requested module scope | Planning | Open | High | S/M | Product navigation decision |
| UI-P0-003 | Logistics `/vehicles` and `/planning` routes fall back instead of rendering distinct requested workspaces | Logistics | Open | High | M/L | Logistics read contracts or route removal decision |

## P1 Production-Ready

| ID | Issue | Module | Status | Severity | Complexity | Dependency |
| --- | --- | --- | --- | --- | --- | --- |
| UI-P1-001 | Secondary Inventory pages need internal canon certification | Inventory | Open | Medium | M | Screenshot harness |
| UI-P1-002 | Certify secondary Components tabs against Inventory canon | Components | Open | Medium | L | Screenshot harness |
| UI-P1-003 | Components BOM workspace is partial and not Inventory-canon certified | Components | Open | Medium | M | Components BOM read model/UI decision |
| UI-P1-004 | Production per-mode tables need height, pagination and empty-row parity certification | Production | Open | High | L | Screenshot harness |
| UI-P1-005 | Production Machines workspace missing or not route-visible | Production | Open | Medium | M | Machine read contract/navigation decision |
| UI-P1-006 | Projects per-branch visual parity not certified | Projects | Open | High | L | Screenshot harness |
| UI-P1-007 | Replace Suppliers local panel/table/filter classes with shared Inventory/Enterprise primitives | Suppliers | Open | High | M | Shared component decision |
| UI-P1-008 | Add standard Supplier table pagination | Suppliers | Open | Medium | M | API/client pagination decision |
| UI-P1-009 | Add/verify QC pagination instead of rendering up to `limit: 100` rows | QC | Open | High | M | QC read model pagination contract |
| UI-P1-010 | Normalize QC panel/table primitives to Inventory/Enterprise shared surfaces | QC | Open | Medium | M | UI standard decision |
| UI-P1-011 | Add Logistics standard filters beyond search | Logistics | Open | Medium | M | API filter support |
| UI-P1-012 | Add Logistics pagination and empty rows to dispatch table | Logistics | Open | Medium | M | API or client pagination |
| UI-P1-013 | Audit existing Planning workspace after route decision | Planning | Open | Medium | M | Route activation |
| UI-P1-014 | Normalize Admin Settings local UI classes to shared primitives | Admin | Open | Medium | M | UI standard decision |
| UI-P1-015 | Add Users/Roles standard pagination | Admin | Open | Medium | M | API/client pagination decision |

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
