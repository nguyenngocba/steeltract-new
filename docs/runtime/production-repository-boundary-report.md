# EPIC130 - Production Repository Boundary Report

Date: 2026-07-11
Status: BOUNDARY INCOMPLETE

## Summary

Production has a `ProductionRepository`, but the repository boundary is not complete. Prisma access remains distributed across multiple Production services.

## Current Repository Coverage

`ProductionRepository` currently covers:

- `ProductionOrder` create/update/find/list/count;
- `ProductionStage` find/update;
- `ProductionTask` create/update;
- `ProductionLog` create/list;
- `WorkCenter` create/list;
- `Machine` create/list;
- `ProductionSchedule` create/list;
- `ActivityLog` create;
- simple metrics counts.

## Direct Prisma Usage Outside Repository

| File | Evidence | Impact |
| --- | --- | --- |
| `production.service.ts` | Injects `PrismaService` in constructor. | Main service can bypass repository. |
| `production.service.ts` | `stageToYard()` directly reads QC, Yard slot, Yard placements and updates Component, Timeline, Log, Order. | Cross-module workflow and persistence boundary are mixed. |
| `production.service.ts` | `createComponentFromProductionOrder()` starts with direct `productionOrder.findUnique()`. | Component creation path bypasses repository. |
| `material-issue.service.ts` | Injects Prisma and directly creates/updates issues, stock, transactions, item quantities. | Material issue/return workflow is not repository-routed. |
| `production-reservation.service.ts` | Injects Prisma and owns reservation creation, reserve/release/expire, stock bucket reads. | Reservation workflow is not repository-routed. |
| `production-consumption.service.ts` | Injects Prisma and reads order/item/issues/consumptions and writes consumption rows. | Consumption workflow is not repository-routed. |
| `production-material-ledger.service.ts` | Injects Prisma and reads/writes ledger rows. | Ledger read/write boundary is service-local. |
| `bom.service.ts` | Injects Prisma and handles BOM CRUD plus material/transaction/issue reads. | BOM is not repository-routed. |
| `workorder.service.ts` | Injects Prisma directly. | WorkOrder path is not repository-routed. |

## Controller Boundary

Controller boundary is mostly acceptable:

- no Prisma injection in `ProductionController`;
- endpoints delegate to services;
- request bodies use Zod validation pipes.

Remaining issue:

- controller delegates to many services that each own persistence directly. For Inventory-level compliance, these services should call repository methods.

## Refactor Plan

### Step 1 - Expand ProductionRepository

Add repository method groups without changing response shapes:

- BOM repository methods;
- reservation repository methods;
- issue repository methods;
- consumption repository methods;
- ledger repository methods;
- production warehouse bucket methods;
- QC/Yard lookup methods required by Production workflows.

### Step 2 - Move Transaction Blocks

Keep business logic in services, but route all `tx.*` persistence through repository transaction helpers where practical.

### Step 3 - Split Read Model Methods

Add read methods for:

- order list page;
- reservation queue;
- material issue queue;
- ledger page;
- consumption page;
- execution board;
- production warehouse.

### Step 4 - Enforce

After refactor:

```bash
rg "PrismaService" apps/backend-api/src/modules/production/services
```

should return no Production service constructors except approved transitional comments, if any.

## Current Verdict

Repository Boundary: **BLOCKED**

Production cannot be declared Core Platform compliant until service-to-Prisma direct access is removed or explicitly isolated behind repository abstractions.

