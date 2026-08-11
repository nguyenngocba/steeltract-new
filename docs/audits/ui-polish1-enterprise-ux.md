# UI.POLISH.1 - Enterprise UX Polish

Date: 2026-08-11  
Scope: Frontend presentation only  
Backend/API/schema/migration changes: NONE

## Audit Scope

The review covered the active Dashboard, Inventory, Components, Production,
QC, Yard, Logistics, Projects, Settings, Master Data and Executive BI
workspaces. The Inventory cockpit and the published
`docs/ui/STEELTRACK_UI_GUIDELINES.md` contract remained the reference.

The audit separated default operational tables from 96vw full-list/detail
workspaces. Wide full-list tables are allowed to scroll; default workspaces
should expose only the six to eight fields required for routine decisions.

## Findings

| Area | Before | Result |
| --- | --- | --- |
| Density | Shared filters and forms retained excess padding | Shared header, filter and form rhythm reduced without changing fields |
| Tables | Row styling existed, but sticky header, selected state and clipped-cell disclosure were inconsistent | Shared table shell now owns these behaviors |
| Action column | Page implementations use different action widths | Shared opt-in sticky action contract added; it is not forced onto non-action tables |
| Drawers | Header/body/footer were stable, but contextual tabs were rebuilt inside scrolling content | Tabs now belong to fixed drawer chrome; body is the sole scroll owner |
| Forms | Controls mixed radii, weight and focus treatment | 36px controls, medium input text, compact sections and live validation feedback standardized |
| Charts | Loading/empty/realtime presentation was page-local | Shared chart card supports controlled loading, empty and realtime states |
| Accessibility | Drawer focus trap existed; tabs and clipped content were inconsistent | ARIA tabs, visible focus and automatic title for genuinely clipped table cells added |

## Implementation

### Table Polish

`CockpitTableShell` now provides:

- 36px header and row geometry with medium, single-line typography.
- Sticky table header and tabular numerals.
- Shared row hover plus `aria-selected`/`data-state=selected` treatment.
- Delegated hover/focus detection that adds `title` only when a cell is actually
  clipped. Explicit page-authored titles are preserved.
- An opt-in `stickyActionColumn` presentation contract. It defaults to false so
  a table whose last column is business data is never pinned accidentally.

### Drawer Polish

`ModuleDetailDrawer` now has a 56px compact header, 16px body padding and 12px
footer rhythm. Context tabs are part of fixed drawer chrome, use `tablist`/`tab`
semantics and remain horizontally reachable on narrow screens. The body remains
the only vertical scroll owner; Escape, focus trapping and focus restoration are
unchanged.

The shared tab contract replaced page-local tab bars in:

- Master Data record details.
- Components Production order details.
- Components/QC and standalone canonical physical QC details.

### Form Polish

Enterprise forms retain their validation and submit behavior. Presentation is
now compact and consistent: 36px controls, 6px radius, medium values, visible
focus rings, 12px labels, tighter sections and `aria-live` validation messages.

### Chart Polish

`CockpitChartCard` now exposes controlled `loading`, `empty`, `emptyLabel` and
`realtime` presentation states. No synthetic data or trend was introduced.
Chart cards receive an accessible region label and busy state; chart-library
tooltip and legend content remain owned by each real dataset.

## Responsive Review

Static class/DOM review covered 1366, 1440, 1600 and 1920 desktop contracts:

- Detail drawer: 64vw desktop, full-width mobile.
- Full-list workspace: 96vw exception.
- Context tabs: horizontal overflow, no compressed labels.
- Default controls: stable 36px height.
- Default table cells: no wrap, ellipsis and hover/focus disclosure.

The static audit found remaining page-local tables wider than the default
1366px content region, especially in monolithic Production and Projects pages.
Many are intentional full-detail tables; each remaining default table requires
business-aware column prioritization. Columns were not removed blindly in this
sprint.

## Filter UX

Shared filter panels now use compact padding and the established control
geometry. Quick filters, clear-all and saved filters are only shown where an
existing page already owns those states. This sprint did not fabricate saved
filter persistence or unsupported API semantics.

## Micro UX

- Drawer tabs are keyboard focusable with visible focus rings.
- Drawer close, Escape and focus restoration remain available.
- Validation updates are announced politely.
- Clipped table values are discoverable by pointer and keyboard focus.
- Existing destructive confirmations and success toasts were preserved.

## Files Changed

- `apps/frontend/src/shared/ui/cockpit/CockpitTableShell.tsx`
- `apps/frontend/src/shared/ui/cockpit/CockpitChartCard.tsx`
- `apps/frontend/src/shared/ui/modules/index.tsx`
- `apps/frontend/src/shared/forms/EnterpriseForm.tsx`
- `apps/frontend/src/modules/master-data/components/UnifiedMasterDataWorkspace.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsProductionPage.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsInternalQcPage.tsx`
- `apps/frontend/src/shared/ui/ui-contract.test.tsx`
- `apps/frontend/src/modules/settings/pages/SettingsPage.test.tsx`
- `apps/frontend/e2e/warehouse-master.spec.ts`

Documentation files are additional mandatory state/report updates. No backend
file was modified by UI.POLISH.1.

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Frontend tests | PASS | 4 files, 12 tests |
| Typecheck | PASS | `pnpm -C apps/frontend typecheck` |
| ESLint | PASS WITH BASELINE WARNINGS | 0 errors, 384 existing warnings |
| Frontend build | PASS | Vite production build completed in 2.41s |
| Playwright runtime | PASS | 7 RBAC profiles plus Warehouse CRUD scenario pass; credential-gated full runtime workflow skipped |
| `git diff --check` | PASS | No whitespace errors before documentation closeout |

Playwright ran against the real configured frontend/backend boundary. Two
harness races were corrected: waiting for authentication before navigation and
closing the dependency drawer before acting on the underlying table. The
Warehouse scenario then passed login, workspace open, create, edit, dependency
review, deactivate/reactivate, storage-location assignment and Yard render in
22.8 seconds. Full four-breakpoint screenshot-diff certification remains a
separate visual gate.

## Remaining P1

1. Capture and approve authenticated screenshots at 1366, 1440, 1600 and 1920;
   the operational Playwright scenario is now stable.
2. Classify each remaining wide default Production/Projects table with a domain
   owner and reduce it to six to eight operational columns; retain complete
   columns in the 96vw view.
3. Adopt `stickyActionColumn` only on tables whose last column is confirmed as
   an action column.
4. Move remaining page-local detail tabs to the shared drawer contract after
   verifying their entity context.
5. Add saved filters only when a canonical persistence contract is approved.

## Conclusion

Shared UI quality and interaction consistency are improved without changing
business behavior. Static, automated frontend and targeted runtime browser
gates pass. Multi-breakpoint visual-diff certification remains pending.
