# SteelTrack Changelog

## 2026-06-04

### Inventory Foundation Phase A - UI Consolidation

Implemented:

- Removed the duplicate create-material form from `InventoryOverviewPage`.
- Added `MaterialDrawer` to `InventoryOverviewPage` so the overview quick action opens the same create/edit Material Master form used by `InventoryMaterialsPage`.
- Kept Material Master creation separate from initial inbound transaction creation.
- Confirmed no Prisma schema change and no migration were created.
- Did not modify the Supplier module.
- Refined the app sidebar theme to better match the dark cockpit UI:
  - glass-style dark sidebar background;
  - calmer group headers;
  - clearer active submenu state;
  - hash-aware active matching for child tabs such as Yard 2D/3D tabs.

Build:

- Frontend build passed.
- Backend build passed.
