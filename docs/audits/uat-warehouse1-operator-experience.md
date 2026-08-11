# UAT.WAREHOUSE.1 - Warehouse Operator Experience

Date: 2026-08-11  
Role: `warehouse_demo` / Warehouse Operator  
Mode: real browser, real API, no mocks, no direct database mutation

## Result

**Operational UAT: NO-GO**

The authenticated UI is stable and the Inventory command forms are now
accessible, compact and free from viewport-wide horizontal overflow. The
requested end-to-end warehouse workflow cannot complete in the current runtime:

- Warehouse Operator cannot access Suppliers or create a supplier.
- The reset runtime contains zero suppliers, so Receipt cannot be submitted.
- Without Receipt there is no source stock for Transfer or Production Issue.
- Inventory exposes no Production Return command for this role.
- Inventory exposes no Supplier Return command, although backend domain support
  for `SUPPLIER_RETURN` exists.

No permission, API, workflow or business rule was changed to hide these gaps.

## Runtime Evidence

Playwright: `apps/frontend/e2e/warehouse-operator-uat.spec.ts`

- Browser result: 1/1 PASS
- React runtime exceptions: 0
- Failed browser requests: 0
- Horizontal page overflow: 0 px on all measured screens
- Unlabelled controls in Receipt/Transfer/Issue/Count dialogs: 0 after fixes
- Runtime supplier options: 0
- Runtime material options: 1
- Transfer source locations with stock: 0
- Production Issue source locations with stock: 0

## Workflow

| # | Scenario | Result | Evidence |
|---|---|---|---|
| 1 | Login | PASS | Real Warehouse Operator JWT and landing page |
| 2 | Dashboard | PASS | Inventory visible; Production, QC and System hidden |
| 3 | Create Supplier | BLOCKED P0 | `/suppliers/list` resolves to Unauthorized for this role |
| 4 | Create Receipt | BLOCKED P0 | Supplier picker has zero records |
| 5 | Receive material | BLOCKED P0 | Depends on valid Receipt |
| 6 | Put away to Location | BLOCKED P0 | Depends on valid Receipt |
| 7 | Move Location | BLOCKED P0 | One material exists but no source location has stock |
| 8 | Issue to Production | BLOCKED P0 | Production destination exists; source balance does not |
| 9 | MAIN to/from another Warehouse | BLOCKED P0 | No source balance; current transfer picker uses receipt-capable main zones |
| 10 | Inventory Count | NOT EXECUTED | Form verified; UAT did not manufacture stock outside the required chain |
| 11 | Reverse Production Return | BLOCKED P0 | Command exists only inside inaccessible Production UI |
| 12 | Return Supplier | BLOCKED P0 | No Inventory frontend command |
| 13 | Export | PASS | Real CSV download completed |
| 14 | Logout | PASS | UI logout returned to `/login` |

## Screenshots

1. [Login and landing](screenshots/uat-warehouse1/01-login-dashboard.png)
2. [Warehouse RBAC dashboard](screenshots/uat-warehouse1/02-dashboard-rbac.png)
3. [Supplier access blocked](screenshots/uat-warehouse1/03-create-supplier-blocked.png)
4. [Receipt form](screenshots/uat-warehouse1/04-receipt-form.png)
5. [Transfer form](screenshots/uat-warehouse1/05-transfer-form.png)
6. [Production Issue form](screenshots/uat-warehouse1/06-production-issue-form.png)
7. [Inventory Count form](screenshots/uat-warehouse1/07-inventory-count-form.png)
8. [Production Return command missing](screenshots/uat-warehouse1/08-production-return-missing.png)
9. [Supplier Return command missing](screenshots/uat-warehouse1/09-supplier-return-missing.png)
10. [Transaction export](screenshots/uat-warehouse1/10-export.png)
11. [Logout](screenshots/uat-warehouse1/11-logout.png)

## UX Findings

### P0

1. Supplier creation conflicts with the approved Warehouse Operator permission
   profile. This requires a product/RBAC decision, not a visual fix.
2. Production Return is not reachable from the Inventory workspace for the
   operator responsible for warehouse custody.
3. Supplier Return has no Inventory presentation-layer command.
4. The clean RC1 runtime cannot begin warehouse UAT because it has no supplier.
   A controlled master-data prerequisite or approved setup workflow is needed.

### P1

1. Global commands and Overview quick filters used identical accessible names,
   making keyboard/assistive selection ambiguous.
2. Receipt, Issue and Transfer controls had 8-11 unnamed inputs/selects per
   dialog.
3. Pending-line actions used emoji instead of the shared icon language.
4. Inventory Count silently ignored submission when no difference existed and
   did not provide a success confirmation.
5. The `Khác` command menu lacked menu semantics and Escape handling.

### P2

1. Receipt and Transfer require internal dialog scrolling at 1280x720. The
   implementation has one scroll owner and no clipping, but a future workflow
   review may reduce secondary panels for short-height screens.
2. Receipt/Issue/Transfer currently use a pending-line step before confirmation;
   this is explicit and safe but adds one click for single-line transactions.

## UI Fixes Applied

- Compacted global Inventory commands to the 36px cockpit control standard.
- Added Lucide icons and unique accessible names to Receipt and Issue commands.
- Added WAI-ARIA menu state/roles and Escape close behavior to `Khác`.
- Added accessible names to all tested Receipt, Issue, Transfer and Count fields.
- Replaced pending-row edit/delete emoji with labelled Lucide icon buttons.
- Added attachment category and removal labels.
- Added explicit Inventory Count validation, success and error feedback.
- Added an accessible account-menu trigger for reliable keyboard/browser use.

These changes are presentation and interaction feedback only. Transaction
payloads, API calls, permissions and business calculations are unchanged.

## Usability Review

| Category | Result |
|---|---|
| Understandability | GREEN for available forms |
| Click count | YELLOW; pending-line workflow adds one confirmation step |
| Popup stacking | GREEN; unsaved-change confirmation correctly owns focus |
| Horizontal scrolling | GREEN at page level; Count table owns local overflow |
| Table density | GREEN for tested Inventory pages |
| Toolbar discoverability | GREEN after command/icon hardening |
| Tooltips and labels | GREEN for tested commands/forms |
| Validation and feedback | GREEN after Count feedback fix |
| Loading/empty states | GREEN on inspected pages |
| Workflow completeness | RED due P0 boundaries above |

## Readiness

**Warehouse Operator Readiness: 40%**

The 40% score reflects stable authentication, correct module visibility,
usable command surfaces, export and logout, but does not award completion for
forms that merely open. Ten of fourteen requested operational steps were not
completed through the canonical chain.

To close UAT, product/security owners must first decide whether Warehouse
Operator receives Supplier creation or whether suppliers are a mandatory setup
prerequisite. A separate approved business/frontend sprint must then expose
Production Return and Supplier Return without bypassing their existing domain
services. After those decisions, rerun this exact Playwright journey with a
controlled supplier/material/warehouse dataset.

## Verification

| Gate | Result |
|---|---|
| Warehouse Operator Playwright | PASS, 1/1 in 22.4s |
| Frontend tests | PASS, 4 files / 12 tests |
| Backend tests | PASS, 95 suites / 318 tests |
| Frontend typecheck | PASS |
| Targeted ESLint | PASS, 0 errors / 15 existing warnings |
| Frontend production build | PASS |
| Backend production build | PASS |
| `git diff --check` | PASS |
| Staged files | None |

The frontend build retains the existing Vite warning for the approximately
964 kB `vendor-react-three` chunk. It is unrelated to this UAT sprint.
