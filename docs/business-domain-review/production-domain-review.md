# Production Domain Review

Status: IMPLEMENTED

## Dashboard / Overview

Current purpose: production manager cockpit.

Business value: shows running work, completed-today output, material blockers,
delayed orders and attention queue.

Decision supported: decide which manufacturing order needs intervention now.

Data source used: existing Production cockpit read model, production logs,
material readiness and order status fields.

Improvements applied:

- Added steel-factory language around MO/WO, material issue, steel consumption
  and release readiness.
- Added attention queue for delayed, shortage and low-progress orders.
- Increased chart weight for progress and material readiness.

## Orders / Planning

Current purpose: full manufacturing order registry.

Business value: lists MO/WO, component, project, quantity, material readiness,
progress, due date and status.

Decision supported: identify pending, delayed and ready-to-release work orders.

Data source used: existing Production cockpit read model and order analytics.

Improvements applied:

- Renamed generic cockpit labels into manufacturing-order language.
- Replaced the non-actionable ready-to-release placeholder with real rows where
  material readiness is at least 100%.

## BOM

Current purpose: production BOM registry.

Business value: shows estimated steel weight, material-line count, active BOMs
and structure type.

Decision supported: confirm whether a component has a usable production
definition before releasing work.

Data source used: existing BOM rows, items and estimated weight.

Improvements applied: reviewed; current page already exposes steel-fabrication
BOM information using existing data.

## Material Consumption / Return / Ledger

Current purpose: track issue, consumption, return and ledger evidence.

Business value: keeps Production from hiding steel usage and return movement.

Decision supported: validate whether material flow supports execution and
completion.

Data source used: existing Production issue, consumption, reservation and
ledger queries.

Improvements applied: language alignment in reports; no business/API change.

## Reports

Current purpose: production analytics.

Business value: summarizes manufacturing order status and steel material flow.

Decision supported: compare issued, consumed and reserved steel quantities.

Data source used: existing orders, issues, consumptions, reservations and logs.

Improvements applied:

- Replaced generic English metric labels with steel-factory terms.
- Kept all values from existing data only.

