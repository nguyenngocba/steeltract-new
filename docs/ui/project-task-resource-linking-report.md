# Project Task Resource Linking Report

Date: 2026-06-30

## Objective

Expose task-level material and component resource context inside Project execution.

## Implemented

Task Detail now displays:

### Materials

Columns:

- Material
- Planned
- Issued
- Used
- Returned
- Remaining

### Components

Columns:

- Component
- Assigned
- Installed
- Returned
- Status

The WBS tree summarizes linked material and component counts.

## Current Data Model

Resource links are stored in the WBS metadata bridge on existing `Task.description`.

## Return Flow

Material return is connected to the existing Inventory Return Request workflow:

Project -> Return Request -> Inventory Return Workflow

Component return remains documented as a workflow gap:

Project -> Return Request -> Yard

## Limitations

- Link/unlink dedicated pickers are not implemented yet.
- Component return does not yet have a formal backend workflow.
- Material issue/return actions from a task still route through existing project material return entry points, not a task-specific ledger.

