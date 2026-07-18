# 05. Enterprise Forms

## Contexts

- Toolbar/filter input: 36px (`h-9`), 12-14px text.
- Dense inline control: 32px (`h-8`) only inside compact toolbars/tables.
- Transaction/master form: 44px (`h-11`), 14px text.
- Textarea: minimum 96px with 12px vertical padding.

All use an 8px radius, low-contrast border, dark translucent surface, slate-100
text and slate-500 placeholder. Focus uses a visible cyan 2px outline/border.

## Layout

- Group fields into named business sections, not one uninterrupted grid.
- Base: one column. `md`: two columns for related short fields.
- Section gap: 16-24px; field grid gap: 12px.
- Labels sit above controls. Placeholder is an example/hint, never the label.
- Required fields show a textual/visual indicator and matching validation.
- Related location fields follow Warehouse -> Zone -> Slot -> Level order.

## Controls

- Lookup/autocomplete for large datasets; select only for bounded options.
- Numeric fields use locale-aware parsing/formatting and retain an unformatted
  numeric domain value.
- Date/time control states timezone/format.
- Checkbox for independent booleans; switch only for immediate on/off settings.
- Readonly values remain legible and are distinguishable from disabled values.
- File upload uses the Inventory attachment picker rules: supported type,
  category, size feedback, list and remove before submit.

## Validation

Validate in dependency order and place the message next to the field/section.
On submit, focus or scroll to the first invalid field. Preserve entered and
pending data after API failure. Disable duplicate submission while mutation is
pending, but do not erase the form before success.

## Buttons

Footer order: secondary cancel/back, then primary submit at the right. Dangerous
actions are separated and explicitly labeled. Primary labels describe the
business command (“Xác nhận xuất kho”), not generic “OK”.

## Transaction Forms

Inventory's canonical multi-item flow is form -> 2D/location validation -> add
to pending -> reset line form -> review pending -> atomic submit. Pending rows
are local state only until final confirmation. API failure preserves the list;
successful submit clears it.

## Accessibility

Every control needs an associated label, error association, logical tab order
and visible focus. Autocomplete/listbox patterns require keyboard navigation.

## Known Inventory Variance

Material and transaction forms frequently use placeholders without labels;
focus styling is injected per portal; `h-8`, `h-9` and `h-11` are sometimes
mixed without context. These are documented remediation items, not canon.

