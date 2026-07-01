# Project Realtime Foundation

Sprint 40PROJ.7 adds event hook foundations without WebSocket infrastructure.

## Event Hooks

Project task mutations write activity log events:

* `project.task.created`
* `project.task.updated`
* `project.task.deleted`
* `project.material.changed`
* `project.cost.changed`
* `project.inspection.changed`

## Purpose

These events provide a stable source for future:

* Project activity timelines
* Dashboard refresh triggers
* Notification rules
* WebSocket/outbox integration

## Out Of Scope

No realtime transport was introduced in this sprint. Future work should decide whether Project events flow through `outbox_events`, WebSocket gateways, or polling-based dashboard invalidation.
