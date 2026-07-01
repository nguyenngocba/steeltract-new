# Project Material Return Reconciliation Report

Date: 2026-07-01

## Problem

`POST /inventory/returns` created a Return Request, but the operational views did not reconcile:

- Projects still showed the material as fully available/on-site.
- Inventory stock did not change at the correct lifecycle step.
- Project task material allocations were not reduced after the returned material was received.

## Lifecycle Implemented

### Requested

When a project material return request is created:

- `ReturnRequest.status = REQUESTED`
- Inventory stock is not increased.
- Project runtime calculates `pendingReturnQuantity` from open `SITE_RETURN` requests.
- Project runtime calculates `availableReturnQuantity` from current allocation and pending return quantities.
- ActivityLog writes:

```text
PROJECT_MATERIAL_RETURN_REQUESTED
```

### Received

When a return request is received:

- `ReturnRequest.status = RECEIVED`
- Inventory creates a real transaction:

```text
type = RETURN
transactionTypeCode = PROJECT_RETURN_RECEIVED
referenceModule = return-workflow
referenceId = returnRequest.id
```

- Inventory stock increases through the normal Inventory transaction path.
- Project task material allocation is reconciled:
  - `issuedQty -= receivedQuantity`
  - `returnedQty += receivedQuantity`
  - `remainingQty` is reduced safely
- ActivityLog writes:

```text
PROJECT_MATERIAL_RETURN_RECEIVED
```

### Accepted

When a received project return is disposed/accepted as usable stock:

- The workflow writes:

```text
PROJECT_MATERIAL_RETURN_ACCEPTED
```

- `SITE_RETURN` does not create a second stock-in transaction at disposition, avoiding duplicate inventory increase.

## Project Runtime Fields

Project material rows now expose:

- `allocatedQuantity`
- `usedQuantity`
- `pendingReturnQuantity`
- `returnedQuantity`
- `availableReturnQuantity`

`availableReturnQuantity` follows the reconciled current-allocation model:

```text
availableReturnQuantity =
current allocatedQuantity
- usedQuantity
- pendingReturnQuantity
```

`returnedQuantity` remains an audit field. This matches the expected received-state example where allocated quantity is reduced after receiving.

## UI Changes

Project material tables now show:

- Allocated
- Used
- Pending Return
- Returned
- Available Return

Return buttons are disabled when `availableReturnQuantity <= 0`.

The return dialog validates against `availableReturnQuantity` and shows:

```text
Vượt số lượng có thể trả
```

## Expected Scenario

Initial:

```text
Allocated = 1000
Used = 850
Return = 150
```

After request:

```text
Allocated = 1000
Used = 850
Pending Return = 150
Returned = 0
Available Return = 0
Inventory stock unchanged
```

After receive:

```text
Allocated = 850
Used = 850
Pending Return = 0
Returned = 150
Available Return = 0
Inventory stock +150
```

## Files Changed

- `apps/backend-api/src/modules/inventory/return-workflow.service.ts`
- `apps/backend-api/src/modules/projects/services/projects.service.ts`
- `apps/frontend/src/modules/projects/api/projects.api.ts`
- `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`

## Limitations

- No Prisma schema migration was added.
- `pendingReturnQuantity` is a runtime read model derived from open `ReturnRequest` rows, not a persisted column.
- Richer accepted/rejected lifecycle labels still map onto the existing `ReturnRequestStatus` / disposition workflow.
