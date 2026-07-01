# Logistics Auto Suggestion Report

## Source

`POST /logistics/dispatch-orders/suggest`

The suggestion engine reads real project execution data:

- `ProjectTask`
- `ProjectTaskMaterialAllocation`
- `ProjectTaskComponentAllocation`

## Material Suggestion Rule

For each upcoming incomplete task:

`missingQty = plannedQty - issuedQty`

Only positive missing quantities are suggested.

## Component Suggestion Rule

Component allocations are suggested when they are not `HANDED_OVER` or `RETURNED`.

## Limitations

- The MVP does not infer yard slot coordinates.
- The MVP does not create purchase requests.
- Suggested items are generated only from existing task allocations.
