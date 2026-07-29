# STEELTRACK UI.OPS.2 - Visual & Form Convergence Report

Date: 2026-07-28
Status: IMPLEMENTED
Scope: Frontend only

## Reference Used

- `InventoryMaterialsPage`
- `InventoryMaterialDetailModal`
- `InventoryTransactionModals`
- Inventory inbound/outbound form shell, footer and input density

## Components Changes

- Reworked the duplicated create-component modal surfaces in:
  - `ComponentsListPage`
  - `ComponentsActionContext`
- The create flow now presents the canonical meaning more clearly:
  - `Thong tin cong trinh`
  - `Thong tin cau kien`
  - `Ghi chu`
  - `Tong hop`
- Project selection is explicit as `Cong trinh / Du an`.
- Quantity remains `So luong yeu cau`, and the summary states that creation does
  not create inventory, ComponentInstance or ProductionOrder.
- Type/profile suggestions continue to use existing component data through
  datalist values, not hardcoded Beam/Column/Profile options.

## Production Changes

- `ProductionBomModal` now behaves as an Engineering BOM form instead of a
  production-stock allocation form.
- BOM material lookup now uses real Material Master rows from Inventory items.
- The form no longer requires Production Warehouse stock while defining a BOM.
- The modal width was reduced from broad workspace sizing to a bounded
  Inventory-style form shell.
- Sections now read as:
  - `Ho so ky thuat`
  - `Vat tu BOM`
  - `Routing / Cong doan`
  - `Tong hop`
- `ManufacturingOrderModal` now separates the canonical production-order
  decision into:
  - `Cong trinh / Nhu cau`
  - `Engineering basis`
  - `So luong`
  - `Ke hoach`
  - `Tong hop`
- Existing validation, API calls and backend contracts were preserved.

## QC Changes

- `InspectionDetail`, `QueueDetail` and final instance QC detail now use
  bounded modal shells with:
  - compact header
  - single scroll owner
  - constrained body
  - footer action row
- Final QC now presents one physical ComponentInstance with production evidence
  and a clear footer: `Huy`, `Khong dat`, `Dat`.
- NCR detail drawer was tightened and Vietnamese labels replaced the remaining
  English section copy.
- No new QC command or backend workflow was introduced.

## Real Data Audit

- No new mock, fake, sample or generated business data was introduced.
- Components create suggestions come from existing component read data.
- BOM material suggestions come from existing Inventory Material Master data.
- QC details continue to use existing QC workspace and component-instance query
  results.
- Empty states remain the fallback where backend data is unavailable.

## Modal And Drawer Policy

- Detail surfaces touched in this sprint now follow the Inventory detail
  principle: bounded shell, internal scrolling, compact metadata and stable
  footer actions.
- Large full-list modals that already serve `Xem tat ca` table workflows were
  not redesigned in this sprint.

## Files Changed

- `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`
- `apps/frontend/src/modules/components/context/ComponentsActionContext.tsx`
- `apps/frontend/src/modules/production/components/ProductionBomModal.tsx`
- `apps/frontend/src/modules/production/components/ManufacturingOrderModal.tsx`
- `apps/frontend/src/modules/qc/pages/QcPage.tsx`

## Verification

- `pnpm -C apps/frontend build`: PASS
- Existing Vite chunk-size warning remains unrelated to UI.OPS.2.
- Frontend tests and `git diff --check` to be run in final verification.

## Known Limitations

- Browser screenshot certification was not performed yet in this run.
- `Xem tat ca` expanded list modals in Production/QC still use existing large
  table shells and should be reviewed in a separate list-workspace pass.
