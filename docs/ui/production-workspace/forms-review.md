# Production Forms Review

## Shared Standard

The canonical frontend form layer now exports:

- `EnterpriseForm`, `EnterpriseFormSection` and `EnterpriseFormGrid`
- `EnterpriseField`, `EnterpriseInput`, `EnterpriseNumberField`
- `EnterpriseSelect` and `EnterpriseDatePicker`
- `EnterpriseFormActions` and `EnterpriseModalForm`

Legacy shared form entry points re-export these primitives, preventing another
form styling implementation. Controls use a 36px height, consistent labels,
required markers, validation placement, responsive grids and shared actions.

## Production Cutover

- Manufacturing Order creation uses grouped Enterprise fields and modal form.
- Production BOM uses the Enterprise modal shell and controls; its material and
  routing grids remain domain-specific row editors.
- Material Return and Consumption no longer use `window.prompt`; both use
  labelled, validated Enterprise modal forms with the unchanged mutation hooks
  and payloads.
- Yard staging fields in the Production detail drawer use Enterprise fields,
  numeric controls and action styling.

## Dialog Behavior

The shared modal is viewport bounded and has one scroll owner, fixed header and
footer actions, initial focus, Tab containment, Escape handling, body scroll
lock and focus restoration. Pending mutations disable close and submit actions.
