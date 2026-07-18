# 04. Enterprise Data Table

## Composition

The canonical table workflow is:

1. `ModuleFilterBar` for search, quick/advanced filters and commands;
2. `CockpitTableShell` or `moduleTableShell` with bounded height;
3. semantic `<table>` with explicit column widths where comparison matters;
4. `DataTablePagination` using server totals/pages;
5. detail drawer opened from row activation.

## Dimensions And Density

- Standard text: 12-14px; metadata 10-11px.
- Header: 12px uppercase, 0.08em tracking, slate-400.
- Cell padding: 8px horizontal and 6-8px vertical for operational density.
- Compact action icons: 28-32px square with tooltip/accessible name.
- Stable table viewport: 520px small, 560px standard, or an explicitly justified
  workflow height.
- Wide tables declare a minimum width and scroll inside the shell.

## Columns

- Identity/code left aligned; numeric/date/status columns use stable widths.
- Numeric values right aligned, tabular and shared formatted.
- Long names truncate with a native title/tooltip or detail view.
- Status uses a semantic badge; do not infer status from row position/color.
- Inline actions occupy a final fixed-width column.

## Behavior

- Sorting, filtering and pagination are server-side for business datasets.
- Search is debounced; Enter may apply immediately.
- Resetting a filter returns to page 1.
- Row click/Enter opens detail; nested buttons stop unintended row activation.
- Sticky headers are required for internally scrolling tables.
- Selection appears only when a real bulk command exists.
- Expandable rows are reserved for compact secondary detail, not a substitute
  for the standard drawer.

## Pagination

Use `DataTablePagination`: current range and total at left, at most five page
buttons centered, previous/next at right; stack at base and use three columns at
`md`. Do not implement client slicing over an unbounded response.

## States

- Loading: row skeleton preserving header/column geometry.
- Empty: clear reason and optional primary recovery action.
- No results: distinguish active filters from truly empty data.
- Error/offline/no permission: use the shared workspace state panel.
- Keep previous server page only when visibly marked; never present stale rows as
  a completed refresh.

## Accessibility

Use table semantics, scope column headers, visible focus, keyboard-operable
sorting/rows/actions and accessible names for icon buttons. Color is not the
sole status indicator.

## Known Inventory Variance

`InventoryPagination` duplicates `DataTablePagination`; header stickiness and
keyboard row activation vary by tab; attachment uses an emoji in one table.
Future modules must use the canonical composition above. UI002 makes no code
replacement.

