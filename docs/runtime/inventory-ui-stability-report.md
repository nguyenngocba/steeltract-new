# Inventory UI Stability Report

Date: 2026-07-08

## Scope

Reviewed Inventory UI stability without redesign:

* Dashboard/Overview
* Transactions
* Return Requests
* Materials & Stock
* Locations
* Inbound
* Outbound
* Transfer
* Stock Take
* Adjustments
* Alerts

## Findings

### Stable

* Inventory Overview uses existing cockpit layout and MAIN stock rules.
* Materials table displays `Kho chính`, `Kho SX`, and `Tổng tồn`.
* Transactions page has detail drawer and attachment count logic.
* Return Requests page uses cockpit KPI/chart/table/drawer patterns.
* Inbound modal has service-level backend validation for missing storage location.

### Warnings

1. Inventory transaction API helper duplication.

There are two active paths:

```text
/inventory/transactions
/transactions
```

`/transactions` is a legacy CQRS bridge that still routes to Inventory handlers. It is compatible, but Business Freeze should standardize active Inventory UI calls on `/inventory/transactions` after confirming no legacy screens depend on the bridge.

2. Controller validation is weaker than service validation.

The UI can send line-level location data, and service validation enforces it, but `InventoryController` accepts raw body and does not use `createTransactionSchema`.

3. Some modal wrappers in Locations still use local large modal styling.

This is visual debt, not a current business blocker.

4. Dashboard historical trend widgets are frontend-derived from current rows and transaction back-calculation.

This is acceptable for cockpit insight but not sufficient for official historical report freeze.

## No Redesign Applied

No frontend UI changes were made in this sprint.

## UI Freeze Result

UI stability: PASS with warnings.

Business Freeze remains blocked by data parity and validation-contract issues, not by layout/styling.
