# Core Platform Gap Analysis

## P0 - Certification Blockers

### Atomic Outbox

- Inventory Return Request lifecycle writes business state, event and Activity
  Log in separate operations.
- Components `update` and status transitions emit `component.updated` after the
  repository transaction and do not persist it atomically.
- Production stage completion and stage-to-Yard compatibility events are emitted
  after the primary transaction. Canonical order/material events are already
  atomic and must remain the reference implementation.

Impact: a process failure after commit can leave snapshots/event consumers
without the corresponding domain event.

### ADR011

- Inventory Materials is an editable/operator workspace but reads persisted
  material snapshots as its primary list source.
- Production Cockpit is the active operator surface and calculates status,
  readiness, material and progress KPI from multiple full client datasets.

Impact: stale read-after-write behavior and data-volume-dependent UI results.

## P1 - Platform Parity

- Components, QC and Yard have snapshot readers but no active dashboard API
  wired to them. Existing Overview/Cockpit/Metrics endpoints remain live.
- Production snapshot cutover covers the metrics endpoint, not the entire active
  Cockpit data composition.
- Inventory runtime metric names do not match the module-level convention.
- Components, QC and Yard event freshness is limited to currently implemented
  event names; missing business workflows must not be invented in a platform
  remediation sprint.

## P2 - Documentation and Certification Controls

- Prior EPIC reports describe snapshot readers as ready/working without always
  distinguishing registered foundation from active controller cutover.
- AI-state module percentages mix business completeness and Core Platform
  compliance, making certification status ambiguous.
- No automated architecture gate currently fails CI on direct Service Prisma,
  post-commit EventBus persistence, or dashboard/workspace source violations.

## Non-blocking Observations

Frontend `filter`, `reduce`, `slice` and `sort` are not automatically violations.
Presentation-only shaping of bounded server results is acceptable. This report
marks only calculations that determine business KPI, filtering scope or
pagination truth.
