# Navigation Audit Report

Date: 2026-06-27

Scope: Components, Production, Projects, Suppliers, QC.

## Summary

Inventory uses stable path-based navigation and is the reference. Components and Production mostly follow this pattern. Projects, Suppliers, and QC still used local tab state or had sidebar subroutes without matching router entries, so refresh/direct URL/back-forward could lose the selected tab or redirect to Dashboard.

## Findings

### Components

Status: mostly synchronized.

- Existing routed tabs: `/components`, `/components/list`, `/components/production`, `/components/stock`, `/components/material-stock`, `/components/transfers`, `/components/qc`, `/components/history`.
- Missing requested tab: `/components/reports`.
- Label mismatch: `Kho vật tư SX` is the existing page for material usage/production material stock, but the requested navigation label is `Vật tư sử dụng`.
- Refresh/direct URL works for existing routes because each tab is a dedicated route.

### Production

Status: partially synchronized.

- Existing routed tabs: `/production`, `/production/boms`, `/production/orders`, `/production/execution`, `/production/reservations`, `/production/warehouse`, `/production/material-ledger`, `/production/material-issues`, `/production/consumptions`, `/production/logs`.
- Sidebar was missing existing routes: `/production/execution`, `/production/reservations`, `/production/warehouse`, `/production/material-ledger`.
- Missing requested tabs: `/production/planning`, `/production/incidents`, `/production/reports`.
- Production derives view from `location.pathname`, so existing routed tabs survive refresh/back-forward.

### Projects

Status: broken for sidebar subroutes.

- AppRouter only exposed `/projects`.
- Sidebar linked `/projects/list`, `/projects/progress`, `/projects/materials`, `/projects/reports`, which redirected to Dashboard through the catch-all route.
- Projects page used local `useState` for active tab, so refresh/back-forward/direct URL could not preserve selected tab.
- Missing requested tabs: `/projects/components`, `/projects/costs`, `/projects/documents`, `/projects/logs`.

### Suppliers

Status: broken for sidebar subroutes.

- AppRouter only exposed `/suppliers`.
- Sidebar linked `/suppliers/ratings`, which redirected to Dashboard through the catch-all route.
- Suppliers page used local `useState` for active tab, so refresh/back-forward/direct URL could not preserve selected tab.
- Missing requested tabs: `/suppliers/quotes`, `/suppliers/purchase-orders`, `/suppliers/deliveries`, `/suppliers/quality`, `/suppliers/payables`, `/suppliers/logs`, `/suppliers/reports`.

### QC

Status: broken for sidebar subroutes.

- AppRouter only exposed `/qc`.
- Sidebar linked `/qc/inspections`, `/qc/plan`, `/qc/standards`, `/qc/ncr`, `/qc/calibration`, `/qc/reports`, which redirected to Dashboard through the catch-all route.
- QC page used local `useState` for active tab, so refresh/back-forward/direct URL could not preserve selected tab.
- Missing requested tabs: `/qc/inbound`, `/qc/production`, `/qc/final`, `/qc/capa`, `/qc/logs`, `/qc/dashboard`.

## Dead Menu Items

- `/dashboard/charts`
- `/dashboard/activity`
- `/projects/list`
- `/projects/progress`
- `/projects/materials`
- `/projects/reports`
- `/suppliers/ratings`
- `/qc/inspections`
- `/qc/plan`
- `/qc/standards`
- `/qc/ncr`
- `/qc/calibration`
- `/qc/reports`

## Duplicate / Alias Routes To Normalize

- Supplier quality navigation should replace `/suppliers/ratings` with `/suppliers/quality`.
- QC requested navigation uses inbound/production/final inspection categories, while current UI has a generic inspections tab. Category routes should render the existing inspection workspace until backend-specific categories are added.
- Production requested navigation includes planning/incidents/reports while the current cockpit has richer operational routes. New requested routes should be added without removing existing production operational routes.

## Recommended Fix

- Use path-based routes for all target module tabs.
- Derive active tab from `location.pathname`.
- Replace local tab state in Projects, Suppliers, and QC with URL-derived tab values.
- Add matching router entries for every sidebar tab.
- Keep unsupported report/log/document/cost tabs as explicit module placeholder/summary views instead of dead links.
