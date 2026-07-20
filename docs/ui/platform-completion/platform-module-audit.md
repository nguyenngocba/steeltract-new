# Platform Module Audit

Date: 2026-07-18

## User Management

- Users: active route exists and has dashboard/table/detail workflow.
- Roles/Permissions: active route exists and has permission matrix.
- Groups, Departments, Positions, Sessions, Login History, Password Policy,
  MFA: no dedicated backend read contracts yet; represented as platform
  capability rows with useful empty-state guidance.

## Organization

- Company: basic system overview data exists.
- Warehouses: Inventory owns warehouse/location data.
- Plants, Factories, Teams, Shifts, Calendars: no dedicated backend read
  contracts yet; represented as capability rows.

## Administration

- System Settings: active route exists.
- Number Sequences, Document Types, Approval Matrix, Lookup Tables, Master Data:
  represented through Settings general/master/platform capability sections.

## Security

- Audit/Activity Logs: active System Logs route exists.
- User Sessions, Security Events, API Tokens, Devices, IP Whitelist: capability
  rows only until backend read contracts exist.

## Monitoring

- Health, Jobs, Queues, Background Tasks: Operations Center exists.
- Scheduler, Webhooks, Email Queue: capability rows only until read contracts
  exist.

## Backup

- Backup settings exist in Settings. Backup history/storage/restore/retention
  require backend contracts before live tables are shown.

## Reports Center

- A foundation section now exists under Settings. It does not invent report
  counts; it documents module ownership and next steps.

## Notification Center

- Active route now has real KPI cards, search, filters, list and detail panel
  from existing notifications data.

