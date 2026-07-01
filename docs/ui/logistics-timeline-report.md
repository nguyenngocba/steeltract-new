# Logistics Timeline Report

## Event Types

- `CREATED`
- `LOADING`
- `DEPARTED`
- `ARRIVED`
- `RECEIVED`
- `COMPLETED`
- `CANCELLED`

## UI

The Dispatch Detail Drawer shows timeline events from `dispatch_events`, ordered by creation time.

## Activity Log

System-level activity logs are written for:

- `PROJECT_DISPATCH_CREATED`
- `PROJECT_DISPATCH_RECEIVED`

Future workflow extensions can add activity logs for loading/departure/arrival if audit policy requires them.
