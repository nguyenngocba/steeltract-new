# Project Dependency Report

Date: 2026-06-30

## Implemented

Task metadata now supports:

- Predecessors
- Successors
- Dependency types:
  - Finish-To-Start
  - Start-To-Start
  - Finish-To-Finish

The Task Detail drawer displays:

- Predecessor tasks
- Successor tasks
- Delay-aware dependency warning context

The Project Command Center displays chain warning rows when delayed tasks affect successors.

## Limitations

- Dependencies are stored in WBS metadata, not a normalized table.
- There is no automatic schedule recalculation yet.
- There is no workflow lock preventing a successor from starting before predecessor completion.

