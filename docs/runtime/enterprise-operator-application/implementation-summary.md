# RFC010 Enterprise Operator Application Layer

Status: **IMPLEMENTED**

## Implementation

Added one internal `EnterpriseOperatorService` above the RFC009 process layer.
It exposes application methods for:

- Receive Materials
- Allocate Materials to Project
- Release Production
- Execute Production
- Complete QC Inspection
- Move To Yard
- Prepare Shipment
- Dispatch Shipment
- Receive At Site
- Accept Project
- Complete Project

Every method invokes an existing owner command service directly or delegates to
an existing process orchestrator. The service has no repository, Prisma,
aggregate or schema dependency and contains no domain transition rules.

Each operation requires the RFC009 process context and returns a common
enterprise envelope:

- operation status and collected owner-command results;
- process ID and correlation ID;
- ordered completed-step timeline;
- deterministic durable audit receipt reference.

Command operations propagate actor, correlation, causation and deterministic
step idempotency keys. Inventory receiving uses the process ID as its stable
transaction reference when the caller does not supply one. `Receive At Site`
orders Logistics delivery confirmation before Project delivery tracking and
site receipt; owner services retain all validation and optimistic concurrency.

The layer is exported internally from `EnterpriseProcessModule`. No controller,
route, API contract, frontend, repository, domain service, Projection Engine,
schema or migration changed.

## Verification

- Operator/process and owner/projection regression tests: **PASS** (`42/42`,
  nine suites).
- Backend build: **PASS**.
- Owner command and projection replay regression: **PASS**.
- Frontend build: **PASS**.
- Prisma validate: **PASS**.
- `git diff --check`: **PASS**.
- Commit/stage: **NONE**.
