# Project Resource Domain

Project task resources are normalized into task-scoped allocation tables.

## Materials

`ProjectTaskMaterialAllocation` stores:

* planned quantity
* issued quantity
* used quantity
* returned quantity
* remaining quantity
* unit cost
* total cost

Procurement readiness can now be derived from:

```text
missing = plannedQty - issuedQty
remaining = plannedQty - usedQty - returnedQty
```

## Components

`ProjectTaskComponentAllocation` links project tasks to components and tracks:

* assigned date
* installed date
* returned date
* component allocation status
* cost

## Workers And Machines

`ProjectTaskResource` stores worker, machine, and other resources:

* type
* name
* required quantity
* allocated quantity
* cost

This supports task-level shortage summaries without using JSON metadata.
