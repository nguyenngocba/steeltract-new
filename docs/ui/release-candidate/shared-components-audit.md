# Shared Components Audit

Date: 2026-07-18

Status: IMPLEMENTED - VISUAL QA PENDING

## Shared Pattern Sources

- `shared/ui/modules`
- `shared/ui/cockpit`
- `shared/ui/enterprise`
- `shared/ui/enterprise-components`
- `shared/forms`

## Applied In This Pass

QC local aliases were connected to the shared module token set:

- `modulePanel`
- `moduleInput`
- `modulePrimaryButton`
- `moduleMutedButton`
- `moduleTableHead`
- `moduleTableRow`

This removes another module-specific design island without changing JSX
behavior or data flow.

## Existing Compatibility Layers

- `InventoryVisuals` remains a compatibility wrapper for the Inventory Golden
  implementation.
- `ProductionCockpitShared` and `ComponentsCockpitShared` remain thin
  module-specific adapters over shared cockpit/module primitives.

## Remaining Shared Component Debt

- QC dialogs still use local modal shells and should eventually move to
  `EnterpriseModalForm` or a shared non-form modal primitive.
- Some Inventory transaction/detail fragments still contain local compact input
  strings.
- Status badge semantics are consistent enough visually, but a cross-module
  `EnterpriseStatusBadge` would reduce small color/radius drift.

