# Navigation Completion Report

Date: 2026-06-27

Scope: Components, Production, Projects, Suppliers, QC.

## Completed

### Router Synchronization

Added real frontend routes for all active sidebar tabs in the target modules.

- Components: added `/components/reports`.
- Production: added `/production/planning`, `/production/incidents`, `/production/reports`.
- Projects: added `/projects/list`, `/projects/progress`, `/projects/components`, `/projects/materials`, `/projects/costs`, `/projects/documents`, `/projects/logs`, `/projects/reports`.
- Suppliers: added `/suppliers/list`, `/suppliers/quotes`, `/suppliers/purchase-orders`, `/suppliers/deliveries`, `/suppliers/quality`, `/suppliers/payables`, `/suppliers/logs`, `/suppliers/reports`.
- QC: added `/qc/inbound`, `/qc/production`, `/qc/final`, `/qc/ncr`, `/qc/capa`, `/qc/logs`, `/qc/dashboard`, `/qc/reports`.
- QC legacy compatibility: `/qc/plan`, `/qc/standards`, `/qc/calibration` still render the existing page for old bookmarks.

### Sidebar Synchronization

Updated both active navigation configs:

- `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
- `apps/frontend/src/app/config/navigation.config.ts`

The main target modules now expose matching sidebar entries and frontend routes.

### URL-Derived Tabs

Converted local tab state to URL-derived active tabs in:

- Projects
- Suppliers
- QC

Production already derived view state from `location.pathname`; new Production tabs were added to the existing path-based model.

### Browser Behavior

Expected behavior after this sprint:

- Clicking a sidebar child route navigates to the matching module tab.
- Refresh keeps the current tab because the tab is derived from the URL.
- Browser Back/Forward follows route history.
- Direct URL access renders the matching module page instead of falling through to Dashboard.
- Sidebar collapsed/expanded state does not affect route matching.

## Module Notes

### Components

- Existing component pages remain route-based.
- `Vật tư sử dụng` now labels the existing `/components/material-stock` route.
- `/components/reports` currently reuses the existing Components History page as a non-dead report route until a dedicated Components report page is built.

### Production

- Existing operational routes remain intact.
- New tabs `Kế hoạch`, `Sự cố`, and `Báo cáo` were added without changing Production APIs or workflows.
- `Kế hoạch` uses the existing Work Order table filtered to planned/released orders.
- `Sự cố` and `Báo cáo` render explicit empty/placeholder workspaces because no dedicated incident/report API exists yet.

### Projects

- Project tab buttons are now route links.
- New tabs `Chi phí`, `Tài liệu`, and `Nhật ký` render explicit placeholders until dedicated APIs are added.
- Existing `Cấu kiện công trình` and `Vật tư theo công trình` tabs remain backed by current runtime data.

### Suppliers

- Supplier tabs are now route links.
- `Chất lượng` uses the existing supplier evaluation cockpit.
- `Báo giá`, `Đơn mua`, `Giao hàng`, `Công nợ`, `Nhật ký`, and `Báo cáo` render explicit placeholders until Supplier/Purchasing APIs are implemented.

### QC

- QC tabs are now route links.
- `Kiểm tra đầu vào`, `Kiểm tra sản xuất`, and `Kiểm tra xuất xưởng` currently reuse the existing inspection workspace.
- `CAPA` currently reuses the existing NCR workspace until a CAPA-specific lifecycle exists.
- `Dashboard` maps to the current QC overview.
- `Nhật ký` maps to the current QC reports workspace until a dedicated QC log source exists.

## Validation

Command:

```bash
pnpm -C apps/frontend build
pnpm -C apps/backend-api build
```

Result: both passed.

Notes:

- Vite still reports the existing `.env` `NODE_ENV=production` warning.
- Vite still reports the existing large chunk warning, including the Yard 3D bundle.

## Remaining Gaps

P0:

- None for route existence in the target modules.

P1:

- Build dedicated report/log/document/cost pages where placeholders now exist.
- Add backend/API support for Supplier purchasing tabs, Project costs/documents/logs, Production incidents/reports, and CAPA.

P2:

- Consider replacing the remaining legacy QC alias routes with redirects after operators confirm no bookmarks depend on them.
- Consider adding automated route smoke tests for every sidebar item.
