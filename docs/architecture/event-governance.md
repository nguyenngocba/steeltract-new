# Event Governance Standard

Date: 2026-07-17  
Status: **APPROVED - ADS004**

## Naming

Canonical names use lowercase dot-separated owner, aggregate/fact and past-tense
action. Hyphens are allowed only inside an established aggregate token such as
`work-order`.

```text
<owner>.<aggregate-or-fact>.<past-action>
```

Two-part names explicitly approved in the Inventory catalog remain exceptions.

## Publication Gate

An event may be canonical only when:

1. its aggregate owner is fixed by AD-015;
2. the source transition/command is approved;
3. mutation and Outbox commit atomically;
4. payload schema/version and ordering key are registered;
5. idempotency key is deterministic;
6. subscribers and projection effects are documented;
7. no existing canonical event already describes the same fact.

## Subscriber Gate

A subscriber may:

- update its own idempotent read projection;
- enqueue its own background rebuild;
- invoke its own application command after local validation.

A subscriber may not write the publisher's tables, bypass owner commands,
republish the fact as its own or infer a stock mutation from a Production fact.

## Ownership And Review

The publisher owns schema evolution. Any new canonical event, breaking version,
publisher change, dual-publish adapter or retirement requires Architecture
Review and updates to the catalog, payload contract and subscriber matrix.

## Observability

Operations Center must expose Outbox waiting/retry/failed/dead-letter counts,
oldest event age, consumer lag, version rejection and replay outcome by owner
and event family. Payload contents must not be logged wholesale.

## Compatibility Signals

Legacy/internal events may continue during implementation rollout but:

- are labeled `legacy` or `internal` in routing metadata;
- cannot gain new business subscribers;
- cannot be dual-published indefinitely;
- require a time-bounded adapter and deduplication plan before retirement;
- do not override canonical ownership or payload semantics.

## Security

Events carry identifiers and minimum facts only. Authentication tokens, secrets,
attachment bytes, unrestricted user input and sensitive personal data are
forbidden. Subscriber authorization is service-level and least privilege.

