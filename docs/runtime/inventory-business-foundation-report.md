# Inventory Business Foundation Report

Date: 2026-07-14  
Decision: **EPIC181 APPROVED WITH LIMITATIONS**

## Acceptance Matrix

| Gate | Result | Evidence |
|---|---|---|
| Canonical `items[]` command | PASS | Header persists all original lines |
| Duplicate-bucket validation | PASS | Aggregate validation test covers collective overdraw |
| Balance mutation | PASS | One material update and one location update per aggregate |
| Transfer semantics | PASS | Deterministic one-pair-per-material validation |
| Reporting/activity | PASS | CSV, history, returns, location and adjustment paths line-aware |
| Repository boundary | PASS | Material Movements direct Prisma removed |
| Atomic Outbox | PASS | Existing Inventory transaction boundary retained |
| Snapshot Engine | PASS | No changes |
| API/schema/migration | PASS | No changes |
| Public request idempotency | LIMITED | Stable references supported; anonymous request key deferred |

## Business Semantics

- Distinct materials and distinct locations remain distinct lines.
- Duplicate bucket lines remain distinct audit lines but are treated as one
  balance delta for availability and persistence side effects.
- Document-level quantities do not invent a shared unit across mixed materials.
- Mixed-line unit price is shown only when all lines share the same price;
  document value is the sum of line values. Transfer header summaries count the
  positive destination side once, while line exports retain both ledger sides.
- Transfers support one source/destination pair per material. Ambiguous repeated
  pairs fail validation instead of being guessed by line order.

## Deferred Work

- EPIC182: Pending Items UI and bounded operator command buffer.
- Explicit maximum batch size and indexed per-line validation errors.
- Durable public idempotency key, requiring separately approved additive
  contract/storage.
- Pair ID/line number only if multiple same-material transfer pairs are approved.
- Real multi-material operator and rollback certification before UI rollout.

## Final Status

Inventory Business Foundation supports `items[]` without changing Core
Platform, public API, schema, workflow or presentation layout. It is ready for
the Pending Items sprint subject to the documented idempotency and transfer-pair
decisions.
