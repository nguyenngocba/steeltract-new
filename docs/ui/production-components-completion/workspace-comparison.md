# Workspace Comparison

Status: IMPLEMENTED - VISUAL QA PENDING

## Inventory Canon

Inventory workspaces start with operational content:

1. KPI or primary operational surface
2. Filters/actions
3. Table/chart workspace
4. Drawer/detail surface

Inventory does not repeat the global page title inside each tab after the
global shell already identifies the module.

## Production After UI005A

Production now starts directly with KPI cards, followed by filter/actions and
the selected operational workspace. Navigation remains in the global sidebar.

Route changes:

- `/production/incidents` now renders a delayed-order/log warning workspace.
- `/production/reports` now renders report KPIs and material/order/activity
  charts from existing Production data.

## Components After UI005A

Components now starts directly with the route's KPI/filter/table/chart content.
Navigation remains in the global sidebar.

Route changes:

- `/components/qc` uses live Components data instead of static rows.
- `/components/reports` has a dedicated report workspace.
- Legacy overview/workspace page exports point to the real Overview workspace.

## Remaining Gap

Authenticated visual screenshots across all routes remain pending because this
environment has no browser automation runtime.
