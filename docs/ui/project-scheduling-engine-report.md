# Project Scheduling Engine Report

Date: 2026-06-30

## Implemented

Sprint 40PROJ.6 adds a no-migration scheduling engine on top of the existing Project WBS metadata bridge.

Supported dependency types:

- Finish-To-Start
- Start-To-Start
- Finish-To-Finish

## Behavior

For persisted Project WBS tasks, the backend now calculates:

- `scheduledStartAt`
- `scheduledFinishAt`
- `forecastFinishAt`
- `cascadeDelayDays`

If a predecessor finishes late, successor tasks are shifted while preserving their task duration.

## Data Source

- Existing `Task` table
- Project WBS metadata stored in `Task.description`

## Limitations

- Scheduling is a read-model calculation, not a persisted schedule baseline table.
- Critical path and float are not implemented yet.
- Workflow is not locked when dependencies are violated.

