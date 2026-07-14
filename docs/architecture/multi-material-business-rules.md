# Multi-material Business Rules

Date: 2026-07-14  
Status: **APPROVED SPECIFICATION**

## Core Rules

1. One posted Inventory transaction has one header and one or more lines.
2. Pending Items is local command state and has no stock or ledger effect.
3. The server remains authoritative for material, location, quantity, stock,
   workflow, and atomic persistence validation.
4. Posted transactions remain immutable under INV-010.
5. A failed line fails the complete document.

## Duplicate Decision

**Selected option: Option A - automatically merge exact duplicates.**

Two pending entries merge only when every applicable bucket/business identity
matches:

- material;
- warehouse;
- zone;
- slot;
- level;
- unit;
- lot, batch, and serial when those capabilities exist;
- unit price/cost basis when editable;
- workflow-specific reason, disposition, or source/destination pair.

The merged entry keeps one Pending row and adds quantity. The UI must indicate
that the quantity was merged. The backend remains defensive and aggregates
duplicate balance buckets even if another client submits separate lines.

## Non-duplicate Cases

These remain separate entries:

- same material, different warehouse/Zone/Slot/Level;
- same material and location, different unit or price basis;
- same material and location, different approved lot/batch/serial identity;
- same material, different adjustment reason or return disposition;
- different transfer source/destination route.

## Lot, Batch, and Serial

Current Inventory transaction/location schema does not persist lot, batch, or
serial identity. Therefore Phase 1 must not expose fake tracking selectors or
encode tracking values in remarks.

Future behavior:

- different lot or batch: separate Pending entries;
- serialized material: one serial per entry unless an approved serial-range
  model exists;
- duplicate identity includes the tracking identifier;
- the backend bucket key and unique validation must be extended before rollout.

## Quantity and Units

- Quantity must be finite and greater than zero in the operator editor.
- Transfer conversion creates equal absolute source/destination quantities.
- Totals must never add unlike units into one number.
- Pending summary groups quantity by unit, for example `25 t; 120 cái`.
- Total weight is shown only when authoritative unit-weight/conversion data is
  available for every included line. Otherwise it is `Chưa xác định`.

## Value

- Inbound/return/adjustment value is the sum of applicable line values.
- Outbound value uses the approved Inventory valuation source, not a frontend
  guess.
- Transfer value counts each material once, not both source and destination.
- Missing price produces an explicit unavailable value where the workflow
  permits it; it must not silently become zero.

## Transfer Phase 1

- One Pending transfer entry represents one material, one source bucket, one
  destination bucket, and one quantity.
- A transaction may contain many different materials.
- The same material may not have multiple transfer routes in one transaction in
  Phase 1 because the persisted contract has no pair identifier.
- An exact duplicate transfer entry merges quantity.
- A second different route for the same material is blocked with a clear
  message and must be posted as a separate transaction.

## Limits

Phase 1 operator UI limit: **50 Pending business entries per document**.

- Inbound/Outbound/Adjustment: up to 50 canonical lines.
- Transfer: up to 50 business entries, transformed into up to 100 persisted
  source/destination lines.
- This is an operator safety limit, not a claim of backend performance capacity.
- Backend enforcement and larger limits require benchmark evidence in the
  implementation sprint.
