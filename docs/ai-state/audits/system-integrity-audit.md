# System Integrity Audit

Date: 2026-06-12

Scope:

- Inventory reconciliation: `inventory_transactions`, `inventory_transaction_items`, `inventory_location_stocks`
- Production material flow: reservation, issue, return, consumption, ledger
- Component lifecycle: `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED`
- Costing balance: `issued = returned + consumed + scrap`
- Project integrity: installed components must have `projectId`

This audit is read-only. No business workflow or database correction was added.

## Summary

Status:

- Inventory has material reconciliation inconsistencies between transaction-derived balances and `inventory_location_stocks`.
- Production issue/return/reservation data exists, but consumption has not been posted in current data, so issued material is not fully allocated to returned/consumed/scrap.
- Component lifecycle is mostly consistent for project shipment/install states; one `READY` component lacks a matching `READY` timeline entry.
- No installed component currently violates the `projectId` rule.

## Inventory Reconciliation

Observed data:

- Inventory transactions: 37
- Inventory transaction items: 43
- Location stock rows: 12
- Transaction type counts:
  - `IMPORT`: 11
  - `EXPORT`: 18
  - `TRANSFER`: 5
  - `RETURN`: 3
- Current location stock quantity: 3,118
- Negative location stock rows: 0
- Location reconciliation mismatches: 26
- `inventory_items.quantity` snapshot mismatches: 2

Findings:

- `inventory_location_stocks` does not fully reconcile to transaction item quantities by `inventoryItemId + warehouseId + zoneId + slotId + level`.
- Two material snapshots differ from location stock totals:
  - `VT001`: snapshot 556, location total 666, delta -110
  - `VT003`: snapshot 899, location total 1,221, delta -322
- Sample location mismatches:
  - Item `cmq8t0fpm0002pvyczvdolrux`, slot `A02/L2`: transactions 100, location stock 0
  - Item `cmq8t158x0003pvyc2bm8vf97`, slot `A03/L3`: transactions 222, location stock 2
  - Item `cmq8t2frk0005pvyccz3nz763`, slot `C01/L1`: transactions 5,444, location stock 0

Risk:

- Location stock is the operational source of truth for picking/reservation, but historical transaction data cannot currently rebuild it exactly.
- Snapshot quantity remains compatibility data and should not be used for slot-level decisions.

Recommended hardening:

- Add a formal reconciliation job/report before treating transaction history as immutable ledger.
- Backfill or adjust `inventory_location_stocks` only after reviewing historical demo/smoke transactions.
- Keep `inventory_items.quantity` as summary-only compatibility data.

## Production Audit

Observed data:

- Reservations: 5
- Reservation status counts:
  - `ISSUED`: 3
  - `CANCELLED`: 1
  - `PARTIALLY_ISSUED`: 1
- Reservation lines: 5
- Over-issued reservation lines: 1
- Over-returned reservation lines: 0
- Material issues: 11
- Issue returned quantity greater than issued quantity: 0
- Issued quantity: 657
- Returned quantity on issues: 2
- Consumption rows: 0
- Material ledger rows: 13
- Ledger event counts:
  - `RESERVE`: 5
  - `ISSUE`: 5
  - `RETURN`: 2
  - `RELEASE`: 1
- `CONSUME` ledger rows: 0

Findings:

- One reservation line has `issuedQty > reservedQty`.
- Production has issued material, but current DB has no consumption records.
- There are 11 issue rows but only 5 `ISSUE` ledger rows, indicating some issue rows predate ledger automation or came from auto-issue paths not fully ledger-backed.
- `RETURN` ledger rows exist and match the presence of return activity.

Risk:

- Production costing and material accountability remain incomplete until issued material is consumed, scrapped, or returned.
- Ledger cannot yet be treated as a complete historical source for all material issue rows.

Recommended hardening:

- Add migration/backfill or admin reconciliation for issue rows that predate material ledger automation.
- Review the over-issued reservation line before relying on reservation KPIs for capacity planning.

## Component Lifecycle Audit

Observed data:

- Components: 8
- Lifecycle counts:
  - `STOCK`: 5
  - `READY`: 2
  - `SHIPPED`: 1
- Timeline gaps:
  - `READY`: 1 component has status `READY` without a matching `READY` timeline action.
  - `SHIPPED`: 0 gaps
  - `DELIVERED`: 0 gaps
  - `INSTALLED`: 0 gaps

Findings:

- Current lifecycle statuses are valid enum states.
- Shipment timeline integrity is good for the one shipped component.
- One ready component likely predates the production-created timeline convention or was updated through a generic path.

Risk:

- Component history may be incomplete for older/generic state transitions.

Recommended hardening:

- Add a read-only lifecycle integrity panel for missing timeline actions.
- Backfill missing timeline entries only after confirming whether historical state dates are recoverable.

## Costing Audit

Rule:

- `issued = returned + consumed + scrap`

Observed data:

- Production material balance rows: 7
- Costing balance violations: 7
- Over-consumption rows: 0
- Component costing rows: 0

Findings:

- All current production material balance rows have remaining unallocated issued material because no consumption rows exist.
- No row exceeds issued quantity; the issue is incomplete allocation, not negative balance.
- Component costing table is currently empty after prior smoke cleanup.

Risk:

- Actual component cost cannot be calculated from current live rows until consumption is posted for real production orders.

Recommended hardening:

- Require production consumption before costing recalculation for real components.
- Add an operator report for issued-but-not-consumed material by MO/material.

## Project Audit

Observed data:

- Installed components: 0
- Installed components without `projectId`: 0
- Installed components missing installation location: 0

Findings:

- No current violation of the installed-component project rule.
- There is no live installed component yet to validate field usage beyond Sprint 7 smoke testing.

Recommended hardening:

- Keep API validation requiring installation mapping for `DELIVERED -> INSTALLED`.
- Add project receiving/install certificate documents later; current mapping is text-field based.

## KPI Summary APIs Added

Read-only endpoints:

- `GET /runtime/integrity/inventory-summary`
- `GET /runtime/integrity/production-summary`
- `GET /runtime/integrity/project-summary`

Purpose:

- Provide compact integrity KPIs for dashboards or future admin audit screens.
- Do not mutate business records.
- Do not add new business workflows.

## Fixes Applied

Code:

- Added read-only Runtime Integrity KPI controller.
- Added three KPI summary endpoints.
- Used persisted transaction item quantities as the basis for Inventory reconciliation because transaction rows already store signed quantities.
- Used issue `returnedQty` as the returned-material source for production costing balance to avoid double-counting consumption snapshot fields.

Data:

- No data fixes were applied.
- Existing inconsistencies are documented for operator/admin review.

## Remaining Technical Debt

- Inventory needs a formal reconciliation/backfill plan for transaction-derived vs location-stock balances.
- Production Material Ledger needs a backfill plan for issue rows created before ledger automation or through paths not writing `ISSUE`.
- Production requires real consumption posting before costing can be trusted.
- Component lifecycle timeline backfill should be reviewed for older `READY` records.
- Installation mapping remains text-only and is not validated against drawings or coordinates.
