# Remaining Opportunities

Status: OPEN

These are intentionally not implemented because this EPIC forbids backend/API
changes and fake data.

- True NCR count requires a QC-domain contract linked to components.
- Waiting-for-painting and waiting-for-shipping can become authoritative once
  Components has canonical stage events or read-model fields for each stage.
- Today's steel consumption would be stronger if the Production read model
  exposes date-scoped consumption totals directly.
- Component detail drawers can become richer when authoritative timeline and
  dependency projections are available across Production, QC, Yard and
  Logistics.
- Bulk actions should only be added when corresponding command contracts exist.

