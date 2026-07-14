# Multi-material Rollout Plan

Date: 2026-07-14  
Status: **APPROVED SEQUENCE**

## Gate 0 - EPIC182 Specification

- Freeze duplicate, Pending, validation, cancellation and rollback behavior.
- No application, API, schema, or data changes.
- Handoff the specification to UI implementation only after review.

## Gate 1 - Pending Items Frontend Foundation

- Implement a reusable local Pending command buffer within existing Inventory
  drawers.
- Preserve 2D selectors and current presentation language.
- Implement exact-duplicate merge, edit/remove, dirty-close protection, grouped
  quantities, and one-submit behavior.
- Do not enable all workflows yet.

Exit: component/unit tests for local state transitions and no API call before
Confirm.

## Gate 2 - Inbound Pilot

- Enable multi-material Inbound first.
- Validate per-line location and price, mixed units, attachment/header behavior,
  atomic rollback and line-aware history.
- Keep the existing single-material path compatible.

Exit: real operator smoke with 1, 5, and 50 entries plus one invalid line.

## Gate 3 - Outbound Pilot

- Enable Outbound using live source buckets.
- Validate aggregate Pending demand, concurrent stock conflict, complete
  rollback and read-after-write behavior.
- Public durable idempotency should be approved before broad production rollout;
  until then mutation auto-retry remains prohibited.

Exit: no over-issue and no duplicate transaction under the approved retry test.

## Gate 4 - Transfer

- Enable many distinct materials with one source/destination route each.
- Block multiple routes for the same material in one transaction.
- Do not add pair IDs or schema fields without a separate approval.

Exit: source/destination parity, stock/location parity and line ordering PASS.

## Gate 5 - Adjustment, Stock Take, Return

- Adjustment requires approved per-line reason/evidence semantics.
- Stock Take remains its existing count/variance workflow; reuse only the local
  Pending primitive where semantics match.
- Return remains driven by Return Request state/disposition rules.

Exit: workflow-specific audit evidence survives at line level.

## Gate 6 - Certification

- Execute real operator tests across all enabled workflows.
- Verify ledger, location stock, item compatibility quantity, snapshots,
  Outbox, Runtime and read-after-write parity for every line.
- Benchmark payload/latency at 1, 5, 20 and 50 Pending entries.
- Certify no first-line-only consumer and no partial transaction.

## Stop Conditions

Stop rollout and return to specification review if implementation requires:

- multiple transfer routes for one material;
- lot/batch/serial tracking;
- persistent drafts;
- partial posting;
- API indexed errors or durable idempotency storage;
- changes to Inventory ownership or transaction immutability.

These are additive business/platform decisions, not presentation details.
