# ADS002 Component State Machine

Date: 2026-07-17  
Status: **APPROVED - NORMATIVE ARCHITECTURE DECISION**

## Decision

Components owns engineering identity and released engineering definition. It
does not own fabrication progress, quality result, physical placement,
transport or installation acceptance. Those facts remain owned by Production,
QC, Yard, Logistics and Projects under ADS001.

The canonical command model has two aggregate roots:

1. `Component` controls identity availability and retirement.
2. `ComponentRevision` controls versioned engineering content and contains its
   `EngineeringBomDefinition`.

`ComponentRelease` and archive records are immutable evidence produced by
aggregate transitions. They are not additional mutable sources of state.

## Component State Machine

```text
DRAFT --first revision released--> ACTIVE
ACTIVE --deprecate---------------> DEPRECATED
DEPRECATED --reactivate----------> ACTIVE
DRAFT --archive------------------> ARCHIVED
DEPRECATED --archive-------------> ARCHIVED
ARCHIVED ------------------------> terminal
```

`ACTIVE` means that the identity has a current released engineering revision.
It does not mean in production, QC passed, in Yard, shipped or installed.

## Component Revision State Machine

```text
DRAFT --submit review--> IN_REVIEW --approve--> APPROVED --release--> RELEASED
  ^                         |                     |
  |                         +--return------------+
  +------------------------- withdraw approval --+

RELEASED --new revision released--> SUPERSEDED --archive--> ARCHIVED
DRAFT -------------------------------------------> ARCHIVED
ARCHIVED --------------------------------------------------> terminal
```

Corrections before release return the revision to `DRAFT`. Released and
superseded revisions are immutable. A correction after release requires a new
revision.

## Engineering BOM Definition State

The BOM is versioned inside one `ComponentRevision`; it cannot be released
independently.

```text
DRAFT --validate--> VALIDATED
VALIDATED --content edit--> DRAFT
VALIDATED --release revision--> RELEASED
RELEASED --replacement released--> SUPERSEDED
SUPERSEDED --archive revision--> ARCHIVED
```

Review submission requires `VALIDATED`. Any content edit invalidates prior BOM
validation and review approval.

## Release Policy

Release is an atomic transition, not an editable workflow status:

```text
approved revision + validated BOM + release command
  -> lock revision content
  -> supersede prior current release, if any
  -> set new revision current
  -> activate Component, if first release
  -> append release evidence and Outbox fact
  -> commit
```

There is no rollback from `RELEASED` to an editable state. An unused release
may be withdrawn only before any downstream owner has accepted a reference.
Otherwise a replacement revision must supersede it. Withdrawal prevents new
references and never rewrites existing Production Orders.

## Archive Policy

Archive is terminal and non-destructive. It removes an identity or revision
from new selection while retaining engineering, audit and downstream reference
history. An active Component cannot be archived directly; it must be deprecated
and pass all cross-context obligation checks first.

## Legacy Status Policy

The persisted values `STOCK`, `CUTTING`, `WELDING`, `PAINTING`, `READY`,
`SHIPPED`, `DELIVERED` and `INSTALLED` are compatibility data, not this state
machine. No automatic mapping or migration is authorized by ADS002.

