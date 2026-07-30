# LOGISTICS.2 - Canonical ComponentInstance Dispatch & Delivery Audit

Date: 2026-07-30
Mode: Audit with schema/state gate

## IMPLEMENTED

No source-code implementation was performed in this sprint turn.

The sprint requirement explicitly says to stop at schema gate if
`ComponentInstanceState` cannot represent the physical logistics lifecycle.
Current Prisma enum does not contain Yard or delivery lifecycle states:

- `ComponentInstanceState.PLANNED`
- `IN_PRODUCTION`
- `PRODUCED_WAITING_QC`
- `QC_PASSED`
- `QC_FAILED`
- `REWORK`
- `SCRAPPED`
- `USE_AS_IS`
- `LEGACY_UNKNOWN`

Because `IN_YARD`, `IN_TRANSIT`, and `DELIVERED` are missing, Logistics cannot
truthfully move a physical component from Yard to Dispatch to Delivery without
either fabricating state or falling back to legacy `Component.status`. Both are
forbidden by LOGISTICS.2.

## SOURCE OF TRUTH

Current canonical upstream chain:

`Project -> ProjectComponentRequirement -> ProductionOrder -> ComponentInstance -> QC -> Finished Goods -> YardItemPlacement`

Current Logistics source of truth is not yet canonical:

- `DispatchItem.componentId` points to `Component`, which is an engineering
  definition.
- `DispatchItem` has no `componentInstanceId`.
- Dispatch suggestion reads `ProjectTask.componentAllocations.componentId`,
  not active Yard placements.
- Shipment aggregate/domain command line identity is
  `type + inventoryItemId/componentId`.
- Frontend dispatch create payload sends `componentId` for component items.

Classification:

| Area | Current Identity | Classification |
| --- | --- | --- |
| `DispatchItem.componentId` | `Component.id` | LEGACY COMPONENT DEFINITION |
| `LogisticsService.suggestDispatchItems()` | `ProjectTaskComponentAllocation.componentId` | LEGACY COMPONENT DEFINITION |
| `LogisticsService.normalizeItems()` | requires `componentId` for component lines | LEGACY COMPONENT DEFINITION |
| `LogisticsService.receive()` | updates `Component.status = DELIVERED` | LEGACY COMPONENT DEFINITION |
| `ShipmentLineInput` | `componentId?: string` | LEGACY COMPONENT DEFINITION |
| `ShipmentAggregate` | validates component line by `componentId` | LEGACY COMPONENT DEFINITION |
| Frontend `DispatchSuggestion` | `componentId/componentCode/componentName` | LEGACY COMPONENT DEFINITION |
| Frontend create dispatch | submits `componentId` | LEGACY COMPONENT DEFINITION |
| Yard staging | `YardItemPlacement.componentInstanceId` | CANONICAL INSTANCE |
| Finished Goods API | `GET /components/instances/finished-goods` | CANONICAL INSTANCE |

## SCHEMA / MIGRATION

Current `DispatchItem` schema:

- `dispatchOrderId String`
- `type DispatchItemType`
- `inventoryItemId String?`
- `componentId String?`
- `quantity Float`
- relation to `InventoryItem`
- relation to `Component`
- no relation to `ComponentInstance`

Minimum additive schema needed after approval:

1. Add nullable `DispatchItem.componentInstanceId String?`.
2. Add optional relation to `ComponentInstance`.
3. Add index `@@index([componentInstanceId])`.
4. Preserve `componentId` for legacy historical dispatch rows.
5. Do not add a global unique constraint. Cancelled/history rows may reuse an
   instance; active duplicate prevention must be transactional service logic.

Minimum physical lifecycle state proposal:

- Add `IN_YARD`
- Add `IN_TRANSIT`
- Add `DELIVERED`
- Later, if installation is brought into the same physical lifecycle, add or
  map `INSTALLED` explicitly.

Gate reason:

Without these states, the system cannot represent a component instance that
has left Yard but has not yet been delivered. Leaving it as `QC_PASSED` or
mutating `Component.status` would produce incorrect dashboard/project
traceability.

## DISPATCH ELIGIBILITY

Required canonical eligibility:

- `DispatchItem.type = COMPONENT`
- candidate has `ComponentInstance.id`
- candidate is Finished Goods eligible by Components domain predicate
- candidate has an active `YardItemPlacement` with matching
  `componentInstanceId`
- candidate belongs to the dispatch Project
- candidate is not present in another active dispatch
- candidate is not already delivered

Current implementation does not satisfy this:

- It proposes component allocations from project tasks.
- It does not require active Yard placement.
- It checks duplicate active dispatch by `componentId`, not by
  `componentInstanceId`.
- Two physical instances of the same component definition cannot be dispatched
  independently under the current duplicate rule.

## YARD HANDOFF

Current canonical Yard facts:

- `POST /yard/stage` stages a physical finished-goods
  `ComponentInstance`.
- `YardItemPlacement.componentInstanceId` and `YardMovement.componentInstanceId`
  preserve physical identity.
- Generic new `COMPONENT` placement without `componentInstanceId` is rejected.

Current Logistics gap:

- Dispatch planning does not bind to active Yard placement.
- Loading/departure does not release a Yard placement by
  `componentInstanceId`.
- Existing Yard removal can write movement metadata, but Logistics has no
  relational dispatch exit lineage yet.

Recommended V1:

- Planned dispatch: keep Yard placement active.
- Loading: optionally mark operational loading state only.
- Departed: release active Yard placement exactly once and record dispatch
  identity in Yard movement metadata.
- Cancelled before departure: keep Yard placement active and make the instance
  eligible again.

## DELIVERY

Current delivery behavior:

- `PATCH /logistics/dispatch-orders/:id/receive` sets dispatch status
  `RECEIVED`.
- Material items create an Inventory export transaction.
- Component items update `ProjectTaskComponentAllocation.status =
  HANDED_OVER`.
- Component items update legacy `Component.status = DELIVERED`.

Canonical delivery requirement:

- Delivery must operate on `ComponentInstance`.
- Delivery evidence must answer: which instance, which dispatch, which
  project, which component definition, which Yard source, and when.
- It must not mutate `Component.status`.

Current implementation is not safe for canonical physical delivery.

## PROJECT TRACEABILITY

Current `GET /projects/:id/execution` explicitly reports:

```text
downstream.yardCanonical = true
downstream.dispatchCanonical = false
```

It does not yet expose canonical dispatched/delivered quantities from physical
instance evidence.

Minimum safe extension after Logistics conversion:

- count dispatched instances from `DispatchItem.componentInstanceId` joined to
  active/non-cancelled DispatchOrders.
- count delivered instances from canonical delivery evidence, not from
  `Component.status`.
- preserve Yard staged quantity from active `YardItemPlacement`.

## LEGACY DATA

Legacy logistics rows must remain readable:

- existing `DispatchItem.componentId`
- existing `Component.status = SHIPPED/DELIVERED/INSTALLED`
- existing ProjectTask component allocation handoff rows

Do not backfill `componentInstanceId` unless deterministic lineage exists.

New writes should reject component dispatch payloads that only contain
`componentId` once the schema/state gate is approved and implemented.

## RBAC

Current Logistics controller is guarded:

- class-level `JwtAuthGuard`
- class-level `PermissionsGuard`
- class-level `@RequirePermissions('logistics.read')`
- write endpoints override with `@RequirePermissions('logistics.write')`

Runtime RBAC was not executed in this audit turn. Static controller audit is
PASS.

## VERIFIED

Static audit evidence:

- Prisma `DispatchItem` lacks `componentInstanceId`.
- Prisma `ComponentInstanceState` lacks `IN_YARD`, `IN_TRANSIT`, and
  `DELIVERED`.
- `LogisticsService.suggestDispatchItems()` reads project task component
  allocations by `componentId`.
- `LogisticsService.normalizeItems()` requires `componentId` for
  `COMPONENT` dispatch items.
- `LogisticsService.assertNoActiveComponentDispatch()` checks active duplicate
  dispatches by `componentId`.
- `LogisticsService.receive()` updates legacy `Component.status =
  DELIVERED`.
- `LogisticsCommandService`, `ShipmentLineInput`, and `ShipmentAggregate` use
  `componentId` as component-line identity.
- Frontend Logistics API and create drawer send `componentId`.
- Yard staging and Finished Goods eligibility are already canonical by
  `ComponentInstance`.

`git diff --check` result is recorded in final response.

## RUNTIME

Runtime mutating certification was not executed.

Reason:

- This turn stopped at required schema/state gate before write-path changes.
- The sprint also requires safe runtime fixtures and forbids mutating real dev
  DB just to claim certification.

## NOT VERIFIED

- No authenticated runtime 401/403/authorized Logistics smoke.
- No create-dispatch mutation with physical instances.
- No depart-time Yard release mutation.
- No delivery confirmation mutation.
- No frontend browser smoke.
- No backend tests for new canonical Logistics behavior, because the
  implementation is gated.

## REMAINING GAPS

P0:

- Add canonical physical states to `ComponentInstanceState` or an equivalent
  approved lifecycle representation: `IN_YARD`, `IN_TRANSIT`, `DELIVERED`.
- Add `DispatchItem.componentInstanceId` relation to `ComponentInstance`.
- Convert component dispatch creation to require physical instances.
- Validate active Yard placement and matching Project.
- Prevent duplicate active dispatch by `componentInstanceId`.
- Stop new writes that mutate `Component.status` for delivery.
- Extend project execution read model with canonical dispatched/delivered
  quantities only after dispatch evidence exists.

P1:

- Add Yard exit lineage for dispatch release if JSON movement metadata is not
  sufficient for audit/reporting.
- Update Logistics frontend candidate picker to display physical instance code,
  component definition, project, Yard location and Finished Goods state.
- Add runtime RBAC smoke for `logistics.read/write`.

P2:

- Historical migration/backfill plan for old `DispatchItem.componentId` rows
  where deterministic physical lineage can be proven.
- POD detail model for proof images/signature if future delivery certification
  needs richer evidence.

## NEXT

Request approval for the schema/state gate:

1. Add `DispatchItem.componentInstanceId String?` with relation and index.
2. Add physical instance states `IN_YARD`, `IN_TRANSIT`, `DELIVERED`.
3. Then implement LOGISTICS.2 write path transactionally:
   - suggest active Yard physical instances
   - create dispatch by `componentInstanceId`
   - depart releases Yard once
   - receive marks exact instances delivered
   - project execution reads dispatched/delivered quantities from canonical
     evidence
   - preserve legacy rows as read-only compatibility
