# QC Boundary Validation

## Static Validation

- Controller contains request validation and service delegation only.
- QC services have no direct Prisma access.
- Prisma injection is confined to repositories.
- Repository methods contain persistence/query mechanics only.
- Cockpit aggregation and lifecycle validation remain service responsibilities.
- No frontend, route, DTO, schema or migration changed.

## Behavioral Compatibility

- Existing Cockpit limits/includes/order are unchanged.
- Existing inspection/checklist/NCR response shapes are unchanged.
- Existing event names and payload JSON are unchanged.
- Existing state transition methods are unchanged.
- Snapshot, Runtime, Feature Flags and Operations Center are untouched.

Focused Jest validation confirms the same transaction object reaches the
inspection update, ActivityLog and both audit/domain Outbox inserts.

