# 10. Enterprise Interactions

## Hover And Active

Hover increases border/surface contrast slightly; it must not resize content.
Clickable rows/cards use cursor and active state. Noninteractive cards must not
look clickable. Selected filters/KPIs retain a visible state independent of
hover.

## Focus And Keyboard

- Every interactive element has visible cyan focus.
- Tab order follows visual/business order.
- Enter activates focused rows/search; Space activates buttons/checks.
- Escape closes overlays only after dirty-state handling.
- Drawers/modals trap focus and restore it to the trigger.
- Icon controls have accessible names and tooltips where meaning is unfamiliar.

## Loading

Use local fixed-geometry skeletons for initial load. Commands expose pending
state and prevent duplicate submission. Refresh keeps layout stable and must not
pretend stale data is current. Never use a full-page spinner for one panel.

## Feedback

- Toast: concise result for completed command or recoverable error.
- Inline error: field/section problem requiring operator action.
- Confirmation: destructive action or dirty-state discard.
- Timeline/audit: durable business result, not replaced by toast.

Do not display success before the mutation succeeds. If attachment upload fails
after the business transaction, state both outcomes explicitly, as Inventory
currently does.

## Optimistic Behavior

Use only when reversal is safe and domain state is unambiguous. Inventory
transactions favor submit -> server success -> query invalidation/refetch.
Pending transaction lines are local draft state, not optimistic persisted rows.

## Error Recovery

Preserve user input and pending items after API failure. Provide retry without
duplicating requests; canonical mutations use idempotency when supported. Empty,
offline, permission and server error are distinct states.

## Confirmation And Undo

Use confirmation for irreversible/delete/discard actions. Undo is permitted only
when the domain provides a real reversal command; never simulate rollback by
locally hiding a committed event.

## Current Gaps

Inventory has partial keyboard row activation but no uniform focus trap, Escape
handling or focus restoration. `window.confirm`, emoji actions and inconsistent
button accessible names remain remediation candidates. No interaction code is
changed by UI002.

