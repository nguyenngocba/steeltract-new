# Core Platform Certification Report

## Decision

**CORE PLATFORM v1.0: CERTIFICATION BLOCKED**

Audit date: 2026-07-13. Scope: Inventory, Components, Production, QC and Yard.
This sprint changed documentation only.

## Certification Matrix

| Module | Repository | ADR011 | Snapshot active path | Runtime | Operations Center | Feature flag | Background | Atomic Outbox | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Inventory | PASS | FAIL | PARTIAL | PARTIAL | PASS | PASS | PASS | FAIL | BLOCKED |
| Components | PASS | PASS | FAIL | PARTIAL | PASS | PASS | PARTIAL | FAIL | BLOCKED |
| Production | PASS | FAIL | PARTIAL | PASS | PASS | PASS | PASS | PARTIAL | BLOCKED |
| QC | PASS | PASS | FAIL | PARTIAL | PASS | PASS | PARTIAL | PASS | BLOCKED |
| Yard | PASS | PASS | FAIL | PARTIAL | PASS | PASS | PARTIAL | PASS | BLOCKED |

## Blocking Evidence

1. Inventory Materials reads `InventoryMaterialSnapshot` through
   `InventoryReadModelService.materialList()`. This conflicts with ADR011's
   strong live-read rule for operator workspaces.
2. Active Production Cockpit loads unbounded order/BOM/issue/reservation arrays
   and calculates business KPI in `ProductionCockpitPage.tsx`; the orders hook
   calls `GET /production` without pagination.
3. Components, QC and Yard snapshot reader services are registered/exported but
   their active Overview/Cockpit/Metrics controllers still call live read-model
   or repository services. The dashboard snapshot path is therefore foundation,
   not a completed cutover.
4. Components emits `component.updated` after repository commit through
   `EventBusService` without persistent atomic Outbox.
5. Inventory Return transitions update business rows, then emit events and logs
   in separate calls. The command and event are not one transaction.
6. Production legacy stage/staging events use EventBus after the business
   transaction. Canonical order/material events are atomic, but module-wide
   Outbox parity is incomplete.

## What Passed

- Direct Prisma ownership is repository-only in all five audited modules.
- Shared Snapshot Engine, dispatcher, writer, validator and feature-flag service
  are reused; no module-specific background framework was found.
- Feature flag names are centralized and correct.
- Operations Center has additive Platform Health for all five modules.
- Components, QC and Yard workspace read-model endpoints are bounded and
  repository-backed.

Core Platform may be called **foundation complete**, but not **v1.0 certified**
until the P0/P1 gaps in the roadmap are remediated and re-audited.
