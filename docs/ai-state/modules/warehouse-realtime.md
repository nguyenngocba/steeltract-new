# Warehouse Realtime Dashboard

Status: **FRONTEND IMPLEMENTED - POLLING FOUNDATION**

## Scope

Realtime warehouse operational cockpit for Inventory operators.

## Implemented Features

- Route: `/warehouse-realtime`.
- Navigation entry under `VẬT TƯ KHO` as `Cockpit realtime`.
- Realtime KPI row:
  - Total inventory.
  - Reserved.
  - Available.
  - Low stock.
  - Out of stock.
- Warehouse map panels:
  - Warehouse occupancy from Inventory overview warehouse facets.
  - Slot utilization approximation from material warehouse buckets.
- Recent transactions table:
  - Reads existing `/inventory/transactions`.
  - Shows receipt/issue/transfer/adjustment badges where type data exists.
- Realtime alerts:
  - Negative inventory from current material rows.
  - Out-of-stock and low-stock counts from Inventory overview.
  - Unassigned material rows where warehouse code is absent.
- Movement timeline:
  - Reads existing Inventory overview `movementTrend`.
- Polling abstraction:
  - TanStack Query refetch interval: 5 seconds.

## Database Models

No new database models.

## API Endpoints

No new backend endpoints.

Frontend reads existing endpoints:

- `GET /inventory/overview`
- `GET /inventory/materials`
- `GET /inventory/transactions`

## Routes

- `/warehouse-realtime`

## Remaining Tasks

1. Add a dedicated backend realtime read endpoint if the existing Inventory
   overview/material/transaction endpoints become too chatty.
2. Add WebSocket signal support after an approved backend realtime contract.
3. Add authoritative warehouse capacity fields before certifying true over
   capacity alerts.
4. Add slot/zone-level read contracts if warehouse map needs exact physical
   utilization rather than normalized distribution.
