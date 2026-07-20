# NAV001 Workspace Navigation Report

Date: 2026-07-18

Status: IMPLEMENTED - VISUAL QA PENDING

## Objective

Remove redundant page-level navigation that duplicates the global left sidebar.
The sidebar is the primary module navigation surface; page content should begin
with operational data.

## Implementation

- `EnterpriseWorkspace` no longer renders breadcrumb, page title, module
  description or route-based workspace tabs.
- Route tabs passed to `EnterpriseWorkspace` are treated as sidebar-owned
  navigation and are not rendered inside content.
- Non-route tabs remain available for local in-page state where no sidebar route
  exists.
- `EnterpriseModulePage` now uses the full available width instead of an
  additional `max-w-[1800px]` content cap.
- `MaterialDetailPage` no longer renders the Inventory module tab bar inside an
  entity detail page. Entity-level detail tabs remain.

## Audited Areas

- Inventory active routes.
- Production active workspace.
- Components active workspace.
- QC active workspace.
- Yard active workspace.
- Logistics active workspace.
- Projects, Suppliers, Settings, Users and Roles pages that use
  `EnterpriseWorkspace`.

## Kept By Design

- Entity/detail tabs such as material detail views and transaction attachments.
- Non-route local settings tabs that are not duplicated by sidebar routes.
- Operational actions such as create, refresh and export buttons.

## Not Changed

- Backend.
- API contracts.
- Routes.
- Permissions.
- Business logic.
- Database.

