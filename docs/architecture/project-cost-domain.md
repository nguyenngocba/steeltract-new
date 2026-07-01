# Project Cost Domain

Task cost is now represented by `ProjectTaskCost`.

## Cost Buckets

* `materialCost`
* `laborCost`
* `machineCost`
* `otherCost`
* `budgetCost`
* `actualCost`
* `forecastCost`

## Traceability

Cost can now be traced:

```text
Project
↓
ProjectTask phase
↓
ProjectTask task/subtask
↓
ProjectTaskCost
↓
Material / Component / Resource allocations
```

## Current Limitation

Revenue/budget is preserved through `budgetCost` for compatibility with the existing Project command center. Formal project contract/budget tables are still future work.
