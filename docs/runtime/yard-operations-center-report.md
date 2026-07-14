# Yard Operations Center Integration

## Integration

Operations Center uses the existing repository and service. It now reads Yard
domain counts, persisted snapshot state, Outbox state and Background Job state,
then combines them with `PerformanceMetricsService` and the shared snapshot
feature flag.

The existing snapshot module list also includes:

- Yard Dashboard snapshots
- Yard Workspace snapshots

The response is additive and backward compatible. No route, controller, UI,
permission or feature-flag semantics changed.

## Health Rules

- No persisted snapshot: `critical`.
- Latest snapshot older than one hour: `warning`.
- Failed Yard Outbox event or snapshot job: `warning`.
- No observed live-read sample: `unknown`, not falsely healthy.
- Parity capability: `prepared`; mismatches remain warning-only.
