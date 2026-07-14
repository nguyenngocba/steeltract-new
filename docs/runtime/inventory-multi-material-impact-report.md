# Inventory Multi-material Impact Report

Date: 2026-07-14  
Status: **ASSESSMENT COMPLETE**

## Executive Finding

The core Inventory write path is array-capable, atomic, and line-aware. The
largest impact is not persistence; it is enforcing batch invariants and removing
single-line assumptions from presentation and legacy write paths.

## Affected Backend Paths

| Path | Current behavior | Impact |
|---|---|---|
| `InventoryService.createTransaction` | Normalizes `items[]`, values every line, validates and writes all lines in one repository transaction | Medium hardening |
| `InventoryRepository.createTransaction` | Nested create includes all items | Low |
| `InventoryRepository.listTransactions` | Header pagination with included items; material filter returns only matching lines | Low, document-context contract must be explicit |
| `InventoryPostingService` | Accepts `lines[]` for Production Issue/Return | Medium hardening for duplicate buckets |
| `ReturnWorkflowService` | Return requests and posting are multi-item, but notifications/metadata select the first item | Medium |
| `MaterialMovementsService` | Direct single-line Prisma writer returning `items[0]` | High legacy-path remediation |
| Dashboard activity | Sums all quantities but names only first material | Medium presentation semantics |

## Correctness Risks

### P0: Duplicate bucket validation

`InventoryService.createTransaction()` validates negative lines before any line
is applied. Two lines for the same material/location can each see the same
starting balance and both pass even when their combined deduction is too large.
`InventoryPostingService` has the same shape.

Implementation must normalize or group negative deltas by the complete bucket
key before stock validation, then mutate atomically. This is mandatory before
multi-material rollout because Pending Items can accidentally contain duplicate
material/location entries.

### P0: Legacy writer bypass

`MaterialMovementsService` creates an Inventory transaction directly through
Prisma and is explicitly single-line. It bypasses the certified Inventory
Repository/Outbox/snapshot path. Multi-material enablement must not expand this
path; it should be retired behind the canonical transaction boundary in a
separately approved implementation sprint.

### P1: Transfer pair identity

Current transfer persistence uses one negative and one positive line for one
material. For N materials, signed rows alone do not identify pairs when the same
material is moved between multiple buckets. A command-level pair structure is
required; a persisted `lineGroupId`/movement pair key is recommended only if
the audit/detail contract must reconstruct exact pairs later.

### P1: Header/location ambiguity

`InventoryPostingService` connects header warehouse and zone from `lines[0]`.
This is misleading for a document spanning locations. Header fields should mean
document default/scope only; all stock truth must remain on lines.

### P1: Idempotency

Outbox idempotency exists after a transaction ID is created, but the public
create request has no client request idempotency contract. Retried submissions
can create a second header. Multi-line documents increase the cost of this
failure and need an additive request idempotency key.

## Operational Impact

- Atomic transaction duration grows approximately with line count because
  material lookup, stock lookup, item snapshot update, location update, and
  bucket Outbox writes are currently line-oriented.
- Repeated material lookups can become N query behavior. Batch prefetch and
  grouped balance reads should be evaluated during implementation.
- A bounded maximum line count is required to protect request latency, Outbox
  volume, and background snapshot work.
- Runtime request/SQL metrics continue to work without semantic changes. Future
  reports should add dimensions through existing telemetry rather than a new
  metrics framework.

## UI Component Impact (No Design Proposed)

| Component/path | Current assumption | Required implementation scope |
|---|---|---|
| `InventoryTransactionModals.tsx` | Inbound, Outbound, Transfer, and Adjustment hold one selected material; Stock Take already builds several rows | Add a reusable Pending Items command buffer while preserving each drawer and 2D selector |
| `useCreateInbound.ts` / `useCreateOutbound.ts` | Typed adapters wrap one material in `items[]` | Accept typed line arrays while retaining one-line callers |
| `createTransaction.ts` | Payload is `any` | Bind to the existing array transaction type |
| `InventoryTransactionsPage.tsx` | Main row and CSV export read `items[0]`; detail drawer maps all lines | Use a document summary in the table and line-aware export |
| `InventoryLocationsPage.tsx` | Recent inbound/outbound maps only `items[0]` | Flatten relevant lines or show an explicit multi-material summary |
| `InventoryOverviewPage.tsx` | Recent movement helper returns the first line | Keep KPI aggregation backend-owned; make movement summary line-aware |
| `InventoryMaterialDetailModal.tsx` | Server history is material-scoped and flattened by line | No structural redesign; verify sibling document navigation |
| `InventoryReturnRequestsPage.tsx` | List labels the first request item | Show material count/summary without changing the workflow layout |

The existing drawer, modal/drawer order, 2D location interaction, styling, and
responsive composition do not require redesign.

## Current Data Evidence

The live read-only assessment found 99 headers and 109 lines. Ten transfers have
two lines, but every header has exactly one distinct material. Existing data
therefore validates multi-line source/destination mechanics only, not a true
multi-material document.

## Overall Impact

**Medium**, with two **P0 correctness gates**: aggregate duplicate-bucket
validation and removal of the direct single-line legacy writer. The Core
Platform architecture does not need replacement.
