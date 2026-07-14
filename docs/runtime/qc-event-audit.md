# QC Event Foundation Audit

## Existing Events

The active service emits persistent Outbox events for:

- `qc.inspection.started`
- `qc.inspection.completed`
- `qc.issue.created`
- `qc.ncr.created`
- `qc.rework.required`

It also emits persistent audit and notification events. No QC event is registered
in `EventConsumerService` for snapshot routing.

## Compliance Gaps

- Domain events are emitted after the QC repository transaction commits; they
  are not atomic with the mutation.
- Audit Outbox writes occur through a separate Outbox transaction.
- Created, result-recorded, approved, rejected and cancelled transitions do not
  have complete canonical domain events.
- Event payloads currently pass full ORM result objects rather than a stable,
  lightweight contract.
- No event contract versioning or QC consumer routing is defined.

## Proposed Canonical Contract

Proposal only; not implemented:

- `qc.inspection.created`
- `qc.inspection.started`
- `qc.inspection.result-recorded`
- `qc.inspection.completed`
- `qc.inspection.passed`
- `qc.inspection.failed`
- `qc.inspection.approved`
- `qc.inspection.rejected`
- `qc.inspection.cancelled`
- `qc.issue.created`
- `qc.issue.updated`
- `qc.ncr.created`
- `qc.ncr.updated`
- `qc.ncr.closed`
- `qc.rework.requested`
- `qc.reinspection.requested`

EPIC151 must align names with an approved QC decision before changing code and
must persist mutation plus Outbox row in one repository transaction.

