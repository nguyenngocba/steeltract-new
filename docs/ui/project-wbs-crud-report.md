# Project WBS CRUD Report

Date: 2026-06-30

## Objective

Provide a real editable Work Breakdown Structure for Projects without changing Prisma schema.

## Backend

Added Project WBS endpoints:

- `GET /projects/:id/wbs`
- `POST /projects/:id/wbs`
- `PATCH /projects/:id/wbs/:taskId`
- `PATCH /projects/:id/wbs/:taskId/move`
- `DELETE /projects/:id/wbs/:taskId`

## Persistence Strategy

Because schema changes were out of scope, Project WBS tasks are persisted in the existing `Task` table.

WBS-specific fields are stored as JSON metadata in `Task.description`:

- `steeltrackProjectWbs`
- `projectId`
- `parentId`
- `owner`
- planned/actual start and finish dates
- `progress`
- rich task status
- `sortOrder`
- material links
- component links

## Frontend

The Project Detail `Tiến độ` tab now includes:

- Multi-level tree grid.
- Add task.
- Add subtask.
- Edit task.
- Delete task with recursive child deletion.
- Move up/down through `sortOrder`.
- Change parent.
- Expand all / collapse all.
- Task detail drawer.

## Statuses

Supported UI statuses:

- Draft
- Planned
- Ready
- In Progress
- Blocked
- Paused
- Completed
- Cancelled

These map to the existing coarse `TaskStatus` enum for database compatibility.

## Limitations

- This is a bridge implementation. A future normalized ProjectTask schema should replace metadata-in-description storage.
- Drag-and-drop reorder is not implemented.
- There is no approval workflow on WBS task edits yet.

