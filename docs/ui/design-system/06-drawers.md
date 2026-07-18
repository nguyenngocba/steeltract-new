# 06. Enterprise Drawers

## Canonical Component

Use `ModuleDetailDrawer` for read/detail workflows. It provides backdrop,
header, action area, independent body scroll and right/center placement.

## Sizes

| Size | Desktop width |
| --- | --- |
| Small | 45vw, 720-820px |
| Medium | 58vw, 900-1180px |
| Large | 62vw, 980-1280px |

At base, drawers are full viewport width. Use the smallest size that keeps the
information hierarchy legible. A centered placement is a bounded detail dialog,
not a substitute for a transaction modal.

## Structure

- Backdrop: black 65% plus restrained blur.
- Right drawer: full height, left border, no decorative outer card.
- Header: fixed, 20px/16px padding, title 20px semibold, subtitle 14px.
- Header actions: right aligned; close uses an icon with accessible name.
- Body: `min-h-0 flex-1 overflow-y-auto p-5`.
- Sections: summary first, then tabs/detail, timeline/activity/audit last.
- Footer/sticky actions are used only when the drawer edits data.

## Interaction

- Opening moves focus into the drawer; closing returns it to the trigger.
- Escape and backdrop behavior must respect dirty-state confirmation.
- Focus remains trapped while open.
- Body scroll must not move the underlying workspace.
- Deep content uses internal tabs/anchors rather than nested drawers.

## Responsive

Full-screen on mobile with a compact header and touch-safe actions. Desktop
minimum widths must not cause horizontal viewport overflow; where the viewport
is narrower than a declared minimum, `w-screen` wins and content reflows.

## Known Inventory Variance

`MaterialDrawer` is visually a centered `max-w-6xl` modal despite its name;
Inventory detail/attachment overlays use custom width classes. Future modules
must choose drawer or modal by interaction model, not component name. Current
Inventory remains unchanged.

