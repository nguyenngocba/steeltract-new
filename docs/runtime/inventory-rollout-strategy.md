# Inventory Multi-material Rollout Strategy

Date: 2026-07-14  
Recommendation: **OPTION B - ADDITIVE**

## Delivery Principles

- Preserve existing Header/Line data and routes.
- Keep scalar single-material requests backward compatible during migration.
- Preserve drawer, 2D map, and operator flow.
- Do not introduce an editable spreadsheet UI.
- Keep Inventory as stock source of truth.
- Keep all stock, audit, and Outbox writes atomic.
- Roll out by workflow; do not enable every command at once.

## Proposed Roadmap

### EPIC181 - Multi-material Command Foundation (Completed)

Scope:

- Freeze line semantics for the current contract.
- Aggregate duplicate bucket deltas before availability checks.
- Add stable-reference idempotency for existing internal callers.
- Route the legacy Material Movement writer through the canonical boundary.
- Add repository/service tests for rollback, mixed materials, duplicate buckets,
  mixed locations, valuation, and Outbox fan-out.

Gate: no frontend rollout until atomicity and stock invariants pass.

### EPIC182 - Business Specification and Operator Workflow (Current)

Scope:

- Freeze local Pending command behavior without application code.
- Select automatic exact-duplicate merge.
- Define edit/remove, dirty-close, grouped totals, validation order, atomic
  rollback and workflow-specific rollout gates.
- Preserve the current Drawer/2D design as an implementation constraint.

Gate: Gemini follows the approved specification and does not invent workflow.

### EPIC183 - Pending Items Foundation and Inbound Pilot

Scope:

- Implement the local Pending Items foundation in existing drawers.
- Enable and certify Inbound first.
- Preserve single-material compatibility and presentation language.

Gate: no API call before Confirm; exact duplicate merge and rollback tests pass.

### EPIC184 - Outbound and Transfer Pilot

Scope:

- Enable Outbound with aggregate stock/concurrency validation.
- Enable Transfer for multiple distinct materials with one route per material.
- Keep one-material requests working unchanged.

Gate: durable idempotency decision before broad rollout; no over-issue.

### EPIC185 - Adjustment, Stock Take, and Return

Scope:

- If broader transfer routing is approved, decide whether stable `lineNo`, pair
  ID, or per-line audit fields require an additive migration.
- Preserve per-line adjustment/count evidence.
- Remove first-item assumptions from return metadata and notifications.

Gate: workflow-specific parity; do not treat generic signed rows as a complete
transfer or stock-take domain.

### EPIC186 - Cross-module and Operator Certification

Scope:

- Certify the line-aware history, movement, CSV, reports and activity paths
  completed by EPIC181.
- Regression-test Components, Production, Projects, Suppliers, and dashboards.
- Measure line-count performance bands, background lag, and snapshot parity.
- Run end-to-end operator certification.

Gate: no omitted line, no duplicate stock effect, no first-item-only report.

## Test Matrix

Minimum cases:

1. Five distinct inbound materials in one location and mixed locations.
2. Five outbound materials with sufficient and one insufficient line; entire
   transaction must roll back.
3. Duplicate material/source bucket whose aggregate exceeds stock.
4. Reject two transfer pairs for the same material until pair identity exists.
5. Mixed units; document quantity must not claim a false combined unit.
6. Multi-line adjustment and stock take with per-line evidence.
7. Multi-item return with different dispositions.
8. Retried internal request with the same stable reference; separately test any
   future public idempotency key after approval.
9. Material history shows only the selected line while document detail shows all.
10. Snapshot/material/location/dashboard parity for every affected line.

## Estimates

| Option | Estimate | Delivery confidence |
|---|---:|---|
| A: current model, Inbound/Outbound pilot only | 1-2 sprints | Medium; known correctness limits remain |
| B: additive enterprise rollout | 4-6 sprints | High if gates are enforced |
| C: model redesign | 8-12+ sprints | Low; unnecessary migration risk |

Estimates assume one focused engineering team, existing automated build
infrastructure, and operator access for the final validation sprint. They are
planning ranges, not calendar commitments.

## Approval Gate

RFC-001 Option B and EPIC181 are approved. EPIC182 authorizes specification
only. Frontend implementation begins in EPIC183 and remains subject to the
workflow gates in `docs/architecture/multi-material-rollout-plan.md`.
