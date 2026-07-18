# Inventory Tables Review

## Implementation

- `InventoryPagination` is now a compatibility adapter over the shared
  `DataTablePagination`; Inventory no longer maintains a second pagination
  algorithm.
- The shared Inventory table header is sticky, opaque enough over scrolling
  rows and retains the canonical compact typography.
- Existing server totals, page state, row actions and filter behavior are
  unchanged.
- Wide operational tables retain explicit minimum widths and scroll inside
  their table surface rather than expanding the workspace.
- Materials uses a `clamp(320px, 52vh, 520px)` table viewport, guaranteeing a
  visible operational surface on laptop and desktop heights while preserving
  internal horizontal/vertical scrolling.
- No bulk selection was introduced where no bulk business command exists.

## Remaining Variance

Some specialized tables define local headers because they have fixed column
layouts or map-like data. They remain visually compatible but are not yet one
generic table component. Archived `MaterialTable` is not an active route and is
not part of the canon.

Pagination and active table shell consistency: **PASS**.
