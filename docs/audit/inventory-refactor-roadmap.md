# Inventory Core Platform Refactor Roadmap

Date: 2026-07-08

Scope: roadmap only. No code changes were made.

## Goal

Raise Inventory Core Platform compliance from 72% to at least 82% without changing business behavior.

## Sprint INV-CORE.1 - Repository Command Boundary

Objective:

Move remaining Inventory command reads/writes behind repository methods while preserving current behavior.

Scope:

- `InventoryService.createTransaction`
- stock bucket update helpers
- item quantity snapshot update
- transaction item valuation writes
- return request CRUD helpers
- return request item updates
- activity log writes used by Inventory returns

Rules:

- No API contract change.
- No UI change.
- No schema change.
- Keep exact stock bucket behavior unchanged.

Deliverables:

- Repository methods for transaction command lifecycle.
- Repository methods for return request lifecycle.
- Audit report listing remaining direct Prisma calls.

Success criteria:

- Inventory command services no longer call Prisma directly except through repository or transaction client passed by repository.

## Sprint INV-CORE.2 - Inventory Event Contract

Objective:

Publish canonical Inventory events after successful commits.

Events:

- `inventory.transaction.created`
- `inventory.stock_bucket.updated`
- `inventory.return.requested`
- `inventory.return.received`
- `inventory.return.rejected`
- `inventory.stocktake.completed`
- `inventory.adjustment.posted`
- `inventory.material.updated`

Rules:

- Events are side effects, not workflow replacement.
- Use outbox for committed lifecycle events.
- Do not change user-facing response shape.

Success criteria:

- Background jobs and Operations Center can observe Inventory lifecycle without direct table polling.

## Sprint INV-CORE.3 - Material Detail And Location Read Models

Objective:

Stop Material Detail and location analytics from depending on broad runtime reads.

Read model candidates:

- `MaterialDailyMovementSnapshot`
- `InventoryLocationBalanceSnapshot`
- `InventoryReturnRequestSnapshot`

API compatibility:

- Keep existing Material Detail response shape initially.
- Replace source behind service with tab-native loaders/read models.

Success criteria:

- Material Detail can open with bounded queries.
- Analytics tabs can lazy-load independently.

## Sprint INV-CORE.4 - Background Side Effects

Objective:

Move non-blocking Inventory side effects into Background Engine.

Candidates:

- dashboard snapshot refresh;
- material daily snapshot refresh;
- location balance snapshot refresh;
- return request aging snapshot;
- notification generation;
- parity validation.

Not candidates:

- stock quantity mutation;
- exact bucket validation;
- transaction persistence.

Success criteria:

- User-facing stock correctness remains synchronous.
- Heavy read-model and alert refresh work is asynchronous and idempotent.

## Sprint INV-CORE.5 - Operations Center Inventory Health

Objective:

Expose Inventory-specific operational health.

Signals:

- stock bucket mismatch count;
- stale material snapshots;
- transaction valuation coverage;
- pending return requests;
- slow Inventory endpoints;
- Inventory snapshot hit/miss/fallback;
- Inventory outbox failures;
- Inventory background job failures.

Success criteria:

- Admin can identify Inventory health issues without running SQL manually.

## Sprint INV-CORE.6 - Workflow Hardening

Objective:

Standardize approval/audit/timeline only after repository and event foundations are in place.

Targets:

- stocktake approval;
- adjustment approval;
- inbound/outbound document lifecycle;
- return acceptance/inspection;
- required attachment policies.

Success criteria:

- Workflows become auditable without breaking existing operator paths.

## Recommended Order

```text
1. INV-CORE.1 Repository Command Boundary
2. INV-CORE.2 Inventory Event Contract
3. INV-CORE.3 Read Models
4. INV-CORE.4 Background Side Effects
5. INV-CORE.5 Operations Center Inventory Health
6. INV-CORE.6 Workflow Hardening
```

Rationale:

- Repository boundaries make event publishing and idempotency safer.
- Events make background snapshots and Operations Center health cleaner.
- Read models remove runtime aggregate pressure.
- Workflow approval should wait until audit/event foundations are stable.

