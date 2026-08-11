# PROCUREMENT.GATE.1 - Procurement Canonical Gate Approval

Date: 2026-08-11  
Status: **IMPLEMENTED AND DEPLOYED**

## Scope

This gate adds only the persistence, idempotency, lineage and authorization
contracts required by the later Procurement domain sprint. It does not add
Purchase Request/PO commands, Receipt endpoints, UI, or supplier-return
business transitions.

## Material Request

The legacy `MaterialRequest.status: ApprovalStatus` remains unchanged for old
consumers. The canonical lifecycle is now stored independently in:

```text
lifecycleStatus: PurchaseRequestStatus
DRAFT -> SUBMITTED -> APPROVED | REJECTED | CANCELLED
```

Additive fields:

- `requesterId` -> nullable `User` relation
- `approvedById` -> nullable `User` relation
- `departmentId`
- `requiredDate`
- `priority` using the existing `TaskPriority` enum
- `reason`
- `submittedAt`, `approvedAt`, `rejectedAt`, `cancelledAt`

There is no canonical Department model in the current database. Therefore
`departmentId` is an indexed nullable identity slot without an FK. The domain
sprint must not invent a Department table or treat this value as a validated
master relation until an Organization schema sprint establishes that master.

## Purchase Order

`PurchaseOrderStatus.REJECTED` is additive. Existing statuses, including
legacy `PENDING`, remain valid.

Existing requester/approver identities and submission/approval timestamps are
retained. The gate adds rejection/cancellation actor, timestamp and reason
fields:

- `rejectedById`, `rejectedAt`, `rejectionReason`
- `cancelledById`, `cancelledAt`, `cancellationReason`

Both actor relations use `ON DELETE SET NULL` to preserve historical PO data.

## Canonical Partial Receipt Contract

One PO can now own N Inventory receipt transactions:

```text
PurchaseOrder.id
  <- InventoryTransaction.referenceId
     referenceModule = PURCHASE_ORDER
     type = IMPORT

Receipt command 1 -> Idempotency-Key A -> InventoryTransaction A
Receipt command 2 -> Idempotency-Key B -> InventoryTransaction B
Receipt replay    -> Idempotency-Key A -> InventoryTransaction A
```

`InventoryTransaction` now stores nullable unique `idempotencyKey` and its
`commandHash`. This moves the durable command marker onto the stock document
itself while retaining the existing Outbox marker as compatibility/audit
infrastructure.

For `IMPORT + PURCHASE_ORDER`, an explicit Idempotency-Key enables multiple
transactions with the same PO reference. Each key can create at most one stock
document:

- same key + same payload: return the existing transaction;
- same key + different payload: `409 Conflict` and ActivityLog;
- different keys + same PO reference: create separate receipt transactions;
- concurrent duplicate key: the unique InventoryTransaction index rolls back
  the losing transaction before stock changes commit, then returns the winner.

Other Inventory references preserve their existing single-reference behavior.
The existing Inventory service still owns valuation, location validation,
InventoryItem compatibility balance, InventoryLocationStock, Outbox and stock
events. Procurement is not allowed to write Inventory tables directly.

## Supplier Return Lineage

`ReturnRequest` now has nullable canonical links:

- `supplierId -> Supplier`
- `purchaseOrderId -> PurchaseOrder`
- `receiptTransactionId -> InventoryTransaction`

This supports the future enforced chain:

```text
Supplier
  -> PurchaseOrder
  -> IMPORT InventoryTransaction
  -> Supplier ReturnRequest
  -> EXPORT InventoryTransaction
```

All relations use `ON DELETE RESTRICT`. Existing ReturnRequest behavior and
legacy rows remain unchanged. The domain sprint must validate that the source
receipt is an IMPORT for the same PO, supplier and returned materials.

## RBAC

Added to the canonical permission catalog:

- `procurement.view`
- `procurement.request.create`
- `procurement.po.create`
- `procurement.po.approve`
- `procurement.receipt`
- `procurement.return`

`RbacService.ensureCanonicalCatalog()` was used to upsert the six permissions
and assign them to the existing `admin` role. No SQL permission seed or role
widening was introduced for non-admin presets.

## Migration

Migration: `20260811123000_procurement_canonical_gate`

The SQL contains only:

- enum creation/value extension;
- nullable/defaulted column additions;
- indexes and one unique idempotency index;
- nullable foreign keys.

It contains no `DROP`, `TRUNCATE`, `DELETE`, or `RENAME`. `ON DELETE` clauses
are FK referential policies only.

Preflight:

```text
MaterialRequest          0
PurchaseOrder            0
ReturnRequest            0
InventoryTransaction     2
Invalid Supplier returns 0
```

Post-deploy counts are unchanged. A schema probe confirmed all 13 selected
gate columns exist.

## Compatibility

- No legacy field was removed or renamed.
- `MaterialRequest.status` remains available.
- `PurchaseOrderStatus.PENDING` remains available.
- Existing Inventory callers without an explicit PO receipt key keep their
  previous reference behavior.
- Existing Outbox-based Inventory replay remains a fallback for historical
  transactions.
- `PurchaseReceiving` remains untouched and is still a legacy candidate.
- No Procurement workflow/controller or UI was implemented.

## Verification

| Gate | Result |
|---|---|
| Prisma format | PASS |
| Prisma validate | PASS |
| Prisma generate | PASS, 6.19.3 |
| Migration deploy | PASS |
| Migration status | PASS, 93 migrations, up to date |
| Inventory/RBAC targeted tests | PASS, 2 suites / 11 tests |
| Partial receipt replay/conflict/conservation test | PASS |
| Backend build | PASS |
| RBAC runtime catalog | PASS, 6/6 permissions assigned to admin |
| Compatibility row-count probe | PASS |

## Domain Sprint Handoff

`PROCUREMENT.DOMAIN.1` may now implement typed Controller -> Service ->
Repository commands. It must require a client idempotency key for each PO
receipt, update PO line received/remaining quantities in the same transaction
as Inventory posting, enforce over-receipt protection, and use the new
ReturnRequest lineage. No further Procurement schema gate is currently known.

