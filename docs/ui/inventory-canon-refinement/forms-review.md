# Inventory Forms Review

## Standard

Inventory retains two intentional control densities: 32px dense controls and
36px filter/transaction fields. Transaction forms remain grouped by business
section and stack before their `xl` split-pane layout.

## Implementation

- Existing business fields, validation order and Pending Items behavior remain
  unchanged.
- Transaction modal geometry, scroll containment and focus behavior are
  centralized in `ModalShell`; its viewport-bounded body is the only vertical
  scroll owner.
- Material create/edit uses the same 36px control density and a bounded drawer
  body with a fixed header/footer.
- Dirty close and pending-line edit no longer use browser dialogs; the shared
  Inventory confirmation presents explicit consequence and action hierarchy.
- API failure still preserves form and Pending Items state.
- Filter and command controls remain comfortable at 36px; textareas retain an
  80px minimum height.

## Follow-up

Several legacy Location form fields still communicate their label through a
placeholder. Converting these to persistent labels requires a focused form
markup pass and screenshot validation; no business field was renamed here.

Form behavior and sizing contract: **PASS WITH MARKUP DEBT RECORDED**.
