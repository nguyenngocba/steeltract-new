# EPIC112 INV.CORE.1 - Inventory Repository Coverage Report

Date: 2026-07-08

## Scope

Inventory service/controller persistence was audited and routed through `InventoryRepository`.

## Coverage Summary

```text
Inventory Repository Coverage: 100% for active Inventory module service/controller persistence paths.
```

Evidence scan:

```bash
rg -n "PrismaService|this\\.prisma|private readonly prisma|private prisma" apps/backend-api/src/modules/inventory --glob "*.ts"
```

Result:

- Direct Prisma usage remains only in `InventoryRepository`.
- `InventoryService`, `ReturnWorkflowService`, and Inventory controllers no longer inject `PrismaService`.

## Refactored Paths

### InventoryService

Moved direct Prisma usage into repository/read-model boundaries:

- Material Detail.
- Inbound suggestions.
- Inventory audit source rows.
- Default category lookup.
- Supplier lookups.
- Transaction detail lookup.
- Warehouse zone lookup.
- Average cost source lines.
- Current stock aggregation.
- Exact location stock lookup.
- Item stock grouping.

### ReturnWorkflowService

Moved direct Prisma usage into repository:

- Return request list/create/update/detail.
- Return request item updates.
- ActivityLog writes.
- Site return availability source reads.
- Project task material allocation updates.
- Return request number generation.

### Inventory Master Controllers

Moved direct Prisma usage into repository:

- Zones.
- Categories.
- Units.
- Material types.

## Remaining Direct Prisma

Expected:

- `InventoryRepository` owns Prisma access.

No direct Prisma is expected in active Inventory services/controllers.

## Command Boundary

Command paths now flow through:

```text
Controller
  -> Service
      -> InventoryRepository
          -> Prisma
```

Covered command groups:

- Inbound.
- Outbound.
- Transfer.
- Adjustment.
- Return.
- Stock take through Inventory transaction command path.
- Material create/update/delete.
- Inventory master data CRUD.

## Limitations

- Production services and other modules may still write Inventory-related records directly. This report covers the active `modules/inventory` backend boundary only.
- A later cross-module compliance sprint should address non-Inventory writers that create Inventory transactions outside `InventoryService`.

## Verification

- Backend build passed.

