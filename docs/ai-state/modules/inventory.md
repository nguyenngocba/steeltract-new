# Inventory Module

## Current Sprint

SteelTrack Sprint A - Inventory Foundation Implementation

Scope:

- Phase A only: UI consolidation.
- No Prisma schema changes.
- No migrations.
- No Supplier module changes.

## Implemented In Phase A

### Material Master Form Consolidation

`MaterialDrawer` is now the only active create/edit Material Master form used by the Inventory cockpit.

Changes:

- `InventoryOverviewPage` no longer owns `createMaterialForm`.
- `InventoryOverviewPage` no longer contains `handleCreateMaterial`.
- `InventoryOverviewPage` no longer renders the duplicate `activeModal === 'create-material'` form.
- The Overview quick action `Thêm vật tư mới` opens `MaterialDrawer`.
- `InventoryMaterialsPage` continues to use `MaterialDrawer` for create/edit.

### Sidebar Theme Alignment

The app sidebar was adjusted to better match the Inventory cockpit theme:

- Dark glass-style sidebar shell.
- Softer section labels.
- Cleaner child tab indentation.
- Blue active state with subtle glow.
- Hash-aware active state for sub-tabs.

## Boundaries Preserved

- Material creation does not create an initial inbound transaction.
- Inventory inbound/outbound/transfer workflows were not moved in this phase.
- Database schema was not changed.
- Supplier module was not touched.

## Remaining Phase A Follow-Up

- Consolidate material detail workspace so Overview and Materials use one shared detail component.
- Route dashboard quick actions to dedicated transaction tabs instead of keeping larger transaction modals inside Overview.
- Normalize older Inventory Overview table styling to the same Inventory visual component set.

## Next Phase

Phase B - Database enhancement for steel-structure Material Master fields:

- `specification`
- `grade`
- `standard`
- `origin`
- `unitWeight`
- `defaultSupplier`
- `leadTimeDays`
- stronger unit/category/material type DTO alignment
