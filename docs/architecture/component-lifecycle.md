# Component Domain Lifecycle

Date: 2026-07-17  
Status: **APPROVED - ADS002**

## Aggregate Lifecycle

### Create Identity

`CreateComponent` creates a unique Component identity in `DRAFT`. Creation does
not imply engineering approval, Production readiness, stock availability or QC
release.

### Create Revision

The first revision is created from an empty approved template. Later revisions
are copied from the current released revision so the released source remains
unchanged. A Component may have multiple historical revisions but at most one
current released revision.

A new revision is required when released engineering content changes,
including geometry, specification, material requirement, quantity basis,
routing requirement, tolerance or other BOM content used by downstream work.
Metadata with no engineering effect may use `UpdateComponentMetadata`.

### Review And Approval

Only a `DRAFT` revision with a validated BOM can enter `IN_REVIEW`. Review does
not mutate content. A reviewer either approves it or returns it to `DRAFT` with
a reason. Editing approved content first withdraws approval and returns the
revision to `DRAFT`.

### Release

Release locks the revision and its BOM. The first release activates the
Component. A later release atomically supersedes the previous current revision.
Production and other downstream contexts must reference the released revision
identifier, not merely the mutable Component identifier.

### Deprecate And Reactivate

Deprecation prevents new revisions and new downstream references but preserves
existing Production, QC, Yard, Logistics and Project obligations. Reactivation
is allowed only while the identity is not archived and its current release is
still valid for new use.

### Archive

Archive is retention, not deletion. It is allowed for a `DRAFT` identity with
no release or a `DEPRECATED` identity with no open downstream obligation.
Released content remains queryable by identifiers already stored downstream.

## Revision Questions Resolved

| Question | Decision |
| --- | --- |
| When is a new revision created? | Before changing any released engineering definition or when explicitly branching an approved draft for correction. |
| Is a revision immutable? | `DRAFT` is editable; `IN_REVIEW` and `APPROVED` are locked except return/withdraw commands; `RELEASED`, `SUPERSEDED` and `ARCHIVED` are immutable. |
| Can release roll back? | No. Correct by superseding with a new revision. Limited withdrawal is allowed only before any downstream reference exists. |
| How many active revisions? | At most one current `RELEASED` revision per Component. Historical released revisions become `SUPERSEDED`. |
| Does a BOM change require a revision? | Yes after release. Before release, editing the BOM returns it to `DRAFT` and invalidates validation/approval. |

## External Facts

The Component read model may display Production stage, QC result, Yard
placement, shipment and installation acceptance. These are projections and do
not transition either canonical Components aggregate.

