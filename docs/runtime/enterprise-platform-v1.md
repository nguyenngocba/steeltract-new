# SteelTrack Enterprise Platform v1.0

## Certified Architecture

```text
Operator Workspace -> Repository Live Read Model
Dashboard/Analytics -> Persisted Snapshot -> Repository Fallback
Mutation -> Repository Transaction -> Activity/Audit/Domain Outbox
Outbox -> Shared Worker/Event Consumer -> Background Snapshot Dispatcher
Runtime Metrics -> Operations Center Platform Health
```

## Certified Modules

- Inventory
- Components
- Production
- QC
- Yard

## Invariants

1. Prisma persistence is repository-owned.
2. Operator workspaces follow ADR011 and do not use persisted snapshots as
   their source of truth.
3. Dashboard and analytics reads are snapshot-first with bounded repository
   fallback and asynchronous rebuild.
4. Durable domain/audit events commit atomically with their owning mutation.
5. Snapshot work uses the shared dispatcher, worker, writer and validator.
6. Runtime metric names use the certified module-prefix contract.
7. Operations Center exposes repository, read model, snapshot, runtime, flags,
   jobs, routing and parity health for every certified module.

## Scope Boundary

Certification does not claim benchmark capacity, complete domain workflows or
operator acceptance. Future modules, starting with Logistics, must inherit this
platform pattern without creating a parallel repository, snapshot, runtime,
queue or metrics framework.
