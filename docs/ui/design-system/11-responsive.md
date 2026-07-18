# 11. Enterprise Responsive Standard

## Base Strategy

Design mobile-first, then add `md`, `xl` and `2xl` structural changes. Do not
scale font size with viewport width. Stable controls, tables, boards and charts
use explicit dimensions and internal overflow.

## Desktop And Laptop

- Content remains capped at 1800px.
- KPI bands use 3-5 columns; executive bands may use six at `2xl`.
- Operator split panes activate at `xl`.
- Tables maintain column widths and internal scrolling.
- Right drawers use declared viewport/min/max widths.

At laptop widths, remove secondary columns before compressing primary table or
form content below usability.

## Tablet

- Header actions wrap beneath title when necessary.
- KPI cards use 2-3 columns.
- Filter grid groups controls logically and allows full-width search.
- Analytics stack to one/two columns.
- Detail drawer becomes full width when its desktop minimum cannot fit.

## Mobile

- Workspace remains one column with 12px edge padding.
- Tables/tabs scroll horizontally; do not transform data into unrelated cards
  unless a canonical mobile row component exists.
- Modals/drawers use near-full viewport, compact padding and internal scroll.
- Transaction 2D/pending layout stacks form first, then preview/list.
- Primary/secondary actions remain reachable and must not overflow.

## Charts

Retain card height, reduce tick/legend density and paginate categories. Labels
must not overlap. An essential value must also be available as text/table.

## Filters

Filters stack at base and use the 12-column `xl` grid. Advanced filters may
collapse, but active filter state and reset remain visible. Sticky bars must not
cover content or consume most of a mobile viewport.

## Drawers And Modals

Full-width on mobile; header/footer stay visible, body owns scroll. Respect safe
areas. Dirty close and focus behavior remain the same at every breakpoint.

## Validation Viewports

At minimum validate 360x800, 768x1024, 1366x768, 1440x900 and 1920x1080.
Check text/button fit, no incoherent overlap, table/overlay scrolling, chart
labels and focus visibility.

## Current Gaps

Some Inventory tables require 700-1180px minimum width, wide transaction modals
are optimized for `xl`, and several grids switch directly from one to five
columns at `md`. These require later screenshot/operator validation; UI002 does
not redesign them.

