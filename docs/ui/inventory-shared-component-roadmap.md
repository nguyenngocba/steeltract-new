# Inventory Shared Component Roadmap

## P0 - Foundation Lock

- Treat `shared/ui/cockpit` and `shared/ui/modules` as canonical import roots.
- Prevent new page-local pagination algorithms.
- Preserve approved Inventory presentation with screenshot regression checks.

## P1 - Presentation-Preserving Extraction

- Add typed composition helpers for repeated KPI metadata without replacing
  approved `CockpitKpiCard` rendering.
- Evaluate a typed status badge mapping API for stock, transaction, and return
  statuses; merge only mappings with identical semantics.
- Move repeated transaction detail sections into Inventory-domain composition
  components while retaining `ModuleDetailDrawer` as the shell.
- Add component tests for pagination boundaries and drawer sizing.

## P2 - Dead-Code Removal

- Generate a TypeScript import graph covering lazy routes.
- Verify parallel `features/`, `tabs/`, `tables/`, analytics, and warehouse-map
  trees are unreachable.
- Delete only confirmed orphan files in small batches with build verification.
- Consolidate duplicate global placeholder component libraries separately from
  Inventory to avoid cross-module regressions.

## Exit Criteria

- No duplicate active pagination implementation.
- New Inventory tabs use canonical shared primitives.
- Domain-specific wrappers contain domain composition, not copied shell code.
- Visual regression evidence confirms no layout/presentation change.

