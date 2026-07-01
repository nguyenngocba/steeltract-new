# Sprint 40PROJ.3 – Project WBS Report

Date: 2026-06-30

## Objective

Introduce a Work Breakdown Structure foundation for Projects:

```text
Project
↓
Phase
↓
Task
↓
Subtask
```

## Implementation

No schema changes were made. The current WBS is derived from available operational data.

Sources:

* `Project`
* `Component`
* existing `Task` rows linked to `Component`
* project-linked Inventory material transactions

Generated WBS node types:

* `PROJECT`
* `PHASE`
* `TASK`
* `SUBTASK`

## UI

The Project Detail `Tiến độ` tab now renders a tree grid with:

* Expand/collapse
* Expand all
* Collapse all
* Công việc
* Người phụ trách
* Bắt đầu KH
* Kết thúc KH
* Bắt đầu TT
* Kết thúc TT
* Tiến độ %
* Trạng thái
* Số vật tư
* Số cấu kiện
* Delay

## Rollup Rules

Current rollups are derived:

* Project progress uses existing project runtime progress.
* Component task progress maps component lifecycle status to percent.
* Component-linked `Task` progress maps `PENDING`, `IN_PROGRESS`, and `DONE`.
* Material nodes derive from project-linked Inventory transactions.

## Missing Persistence

The current database does not support full WBS requirements:

* no `projectId` on `Task`
* no `parentId` on `Task`
* no unlimited task hierarchy
* no planned/actual start/finish fields on `Task`
* no task-level material allocation table
* no task-level component allocation table

## Recommendation

Next backend phase should add a formal Project Execution model set:

* `ProjectTask`
* `ProjectTaskDependency`
* `ProjectTaskMaterial`
* `ProjectTaskComponent`
* task activity/audit log

Do this through an explicit schema/migration sprint, not as a hidden UI refactor.

