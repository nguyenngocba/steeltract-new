# EPIC UI006 Migration Summary

Status: IMPLEMENTED

## What Changed

- Added `apps/frontend/src/shared/ui/enterprise-components` as the shared
  Inventory-canon visual component catalog.
- Converted Inventory `InventoryVisuals` into a compatibility wrapper over the
  shared catalog.
- Removed Production's dependency on
  `@/modules/inventory/components/InventoryVisuals`.
- Converted Production chart helpers, compact donut, mini bars, meter and
  status chip to shared implementations.
- Extended `shared/forms` with the remaining Enterprise Form primitives needed
  by future modules.

## Why This Shape

This keeps the existing visual output stable while moving ownership to a shared
library. Inventory stays the Golden Reference, but future modules no longer
need to import Inventory internals to look like Inventory.

## Preserved Behavior

- API calls and DTOs are unchanged.
- React Query hooks and query keys are unchanged.
- Production and Inventory page routes are unchanged.
- Existing wrappers keep old names where broad page rewrites would add risk.

## Remaining Cleanup

- Gradually replace module compatibility wrapper imports with direct
  `shared/ui/enterprise-components` imports when touching each page.
- Move remaining legacy Inventory page-local forms to `EnterpriseForm` in a
  dedicated Inventory-only cleanup sprint.
- Keep module-specific facades thin and business-readable; do not add layout
  logic inside them.
