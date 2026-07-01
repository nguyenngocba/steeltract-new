# Project Task Domain Model

Sprint 40PROJ.7 replaces the Project WBS metadata bridge stored in `Task.description` with first-class project execution tables.

## Source Of Truth

Project execution now uses:

* `project_tasks`
* `project_task_dependencies`
* `project_task_material_allocations`
* `project_task_component_allocations`
* `project_task_resources`
* `project_task_inspections`
* `project_task_costs`

Legacy `tasks.description` JSON is migration input only. Active WBS APIs read and write `ProjectTask`.

## Hierarchy

`ProjectTask.parentTaskId` is a self-relation and supports unlimited depth:

```text
Project
├── Phase
│   ├── Task
│   │   ├── Task
│   │   └── Task
│   └── Task
└── Phase
```

Circular parent assignment remains blocked in the Projects service.

## API Compatibility

Existing endpoints remain stable:

* `GET /projects/:id/wbs`
* `POST /projects/:id/wbs`
* `PATCH /projects/:id/wbs/:taskId`
* `PATCH /projects/:id/wbs/:taskId/move`
* `DELETE /projects/:id/wbs/:taskId`
* `GET /projects/runtime`

The DTO shape returned to the frontend is preserved while the persistence source is normalized.
