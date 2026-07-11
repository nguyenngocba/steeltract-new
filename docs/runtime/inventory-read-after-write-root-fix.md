# EPIC118.5.1 - Inventory Read-after-Write Root Fix

Date: 2026-07-11

## Scope

This sprint fixes the remaining Inventory Materials read-after-write gap without:

- polling;
- retry-based masking;
- page reload;
- global Inventory refetch;
- API contract changes;
- Repository changes;
- Prisma schema changes;
- business workflow changes;
- Snapshot Engine, Event, or Outbox changes.

## Relevant Files

| File | Change | Reason |
| --- | --- | --- |
| `apps/backend-api/src/modules/inventory/inventory-read-model.service.ts` | Materials list row mapper now reads live `locationStocks` for row stock/location values. | Snapshot lag must not block workspace row consistency. |
| `apps/frontend/src/modules/inventory/hooks/invalidateInventoryReadState.ts` | Current helper performs explicit invalidation plus active refetch only. | Avoid masking root cause with retry/polling. |
| `apps/frontend/src/modules/inventory/hooks/useInventoryReadModels.ts` | Current Overview query has no mounted polling interval. | Dashboard remains snapshot-first eventual consistency. |
| `apps/frontend/src/modules/inventory/pages/tabs/InventoryMaterialsPage.tsx` | Table rows derive from `materialsData.items`. | Confirms stale rows were caused by API payload mapping, not local row state. |

Note: the current worktree contains earlier EPIC118.3/118.4/118.5 changes. This report only describes the EPIC118.5.1 root-cause fix.

## Root Fix Details

Before:

```text
snapshot fresh by age
-> use snapshot.locationPayload
-> use snapshot.currentStock
-> table can remain stale until Background Engine writes next snapshot
```

After:

```text
repository page query includes live inventory_location_stocks
-> row mapper maps item.locationStocks
-> currentStock = sum(locationStocks.quantity)
-> table reflects write immediately after active refetch
```

Valuation still uses the existing snapshot valuation basis where available:

```text
averageCost = snapshot.inventoryValue / snapshot.currentStock
inventoryValue = live currentStock * averageCost
```

This preserves the existing display contract while preventing stale stock quantities in the operational Materials table.

## Read-after-Write Matrix

| Mutation | Materials | Locations | Material Detail | History | Overview |
| --- | --- | --- | --- | --- | --- |
| Inbound | Expected PASS after active refetch | Expected PASS via invalidation | Expected PASS via invalidation | Expected PASS via invalidation | Eventual consistency |
| Outbound | Expected PASS after active refetch | Expected PASS via invalidation | Expected PASS via invalidation | Expected PASS via invalidation | Eventual consistency |
| Transfer | Expected PASS after active refetch | Expected PASS via invalidation | Expected PASS via invalidation | Expected PASS via invalidation | Eventual consistency |
| Adjustment | Expected PASS after active refetch | Expected PASS via invalidation | Expected PASS via invalidation | Expected PASS via invalidation | Eventual consistency |
| Return | Expected PASS after active refetch | Expected PASS via invalidation | Expected PASS via invalidation | Expected PASS via invalidation | Eventual consistency |

## Operator Smoke Status

CLI verification can confirm build and static trace only. The required browser/operator smoke test still needs an authenticated UI session with real test transactions:

- inbound;
- outbound;
- transfer;
- adjustment;
- project return request / receive or reject.

Do not mark operational acceptance complete until the browser test confirms Materials, Locations, Material Detail, and History update without F5 or tab switching.

## Acceptance Assessment

Current implementation status: **CODE FIX COMPLETE, OPERATOR SMOKE PENDING**.

The root cause is fixed at the read path where stale payloads were produced. Remaining acceptance depends on real operator smoke validation.

## Verification

Run on 2026-07-11:

| Command | Result |
| --- | --- |
| `pnpm -C apps/backend-api build` | PASS |
| `pnpm -C apps/frontend build` | PASS |
| `git diff --check` | PASS |

No application debug logs were left behind.
