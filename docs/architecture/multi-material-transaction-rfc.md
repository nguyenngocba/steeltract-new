# RFC-001: Multi-material Inventory Transactions

Status: **APPROVED - OPTION B SELECTED**  
Date: 2026-07-14  
Scope: Architecture assessment only; no application code, schema, API, or data was changed.

## Decision Summary

SteelTrack already has a persisted Header/Line model:

```text
InventoryTransaction (header)
        |
        +-- InventoryTransactionItem[] (lines)
                    |
                    +-- InventoryLocationStock bucket mutations
```

The canonical `POST /inventory/transactions` contract already accepts `items[]`,
the repository creates nested lines atomically, and stock/snapshot events are
emitted per affected line. A new transaction model is therefore unnecessary.

The recommended direction is **Option B - additive extension**: preserve the
existing header/line tables and API, harden line-level invariants, add optional
line metadata only where enterprise workflows require it, and roll out the
existing drawer/2D experience with a Pending Items collection.

## Verified Current State

| Area | Evidence | Assessment |
|---|---|---|
| Header/Line | `InventoryTransaction.items` and `InventoryTransactionItem.transaction` in `schema.prisma:888-986` | Present |
| Line location | `warehouseId`, `zoneId`, `slotId`, `level` on every line | Present |
| Line valuation | `unitPrice`, `totalAmount` on every line | Present |
| API array | `createTransactionSchema.items[]` in `inventory.dto.ts:204-287` | Present and backward compatible |
| Atomic persistence | `InventoryService.createTransaction()` creates header, lines, balances, and Outbox in one repository transaction | Present |
| Cross-module posting | `InventoryPostingService` accepts `lines[]` | Present |
| Multi-line reads | list/detail APIs return `items[]`; material filter uses `items.some` | Present |
| Multi-material production data | Read-only query found zero headers with more than one distinct material | Not yet exercised |

Read-only database observation on 2026-07-14:

- 99 transaction headers and 109 transaction lines.
- 89 headers have one line; 10 transfer headers have two lines.
- All 10 two-line headers represent source/destination lines for one material.
- Maximum distinct materials per persisted header is one for every transaction type.

This proves multi-line persistence is active, but it does not certify the
multi-material workflow.

## Target Architecture

```text
Drawer header fields
        |
2D material/location selection
        |
Pending Items (N validated command lines)
        |
POST /inventory/transactions { ..., items: [...] }
        |
InventoryService validation/orchestration
        |
InventoryRepository transaction
  +-- create header
  +-- create N lines
  +-- update N item/location balances
  +-- write header Outbox event
  +-- write affected-bucket Outbox events
        |
Background Snapshot Engine
```

The UI remains a drawer workflow. Pending Items is a command buffer and summary,
not an editable spreadsheet or Odoo-style grid.

## Required Invariants Before Rollout

1. A request must contain at least one line and a bounded maximum line count.
2. Every line must have a stable line number and valid material, quantity, unit,
   and workflow-required location fields.
3. Duplicate source buckets must be aggregated before availability validation.
   Current line-by-line validation can allow two deductions that individually
   pass but collectively exceed the same bucket balance.
4. The entire header, all lines, stock balances, audit data, and Outbox records
   must commit or roll back together.
5. A transfer command must retain a deterministic source/destination pair for
   each pending material. Two untyped signed lines are insufficient when the
   same material appears in multiple transfer pairs.
6. Header warehouse/zone values must not be treated as line truth for mixed
   warehouse documents. Location truth remains line-owned.
7. Posted transactions remain immutable under INV-010.
8. Request idempotency must prevent an operator/network retry from creating a
   second document.

## Workflow Assessment

| Workflow | Existing multi-line readiness | Required work |
|---|---|---|
| Inbound | Backend array and per-line location validation already exist | Pending Items UX, batch validation/error mapping, tests |
| Outbound | Backend signs all lines and updates each bucket | Aggregate duplicate-bucket availability, idempotency, UX |
| Transfer | Two lines already represent source/destination for one material | Add command-level transfer pairs and deterministic line pairing |
| Adjustment | Array persistence works | Preserve reason/audit metadata per line when reasons differ |
| Stock Take | Current modal already submits multiple variance lines | Replace item-total baseline with location-bucket baseline; formalize per-line count audit metadata |
| Return | ReturnRequest and disposition flows already contain item arrays | Remove first-item summaries and certify multi-line posting/read paths |

Reservation is not reduced by an inbound/outbound document model change. Any
future reservation release or consumption remains a separate domain operation.
Production Issue/Return already calls `InventoryPostingService` with `lines[]`,
so Inventory remains the stock source of truth.

## Options

### Option A - Use Current Architecture Without Additive Domain Fields

- Impact: **Low to Medium**
- Estimate: **1-2 engineering sprints** for Inbound/Outbound only.
- Approach: expose Pending Items and submit the existing `items[]` contract.
- Risk: transfer-pair ambiguity, line order is not persisted, duplicate-bucket
  over-issue remains possible, stock-take evidence remains header metadata.
- Core Platform impact: low; Repository, Outbox, Snapshot, Runtime remain intact.
- Recommendation: acceptable only as a limited pilot for distinct-material
  Inbound/Outbound lines. Not sufficient for enterprise-wide rollout.

### Option B - Additive Extension of Existing Header/Line Model

- Impact: **Medium**
- Estimate: **4-6 engineering sprints**, including operator validation.
- Approach: retain current tables and endpoint; add bounded batch DTOs,
  idempotency, stable line ordering, transfer-pair/per-line audit metadata where
  proven necessary, line-aware read models, and Pending Items UX.
- Risk: migration and compatibility work must be sequenced; mixed-location and
  duplicate-material rules require explicit tests.
- Core Platform impact: controlled and additive. Repository ownership, ADR011,
  atomic Outbox, Background Engine, Snapshot Engine, Runtime, and Operations
  Center remain unchanged in principle.
- Recommendation: **SELECT**. It uses the architecture already deployed while
  closing the actual correctness and operability gaps.

### Option C - Replace the Header/Line Model

- Impact: **High**
- Estimate: **8-12+ engineering sprints** plus migration and dual-read period.
- Approach: introduce a new document aggregate and migrate all consumers.
- Risk: duplicate sources of truth, historical migration, API breakage, ledger
  and snapshot parity risk, and broad cross-module regression.
- Core Platform impact: high; repository, event, snapshot, read-model, and
  integration contracts would all need redesign.
- Recommendation: **REJECT**. The current schema is already Header/Line and no
  assessed requirement justifies replacement.

## Final Recommendation

Option B is approved as the implementation direction. EPIC181 completed the
command foundation without a schema migration. EPIC182 freezes operator,
Pending Items, duplicate, validation, cancellation and rollback semantics before
UI implementation. Any additive columns remain subject to separate approval
for transfer pairing, tracking, stock-take evidence or durable idempotency.
