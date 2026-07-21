# Global Design Debt

Date: 2026-07-21

Status: **OPEN DESIGN DEBT REGISTER**

This register groups remaining UI consistency debt after EPIC 7.0. It is
documentation-only and does not authorize source changes.

## Debt Groups

### D1 - Visual Certification Harness

Severity: High

Affected modules: All

The project still lacks an approved authenticated screenshot harness. Source
review can confirm shared component usage and route coverage, but it cannot
prove final spacing, scroll, viewport and responsive behavior.

Recommended fix:

- Add an approved browser QA workflow.
- Capture Inventory canon screenshots first.
- Compare Components, Production, Projects, Suppliers, QC, Logistics and Admin
  against the same breakpoints.

### D2 - Route Visibility And Fallbacks

Severity: High

Affected modules: Logistics, Planning

Logistics has visible route paths that fall back instead of rendering distinct
Vehicles and Planning workspaces. Planning has source files but no registered
visible route.

Recommended fix:

- Decide route ownership before UI implementation.
- Do not build tables/charts until authoritative read contracts exist.

### D3 - Pagination Standardization

Severity: Medium

Affected modules: Logistics, Admin, secondary Inventory pages

Most mature modules use a shared pagination pattern. Logistics dispatch and
Admin Users/Roles still need certification or implementation of the same
standard.

Recommended fix:

- Reuse the approved shared pagination implementation.
- Preserve existing API contracts; use client pagination only where data volume
  is bounded and documented.

### D4 - Local Primitive Drift

Severity: Medium

Affected modules: Admin Settings, Logistics, secondary Inventory pages

Some pages still use local panel/input/table classes instead of shared
Enterprise/Inventory primitives.

Recommended fix:

- Migrate local wrappers only when doing a module-specific UI completion pass.
- Avoid broad shared component rewrites unless the design system approves it.

### D5 - Backend Contract Empty States

Severity: Medium

Affected modules: Suppliers, QC, Projects, Admin, Logistics

Several pages now show controlled empty states because backend read contracts
do not exist yet. This is acceptable and preferable to fake data, but it keeps
the pages from being fully production-complete.

Recommended fix:

- Define read contracts before replacing empty states.
- Keep empty states truthful until data is authoritative.

### D6 - Route Label And Navigation Semantics

Severity: Low/Medium

Affected modules: Projects, Production, QC

Some requested pages are currently implemented as filters or entity-level
views:

- Production Running/Completed/Scrap.
- QC Pending/Passed/Failed.
- Projects Timeline.
- Projects Budget vs Costs naming.

Recommended fix:

- Decide whether these should be sidebar routes, filters, or detail tabs.
- Do not duplicate global navigation inside page content.

## Recommended Remediation Order

1. Establish browser screenshot harness.
2. Resolve Planning route visibility.
3. Resolve Logistics Vehicles/Planning route behavior.
4. Finish Logistics table/filter/pagination standardization.
5. Finish Admin Settings/Users/Roles pagination and primitive alignment.
6. Certify secondary Inventory pages.
7. Decide P2 route semantics for Production, QC and Projects.

