# Canonical Event Payload Review

## Governance Result

- Event names: unchanged.
- Event version: remains `1`.
- Domain ownership: unchanged.
- Commands and workflow: unchanged.
- Public API: unchanged.
- Projection Engine: unchanged.

Inventory, QC and Yard producers now use the AD-019 envelope fields:
`eventId`, `eventName`, `eventVersion`, `occurredAt`, producer, aggregate
identity/version, correlation, causation, idempotency, actor, tenant and ordering
key. Production and Components already used this envelope.

Payloads remain lightweight and contain identifiers/resulting facts only. Slots
and levels remain separate fields. Prisma relation graphs are no longer used as
canonical QC/Yard payloads.

## Version Compatibility

All additions are backward-compatible V1 field additions. Existing required
fields retain meaning. No field was renamed or removed. Consumers must tolerate
unknown additive fields and explicit null where the owning domain lacks a fact.

## Ordering Qualification

Production and Components use aggregate versions. Inventory, QC and Yard legacy
models do not own an explicit aggregate-version column; their envelope token is
derived from the committed row update timestamp. This is deterministic for the
persisted event but is not certified as strict optimistic-concurrency ordering.
