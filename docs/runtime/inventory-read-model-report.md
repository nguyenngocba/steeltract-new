# EPIC112 INV.CORE.1 - Inventory Read Model Report

Date: 2026-07-08

## Scope

This sprint does not add UI, workflow, API contract changes, or Prisma schema changes.

Inventory read-heavy paths were moved behind repository-backed read-model services so services/controllers no longer own direct Prisma aggregation.

## Implemented

Added:

- `InventoryReadModelService`

Read-model responsibilities:

- Material Detail response composition.
- Inbound suggestion response composition.
- Read-model hit metric recording through `PerformanceMetricsService`.

Repository source methods added:

- `findInboundSuggestionSources`
- `findInventoryAuditTransactionLines`
- `findPositiveLocationStocksByItem`
- `findTransactionsByItem`
- `findSuppliersByIds`
- `aggregateLocationOccupancy`
- `groupTransactionItemStockByItems`
- `findInboundCostLines`

## Material Detail

Before:

```text
InventoryService
  -> direct Prisma item read
  -> direct Prisma location stock read
  -> direct Prisma transaction read
  -> direct Prisma supplier read
  -> runtime mapping
```

After:

```text
InventoryService
  -> InventoryReadModelService
      -> InventoryRepository
          -> Prisma
```

The public response shape is unchanged.

## Inbound Suggestions

Before:

```text
InventoryService.getInboundSuggestions()
  -> direct Prisma item / last line / recent lines / supplier / occupancy
```

After:

```text
InventoryService.getInboundSuggestions()
  -> InventoryReadModelService.inboundSuggestions()
      -> InventoryRepository.findInboundSuggestionSources()
      -> InventoryRepository.findSupplierById()
      -> InventoryRepository.aggregateLocationOccupancy()
```

## Location Read Model

Inventory location reads now route through `InventoryRepository` methods:

- `listZones`
- `findZoneById`
- `createZone`
- `updateZone`

The existing API response remains unchanged. This is a repository-backed read model boundary, not a persisted snapshot table.

## Snapshot Path

No new snapshot table was created in this sprint.

Prepared future persisted read models:

- `MaterialDailyMovementSnapshot`
- `InventoryLocationBalanceSnapshot`
- `InventoryReturnRequestSnapshot`

## Limitations

- Material Detail is repository-backed and read-model-owned, but not yet persisted in PostgreSQL.
- Material Detail still composes data from operational tables behind the repository boundary.
- Persisted material/location read models should be added in a later schema-enabled sprint after parity checks are defined.

## Verification

- Backend build passed.

