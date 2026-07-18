# RFC009 Enterprise Process Orchestration

Status: **IMPLEMENTED**

## Implementation

- Added one backend-only `EnterpriseProcessModule`; it exposes no controller or
  public route.
- Added typed application flows for Material Allocation, Production Release,
  QC Release, Yard Release, Shipment and Project Completion.
- Every step calls the owning exported command service. The orchestration layer
  has no repository or Prisma dependency and contains no domain transition
  rules.
- Every process requires `processId`, `correlationId` and `actorId`. Step
  idempotency keys are deterministic (`processId:step`) and correlation/
  causation metadata is propagated to owner commands.
- Transient infrastructure failures use bounded exponential retry (maximum five
  attempts). Domain and concurrency errors fail immediately.
- Completed steps may register an approved owner-command compensation. Current
  concrete compensations use Production cancellation and Logistics shipment
  cancellation; no foreign state is reversed directly.
- Process start, step completion, compensation, failure and completion produce
  durable `audit.activity.created` Outbox receipts. Domain command services
  continue to own their atomic ActivityLog, timeline, audit and canonical
  Outbox records.

## Transaction Model

No cross-bounded-context database transaction was introduced. Each owner
command commits its own aggregate transaction. A process is resumed by invoking
it again with the same `processId`; deterministic command keys replay completed
owner commands without duplicate timeline or canonical Outbox effects.

No process-state schema was added. Consequently, automatic unattended resume
after a process crash requires an external caller/worker to re-submit the same
process context. The durable audit receipts provide traceability but are not a
second business-state store.

## Scope Boundaries

- Material Allocation currently coordinates the Projects-owned allocation
  command. It does not reserve or mutate Inventory.
- Production Release coordinates Release and optional Ready commands.
- QC Release coordinates QC acceptance and optional Yard placement.
- Yard Release coordinates loading preparation, readiness and Logistics
  release.
- Shipment coordinates create, vehicle/driver assignment, loading confirmation
  and optional dispatch while carrying the returned optimistic version.
- Project Completion coordinates optional delivery/site receipt, acceptance and
  completion commands.

No frontend, API, schema, migration, repository, aggregate, Projection Engine,
Inventory business rule or Architecture Decision changed.

## Verification

- Process and owner-command/projection tests: **PASS** (`38/38`, eight suites).
- Bounded retry, deterministic command context, optimistic version propagation,
  compensation and failure propagation: **PASS**.
- Backend build: **PASS**.
- Frontend build: **PASS**.
- Prisma validate: **PASS**.
- Projection replay/idempotency regression suites: **PASS**.
- `git diff --check`: **PASS**.
