# Project Bulk Operations Report

Date: 2026-07-01

## API

- Added `PATCH /projects/:id/wbs/bulk`.

## Supported Operations

- Change parent.
- Assign owner/engineer text.
- Change status.
- Change planned dates.
- Add resource rows.
- Add checklist notes.

## UI

- WBS tree now supports multi-select checkboxes.
- Bulk dialog applies operations to selected tasks.

## Remaining Work

- Add approval and audit review for destructive bulk deletes.
