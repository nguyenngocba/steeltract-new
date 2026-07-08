# EPIC108 - Snapshot Parity Validation

Date: 2026-07-08

## Scope

Validation-only. No UI, workflow, API contract, or business logic changes.

## Implementation

Backend service:

```text
apps/backend-api/src/core/validation/snapshot-parity-validation.service.ts
```

The service compares persisted snapshots with runtime/source recalculation through existing snapshot validators:

- Inventory: `InventoryDashboardSnapshot`
- Projects: `ProjectDashboardSnapshot`
- Logistics: `DispatchDashboardSnapshot`

The validator does not repair data.

## Current Smoke Result

Command used a Nest application context with `EnterpriseValidationModule`.

Result:

```json
{
  "parity": {
    "warningCount": 0,
    "checkedRows": 3
  }
}
```

Interpretation:

- Inventory and Projects snapshots match the current runtime/source recalculation for checked rows.
- Logistics has no dispatch rows in the current validation dataset, so no mismatch is reported.

## Warning Policy

Warnings indicate:

- missing persisted snapshot rows
- mismatched numeric values

Warnings are report-only. They do not block user requests and do not mutate snapshot data.

