# Project Material Return API 404 Report

Date: 2026-07-01

## Symptom

Clicking `Trả vật tư` in Projects called:

```http
POST /inventory/returns
```

Backend returned:

```text
404 Not Found
```

## Root Cause

The backend already had the real return workflow endpoint:

```ts
@Controller('inventory/returns')
export class ReturnWorkflowController
```

However, `ReturnWorkflowController` was not registered in `InventoryModule.controllers`, so NestJS never mounted `/inventory/returns`.

## Payload

Frontend sends the existing Inventory return workflow contract:

```json
{
  "flowType": "SITE_RETURN",
  "projectId": "<projectId>",
  "requestedBy": "<optional>",
  "remarks": "<reason>",
  "items": [
    {
      "inventoryItemId": "<materialId>",
      "requestedQuantity": 1,
      "unitId": "<optional>",
      "zoneId": "<optional>",
      "remarks": "<reason>"
    }
  ]
}
```

## Fix

Registered `ReturnWorkflowController` in `InventoryModule`.

Also added `ActivityLog` creation when a return request is created:

```text
action = PROJECT_MATERIAL_RETURN_REQUESTED
entity = ReturnRequest
module = inventory
```

Frontend now invalidates:

- `projects-runtime`
- `project-runtime`
- `project-wbs`
- `project-detail`
- `inventory`
- `inventory-material-detail`

The return modal now shows the required explicit message when quantity exceeds the returnable amount:

```text
Vượt số lượng có thể trả
```

## Duplicate React Key Fix

The console warning:

```text
Encountered two children with the same key, '/settings'
```

was caused by two sidebar items sharing `path: '/settings'`.

Fix:

- Added stable ids to the duplicated sidebar items:
  - `settings-general`
  - `settings-backup`
- Changed `SidebarGroup` render key to use `item.id` when available, with a title/path fallback.

## Files Changed

- `apps/backend-api/src/modules/inventory/inventory.module.ts`
- `apps/backend-api/src/modules/inventory/return-workflow.service.ts`
- `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`
- `apps/frontend/src/app/shell/sidebar/SidebarGroup.tsx`
- `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
- `apps/frontend/src/app/shell/sidebar/EnterpriseSidebar.tsx`

## Expected Verification

Network:

```text
POST /inventory/returns -> 201 Created
```

Database:

```text
return_requests row created
return_request_items row created
activity_logs row created
```

Frontend:

- Modal closes on success.
- Toast success appears.
- Project runtime and Inventory material detail queries are invalidated.
- Duplicate `/settings` React key warning is gone.
