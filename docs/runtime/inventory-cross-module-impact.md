# Inventory Multi-material Cross-module Impact

Date: 2026-07-14  
Status: **IMPACT MAPPED**

## Impact Matrix

| Module/Area | Impact | Level | Reason |
|---|---|---|---|
| Inventory | DTO validation, batch stock checks, legacy writer, transfer/stock-take semantics, Pending Items, transaction summaries/exports | High | Owns stock and the transaction aggregate |
| Components | Material stock/history consumers may assume one visible line; costing reads item lines | Medium | Reads Inventory facts but should not own posting |
| Production | `InventoryPostingService.lines[]` already supports batch Issue/Return; ledger correlation and duplicate bucket checks need certification | Medium | Direct integration, Inventory remains stock owner |
| QC | No stock transaction ownership; future hold/release may reference document/lines | Low | Contract/reference impact only |
| Yard | No raw-material stock ownership; future handoff may reference documents | Low | Mostly unaffected |
| Projects | Material consumption/return history should remain line-scoped; project documents may include many materials | Medium | Filters transactions through line relations |
| Suppliers/Purchasing | Supplier receipt/cost history must use all lines in a receipt | Medium | Header supplier plus line valuation |
| Logistics | Dispatch/material references may need transaction line identifiers | Low to Medium | Future module, avoid header=material assumption |
| Reports/CSV | Existing first-line export and activity descriptions lose materials | High | User-visible data omission |
| Snapshot Engine | Per-bucket event fan-out and batch parity tests | Medium | Architecture remains valid |
| Runtime | Performance bands by line count; no framework change | Low |
| Operations Center | Existing health remains valid; optional batch diagnostics | Low |

## Boundary Rules

1. Inventory remains the sole owner of item quantity, location stock, valuation,
   Inventory transactions, and Inventory stock Outbox events.
2. Production and future modules submit commands through Inventory boundaries;
   they must not create transaction lines directly.
3. Cross-module references should use `transactionId` for the document and
   `transactionItemId` when a specific material line matters.
4. Consumers must not infer the document material from `items[0]`.
5. Dashboard/analytics remain snapshot-first; operator workspaces remain live
   under ADR011.

## Known Cross-module Findings

- Production posting is already array-based and therefore a strong pilot for
  backend batch semantics.
- Dashboard activity names the first material while summing all quantities.
- Components material stock flattens matching lines and is conceptually safe,
  but should be included in regression tests.
- The direct Material Movement writer is outside the Inventory repository
  boundary and must not become the multi-material integration path.

## Rollout Dependency

Do not update every module in the backend-foundation sprint. First certify the
Inventory aggregate and contract; then remediate readers that demonstrably use
first-line assumptions. This avoids broad speculative refactoring.

