# Sprint 40PROJ.3 – Project Return Flow Report

Date: 2026-06-30

## Objective

Activate a usable Project Material Return entry point without creating a new storage or workflow engine.

## Existing Foundation Used

The implementation reuses the existing Inventory Return workflow:

* `ReturnRequest`
* `ReturnRequestItem`
* `POST /inventory/returns`
* `flowType = SITE_RETURN`

No new schema or migration was introduced.

## Material Return Flow

Current UI flow:

```text
Project Detail / Vật tư
↓
Select material row
↓
Trả vật tư
↓
Create ReturnRequest(SITE_RETURN)
```

The dispose step of the existing return workflow can later create Inventory `RETURN` transactions for usable stock.

## Captured Data

The created return request includes:

* `projectId`
* `inventoryItemId`
* `unitId`
* `zoneId`
* requested quantity
* reason/remarks

## Validation

Frontend validates:

* material must have `projectId`
* material must have `inventoryItemId`
* quantity must be greater than 0
* quantity cannot exceed the selected issued row quantity

Backend validation is the existing `createReturnRequestSchema`.

## Component Return

Component return remains incomplete.

Reason:

* there is no formal Project Component Return API yet
* destination logic for Yard vs Inventory is not represented as a current workflow
* component lifecycle currently supports `SHIPPED -> DELIVERED -> INSTALLED`, not reverse/return states

## Recommendation

Create a future explicit sprint for Component Return:

* `ProjectComponentReturn`
* Yard receiving/disposition
* Component timeline events
* status rules for returned/rework/scrap
* project handover reversal audit

