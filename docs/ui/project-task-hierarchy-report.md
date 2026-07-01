# Project Task Hierarchy Report

Date: 2026-06-30

## Root Cause Fixed

The previous WBS modal did not provide a usable parent selector. Operators could create tasks, but hierarchy creation was awkward and tended toward a flat list.

## Implemented

- Task Create/Edit modal now includes `Công việc cha`.
- Parent selector is a tree-style select:
  - `Không có (Root)`
  - `Móng`
  - `Khung / Gia công`
  - `Khung / Gia công / Hàn`
- Multi-level WBS is supported without a UI depth limit.
- Change Parent is available from the task action panel.
- Expand All / Collapse All remain available.
- Tree rows render true indentation and child toggles.

## Backend Validation

- A task cannot choose itself as parent.
- A task cannot be moved under one of its descendants.
- Circular hierarchy is rejected by `ProjectsService.assertNoCircularWbsParent()`.

## Persistence

Still uses the no-migration WBS bridge:

- existing `Task` table
- SteelTrack Project WBS metadata in `Task.description`

## Next Step

Replace the bridge with normalized `ProjectTask` / `ProjectTaskDependency` models when migrations are allowed.

