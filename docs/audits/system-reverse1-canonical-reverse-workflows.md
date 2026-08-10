# SYSTEM.REVERSE.1 - Canonical Reverse Workflow Certification

Date: 2026-08-10

## Executive Result

Status: **CONDITIONALLY READY - AUTHENTICATED RUNTIME FIXTURE PENDING**

The canonical reverse foundation is implemented for supplier material return,
Production material return, physical Project return, QC rework/scrap, Yard
quarantine and reverse Logistics. All new physical flows use
`ComponentInstance`; no flow restores `Component.status`, writes inventory from
the frontend, or mutates the database outside an owner service.

Static, unit and build certification is green. PostgreSQL migration was backed
up and deployed. The retained forward fixture proves complete physical lineage,
but authenticated reverse mutations were not executed because no valid runtime
credential was available. `admin/admin` returned 401; credential probing was
not performed. Production approval for reverse operations remains conditional
until the controlled `SYSTEM-REVERSE1-*` REST fixture is completed.

## Audit

| Workflow | Previous state | Canonical owner | Result |
| --- | --- | --- | --- |
| Return to Supplier | Generic disposition could add positive RETURN stock | Inventory ReturnWorkflow + InventoryService | IMPLEMENTED, unit certified |
| MAIN <- PRODUCTION | Existing material issue return was canonical | Production MaterialIssue + InventoryPosting | RETAINED, code certified |
| Production <- Project | Generic Project material return already posts into warehouse | Inventory ReturnWorkflow | RETAINED for material; physical component uses Yard |
| Project component return | Mutated engineering `Component.status = READY` | Projects entry point -> Yard physical quarantine | IMPLEMENTED |
| QC Rework | Physical state changed, but rework order had no instance lineage | QC + ProductionRework + ComponentInstanceExecution | IMPLEMENTED |
| QC Scrap | Physical state changed without Yard quarantine release | QC + Yard | IMPLEMENTED |
| Reverse Yard | No installed/delivered return placement contract | Yard | IMPLEMENTED |
| Reverse Logistics | Forward-only dispatch statuses/events | Logistics + Yard | IMPLEMENTED |

## Implemented Workflows

### Return to Supplier

Endpoint chain: `POST /inventory/returns` -> approve -> receive -> inspect ->
dispose.

- `SUPPLIER_RETURN` requires a real Supplier and source Warehouse.
- `PRODUCTION_RETURN` is rejected on this generic API; callers must use the
  canonical material-issue return endpoint.
- Supplier disposition rejects unresolved `QC_HOLD` lines.
- `DAMAGED` and `REPAIR` lines post one idempotent `EXPORT` transaction with
  `transactionTypeCode = SUPPLIER_RETURN`, negative quantities and reference
  `return-workflow/<ReturnRequest.id>`.
- `USABLE_STOCK` remains in stock and `SCRAP` uses the existing negative
  adjustment path.
- Activity actions are flow-specific. Supplier requests no longer masquerade
  as Project material returns.

The legacy schema stores `ReturnRequest.supplierId` as a scalar without a
foreign key. Service validation prevents new orphan supplier references; a
future additive FK remains P1.

### Return Production Material

Canonical endpoint: `POST /production/material-issues/:id/return`.

The existing owner service was retained. It computes:

`returnable = min(issue issued - issue returned, all issued - all returned - consumed - scrap)`

It posts back to the resolved MAIN location through `InventoryPosting`, updates
issue/reservation returned quantities, writes a Production material ledger row,
ActivityLog, audit Outbox and `production.material.returned` fact in one
transaction. Returned reservation quantity can be issued again; On Hand is not
duplicated between MAIN and PRODUCTION.

### Physical Project Return

New endpoint:
`POST /projects/:projectId/component-instances/:instanceId/return-to-yard`.

The endpoint validates Project ownership and delegates to Yard. The legacy
`POST /projects/:id/components/:componentId/return` no longer clears
`Component.projectId` or writes `Component.status = READY`; it returns a
controlled 400 directing callers to physical identity.

Returned `IN_TRANSIT`, `DELIVERED` or `INSTALLED` instances become
`PRODUCED_WAITING_QC` and enter an active Yard placement marked
`returnQuarantine = true`. They are not Finished Goods and cannot dispatch
until QC releases the quarantine.

### QC Rework

- FINAL QC FAIL moves the physical instance to `QC_FAILED`.
- NCR disposition REWORK closes an active return quarantine placement and
  moves the instance to `REWORK`.
- Accepted `ProductionRework` persists `componentInstanceId` from the NCR.
- NCR and original Production Order lineage must match.
- Instance assignment accepts either its original Production Order or an
  accepted rework order linked through `ProductionRework`.
- Rework operation completion evaluates the rework order's Work Orders and
  returns the same physical instance to `PRODUCED_WAITING_QC` for another FINAL
  inspection.

### QC Scrap

SCRAP disposition closes return quarantine, releases Yard occupancy, moves the
physical instance to `SCRAPPED`, records `scrappedAt`, timeline, ActivityLog and
Outbox. Previously consumed raw material is intentionally not restored to
Inventory. A dedicated physical scrap-cost ledger is not present; cost impact
is reported as unsupported instead of fabricated.

### Reverse Yard

Yard return placement, ComponentInstance state transition, PLACE movement,
slot occupancy, timeline, ActivityLog and Outbox share one Serializable
transaction. QC PASS changes a quarantined instance from `QC_PASSED` to
`IN_YARD` and marks the placement released. REWORK/SCRAP closes the placement,
writes REMOVE movement and frees the slot.

### Reverse Logistics

Dispatch chain:
`RECEIVED/COMPLETED -> RETURN_REQUESTED -> RETURN_IN_TRANSIT -> RETURNED`.

Physical chain:
`DELIVERED/INSTALLED -> IN_TRANSIT -> PRODUCED_WAITING_QC (Yard quarantine)`.

Endpoints:

- `PATCH /logistics/dispatch-orders/:id/return-request`
- `PATCH /logistics/dispatch-orders/:id/return-depart`
- `PATCH /logistics/dispatch-orders/:id/return-to-yard`

The receive command requires exactly one Yard placement for every dispatched
ComponentInstance. Status, physical state, Yard placement and audit mutations
are transaction-bound. New write routes use `JwtAuthGuard`, `PermissionsGuard`
and existing owner permissions.

## Runtime Evidence

### Proven

- API started successfully on port 3100 and connected to PostgreSQL.
- `GET /health/live`: 200.
- New Yard, Projects and Logistics reverse writes without token: 401.
- `admin/admin`: 401; no additional credential guessing was performed.
- Retained fixture `SYSTEM-HARDENING1-1786329000052` remains readable with one
  installed physical instance, one completed PO, one completed dispatch and a
  closed Yard placement.
- Its timeline contains planned, production started, operation completed,
  waiting QC and FINAL QC PASS evidence with stable requirement/PO/project
  lineage.
- Current database before reverse fixture: no reverse ActivityLog rows, no
  Supplier Return rows, 23 ProductionMaterialIssues with total returnedQty 0.

### Not Proven at Runtime

Authenticated mutations for Supplier Return, material issue return, reverse
Logistics/Yard, QC rework/re-inspection and scrap were not executed. Dashboard
delta and duplicate ActivityLog checks therefore remain runtime P0 for final
certification. No GREEN claim is made from build-only evidence.

## API and RBAC Evidence

| Boundary | Enforcement |
| --- | --- |
| Inventory returns | `inventory.write` |
| Production material issue return | `production.write` |
| Project physical return | `projects.write` |
| Yard direct physical return | `yard.write` |
| Logistics reverse commands | `logistics.write` |
| QC decisions | existing canonical QC permissions |

Unauthenticated checks proved 401 for all newly introduced mutation paths. A
403/success matrix awaits an authenticated controlled user.

## Database Evidence

- Backup: `/tmp/steeltrack-system-reverse1-before-migration.dump`, PostgreSQL
  custom format, 1,208 TOC entries.
- Migration:
  `20260810150000_canonical_reverse_workflow_foundation`.
- Migration adds Dispatch reverse enum values, nullable
  `ProductionRework.componentInstanceId`, index and FK with `ON DELETE SET NULL`.
- No DROP, TRUNCATE or data DELETE statement exists.
- `prisma migrate status`: 90 migrations, schema up to date.

## Dashboard Evidence

Reverse writes publish the authoritative facts consumed by live read models:
Inventory transaction/stock bucket, Production material returned/ledger, Yard
placement/removal/occupancy, Logistics status, QC disposition and physical
instance timeline. Runtime dashboard before/after deltas were not certified
without authenticated mutations. Historical snapshots are not directly
rewritten by reverse commands.

## Verification

- Targeted reverse tests: PASS.
- Backend full tests: 92/92 suites, 308/308 tests.
- Frontend tests: 2/2 files, 4/4 tests.
- Backend build: PASS.
- Frontend build: PASS.
- Prisma validate/generate: PASS.
- Prisma migration status: PASS after deploy.

## Performance Audit

- Reverse Logistics receives placements sequentially inside a bounded dispatch
  transaction. This prevents partial ownership but can increase lock duration
  for very large dispatches; batching is P2.
- Yard return uses indexed instance/slot lookups; no N+1 exists for one return.
- Supplier return posts all lines in one Inventory transaction. Existing
  per-material snapshot/location updates remain the main round-trip hotspot.
- Project material return allocation reconciliation remains an existing
  sequential-loop P2 hotspot.

## Remaining Gaps

### P0

1. Run authenticated `SYSTEM-REVERSE1-*` REST fixture and prove balance,
   placement, timeline, ActivityLog and dashboard deltas after every action.
2. Prove 403 with a real insufficient-permission role and success with an
   authorized role.

### P1

1. Add an approved additive Supplier relation/FK for
   `ReturnRequest.supplierId`; service validation already blocks new orphans.
2. Define physical ComponentInstance scrap cost accounting if Finance requires
   cost impact beyond retained Production consumption.
3. Migrate frontend callers of the disabled legacy Component-definition return
   endpoint to the physical ComponentInstance route.

### P2

1. Batch very large reverse Logistics placement operations while preserving
   one transaction and deterministic lock order.
2. Add reverse-flow dashboard dimensions after authoritative requirements.

## Production Recommendation

**NO-GO for unrestricted production reverse operations until P0 authenticated
runtime certification is completed.**

Code, schema, migration, tests and builds are ready for controlled staging.
Forward operations remain unaffected. Estimated reverse-workflow readiness:
**85%**.
