# ADS003.5 Production-Inventory Interaction Contract

Date: 2026-07-17  
Status: **APPROVED - NORMATIVE APPLICATION CONTRACT**

## Purpose

This contract applies AD-015, AD-016 and AD-017 without changing their domain
ownership or state machines. It defines how Production commands collaborate
with Inventory for Reservation, Issue, Consumption, Return, Scrap and
Completion.

## Ownership

| Capability | Command owner | Persistence owner | Authoritative response/fact |
| --- | --- | --- | --- |
| Material availability query | Inventory query contract | Inventory | Physical stock by exact bucket and query timestamp/version |
| Production Reservation | Production | Production | Reservation state, allocation and Production ledger |
| Reservation release/expiry | Production | Production | Released allocation; no stock movement |
| Material Issue intent/ledger | Production | Production | Production issue and material ledger |
| Issue stock posting | Inventory | Inventory | Inventory posting receipt and Inventory transaction fact |
| Consumption | Production | Production | Production usage ledger; no Inventory stock movement |
| Return intent/ledger | Production | Production | Production return balance and ledger |
| Return stock posting | Inventory | Inventory | Inventory posting receipt and Inventory return fact |
| Scrap disposition | Production | Production | Production Scrap record and ledger |
| Recoverable Scrap stock receipt | Inventory | Inventory | Inventory posting receipt, only when explicitly requested |
| Production Completion | Production | Production | Completion records/order transition; no Inventory stock movement |

No caller may use an Inventory repository or write Inventory tables directly.
Inventory does not write Production reservation, issue, consumption, return,
scrap or completion records.

## Consistency Modes

### Owner-local Command

Reservation, release, consumption, completion and non-recoverable Scrap commit
inside Production only. Inventory may be queried before validation, but no
Inventory mutation occurs.

### Local Atomic Collaboration

Issue, Return and explicit recoverable Scrap posting use one shared local
PostgreSQL transaction:

```text
Production command
  -> Production repository transaction
  -> InventoryPostingService (Inventory owner)
  -> Inventory validates and posts stock/valuation/Inventory Outbox
  -> Inventory returns PostingReceipt
  -> Production writes domain record/ledger/Production Outbox
  -> one commit or one rollback
```

The transaction context is infrastructure, not shared aggregate ownership.

### Asynchronous Projection

After commit, each owner's Outbox updates that owner's snapshots/read models.
Inventory events must never decrement/increment stock again, and Production
events must never cause Inventory to repeat an already atomic posting.

## Reservation

1. Production may create a `DRAFT` reservation only after Order `RELEASED`.
2. Draft records demand only and does not call Inventory posting, write ledger
   allocation or publish a reserved fact.
3. `ReserveMaterial` queries Inventory live physical availability by exact
   material/warehouse/zone/slot/level bucket and validates Production-owned
   active reservations under Production concurrency control.
4. Successful reserve writes Production allocation, ledger and Outbox only.
5. Release/expiry releases the remaining Production allocation only. It never
   creates an Inventory transaction because reservation did not move stock.

## Issue

1. Production validates Order/reservation/issue balance and sends an internal
   `IssueInventoryMaterial` command to `InventoryPostingService`.
2. Inventory revalidates exact physical stock, valuation and location rules.
3. Inventory posts one immutable outbound transaction and returns a receipt.
4. Production persists issue, reservation progress and `ISSUE` ledger using the
   receipt identifiers in the same transaction.
5. Any failure rolls back both contexts. No compensating delete is allowed.

## Consumption And Completion

Consumption validates against Production-issued balance and writes Production
usage only. Inventory stock was already reduced at Issue and is never reduced
again by Consumption or Completion.

Completion reconciles Production ledger and posting receipts. It does not send
an Inventory mutation command. Any remaining material must be returned through
the Return contract before Order close unless an explicit approved balance
policy applies.

## Return

Production validates:

```text
returnable = issued - consumed - postedScrap - previouslyReturned
```

It then invokes Inventory-owned return posting in the same transaction.
Inventory validates destination and valuation, posts the receipt transaction
and returns a PostingReceipt. Production records its return/ledger from that
receipt before commit.

Inventory Outbox refreshes Inventory projections; Production Outbox refreshes
Production projections. Production does not wait for an Inventory event to make
the command aggregate consistent.

## Scrap

Posting Production Scrap does not automatically create Inventory Adjustment.
Issued stock already left Inventory at Issue.

- Non-recoverable/process Scrap: Production ledger/event only.
- Recoverable Scrap retained as stock: an explicit Production orchestration
  calls Inventory-owned receipt posting for an approved Inventory material and
  destination bucket in the same transaction.
- QC owns NCR, inspection and quality disposition when required. Production
  references the QC decision but never writes it.
- Reporting/Costing consume owner facts; they do not mutate either aggregate.

## Prohibitions

- No double stock posting from Consumption, Completion or event consumers.
- No Inventory transaction for reservation create/release/expiry.
- No generic Inventory Adjustment as an implicit side effect of every Scrap.
- No Production projection treated as Inventory stock truth.
- No foreign repository call as an application contract.

