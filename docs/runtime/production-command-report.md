# Production Command Report

Date: 2026-07-17  
Status: **PASS - INTERNAL APPLICATION COMMANDS**

## Implemented Commands

| Aggregate | Commands |
| --- | --- |
| Production Order | Create, Release, Ready, Start, Pause, Resume, Complete, Close, Cancel |
| Work Order | Ready, Start, Pause, Resume, Block, Complete, Cancel |
| Production Execution | Start, Pause, Resume, Complete, Abort |
| Completion | Record partial, reverse record, finalize through Order completion |
| Scrap | Create draft, post, cancel draft, reverse posted |
| Rework | Accept request, reject request, complete accepted rework |

## Transaction Contract

Each command runs inside `ProductionOrderRepository.transaction`. Aggregate
mutation, Production timeline, ActivityLog, audit Outbox and canonical domain
Outbox are committed together. Version conflicts return a conflict instead of
overwriting concurrent changes. Stable command keys replay the original result;
reuse with a different command hash is rejected.

## Owner Contracts

- Released Component Revision/BOM evidence is command input from the Components
  owner; Production does not query or write Component tables in this path.
- Recoverable Scrap calls `InventoryPostingService.returnMaterial` in the same
  local transaction and stores the Inventory posting receipt.
- Issue/Return keep using Inventory-owned posting. Consumption and Completion
  never decrement stock again.

## Compatibility Gate

No route or response was changed. Exposing these versioned commands publicly
requires a separate additive API RFC for `expectedVersion` and idempotency
headers/body fields; mapping old requests to invented values is forbidden.

## RFC003 Internal Execution Commands

Execution commands remain internal application methods as required by RFC003;
no controller or public route was added. They require stable command context,
and every mutation after start requires `expectedVersion`. Exact retries read
the persisted result from the canonical Outbox; key reuse with a different
command hash fails. Work Order and Order completion reject active runs.
