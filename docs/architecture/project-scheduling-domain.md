# Project Scheduling Domain

Project scheduling is now backed by `ProjectTask` and `ProjectTaskDependency`.

## Dependency Types

* `FS`: Finish-To-Start
* `SS`: Start-To-Start
* `FF`: Finish-To-Finish

Each dependency stores:

* `projectTaskId`
* `dependsOnTaskId`
* `type`
* `lagDays`

## Scheduling Fields

`ProjectTask` stores:

* `plannedStartAt`
* `plannedFinishAt`
* `scheduledStartAt`
* `scheduledFinishAt`
* `forecastFinishAt`
* `baselineStartAt`
* `baselineFinishAt`
* `cascadeDelayDays`
* `baselineVarianceDays`

The current service recalculates scheduling for read responses and preserves API compatibility. Persisted recalculation jobs or workflow locks remain future work.

## Events

The service records foundation activity events:

* `project.task.created`
* `project.task.updated`
* `project.task.deleted`
* `project.schedule.changed`
