# Inventory Golden Reference Analysis

Status: IMPLEMENTED

Scope reviewed:

- `apps/frontend/src/modules/inventory/pages/tabs/InventoryOverviewPage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryMaterialsPage.tsx`

## Information Hierarchy

Inventory leads with operational facts, not explanation. KPI cards are first
because an operator needs to know the current state before deciding where to
look: value, quantity, material count, low stock and out-of-stock conditions.

The filter bar comes immediately after the KPIs. This makes the page feel like
a working console: read the state, narrow the workspace, act on the filtered
table.

The primary table owns the largest viewport area. Charts and summaries explain
the table; they do not compete with it.

## Layout Rhythm

The canonical rhythm is:

1. KPI strip.
2. Compact filter/action bar.
3. Main 9/3 workspace grid.
4. Large operational table on the left.
5. Compact analytics/alerts on the right.
6. Low-height summary strip below.
7. Drawer/modal for detail and mutation.

The spacing is intentionally tight. `gap-1` and `space-y-1/2` keep dense ERP
screens scannable without turning them into marketing layouts.

## KPI Organization

KPI cards use short labels, large values and compact notes. The cards are
clickable when they control workspace scope. Their job is both information and
navigation.

## Chart Positioning

Charts sit beside or below the table. Inventory uses charts to answer "why does
the table look like this?" rather than to replace the table.

## Filters And Toolbar

Filters are horizontal, compact and near the table. Search appears with filters
instead of in a separate page header because operator work is iterative:
filter, inspect, filter again.

## Drawer Usage

Detail uses drawers so operators keep list context. A drawer is preferred over
page navigation for inspection tasks because the table remains the source of
truth and the operator can return to the same filtered position.

## Visual Density

Inventory feels efficient because the page avoids large empty explanatory
blocks. It uses repeated compact surfaces, stable table heights and clear
numeric alignment.

