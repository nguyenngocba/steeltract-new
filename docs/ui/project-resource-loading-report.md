# Project Resource Loading Report

Date: 2026-06-30

## Implemented

Task metadata now supports resource loading:

### Workers

Format:

```text
role|required|allocated
```

### Machines

Format:

```text
type|required|allocated
```

Task detail displays Required, Allocated, and Remaining for each resource row.

Project Command Center aggregates shortages into warning rows.

## Limitations

- Workers and machines are metadata rows, not linked to employee/equipment master records.
- No assignment calendar or capacity leveling exists yet.

