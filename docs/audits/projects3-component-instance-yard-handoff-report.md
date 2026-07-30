# PROJECTS.3 – Canonical ComponentInstance -> Yard Handoff Report

## BEFORE

Current Yard persistence used `YardItemPlacement.itemType + itemId` as the
business identity. For `itemType = COMPONENT`, legacy flows used `Component.id`
as if it were the physical fabricated item. That is semantically ambiguous
because `Component` is now the engineering definition, not the manufactured
instance.

Observed usages:

| Location | Current usage | Classification |
| --- | --- | --- |
| `YardItemPlacement.itemId` with `itemType=COMPONENT` | Legacy placement identity | LEGACY/AMBIGUOUS |
| `YardMovement.itemId` with `itemType=COMPONENT` | Legacy movement identity | LEGACY/AMBIGUOUS |
| `ProductionService.stageToYard()` | Stages completed PO by `order.component.id` and mutates `Component.status=STOCK` | LEGACY/AMBIGUOUS |
| `YardService.removeItem()` | For `itemType=COMPONENT`, marks `Component.status=SHIPPED` | LEGACY/AMBIGUOUS |
| `GET /projects/:id/execution` before this sprint | No Yard canonical state | MISSING |
| Yard frontend inbound dialog | Selected completed ProductionOrder and inferred staged quantity by Component id | LEGACY/AMBIGUOUS |

## SCHEMA

Added nullable canonical physical identity:

- `YardItemPlacement.componentInstanceId`
- `YardMovement.componentInstanceId`
- `ComponentInstance.yardPlacements`
- `ComponentInstance.yardMovements`

Migration:

- `20260729193000_component_instance_yard_handoff`

Raw SQL adds:

- FK from `yard_item_placements.componentInstanceId` to `component_instances.id`
- FK from `yard_movements.componentInstanceId` to `component_instances.id`
- indexes on both new columns
- partial unique index:
  `yard_item_placements_componentInstance_active_uidx`

The partial unique index enforces at most one active Yard placement per
physical `ComponentInstance`, while still allowing multiple historical rows
after `removedAt`.

No legacy placement backfill was performed.

## CANONICAL IDENTITY

Physical Yard identity is now:

`Project -> ProjectComponentRequirement -> ProductionOrder -> ComponentInstance -> YardItemPlacement`

Canonical `POST /yard/stage` writes:

- `componentInstanceId = ComponentInstance.id`
- `itemId = ComponentInstance.id`
- `itemCode = ComponentInstance.instanceNo`
- metadata references to Component definition, Project, Requirement and PO

Legacy `POST /yard/placements` remains readable/compatible but is not the
canonical Finished Goods handoff.

## FINISHED GOODS ELIGIBILITY

Yard does not duplicate QC logic. `YardService.stageComponentInstance()` calls:

`FinishedGoodsEligibilityService.findEligibleInstance(componentInstanceId)`

This reuses the same predicate as:

`GET /components/instances/finished-goods`

Rejected cases:

- unfinished instance
- QC failed / ineligible instance
- scrapped instance
- already actively placed instance

## STAGE TO YARD

Added:

`POST /yard/stage`

Payload:

```json
{
  "componentInstanceId": "component-instance-id",
  "slotId": "yard-slot-id"
}
```

The operation:

1. requires authentication
2. requires `yard.write`
3. validates Finished Goods eligibility
4. validates target slot and stack capacity through existing Yard logic
5. prevents duplicate active placement
6. creates placement and movement with `componentInstanceId`
7. writes ActivityLog and Yard outbox event
8. links attachments using existing Yard attachment behavior

It does not mutate `Component.status`.

## YARD READ MODEL

Yard placement reads now include `componentInstance` with:

- instance code/state
- component definition code/name/type/profile
- project code/name
- requirement number
- production order number/status
- yard slot/zone/row

Frontend Yard placement types now expose the same physical instance identity.

## MOVEMENT

`moveItem()` preserves `componentInstanceId` when creating a `YardMovement`.
Moving a placement changes slot/stack only; it does not create a fake component
or replace physical identity.

`removeItem()` preserves history by setting `removedAt`. For canonical
ComponentInstance placements, it does not run the legacy `Component.status =
SHIPPED` compatibility branch.

## PROJECT INTEGRATION

`GET /projects/:id/execution` now exposes Yard state from canonical
`ComponentInstance.yardPlacements`.

Added:

- requirement `quantities.yardStagedQty`
- project summary `yardStagedQty`
- physical instance `yardPlacementId`, `yardSlotId`, `yardPlacedAt`
- `summary.downstream.yardCanonical = true`

Production completion and Finished Goods percentages are unchanged by Yard
placement. Yard is downstream physical/logistics state, not production
completion.

## RBAC

Yard now uses:

- `JwtAuthGuard`
- `PermissionsGuard`
- class-level `yard.read`
- mutation-level `yard.write`

No new permissions were invented. The existing SYSTEM.2 catalog already
contains `yard.read` and `yard.write`.

## HISTORICAL DATA

Local DB after migration:

| Count | Value |
| --- | ---: |
| canonical instance placements | 0 |
| legacy component placements | 0 |
| total placements | 0 |
| active placements | 0 |
| deterministically migrated | 0 |
| unresolved legacy placements | 0 |

No guessed mappings were created.

## TESTS

Added/updated targeted coverage:

- finished ComponentInstance stages using physical identity
- ineligible/unfinished instance is rejected
- duplicate active ComponentInstance placement is rejected
- movement preserves ComponentInstance identity
- canonical removal does not mutate legacy Component status
- Projects read model reports Yard staged quantity without changing completion
- RBAC metadata includes Yard read/write controller mapping

Verification:

- targeted backend tests: PASS
- full backend tests: PASS, 87 suites / 284 tests
- backend build: PASS
- frontend build: PASS

## RUNTIME

Runtime HTTP certification was not executed because no backend server was
listening on `127.0.0.1:3000` or `127.0.0.1:3105`.

Database migration was deployed locally and migration status reports schema up
to date.

## UNRESOLVED LEGACY DATA

The legacy production endpoint remains:

`POST /production/:id/stage-to-yard`

It still stages by ProductionOrder/Component definition and is retained only
for backward compatibility. New canonical UI path uses `POST /yard/stage`.

Snapshot code that interprets `YardItemPlacement.itemType=COMPONENT` and
`itemId=Component.id` remains a legacy consumer and should be updated in a
separate snapshot compatibility sprint.

## NEXT

1. Runtime certify with an authenticated `PROJECTS3-*` fixture once backend
   server is running.
2. Deprecate or convert `POST /production/:id/stage-to-yard` after all UI
   consumers use ComponentInstance staging.
3. Convert Yard snapshots/read models that still treat `Component.id` as a
   physical placement identity.
4. Continue to Logistics/Dispatch only after Yard placement is certified at
   ComponentInstance level.
