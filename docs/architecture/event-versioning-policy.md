# Event Versioning Policy

Date: 2026-07-17  
Status: **APPROVED - ADS004**

## Version Location

Canonical names never contain `v1`. `eventVersion` is a positive integer in the
envelope. All ADS004 contracts begin at version `1`.

## Compatible Changes

The publisher may add an optional nullable field or broaden documentation
without changing the version. Existing fields cannot change meaning, unit,
type, nullability or ownership.

## Breaking Changes

Removing/renaming a field, changing type/unit/semantics, changing aggregate
identity or changing owner requires a new integer version. The event name stays
the same unless the business fact itself changes.

## Coexistence

1. Publisher supports the old version while all registered subscribers add the
   new version.
2. Subscribers declare supported versions and reject unknown major versions to
   dead letter rather than guessing.
3. Replay preserves the original event version and payload.
4. Old version retirement requires subscriber evidence, replay-window review
   and Architecture Review approval.

## Legacy Names

Legacy aliases are not version zero. They remain separate compatibility inputs
until a dedicated implementation rollout removes them. New code must not
dual-publish both legacy and canonical names for the same fact unless a
time-bounded compatibility adapter with deduplication is explicitly approved.

## Schema Registry

Each event/version must have one immutable schema identifier:

```text
<eventName>@<eventVersion>
```

Schema ownership belongs to the publisher. Consumers may generate local types
but cannot fork or silently extend the source schema.

