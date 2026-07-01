# Project Cost Traceability Report

Date: 2026-06-30

## Implemented

Project cost visibility now extends from Project level down to WBS Task level.

Task metadata supports:

- Revenue
- Labor cost
- Machine cost
- Other cost
- Material/component resource costs

The Cost tab displays:

- Project financial KPIs
- Cost Breakdown
- Cost Burnup
- Profitability
- Project -> Phase -> Task cost traceability table

## Formula

Task actual cost:

```text
material resource cost
+ component resource cost
+ labor cost
+ machine cost
+ other cost
```

Task profit:

```text
revenue - actual cost
```

## Limitations

- Cost buckets are metadata-backed until normalized Project cost tables exist.
- Formal cost approval, budget baselines, and contract billing stages remain future work.

