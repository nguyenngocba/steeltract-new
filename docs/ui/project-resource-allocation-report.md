# Project Resource Allocation Report

Date: 2026-06-30

## Implemented

Task metadata now supports material and component allocation rows.

### Materials

Columns:

- Planned
- Issued
- Used
- Returned
- Remaining
- Cost

### Components

Columns:

- Assigned
- Installed
- Returned
- Status

Task Detail includes action entry points:

- Liên kết
- Xuất
- Trả

## Current UX

Because schema changes were out of scope, the edit modal accepts compact resource rows in the WBS metadata bridge.

## Limitations

- Link/unlink pickers are not implemented yet.
- Task-specific Inventory Issue and Component Return workflows need formal APIs.

