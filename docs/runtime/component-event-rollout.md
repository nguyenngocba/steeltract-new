# Component Canonical Event Rollout

Date: 2026-07-17  
Status: **CANONICAL PUBLISHER AND ADDITIVE COMMAND API IMPLEMENTED**

## Implemented Facts

The command boundary publishes only AD-019 names:

- `component.created`, `component.metadata.updated`, `component.deprecated`,
  `component.reactivated`, `component.archived`;
- `component.revision.created`, `.content.updated`, `.review.submitted`,
  `.review.returned`, `.approved`, `.approval.withdrawn`, `.released`,
  `.superseded`, `.archived`;
- `component.bom.definition.updated`, `.validated`, `.invalidated`.

`component.revision.released` is the sole canonical release fact. No
`component.released` alias was introduced. Existing `component.updated` remains
a compatibility signal on legacy API paths and is not emitted by canonical
commands.

## Delivery Contract

Each fact has event version 1 metadata, UUID event identity, producer,
aggregate identity/version, correlation/causation, ordering key, actor,
idempotency key and ten-attempt retry budget. Payloads are bounded identifiers
and changed facts. Component timeline, ActivityLog, audit Outbox and canonical
domain Outbox are written in the same repository transaction as the mutation.

The additive command endpoints now invoke this sole canonical publisher.
Consumers remain independently deployed projections. No dual publisher or
cross-module mutation was added.
