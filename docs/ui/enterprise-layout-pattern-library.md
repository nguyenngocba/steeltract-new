# Enterprise Layout Pattern Library

## Root Composition

```tsx
<EnterpriseWorkspace
  eyebrow="Module"
  title="Workspace"
  description="Bounded operational description"
  breadcrumbs={['Area', 'Workspace']}
  tabs={tabs}
  activeTab={activeTab}
  actions={actions}
>
  <KpiStrip />
  <Analytics />
  <ModuleFilterBar />
  <CockpitTableShell />
  <DataTablePagination />
</EnterpriseWorkspace>
```

## Stable Rules

- Root width is capped at 1800px and uses `p-3` workspace padding.
- Root sections use `space-y-3`; dense cockpit interiors may retain `gap-1`.
- Tabs scroll horizontally and never wrap labels into multiple lines.
- Action groups wrap rather than overflow on small screens.
- Tables own horizontal scrolling; drawers own vertical body scrolling.
- Loading must not resize fixed KPI/table/chart surfaces.
- Missing chart data renders an empty state; it is never synthesized.
