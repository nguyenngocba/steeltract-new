# Components Repository Boundary Report

Date: 2026-07-12

## Boundary Map

```text
ComponentsController
  -> ComponentsService
     -> ComponentsRepository -> Prisma              PASS

ComponentsController
  -> ComponentCostingService
     -> Prisma                                      VIOLATION
```

## ComponentsRepository Coverage

Covered:

- paginated/filterable Component list and count;
- detail and project reads;
- timeline reads/writes;
- create/update/delete;
- project KPI counts;
- ActivityLog;
- transaction wrapper.

Not covered:

- ComponentCosting read/preview/upsert;
- Production consumption/BOM reads for costing;
- Inventory valuation reads used by costing;
- atomic costing + Component summary + ActivityLog mutation;
- Outbox persistence.

## Direct Prisma Violations

`ComponentCostingService` injects `PrismaService` and directly calls:

- `componentCosting.findUnique`;
- `productionMaterialConsumption.findMany`;
- `$transaction`;
- `componentCosting.upsert`;
- `component.update`;
- `activityLog.create`;
- `component.findUnique`;
- `inventoryTransactionItem.findMany`.

This is a critical Core Platform boundary violation, though current business
behavior is not changed by this audit.

## Cross-Module Ownership Risks

- ProductionRepository creates/updates Component during production output.
- ProjectsRepository updates Component and creates ComponentTimeline.
- YardService performs Component reads/updates through its transaction client.
- QCService directly reads Component through Prisma.

These are not automatically bugs: several require one atomic cross-module
transaction. The next implementation sprint must define an internal Components
posting/command boundary similar to InventoryPostingService before moving calls.
Blindly routing through an HTTP/service call would break transaction atomicity.

## Recommended Implementation Order

1. Add costing repository methods or a focused `ComponentCostingRepository`.
2. Move costing transaction ownership into repository without changing formulas.
3. Add transaction-aware internal Component command boundary for Production,
   Projects and Yard.
4. Keep Controller response and business workflow unchanged.
5. Add boundary tests before event/snapshot work.

Repository Boundary status: **FAIL**.

