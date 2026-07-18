# 07. Enterprise Modals

## Use

Use modals for bounded commands, confirmation and focused creation. Use drawers
for browse/detail/edit-in-context. Large transaction workspaces may use a wide
modal because they combine line entry, pending list and 2D/location preview.

## Sizes

- Confirmation: content-driven, maximum about 480px.
- Standard form: `max-w-4xl` only when grouped fields require it; simpler forms
  should be narrower.
- Wide transaction: `max-w-7xl`.
- Complex outbound/transfer/adjustment: up to `96vw`, capped at 1800px at `2xl`.
- Vertical bounds: outer page scroll or internal body up to 90vh; header/footer
  remain visible.

## Structure

- Portal z-index 9999, dark 60-75% backdrop and restrained blur.
- Surface: slate-950/95, 16px radius, subtle border and shadow.
- Header: 16-20px padding, title 16-20px semibold, icon close.
- Body: 20-24px padding; one-column base, explicit `xl` split for complex flows.
- Footer: top border, 16px vertical/20-24px horizontal padding, actions right.

## Confirmation

Confirmation text names the object and consequence. Destructive confirmation
uses a danger action and a neutral cancel action. Browser `window.confirm` is
not the enterprise standard because it cannot preserve layout, accessibility or
consistent wording.

## Transaction Modal

Pending summary and list appear before the final submit. Edit/remove actions are
icon buttons with accessible labels. Dirty close asks before discarding.
Submission is atomic; failure preserves pending state and provides recovery.

## Interaction And Accessibility

Use `role=dialog`, `aria-modal=true`, labelled title, initial focus, focus trap,
Escape behavior and focus restoration. Prevent background scroll. Icon close
buttons require `aria-label`; do not use emoji as action icons.

## Known Inventory Variance

The current `ModalShell` lacks explicit dialog semantics/focus management,
renders a text “Đóng” button, and several paths use `window.confirm` or emoji
edit/delete controls. These are consistency/accessibility recommendations only;
UI002 does not alter code.

