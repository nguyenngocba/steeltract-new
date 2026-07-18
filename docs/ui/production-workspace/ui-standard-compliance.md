# Production UI Standard Compliance

## Passed

- One Enterprise workspace shell across active Production routes.
- Inventory-derived KPI, panel, table, filter, pagination and drawer language.
- One shared modal implementation for Production mutations.
- One shared form control and layout implementation; no Production form kit.
- 36px active form controls and responsive one/two/three-column grids.
- Viewport-bounded modal/drawer behavior with one internal scroll owner.
- Dialog labels, required state, inline errors, focus containment, Escape and
  focus restoration.
- Explicit loading, empty and error states on primary workspace read paths.
- No backend, API, route, permission, DTO or business change.

## Deliberate Constraints

Selection and sorting were not added to tables whose existing API or workflow
does not define a corresponding operation. Adding inert controls would create a
false operator contract. Incidents and Reports remain empty until their domain
contracts exist.

## Pending Runtime Evidence

Frontend compilation validates responsive class composition and type safety.
Authenticated multi-viewport and assistive-technology certification remains a
manual gate because this environment has no browser binary or Playwright
harness.
