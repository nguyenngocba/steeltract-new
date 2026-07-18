# RFC005 - Quality Control Domain Implementation

## Status

**APPROVED**

## Implementation

- Added canonical `QcInspectionAggregate` and `QcNcrAggregate` rules for one-time inspection completion, NCR eligibility, one-time disposition, rework, and scrap recommendation.
- Added an internal QC command boundary for quality Accept/Reject, NCR creation, Disposition completion, Rework Request, and Scrap Recommendation. Public controllers and routes remain unchanged as required.
- Added durable command replay through Outbox idempotency keys plus command-hash conflict detection.
- Added optimistic concurrency without schema changes: aggregate versions are retained in metadata and repository compare-and-swap uses the persisted `updatedAt` value inside a serializable transaction.
- Canonical `qc.inspection.completed`, `qc.ncr.created`, and `qc.disposition.completed` facts use the approved AD-019 V1 envelope and existing Outbox.
- Aggregate mutation, ActivityLog, audit Outbox, and domain Outbox commit in one repository transaction.
- Existing Checklist, Result, Issue, Snapshot, Read Model, and compatibility API behavior remain intact. Enterprise projections receive the canonical events through the existing `qc.*` registry; Projection Engine code was not changed.

## Verification

| Check | Result |
| --- | --- |
| QC tests | PASS - 6 suites, 13 tests |
| Projection replay/idempotency tests | PASS - 4 suites, 5 tests |
| Prisma validate | PASS |
| Schema or migration change | NONE |
| Public API change | NONE |

