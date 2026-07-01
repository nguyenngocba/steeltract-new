# Project Detail Drawer Refactor Report

Date: 2026-07-01

## Change

- Extended shared `ModuleDetailDrawer` with `placement="center"` while preserving the existing right-drawer default.
- Project Detail now uses centered placement:
  - width: `min(1400px, 90vw)`
  - max height: `90vh`
  - internal scroll
  - existing Industrial Cockpit surface and cyan glass styling

## Reason

- The previous Project Detail workspace felt too large and full-screen-like.
- Centered 80-90vw modal keeps context visible while still allowing a full execution workspace.

## Impact

- Existing modules are unaffected because `placement` defaults to `right`.
