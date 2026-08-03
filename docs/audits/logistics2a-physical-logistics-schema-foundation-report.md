# LOGISTICS.2A - Physical Logistics Schema Foundation

Date: 2026-08-02
Mode: Schema foundation only

## IMPLEMENTED

Implemented the minimum permanent schema foundation required for canonical
physical ComponentInstance logistics.

Changes made:

- Extended `ComponentInstanceState` with:
  - `IN_YARD`
  - `IN_TRANSIT`
  - `DELIVERED`
- Added nullable `DispatchItem.componentInstanceId`.
- Added optional Prisma relation from `DispatchItem` to `ComponentInstance`.
- Added reverse relation `ComponentInstance.dispatchItems`.
- Added `@@index([componentInstanceId])` on `DispatchItem`.
- Added additive migration:
  `20260730100000_physical_logistics_schema_foundation`.
- Added schema-foundation tests proving the generated Prisma model supports
  physical instance dispatch identity without enforcing global uniqueness.
- Added Finished Goods eligibility regression test proving `IN_TRANSIT` and
  `DELIVERED` are not included in current available finished-goods predicate.

No Logistics write-path, frontend picker, Yard departure transition, delivery
transition, or Projects dispatched/delivered read-model was implemented. Those
remain LOGISTICS.2B scope.

## PHYSICAL LIFECYCLE

Canonical target lifecycle now has persistent state vocabulary:

```text
PLANNED
  -> IN_PRODUCTION
  -> PRODUCED_WAITING_QC
  -> QC_PASSED / USE_AS_IS
  -> IN_YARD
  -> IN_TRANSIT
  -> DELIVERED
```

Failure branches remain:

```text
QC_FAILED
REWORK
SCRAPPED
```

State ownership documented for next sprint:

| Transition | Authoritative Owner |
| --- | --- |
| QC pass / use-as-is | QC + Finished Goods eligibility |
| `QC_PASSED` / `USE_AS_IS` -> `IN_YARD` | Yard stage |
| `IN_YARD` -> `IN_YARD` | Yard relocation |
| planned dispatch | Logistics, no state change |
| authoritative departure | Logistics, `IN_YARD` -> `IN_TRANSIT` |
| delivery confirmation | Logistics, `IN_TRANSIT` -> `DELIVERED` |
| cancelled planned dispatch | Logistics, remains `IN_YARD` |
| cancelled/aborted after departure | Not defined in 2A; LOGISTICS.2B gate |

Finished Goods remains an eligibility/classification derived from QC/NCR
evidence. No `FINISHED_GOODS` enum state was added.

## SCHEMA

Updated Prisma models:

`ComponentInstance`

- Added `dispatchItems DispatchItem[] @relation("ComponentInstanceDispatchItems")`.

`DispatchItem`

- Added `componentInstanceId String?`.
- Added `componentInstance ComponentInstance?` relation with:
  - relation name `ComponentInstanceDispatchItems`
  - `fields: [componentInstanceId]`
  - `references: [id]`
  - `onDelete: SetNull`
- Added `@@index([componentInstanceId])`.

Legacy compatibility:

- `DispatchItem.componentId` remains unchanged.
- Existing legacy dispatch rows remain readable.
- No historical `componentId` row was reinterpreted as a physical instance.
- No `@@unique([componentInstanceId])` was added.

## MIGRATION

Migration:

`apps/backend-api/prisma/migrations/20260730100000_physical_logistics_schema_foundation/migration.sql`

SQL characteristics:

- `ALTER TYPE ... ADD VALUE IF NOT EXISTS`
- `ALTER TABLE dispatch_items ADD COLUMN "componentInstanceId" TEXT`
- nullable FK to `component_instances(id)`
- `ON DELETE SET NULL`
- `ON UPDATE CASCADE`
- non-unique index on `componentInstanceId`

Safety review:

- No `DROP`
- No `TRUNCATE`
- No data `DELETE`
- No unsafe `NOT NULL`
- No data backfill
- No inventory transaction creation
- No Yard placement creation
- No dispatch row fabrication

Backup:

- Backup created before deploy at:
  `/tmp/steeltrack-db-backups/steeltrack-logistics2a-20260730.sql`
- Initial sandboxed `pg_dump` failed with an empty libpq error.
- Escalated `pg_dump` succeeded.

Deploy:

- `pnpm -C apps/backend-api exec prisma migrate deploy` PASS
- `pnpm -C apps/backend-api exec prisma migrate status` PASS

## LEGACY DATA

Runtime evidence after migration:

```json
{
  "dispatchItemTotal": 0,
  "dispatchItemWithComponentInstance": 0,
  "legacyComponentIdOnly": 0,
  "yardPlacementTotal": 0,
  "yardPlacementActive": 0,
  "yardPlacementWithComponentInstance": 0,
  "inventoryTransactions": 152
}
```

Classification:

| Legacy Area | Count | Action |
| --- | ---: | --- |
| `DispatchItem` total | 0 | No migration needed |
| `DispatchItem.componentInstanceId` | 0 | Expected after foundation deploy |
| legacy `componentId` only dispatch rows | 0 | No backfill |
| Yard placements | 0 | No Yard state backfill |
| Inventory transactions | 152 | Unchanged by this migration |

Existing `Component.status` values remain legacy compatibility only. They are
not canonical physical Logistics truth.

## FINISHED GOODS IMPACT

Current `GET /components/instances/finished-goods` is backed by
`FinishedGoodsEligibilityRepository`.

Current predicate includes only:

- `ComponentInstanceState.QC_PASSED` with final passed/approved QC evidence
- `ComponentInstanceState.USE_AS_IS` with approved NCR use-as-is evidence

The new states `IN_TRANSIT` and `DELIVERED` are not included. Test coverage
confirms they do not accidentally appear as currently available finished goods.

`IN_YARD` semantics remain a LOGISTICS.2B/Yard policy decision. The current
available finished-goods endpoint still does not include `IN_YARD` because 2A
does not change behavior speculatively. If the product wants Yard-staged
qualified goods to appear as available finished goods, LOGISTICS.2B must update
that predicate explicitly and distinguish:

- manufacturing/QC qualification
- current physical availability

## DATABASE EVIDENCE

ComponentInstance counts by state after migration:

```json
[
  { "state": "PLANNED", "count": 24 },
  { "state": "PRODUCED_WAITING_QC", "count": 4 },
  { "state": "QC_PASSED", "count": 2 },
  { "state": "QC_FAILED", "count": 2 },
  { "state": "IN_PRODUCTION", "count": 3 }
]
```

No rows were moved into `IN_YARD`, `IN_TRANSIT`, or `DELIVERED`.

This is correct: LOGISTICS.2A does not fabricate logistics history and does not
infer Yard state from QC evidence or legacy Component status.

## VERIFIED

Commands run:

- `pnpm -C apps/backend-api exec prisma validate` PASS
- `pnpm -C apps/backend-api exec prisma generate` PASS
- `pnpm -C apps/backend-api exec prisma migrate status` PASS after deploy
- backup with `pg_dump` PASS after escalation
- `pnpm -C apps/backend-api exec prisma migrate deploy` PASS
- `pnpm -C apps/backend-api test -- logistics-physical-schema-foundation.spec.ts` PASS
- `pnpm -C apps/backend-api test -- finished-goods-eligibility.repository.spec.ts` PASS
- `pnpm -C apps/backend-api test` PASS
  - 89 suites
  - 291 tests
- `pnpm -C apps/backend-api build` PASS
- `pnpm -C apps/frontend build` PASS
- `git diff --check` PASS

Frontend build warning:

- Vite reported existing chunk-size warning for large chunks, including
  `vendor-react-three`. This is not caused by LOGISTICS.2A schema changes.

## NOT VERIFIED

Not in 2A scope:

- canonical Dispatch create by `componentInstanceId`
- Yard -> Dispatch release
- `IN_YARD` transition from `/yard/stage`
- `IN_TRANSIT` transition on departure
- `DELIVERED` transition on receipt/delivery confirmation
- frontend physical instance picker
- Projects `dispatchedQty` / `deliveredQty`
- browser smoke
- RBAC runtime smoke

## REMAINING GAPS

P0 for LOGISTICS.2B:

- Update Yard stage to transition eligible instances to `IN_YARD`.
- Update Logistics candidate query to source active Yard placements by
  `componentInstanceId`.
- Update Dispatch creation to accept/reject physical instance payloads.
- Prevent active duplicate dispatch by `componentInstanceId`.
- Keep planned dispatch state as `IN_YARD`.
- On authoritative departure, release Yard placement exactly once and set
  `ComponentInstance.state = IN_TRANSIT`.
- On delivery confirmation, set `ComponentInstance.state = DELIVERED`.
- Stop new component delivery writes from mutating `Component.status`.
- Extend Project execution read model with canonical dispatched/delivered
  counts backed by `DispatchItem.componentInstanceId`.

P1:

- Decide whether `IN_YARD` should appear in the current Finished Goods
  available endpoint or a separate Yard/Finished Goods stock endpoint.
- Add Yard movement dispatch-exit lineage if JSON metadata is not sufficient
  for audit.
- Add runtime RBAC smoke for Logistics read/write endpoints.

P2:

- Deterministic legacy dispatch backfill plan if historical rows appear later.
- Proof-of-delivery evidence expansion for images/signatures.

## NEXT

Proceed to LOGISTICS.2B:

1. Convert write path to physical `ComponentInstance`.
2. Keep legacy `componentId` rows readable but reject new legacy component
   definition dispatch writes where safe.
3. Wire Yard release and delivery state transitions.
4. Add Project traceability counts from canonical Dispatch evidence.
