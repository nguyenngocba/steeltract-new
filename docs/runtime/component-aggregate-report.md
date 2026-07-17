# Component Aggregate Implementation Report

Date: 2026-07-17  
Status: **IMPLEMENTED - ADDITIVE CANONICAL DOMAIN**

## Scope

AD-015, AD-016 and AD-019 are implemented without reinterpreting the legacy
`ComponentStatus` projection. Canonical Components use an independent nullable
`lifecycleState`, optimistic `aggregateVersion`, one `currentRevisionId`,
versioned `ComponentRevision`, versioned `ComponentBomDefinition` and immutable
`ComponentReleaseEvidence`.

Existing rows remain compatibility records with `lifecycleState = null`.
There is no guessed conversion from `STOCK/CUTTING/.../INSTALLED` to the
canonical identity lifecycle.

## State Enforcement

- Component: `DRAFT -> ACTIVE -> DEPRECATED -> ARCHIVED`, with reactivation
  from `DEPRECATED` only when a current release exists.
- Revision: `DRAFT -> IN_REVIEW -> APPROVED -> RELEASED -> SUPERSEDED ->
  ARCHIVED`; edit/review/release transitions are rejected from invalid states.
- BOM: `DRAFT -> VALIDATED -> RELEASED -> SUPERSEDED -> ARCHIVED`; replacement
  invalidates validation.
- First release activates the Component; replacement release supersedes the
  prior Revision/BOM atomically.
- Release evidence stores the released content hash and previous revision.
- Archive is non-destructive and requires structured downstream clearance.

## Compatibility

The canonical aggregate is exposed additively under `/components/commands`.
Legacy operational create/update, delivery and installation paths remain
registered and unchanged. No legacy row is silently adopted into the canonical
lifecycle.

## Persistence

Migration `20260717150000_component_domain_aggregates` is additive. It adds
nullable compatibility columns and new tables/enums; it does not update or
delete existing records. The migration was deployed successfully and Prisma
reports the database schema current.
