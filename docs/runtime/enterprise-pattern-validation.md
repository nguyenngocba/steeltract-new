# Enterprise Pattern Validation

## Certified Rules

These rules are confirmed as the target SteelTrack template:

1. Commands: Controller -> Service -> Repository -> Prisma.
2. Operator workspace: Repository Live Read Model, bounded server query and
   strong read-after-write behavior.
3. Dashboard/analytics: shared Dashboard Reader -> persisted snapshot -> live
   repository fallback -> shared dispatcher rebuild.
4. Events: business mutation, Activity Log and Outbox insert commit in one
   repository transaction.
5. Background updates: Outbox -> Event Consumer ->
   `SnapshotUpdateDispatcher`; no module-local queue.
6. Runtime: module-prefixed hit/miss/read-model/fallback/age/lag metrics plus
   shared global counters.
7. Operations Center: repository, read model, snapshot, runtime, feature flag,
   background, event and parity health from real data.
8. Parity validation is warning-only and never repairs business data.

## Validation Result

| Control | Result | Evidence |
| --- | --- | --- |
| Repository ownership | PASS | Prisma imports are confined to repository files in the five modules |
| ADR011 implementation | FAIL | Inventory Materials and Production Cockpit violations |
| Shared Snapshot Engine | PASS FOUNDATION | All modules registered; three dashboard cutovers missing |
| Shared Background Engine | PASS | Existing routes use dispatcher/event consumer |
| Runtime naming parity | WARNING | Inventory uses older granular naming |
| Operations Center coverage | PASS | All five module health objects present |
| Feature flag parity | PASS | One centralized mapping/service |
| Atomic Outbox | FAIL | Inventory Return, Components and Production legacy paths |
| Audit atomicity | WARNING | Return ActivityLog is post-command |
| Documentation parity | WARNING | readiness and active cutover are conflated |

## Certification Gate

Future modules, beginning with Logistics, must not claim Core Platform compliance
until an active route test proves workspace/live and dashboard/snapshot behavior,
and a transaction test proves atomic Outbox persistence.
