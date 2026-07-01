# Project Procurement Readiness Report

Date: 2026-06-30

## Implemented

Task material allocation rows now support:

- Required / Planned
- Issued
- Used
- Returned
- Remaining
- Cost

Project Command Center aggregates missing material allocations and surfaces warnings such as:

```text
Thiếu X vật tư/cấp phát
```

Suggested actions remain advisory.

## Limitations

- No automatic purchase request is created.
- Material allocation rows are WBS metadata, not formal ProjectTaskMaterialAllocation records.
- Cross-project transfer recommendation is not implemented yet.

