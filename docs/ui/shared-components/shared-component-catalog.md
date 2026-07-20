# Enterprise Shared Component Catalog

Status: ACTIVE

## Visual Components

- `EnterprisePanel`
- `EnterpriseInsightPanel`
- `EnterpriseChartCard`
- `EnterpriseProductionPanel`
- `EnterpriseKpi`
- `EnterprisePagination`
- `EnterpriseHorizontalBars`
- `EnterpriseMiniBars`
- `EnterpriseDonutSummary`
- `EnterpriseCompactDonut`
- `EnterpriseCompactTrendChart`
- `EnterpriseStatusBadge`
- `EnterpriseMeter`
- `EnterpriseLoadingState`

## Visual Tokens

- `enterprisePanel`
- `enterpriseInput`
- `enterprisePageStack`
- `enterpriseKpiClass`
- `enterpriseGridGap`
- `enterpriseTableShell`
- `enterpriseTable`
- `enterpriseTableHead`
- `enterpriseTableRow`
- `enterpriseModuleTableHead`
- `enterpriseModuleTableRow`
- `enterpriseMutedButton`
- `enterpriseModulePrimaryButton`

## Form Components

- `EnterpriseForm`
- `EnterpriseFormSection`
- `EnterpriseFormGrid`
- `EnterpriseField`
- `RequiredLabel`
- `FieldHint`
- `ValidationSummary`
- `EnterpriseInput`
- `EnterpriseTextArea`
- `EnterpriseNumberField`
- `EnterpriseSelect`
- `EnterpriseMultiSelect`
- `EnterpriseDatePicker`
- `EnterpriseCheckbox`
- `EnterpriseRadioGroup`
- `EnterpriseSwitch`
- `EnterpriseFormActions`
- `EnterpriseModalForm`
- `EnterpriseDrawerForm`

## Usage Rule

New operational modules must import shared Enterprise components directly.
Module facades are allowed only when they preserve domain readability and do
not reimplement layout, styling, focus management or form behavior.
