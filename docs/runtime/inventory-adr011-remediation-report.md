# Inventory ADR011 Remediation Report

## Status

**APPROVED**

EPIC171 removes persisted snapshot reads from Inventory operator workspaces while
leaving Inventory Overview unchanged.

## Changes

- Materials now uses bounded repository live queries over
  `inventory_items`, `inventory_location_stocks` and Inventory transaction
  valuation/history.
- Material Detail always uses its repository live model. Current stock is read
  from canonical positive location balances rather than reconstructed history.
- Locations always reads live zones and location stocks.
- Material History remains the existing paginated transaction endpoint.
- Transactions remains the existing repository live endpoint.

The existing `/inventory/materials` response shape, filters, sorting and
pagination metadata are unchanged, so no React Query or presentation change was
required.

## Explicit Non-change

Inventory Overview remains snapshot-backed for KPI, stock trend and historical
analytics. No Snapshot Engine, runtime, event, Outbox, business workflow or UI
code changed.
