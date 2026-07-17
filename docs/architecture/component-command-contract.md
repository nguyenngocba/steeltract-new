# Component Command Contract

Date: 2026-07-17  
Status: **APPROVED - ADS002; IMPLEMENTATION DEFERRED**

## Command Rules

- Commands target one aggregate and include aggregate identifier, expected
  version, actor, reason and idempotency key.
- The Components application service validates invariants; only Components
  repositories persist Components aggregates.
- Mutation, timeline/audit evidence and domain Outbox facts commit atomically.
- Commands are idempotent by command name plus idempotency key.
- Foreign contexts cannot issue generic status updates.

## Component Commands

| Command | Valid source | Result | Required checks |
| --- | --- | --- | --- |
| `CreateComponent` | none | `DRAFT` | Unique stable code; required identity metadata. |
| `UpdateComponentMetadata` | `DRAFT`, `ACTIVE`, `DEPRECATED` | unchanged | Only non-engineering metadata; optimistic version match. |
| `DeprecateComponent` | `ACTIVE` | `DEPRECATED` | Reason required; prevents new references/releases. |
| `ReactivateComponent` | `DEPRECATED` | `ACTIVE` | Current release exists and remains eligible for use. |
| `ArchiveComponent` | `DRAFT`, `DEPRECATED` | `ARCHIVED` | No open downstream obligation; no hard delete. |

Activation is an internal consequence of the first successful
`ReleaseComponentRevision`, not an independent operator command.

## Revision Commands

| Command | Valid source | Result | Required checks |
| --- | --- | --- | --- |
| `CreateComponentRevision` | Component `DRAFT`/`ACTIVE` | Revision `DRAFT` | Component not deprecated/archived; unique revision number. |
| `UpdateRevisionContent` | `DRAFT` | `DRAFT` | Content valid; BOM validation is invalidated. |
| `SubmitRevisionForReview` | `DRAFT` | `IN_REVIEW` | BOM validated; required drawings/specifications present. |
| `ReturnRevisionToDraft` | `IN_REVIEW` | `DRAFT` | Reviewer reason required. |
| `ApproveComponentRevision` | `IN_REVIEW` | `APPROVED` | Authorized approver; review evidence complete. |
| `WithdrawRevisionApproval` | `APPROVED` | `DRAFT` | Reason required; approval evidence retained. |
| `ReleaseComponentRevision` | `APPROVED` | `RELEASED` | Validated BOM unchanged; Component eligible; atomic current-release swap. |
| `WithdrawUnusedRelease` | `RELEASED` | `ARCHIVED` | No downstream reference ever accepted; exceptional reason required. |
| `ArchiveDraftRevision` | `DRAFT` | `ARCHIVED` | Revision is not current and has no downstream reference. |
| `ArchiveSupersededRevision` | `SUPERSEDED` | `ARCHIVED` | Retention policy permits; content remains readable. |

`SUPERSEDED` is produced internally when a newer revision is released.

## BOM Commands

| Command | Valid source | Result | Required checks |
| --- | --- | --- | --- |
| `ReplaceEngineeringBomContent` | Revision/BOM `DRAFT` | `DRAFT` | Materials/references exist; positive quantities; deterministic line identity. |
| `ValidateEngineeringBom` | `DRAFT` | `VALIDATED` | Structural, quantity, unit, duplicate and circular-reference validation. |
| `InvalidateEngineeringBom` | `VALIDATED` | `DRAFT` | Internal consequence of an approved content edit. |

There is no standalone `ReleaseBom` command. Releasing the parent revision
releases the exact validated BOM in the same transaction.

## Cross-context Preconditions

Archive and exceptional release withdrawal obtain read-only decisions from
Production, QC, Yard, Logistics and Projects owner contracts. Components never
queries or writes their tables as part of command handling.

