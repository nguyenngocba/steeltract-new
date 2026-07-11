# Production-Inventory Transaction Report

Date: 2026-07-11

Status: **PASS**

## Previous Risks

* Reservation issue wrote Inventory rows directly from
  `MaterialIssueRepository`.
* Return used the same direct-write path.
* Manual issue created Production state first, called `InventoryService` in a
  separate transaction, and deleted the issue as compensation on failure.

## Current Boundary

Issue and Return now execute Inventory posting with the same Prisma
`TransactionClient` used for Production issue, reservation-line, and ledger
changes. A thrown validation or persistence error rolls the entire callback
back; no manual delete compensation remains.

`InventoryPostingService` owns:

* material existence and positive-quantity validation;
* exact location availability validation for Issue;
* Inventory transaction numbering and valuation;
* Inventory transaction and item creation;
* compatibility item quantity and location balance mutation;
* atomic Inventory Outbox rows for transaction and stock changes.

The service exposes an internal interface only. Existing external Inventory
controllers and API contracts are unchanged.
