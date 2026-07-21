# Components vs Inventory Structural Comparison

Date: 2026-07-21

Scope:
- Reference: `InventoryInboundPage`, `InventoryMaterialsPage`
- Target: `ComponentsOverviewPage`, `ComponentsListPage`

This review compares the rendered JSX hierarchy and layout ownership rather than only Tailwind class strings.

## Reference Trees

### InventoryInboundPage

```text
EnterpriseModulePage
└── Content Stack: space-y-2 text-xs -mt-2
    ├── KPI Grid
    ├── Toolbar / Filter Row
    │   ├── ModuleFilterBar
    │   └── Action Buttons
    ├── Conditional State
    └── Loaded Content
        ├── Hero Grid: grid-cols-1 -> xl:grid-cols-12
        │   ├── InventoryPanel: xl:col-span-9
        │   │   ├── Panel Header
        │   │   ├── Bordered Table Viewport: fixed height, overflow owner
        │   │   └── InventoryPagination
        │   └── Right Rail: xl:col-span-3
        │       ├── InventoryChartCard
        │       └── InventoryChartCard
        └── Bottom Analytics Grid: independent mt-2 grid, xl:grid-cols-4
            ├── InventoryChartCard
            ├── InventoryChartCard
            ├── InventoryChartCard
            └── InventoryChartCard
```

### InventoryMaterialsPage

```text
EnterpriseModulePage
├── Dialog / Drawer siblings
└── Content Stack: space-y-1 -mt-2
    ├── KPI Grid
    ├── InventoryPanel Filter Panel
    ├── Hero Grid: grid-cols-1 -> xl:grid-cols-12, items-start
    │   ├── InventoryPanel: xl:col-span-9
    │   │   ├── Panel Header
    │   │   ├── Bordered Table Wrapper
    │   │   │   └── CockpitTableShell: clamp height, min-height, overflow owner
    │   │   ├── Empty State
    │   │   └── InventoryPagination
    │   └── Right Rail: xl:col-span-3
    │       ├── ChartCard
    │       ├── ChartCard
    │       └── ChartCard
    └── CockpitChartCard: quick statistics strip
```

## Target Trees Before Remediation

### ComponentsOverviewPage

```text
ComponentsWorkspace
└── EnterpriseWorkspace
    └── EnterpriseModulePage
        └── Workspace Stack: w-full min-w-0 flex-1 space-y-2
            └── Page Stack: w-full min-w-0 flex-1 space-y-1
                ├── KPI Grid
                ├── InventoryPanel Filter Panel
                ├── Hero Grid: grid-cols-12, items-start
                │   ├── InventoryPanel: col-span-12 xl:col-span-9
                │   └── aside: col-span-12 xl:col-span-3
                ├── Bottom Queue Grid: md:grid-cols-2
                └── Separate Quick Stats Card
```

### ComponentsListPage

```text
ComponentsWorkspace
└── EnterpriseWorkspace
    └── EnterpriseModulePage
        └── Workspace Stack: w-full min-w-0 flex-1 space-y-2
            └── Page Stack: w-full min-w-0 flex-1 space-y-1
                ├── KPI Grid
                ├── InventoryPanel Filter Panel
                ├── Hero Grid: grid-cols-12, items-start
                │   ├── InventoryPanel: col-span-12 xl:col-span-9
                │   └── aside: col-span-12 xl:col-span-3
                └── Recent Components Grid
```

## Structural Differences Found

| Area | Inventory Structure | Components Before | Impact | Remediation |
| --- | --- | --- | --- | --- |
| Root wrapper | Direct `EnterpriseModulePage` | `ComponentsWorkspace` -> `EnterpriseWorkspace` -> `EnterpriseModulePage` plus another page stack | Extra width/flex/spacing owner changed vertical rhythm and inheritance | Components Overview/List now use `EnterpriseModulePage` directly |
| Content stack | One stack under module page | Two nested stacks with `flex-1` and `min-w-0` twice | Unnecessary nesting affected width inheritance and margin behavior | Removed the outer workspace stack for the two target pages |
| Overview hero grid | `grid-cols-1 xl:grid-cols-12` | `grid-cols-12` from mobile up | Mobile/medium structure differs from Inventory and relies on explicit col-span | Changed to `grid grid-cols-1 xl:grid-cols-12` |
| Overview hero top offset | Hero uses `-mt-1` after toolbar/content gate | No top offset | Hero rhythm did not match Inbound | Added `-mt-1` |
| Overview right rail | `div.space-y-1.5 xl:col-span-3` | `aside.col-span-12 space-y-1 xl:col-span-3` | Different mobile span and rail spacing | Changed to `div.space-y-1.5 xl:col-span-3` |
| Overview bottom analytics | Independent `mt-2` grid with 4 equal columns on xl | 2-column queue grid plus separate quick stats | Bottom felt structurally unlike Inbound | Converted to independent `mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2` |
| List hero grid | `grid-cols-1 xl:grid-cols-12 items-start` | `grid-cols-12 items-start` | Different small viewport layout ownership | Changed to `grid-cols-1 xl:grid-cols-12 items-start` |
| List hero panel | `InventoryPanel xl:col-span-9` | `InventoryPanel col-span-12 xl:col-span-9` | Redundant span used to compensate for always-12 grid | Changed to `xl:col-span-9` |
| List right rail | `div.space-y-1 xl:col-span-3` | `aside.col-span-12 space-y-1 xl:col-span-3` | Different DOM node and span compensation | Changed to `div.space-y-1 xl:col-span-3` |
| List bottom section | Single `CockpitChartCard` quick stats strip | One-column recent components chart | Page closure differed from Materials | Replaced with quick statistics strip matching Materials hierarchy |

## Target Trees After Remediation

### ComponentsOverviewPage

```text
EnterpriseModulePage
└── Content Stack: space-y-2 text-xs -mt-2
    ├── KPI Grid
    ├── InventoryPanel Filter Panel
    ├── Hero Grid: grid-cols-1 -> xl:grid-cols-12
    │   ├── InventoryPanel: xl:col-span-9
    │   │   ├── Panel Header
    │   │   ├── Fixed Table Viewport: height + overflow owner
    │   │   └── Empty State
    │   └── Right Rail: xl:col-span-3
    │       ├── CockpitChartCard
    │       ├── CockpitChartCard
    │       └── CockpitChartCard
    └── Bottom Analytics Grid: independent mt-2 grid, xl:grid-cols-4
        ├── CockpitChartCard
        ├── CockpitChartCard
        ├── CockpitChartCard
        └── CockpitChartCard
```

### ComponentsListPage

```text
EnterpriseModulePage
└── Content Stack: space-y-1 -mt-2
    ├── KPI Grid
    ├── InventoryPanel Filter Panel
    ├── Hero Grid: grid-cols-1 -> xl:grid-cols-12, items-start
    │   ├── InventoryPanel: xl:col-span-9
    │   │   ├── Panel Header
    │   │   ├── Bordered Table Wrapper
    │   │   │   └── CockpitTableShell: clamp height, min-height, overflow owner
    │   │   ├── Empty State
    │   │   └── InventoryPagination
    │   └── Right Rail: xl:col-span-3
    │       ├── CockpitChartCard
    │       ├── ChartCard
    │       └── ChartCard
    └── CockpitChartCard: quick statistics strip
```

## Result

Components Overview now follows the Inbound dashboard structure: one module shell, one content stack, KPI/filter/hero grid, and an independent full-width bottom analytics section.

Components List now follows the Materials workspace structure: one module shell, one content stack, KPI/filter/hero grid, table as the hero, right rail, and a compact quick statistics strip.

No backend, API, routing, query, or business behavior was changed.
