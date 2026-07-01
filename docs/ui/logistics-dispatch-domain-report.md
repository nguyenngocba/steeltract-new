# Logistics Dispatch Domain Report

Sprint 50LOG.1 added the persistent dispatch domain for the Inventory -> Yard -> Logistics -> Projects flow.

## Models

- `DispatchOrder`: dispatch header with project, optional project task, vehicle, driver, status timestamps and loading checklist.
- `DispatchItem`: material or component lines linked to inventory items/components.
- `DispatchEvent`: timeline events for dispatch lifecycle.

## Status Flow

`DRAFT -> PLANNED -> LOADING -> IN_TRANSIT -> ARRIVED -> RECEIVED -> COMPLETED`

`CANCELLED` is allowed before completion.

## Guardrails

- Dispatch orders require at least one item.
- Material items require `inventoryItemId`.
- Component items require `componentId`.
- Active component dispatch is blocked when the same component already appears in an active dispatch order.

## Database

Migration created:

`apps/backend-api/prisma/migrations/20260701090000_dispatch_order_domain/migration.sql`

The migration creates dispatch enums, tables, indexes and foreign keys. It does not modify historical data.
