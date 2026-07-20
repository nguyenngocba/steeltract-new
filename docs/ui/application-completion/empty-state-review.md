# PLATFORM002 Empty State Review

Date: 2026-07-18

## Standard

Every empty state should include:

- Enterprise icon or illustration.
- Meaningful title.
- Business explanation.
- Suggested next action.
- Primary action when the current backend/API supports it.
- Secondary help text when the next step depends on configuration.

## Policy

- Do not show fake operational metrics.
- Do not use `Coming Soon`, `TODO`, `Placeholder`, `Demo`, `Mock`, or
  `Temporary` in user-facing copy.
- If a backend read contract is missing, state the business capability and the
  configuration or contract needed next.
- If search/filter returns no rows, explain how to recover by adjusting the
  filter or checking the owning workspace.

## Coverage

- Platform Hub capabilities use capability tables and next-step guidance.
- Notification Center has a no-result state tied to search/filter behavior.
- Supplier incomplete tabs use controlled empty states with ownership and
  backend contract guidance.
- Components QC and Inventory location audit states now avoid developer/demo
  wording.

