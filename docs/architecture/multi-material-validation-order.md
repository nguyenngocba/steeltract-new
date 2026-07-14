# Multi-material Validation Order

Date: 2026-07-14  
Status: **APPROVED SPECIFICATION**

## Add/Edit Pending Validation

Validation stops at the first invalid stage for the current line, while Confirm
must collect indexed errors for all Pending entries.

1. **Material**
   - Required, active, and allowed for the workflow.
2. **Warehouse**
   - Required where location-controlled; allowed by workflow ownership.
3. **Zone**
   - Required where applicable and must belong to the selected warehouse.
4. **Slot**
   - Required for location-controlled stock and must belong to the Zone.
5. **Level**
   - Required for location-controlled stock and valid for the Slot/location.
6. **Quantity**
   - Finite, greater than zero, valid precision, and within configured limits.
7. **Duplicate**
   - Compute the complete duplicate identity; merge exact matches, retain valid
     distinct buckets, reject forbidden transfer ambiguity.
8. **Stock**
   - For Outbound/Transfer source, aggregate current line plus all matching
     Pending demand and compare with live bucket stock.
   - Client validation is advisory because stock can change concurrently.
9. **Business Rule**
   - Unit, price, supplier/project, adjustment reason, return disposition,
     source/destination difference, attachment requirement, and workflow state.

## Transfer-specific Order

Validate Material, source Warehouse/Zone/Slot/Level, destination
Warehouse/Zone/Slot/Level, Quantity, duplicate route, aggregate source stock,
then transfer rules. Source and destination must differ and belong to permitted
warehouses.

## Confirm Validation

Before the API call:

1. Validate document header.
2. Require 1-50 Pending business entries.
3. Re-run the ordered validation for every entry.
4. Recompute exact duplicate merges.
5. Recompute aggregate stock demand by material/location bucket.
6. Validate cross-line rules and transfer uniqueness.
7. Build canonical `items[]` without using display labels as identifiers.

The API must repeat all authoritative validation. Client success does not imply
that stock remains available at commit time.

## Error Contract Expectations

Without changing the current API in EPIC182, UI implementation should support:

- field-level local errors before Add;
- Pending entry errors identified by `pendingId` locally;
- server field/line errors when available;
- a document-level error fallback when the existing API cannot identify a line.

An additive indexed-error API contract may be proposed later, but Gemini must
not invent one during UI implementation.

## Submit and Retry Safety

- One Confirm produces one mutation request.
- Confirm stays disabled while in flight.
- Validation errors retain Pending state.
- Network timeout is an unknown outcome. Do not auto-retry or generate a second
  transaction while durable public idempotency remains unavailable.
- The operator may reconcile via transaction history before manual resubmission.
