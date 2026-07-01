# Project Template Routing Report

Date: 2026-07-01

## Root Cause

- Projects tab config already included `Templates`, but AppRouter and sidebar configs did not expose `/projects/templates`.
- Clicking the route could fall back to the Projects dashboard.

## Fix

- Added `/projects/templates` route to `AppRouter`.
- Added Templates child entry to both active navigation configs:
  - `apps/frontend/src/app/shell/sidebar/navigation.config.ts`
  - `apps/frontend/src/app/config/navigation.config.ts`

## Expected Behavior

- `/projects/templates` opens the Template workspace.
- Refresh and direct URL access preserve the Templates tab.
