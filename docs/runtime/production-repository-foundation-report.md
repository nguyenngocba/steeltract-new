# EPIC131 - Production Repository Foundation Report

Date: 2026-07-11
Status: APPROVED

## Mission

EPIC131 moved Production toward the Inventory-proven Core Platform repository boundary without changing UI, public API contracts, workflows, Inventory, Operations Center, snapshots, background jobs, or runtime metrics.

## Repository Foundation Added

New repository classes:

| Repository | Purpose |
| --- | --- |
| `BomRepository` | Production BOM list/detail/create/update, BOM code generation, production-stock validation inputs. |
| `MaterialIssueRepository` | Material issue reads/writes, return reads, stock bucket mutation helpers, valuation reads, inventory transaction writes, reservation status helpers. |
| `ProductionConsumptionRepository` | Consumption list/read inputs, consumption transaction wrapper, consumption create. |
| `ProductionMaterialLedgerRepository` | Ledger list/detail/createMany. |
| `ProductionOrderRepository` | Blueprint-aligned order repository facade over existing `ProductionRepository` order methods. |
| `ProductionReservationRepository` | Reservation list/detail/create/reserve/release/expire helpers and production stock bucket reads. |
| `RoutingRepository` | Routing/stage/task/log repository foundation. |
| `WorkCenterRepository` | Work center, machine, and schedule repository foundation. |
| `WorkOrderRepository` | WorkOrder create/release/list foundation. |

Existing repository retained:

- `ProductionRepository` remains the compatibility facade for current `ProductionService` order/stage/log/component paths.

## Service Refactor

Removed direct `PrismaService` injection and direct model access from Production services:

- `BOMService`
- `MaterialIssueService`
- `ProductionConsumptionService`
- `ProductionMaterialLedgerService`
- `ProductionReservationService`
- `ProductionService`
- `WorkOrderService`

Verification command:

```bash
rg -n "PrismaService|this\\.prisma|nextOperationalCode|\\btx\\.[a-zA-Z]+\\.(find|create|update|delete|count|groupBy|createMany|updateMany|deleteMany)" apps/backend-api/src/modules/production/services
```

Result:

```text
no matches
```

## Business Behavior

No business formulas or workflow decisions were changed.

Preserved:

- Production BOM stock validation.
- Production reservation preview/reserve/release/expire logic.
- Material issue from reservation.
- Material return validation equation.
- Production material ledger writes.
- Consumption and scrap validation.
- Production start/stage completion/component creation/Yard staging behavior.
- Existing API response shapes.

## Transaction Boundary

Repository transaction wrappers are now used for current Production workflows:

- `ProductionRepository.transaction`
- `MaterialIssueRepository.transaction`
- `ProductionConsumptionRepository.transaction`
- `ProductionReservationRepository.transaction`
- `ProductionMaterialLedgerRepository.createMany(..., tx)`

Service code still orchestrates workflow order, but persistence calls go through repository methods.

## Future Snapshot Readiness

No snapshot schema or migration was added in EPIC131.

The repository layer now gives EPIC132/EPIC135 a stable foundation for:

- Production dashboard read models;
- Production order live workspace read models;
- Work center snapshot readers/writers;
- Production material ledger and issue read models;
- future snapshot builders.

## Acceptance Checklist

| Criteria | Result |
| --- | --- |
| ProductionRepository foundation | PASS |
| WorkOrderRepository foundation | PASS |
| ProductionOrderRepository foundation | PASS |
| RoutingRepository foundation | PASS |
| WorkCenterRepository foundation | PASS |
| No Production service injects PrismaService | PASS |
| No Production service directly calls `this.prisma` | PASS |
| No Production service directly calls model methods on transaction client | PASS |
| UI unchanged | PASS |
| API contract unchanged | PASS |
| Inventory unchanged | PASS |
| Snapshot not implemented | PASS |

## Final Status

Production Repository Foundation: **APPROVED**

Repository Boundary: **PASS**

Transaction Boundary: **PASS**

Read Model Foundation: **PASS**

Future Snapshot Readiness: **PASS**

