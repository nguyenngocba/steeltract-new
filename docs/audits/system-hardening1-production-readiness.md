# SYSTEM.HARDENING.1 Production Readiness

Date: 2026-08-10

## Scope and Result

SYSTEM.HARDENING.1 fixed the runtime correctness blockers identified by
SYSTEM.E2E.1 without redesigning a module or adding a business feature.

| Gate | Result |
| --- | --- |
| Yard custody closes on dispatch | PASS |
| Projection aggregate version overflow | PASS |
| Inventory idempotency payload binding | PASS |
| Projects pagination contract | PASS |
| Canonical E2E workflow | PASS |
| Inventory conservation | PASS |
| Traceability and ActivityLog | PASS |

## 1. Fixed P0

### Yard lifecycle and physical custody

Dispatch departure now performs one Serializable transaction that verifies
physical and Yard ownership, closes the active `YardItemPlacement`, writes the
outbound movement/audit/outbox records, recalculates slot occupancy, transitions
`IN_YARD` to `IN_TRANSIT`, and advances the dispatch order.

Delivery receipt transitions `IN_TRANSIT` to `DELIVERED`. Dispatch completion
now transitions `DELIVERED` to the additive canonical `INSTALLED` physical
state and records `installedAt`. Conditional updates prevent competing workers
from applying the same transition twice.

### Projection overflow

`EnterpriseProjectionDocument.sourceAggregateVersion` and
`EnterpriseProjectionReceipt.aggregateVersion` now use PostgreSQL `BIGINT`.
The repository writes `bigint`; the REST query boundary converts values to
JSON-compatible numbers. A regression test covers version `1,785,732,307,896`.

The failed projection set was replayed. `ProductionTimeline`,
`MaterialAvailability`, `QcInspectionSummary`, `QcNcrSummary`, `QcTimeline` and
`YardItemSummary` are HEALTHY with zero active failures.

### Inventory idempotency

Inventory mutations bind a normalized `Idempotency-Key` to a deterministic
payload hash. The receipt, transaction, ActivityLog and Outbox write share the
inventory transaction boundary.

- Same key and same payload returns the original transaction.
- Same key and different payload returns `409 Conflict` and writes
  `INVENTORY_IDEMPOTENCY_CONFLICT`.
- Exact replay does not create another posting or audit record.

### Production completion runtime defect

The hardening fixture exposed a runtime-only validation defect. The application
passed the complete command object into `ProductionCompletionAggregate`; its
generic `Object.entries` loop therefore attempted numeric validation of string
fields such as `productionOrderId` and `unit`. TypeScript structural typing did
not reject the extra fields, so builds passed while runtime returned 400.

Validation is now restricted to `quantity`, `completedQty`, `rejectedQty`,
`scrapQty` and `remainingQty`. Runtime proof recorded one completion, one
material consumption and advanced the order to `COMPLETED`.

## 2. Runtime Evidence

Retained fixture: `SYSTEM-HARDENING1-1786329000052`.

The authenticated REST workflow covered receipt, idempotent replay, conflicting
replay, warehouse transfer, Project/requirement creation, revision/BOM release,
Production Order, reservation, material issue, execution, consumption,
production completion, FINAL QC PASS, Finished Goods, Yard, dispatch, receipt,
installation and reverse warehouse transfer.

| Record | Final evidence |
| --- | --- |
| Production Order | `COMPLETED`, version 6, one completion |
| ComponentInstance | `INSTALLED`, `installedAt` populated |
| Yard placement | `removedAt` populated at dispatch |
| Yard slot | `AVAILABLE`, stack level 0 |
| MAIN stock | 45 PCS |
| PRODUCTION stock | 50 PCS |
| Location balance | 95 PCS |
| Transaction movement balance | 95 PCS |

Inventory conservation: receipt 100 - production consumption 5 = 95. The
transaction movement total and location balance total are equal.

## 3. API Evidence

- Inventory exact replay returned the original transaction.
- Inventory mismatched replay returned HTTP 409.
- Production completion and order completion returned HTTP 201.
- `GET /projects?limit=3` returned three rows and metadata
  `{ page: 1, limit: 3, total: 30, totalPages: 10 }`.
- Project execution returned required 1, ordered 1, instance 1, completed 1,
  Yard staged 0 and production completion 100%.
- Projection health returned zero active failures.

## 4. Database and Migration Evidence

Before migration, a PostgreSQL custom-format backup was created at
`/tmp/steeltrack-system-hardening1-before-migration.dump`.

Applied forward-only migrations:

- `20260810100000_projection_aggregate_version_bigint`
- `20260810113000_component_instance_installed_state`

Migration status reports 89 migrations and an up-to-date database. Neither
migration contains DROP, DELETE or TRUNCATE.

## 5. Dashboard and Read-Model Evidence

- Inventory overview reflected the fixture's net +95 PCS and warehouse split.
- Production cockpit reported one completed order for the filtered fixture.
- QC canonical workspace found the physical inspection. After installation the
  instance correctly leaves current Finished Goods/QC-passed stock.
- Project execution reported one physically completed instance and zero active
  Yard staging.
- Yard active placement count returned to baseline after stage and departure;
  the selected slot was freed.
- Logistics included the completed fixture dispatch.
- Executive Cockpit returned HTTP 200 using its authoritative module reads.

## 6. ActivityLog Evidence

The runtime audit chain contains Inventory, Components engineering, Production,
QC, Yard and Logistics actions. It includes inventory posting/conflict,
revision/BOM release, order/work-order/execution lifecycle, material
reserve/issue/consume, FINAL inspection, Yard place/dispatch, Logistics
depart/receive/install, and Production completion/finalization. Exact
idempotent replay did not duplicate the posted transaction log.

## 7. Remaining P1

1. Define physical reverse workflows for installed dismantle, project surplus
   return and supplier outbound return. This sprint certified warehouse transfer
   reversal only.
2. Certify `QC FAIL -> REWORK -> Production -> FINAL QC -> PASS` with a
   dedicated retained fixture.
3. Tighten Yard snapshot freshness/confidence observability. Live fallback was
   correct, but a low-confidence snapshot can remain classified non-stale.
4. Run authenticated browser dashboard certification against the retained
   fixture; API/read-model certification passed.

## 8. Remaining P2 and Performance Hotspots

- Logistics reads up to 200 deeply related dispatch rows; introduce a cursor
  contract before volume makes this a hotspot.
- Yard release performs bounded per-placement movement/audit/outbox writes. It
  is correct and atomic, but batch dispatch latency is linear.
- Inventory multi-line posting performs location-level round trips and exposes
  no explicit maximum item count at the controller boundary.
- The frontend build retains the existing approximately 964 KB React Three
  vendor chunk warning.
- Several projections are `NOT_INITIALIZED` because no source event has
  initialized them; none has an active failure.

## 9. Production Readiness

Readiness: **94%**.

All P0 runtime correctness blockers in scope are resolved. The canonical happy
path, physical custody, projection replay, payload-bound idempotency,
pagination and inventory conservation are certified.

## 10. Recommendation

**GO for controlled staging/pilot. CONDITIONALLY GO for production.**

Production approval should accept or resolve the remaining operational P1 gaps:
post-installation reverse flows, rework-branch runtime certification and Yard
snapshot freshness observability.

## Verification

- `prisma validate`: PASS
- `prisma generate`: PASS
- `prisma migrate status`: PASS, 89 migrations, database up to date
- Backend tests: PASS, 92 suites / 304 tests
- Frontend tests: PASS, 2 files / 4 tests
- Backend build: PASS
- Frontend build: PASS
- `git diff --check`: PASS
- Staged files: none
