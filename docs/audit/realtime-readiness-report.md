# Realtime Readiness Report

Date: 2026-06-29

## Current Realtime Assets

Backend foundations:

- `apps/backend-api/src/core/ws/events.gateway.ts`
- `apps/backend-api/src/core/ws/runtime.gateway.ts`
- `apps/backend-api/src/core/ws/realtime.gateway.ts`
- `apps/backend-api/src/modules/inventory/inventory.gateway.ts`
- Event bus, throttling, websocket rooms, and metrics services.

Frontend foundations:

- `apps/frontend/src/shared/socket-runtime/socket-runtime.ts`
- `apps/frontend/src/shared/realtime/socket.ts`

Operational reality:

- Primary modules still rely on TanStack Query polling.
- Common polling intervals are 4-10 seconds.
- Mutations invalidate related queries manually.

## Module Readiness

| Module | Current Mode | Realtime Readiness |
|---|---|---:|
| Inventory | Polling + invalidation + gateway foundation | Partial |
| Production | Polling + invalidation | Partial |
| Components | Polling + invalidation | Partial |
| Yard | Polling + invalidation | Partial |
| Projects | Polling + invalidation | Partial |
| Suppliers | Polling | Weak |
| QC | Polling + invalidation | Partial |
| Logistics | Static/frontend demo | Not Ready |
| Dashboard | Polling | Partial |

## Gaps

- No documented domain event contract per module.
- Frontend socket clients are not consistently wired to module query invalidation.
- Some socket URLs are hardcoded in legacy/shared files.
- Event payload standards exist in code but are not adopted by all module services.
- Dashboard recomputation still depends on polling and on-demand aggregation.

## Recommended Realtime Architecture

1. Standard event envelope:
   - `domain`
   - `entity`
   - `entityId`
   - `event`
   - `changedFields`
   - `occurredAt`
   - `actorId`
2. Emit lightweight events only.
3. Frontend subscribes by domain and invalidates TanStack Query keys.
4. Dashboard receives event hints but fetches current read models via API.
5. Move heavy metric recomputation to background jobs or persisted snapshots.

## Next Realtime Sprint

Start with Inventory and Yard because they have clear operational event boundaries:

- Inventory transaction created.
- Inventory location stock changed.
- Yard placement created/moved/removed.
- Yard slot occupancy changed.

Then extend to Production material issue/consume and QC inspection status.

