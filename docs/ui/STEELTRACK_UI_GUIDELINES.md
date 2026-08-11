# SteelTrack Enterprise UI Guidelines

Status: OFFICIAL UI STANDARD  
Effective date: 2026-08-11  
Scope: All active SteelTrack frontend modules

## 1. Authority

The visual source of truth is the active Industrial Cockpit implementation:

1. `EnterpriseModulePage` and `EnterpriseWorkspace`
2. `shared/ui/cockpit`
3. `shared/ui/modules`
4. `shared/forms`
5. active Inventory operational pages

Page-local visual primitives may not override this contract without a documented
exception. Shared components own presentation only; query, validation and domain
behavior remain inside their module.

## 2. Workspace Composition

Operational pages use this order:

`Header -> KPI strip -> Toolbar -> primary table/workspace -> analytics -> detail drawer`

- Outer page: `EnterpriseModulePage`.
- Page padding: 10px to 12px; section rhythm: 8px or 16px.
- Full width: `w-full min-w-0`; no decorative max-width around operational data.
- A table is the dominant surface when the page exists for repeated record work.
- Only contextual entity tabs may appear inside page content. Module navigation
  belongs to the global sidebar.
- One scroll owner per bounded surface. Avoid page, panel and table all scrolling
  simultaneously.

## 3. Typography

- Font family: Inter with system sans-serif fallback.
- Page title: 20px, `font-semibold`, one line.
- Short subtitle: 12px, `font-medium`, one line where practical.
- Section title: 12px to 13px, `font-semibold` or `font-bold`.
- Body/table text: 12px to 14px, `font-medium`.
- Caption: 10px to 11px.
- KPI value: 20px, `font-semibold`, tabular numbers when numeric.
- Do not use viewport-scaled font sizes or negative letter spacing.
- Do not use display/hero typography inside operational workspaces.

## 4. Spacing And Grid

Approved spacing scale: 4, 8, 12, 16, 24 and 32px.

- Default workspace section gap: 8px.
- Default panel padding: 12px; large analytic panel: 16px.
- Default responsive grid gap: 8px.
- KPI grids: one column base, two or three at `md`, module-defined operational
  count at `xl`/`2xl`.
- Fixed-format controls and cards must declare stable dimensions.

## 5. Surfaces And Cards

- Default surface radius: 8px (`rounded-lg`).
- Borders: one restrained cyan/white border; avoid nested decorative rings.
- Do not put cards inside cards.
- Do not use floating page-section cards.
- Shadows communicate hierarchy, not decoration.
- Repeated business records may use cards only when a table is not appropriate.

## 6. Header

Header content is limited to:

- Title
- One short subtitle
- Contextual command group when necessary

Do not repeat sidebar navigation, module descriptions, feature explanations or
large breadcrumbs inside operational content.

## 7. Cockpit KPI

- Component: `CockpitKpiCard`.
- Canonical height: 92px.
- Radius: 8px.
- Icon: 14px to 16px inside a 32px container.
- Value: one line; title/note truncate safely.
- Trend/sparkline is rendered only from authoritative data.
- No new KPI may be invented to fill space.
- Loading uses the KPI skeleton with identical 92px geometry.
- Semantic tones: blue/cyan informational, emerald positive, amber attention,
  red critical, purple process/context.

## 8. Toolbar

Canonical order:

`Search -> Filters -> Refresh -> Density -> Export -> View -> Add`

- Controls are 36px high.
- Search grows; filters remain bounded.
- Familiar icon commands use Lucide icons and accessible labels/tooltips.
- The primary Add command is last.
- Permission-denied actions are hidden, not visually disabled.
- Refresh invalidates existing query keys; it does not create a second data path.
- Export uses canonical data already available to the workspace.

## 9. Table

Level 1 default:

- Six to eight high-value columns.
- Fixed 36px header and row height.
- 12px to 14px medium text.
- Single line, no wrap.
- Ellipsis for overflow.
- Native `title` or equivalent accessible tooltip for truncated business text.
- Sticky header for bounded scroll tables.
- Stable empty rows may preserve hero-table geometry.

Level 2:

`Xem tất cả -> 96vw workspace -> complete columns -> pagination`

The full-list workspace is not a detail modal and may occupy 96vw. It keeps a
single bounded table scroll owner.

Use `CockpitTableShell` and `DataTablePagination`. Do not create module-specific
pagination.

## 10. Density

- Default: Compact, 36px rows.
- Optional: Comfortable, 44px rows.
- Density changes geometry only, never data or pagination semantics.
- The same control and behavior must be reused across modules.

## 11. Pagination

- Canonical component: `DataTablePagination`.
- Stable minimum height: 44px.
- Shows range, total, page numbers, first/previous/next/last and optional page
  size selector.
- Disabled navigation remains visible and non-interactive.
- Every icon command has `aria-label` and `title`.
- Page resets to 1 when filtering or page size changes.

## 12. Drawer

- Component: `ModuleDetailDrawer`.
- Placement: right.
- Desktop basis: 64vw; mobile: full screen.
- Header and footer are fixed; body owns vertical scrolling.
- Escape closes, focus is trapped and restored.
- Default contextual sections: Overview, Dependencies, History, Settings and
  Actions. Tabs with no authoritative source show a controlled unavailable
  state, not fabricated content.
- Destructive actions belong in Actions/Dependencies and must show real usage.
- Do not use a centered modal for record detail.

Explicit exception: a full-list “Xem tất cả” workspace uses 96vw. It is not a
record detail drawer.

## 13. Modal

Centered modals are limited to focused commands that cannot be mistaken for
record detail: confirmation, warning, short transactional command or media
preview.

- Viewport bounded.
- One body scroll owner.
- Clear title, compact content and consistent footer.
- Escape and focus restoration are mandatory.
- Large forms and detail views use the right drawer.

## 14. Tabs

- Module routing remains in the global sidebar.
- Page tabs are allowed only for one entity or one drawer context.
- Tab height: 36px; radius: 6px to 8px.
- Tabs scroll horizontally on narrow screens.
- Active state uses blue primary; semantic state colors do not replace selected
  navigation state.

## 15. Badge And Status

- Badge text: 10px to 12px, medium weight, one line.
- Radius: 4px to 6px.
- Status color meaning is stable:
  - emerald: completed/active/passed
  - cyan/blue: running/information
  - amber: pending/attention
  - red: failed/blocked/critical
  - purple: rework/process exception
  - slate: inactive/unknown
- Never communicate status by color alone; always render text.

## 16. Buttons

- Height: 36px.
- Primary: one blue action per command group.
- Secondary: restrained border/background.
- Danger: red only for destructive operations.
- Icon-only for familiar commands; text for explicit business commands.
- Minimum pointer target: 36px, preferably 40px on touch layouts.
- Visible focus ring is mandatory.

## 17. Search And Filters

- Search applies to business identifiers and display names documented by the
  query contract.
- Filters expose only backend-supported semantics.
- Filter changes reset pagination.
- Filtered-empty and globally-empty states are distinct.
- Date/time controls use localized display and unambiguous transport values.

## 18. Forms And Validation

- Use shared Enterprise form primitives.
- Control height: 36px.
- Logical sections and two columns at suitable desktop widths.
- Labels remain visible; placeholders are examples, not labels.
- Required indicators are explicit.
- Inline validation appears below the relevant field without moving unrelated
  controls unexpectedly.
- Error responses preserve operator input.
- Sticky drawer footer contains Cancel then primary command.

## 19. Empty, Loading And Error States

- Empty: `CockpitEmptyState`, `ModuleEmptyState` or
  `EnterpriseWorkspaceStatePanel`.
- Loading: geometry-preserving shared skeleton.
- Error: concise failure reason plus Retry when supported.
- Offline and forbidden are distinct from server error.
- Do not render blank panels or synthetic records.

## 20. Charts

- Component: `CockpitChartCard` or approved analytics primitive.
- Every chart has title, unit, source-backed dataset, loading, empty and error
  behavior.
- Legends and axes use medium typography and localized units.
- Chart height is explicit and responsive.
- Do not fabricate trend arrays, percentages or distributions.
- Domain analytics may have distinct composition and color identity while still
  using shared accessibility and surface contracts.

## 21. Responsive

- Base/mobile layouts stack.
- Tables scroll horizontally inside their shell.
- Drawer becomes full width.
- Toolbars wrap without changing command order.
- No font scaling based on viewport width.
- Validate at 390x844, 768x1024, 1366x768 and 1920x1080.

## 22. Accessibility

- Semantic headings and landmarks.
- Every input has a label.
- Every icon button has accessible name and tooltip.
- Drawers/modals declare dialog semantics and focus behavior.
- Keyboard can reach search, filters, table actions, tabs and pagination.
- Text/state remains understandable without color.
- Truncated content remains discoverable through title/tooltip.

## 23. Compliance Gate

A workspace is GREEN only when:

- shared shell/KPI/table/pagination/drawer/state primitives are used;
- no business/API/schema behavior was duplicated for presentation;
- table and toolbar geometry follows this document;
- loading, empty, error, responsive and keyboard behavior are verified;
- desktop/mobile visual evidence has no overlap, clipping or blank primary
  surface.

