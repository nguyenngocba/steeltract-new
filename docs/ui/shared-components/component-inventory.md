# EPIC UI006 Component Inventory

Status: IMPLEMENTED

## Reviewed Modules

- Inventory
- Production

## Consolidated Components

| Area | Shared Component | Previous Local Pattern | Status |
| --- | --- | --- | --- |
| Visual tokens | `shared/ui/enterprise-components` | Inventory `InventoryVisuals` constants and Production local aliases | Consolidated |
| Panel shell | `EnterprisePanel` | `InventoryPanel`, Production chart panels | Consolidated |
| Chart card | `EnterpriseChartCard`, `EnterpriseProductionPanel` | `InventoryChartCard`, `ProductionPanel` implementation | Consolidated |
| KPI card | `EnterpriseKpi`, `CockpitKpiCard` | Inventory KPI wrapper, Production KPI wrapper | Consolidated |
| Table styling | `enterpriseTableHead`, `enterpriseTableRow`, `enterpriseTableShell` | Inventory-only table constants reused by Production | Consolidated |
| Pagination | `EnterprisePagination` | Inventory pagination wrapper | Consolidated |
| Bars/Donut | `EnterpriseHorizontalBars`, `EnterpriseMiniBars`, `EnterpriseCompactDonut`, `EnterpriseDonutSummary` | Inventory and Production chart helpers | Consolidated |
| Status/Meter | `EnterpriseStatusBadge`, `EnterpriseMeter` | Production local `StatusChip`, `Meter` | Consolidated |
| Form shell | `EnterpriseForm`, `EnterpriseModalForm`, `EnterpriseDrawerForm` | Module-local form shell code | Consolidated |
| Form fields | `EnterpriseField`, `EnterpriseInput`, `EnterpriseNumberField`, `EnterpriseSelect`, `EnterpriseDatePicker` | Production local/modal inputs | Already adopted |
| Extended fields | `EnterpriseTextArea`, `EnterpriseMultiSelect`, `EnterpriseCheckbox`, `EnterpriseRadioGroup`, `EnterpriseSwitch` | Future module-specific form fragments | Added |
| Validation affordances | `ValidationSummary`, `FieldHint`, `RequiredLabel` | Inline one-off validation blocks | Added |

## Compatibility Wrappers

Inventory keeps `InventoryVisuals.tsx` as a compatibility wrapper so existing
Inventory pages keep the same imports and rendering. The actual implementation
now lives in `shared/ui/enterprise-components`.

Production keeps `ProductionCockpitShared.tsx` as a domain facade for readable
page code. Its visual implementation delegates to shared enterprise components.

## Out Of Scope

- No backend/API/React Query change.
- No route or permission change.
- No Inventory or Production workflow change.
- Full form-by-form Inventory migration remains a later visual-only cleanup.
