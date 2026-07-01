# Yard 3D Restoration Report

Date: 2026-06-28

## Scope

Sprint 80YARD.1R restored the existing Yard 3D workspace implementation instead of rewriting it.

No npm package, backend API, Prisma schema, database migration, or workflow changes were introduced.

## Discovery Inventory

### Restored Active Component

- `apps/frontend/src/modules/yard/maps3d/YardOperationalMap3D.tsx`

This is the active 3D implementation. It uses:

- `@react-three/fiber`
- `@react-three/drei`
- `three`
- `Canvas`
- `OrbitControls`
- `useGLTF`

These dependencies already existed in `apps/frontend/package.json` and `pnpm-lock.yaml`; no packages were added.

### Runtime Data

Runtime source remains:

- `useYardSlotsRuntime()`
- `yardApi.slots()`
- `GET /yard/slots`

Runtime type:

- `YardSlotRuntime`

Fields used:

- `slot.id`
- `slot.code`
- `slot.status`
- `slot.currentStackLevel`
- `slot.maxStackLevel`
- `slot.zone`
- `slot.placements`
- `placement.itemCode`
- `placement.itemName`
- `placement.stackLevel`
- `placement.weight`

### Assets

Existing public assets:

- `apps/frontend/public/yard/crane.glb`
- `apps/frontend/public/yard/cau-kien-3d.glb`
- `apps/frontend/public/yard/bai-tap-ket-reference.png`

### Archived References

Archived references found:

- `apps/frontend/src/_archived/final-purge/ui/maps/Yard3DMap.tsx`
- `apps/frontend/src/_archived/prototype-layers/digital-renderers/3d/StackRenderer3D.tsx`

The archived `Yard3DMap.tsx` references `yardSlots`, but the referenced active mock-data file was not available in the current repository path. The active runtime implementation was therefore restored instead of copying archived code.

## Root Cause

The 3D workspace disappeared after Sprint 80YARD.1 because:

1. `/yard/map-3d` route remained valid.
2. `YardOperationalMap3D.tsx` still existed.
3. But `YardTabWorkspace.tsx` stopped importing and rendering `YardOperationalMap3D`.
4. The `/yard/map-3d` branch was replaced with a new CSS pseudo-3D component.
5. As a result, the original 3D component was no longer bundled, and the old 3D GLB/OrbitControls experience vanished.

Exact restored chain:

```text
/yard/map-3d
  -> YardPage
  -> YardTabWorkspace tab === "map-3d"
  -> lazy import ../maps3d/YardOperationalMap3D
  -> <YardOperationalMap3D slots={slots} selectedSlotId={selectedSlotId} />
```

## Restoration

Restored:

- Lazy import of `YardOperationalMap3D`.
- `/yard/map-3d` render branch to call the existing component.
- Existing 3D map experience with GLB crane/component assets, orbit controls, zoom controls, slot planes, and stacked components.

Removed from active render path:

- Sprint 80YARD.1 CSS pseudo-3D branch.

## Demo Data Preservation

Because the current cleaned database can have zero runtime Yard slots, `YardOperationalMap3D` now supports demo fallback:

```ts
const isDemoMode = !slots.length
const sourceSlots = isDemoMode ? demoYardSlots : slots
```

Demo mode uses local sample `YardSlotRuntime` rows inside `YardOperationalMap3D.tsx`.

When demo mode is active, the UI displays:

```text
Đang hiển thị dữ liệu mẫu
```

No empty state is shown for the 3D map when demo fallback is available.

## Runtime Mode

When runtime slots exist, the 3D map uses `yard_slots` runtime data and does not use demo rows.

Coordinates are not invented from backend fields. The existing implementation lays out slots in a computed grid from the current slot sequence, which was already how `YardOperationalMap3D` worked.

## Difference From Sprint 80YARD.1

Sprint 80YARD.1:

- Rendered CSS pseudo-3D.
- Did not bundle `YardOperationalMap3D`.
- Showed empty state when no runtime slots existed.

Sprint 80YARD.1R:

- Restores `YardOperationalMap3D`.
- Reuses existing GLB assets and R3F dependencies already present in the project.
- Adds demo fallback inside the restored component for clean/empty datasets.
- Keeps runtime data preferred over demo data.

## Verification

- `pnpm -C apps/frontend build`: PASS.
- `pnpm -C apps/backend-api build`: PASS.

Build output confirms the restored lazy chunk:

```text
YardOperationalMap3D-*.js
```
