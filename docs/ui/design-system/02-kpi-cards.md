# 02. Enterprise KPI Cards

## Canonical Component

Use `CockpitKpiCard`. Do not create module-specific KPI card components.

## Variants

### Operational

- Height: 108px (`COCKPIT_HEIGHTS.KPI`).
- Padding: 16px.
- Label: 10px, bold, uppercase, 0.12em tracking, slate-400.
- Value: 24px, semibold, one line, tabular numbers for numeric content.
- Note/delta: 10px, semibold; semantic tone.
- Optional icon: 32px square, rounded 8px, top-right.
- Sparkline: 36px high, inset 12px, bottom aligned.

Use for Inventory Materials, Inbound, Outbound and other operator workspaces.

### Executive

- Height: 128px (`KPI_EXEC`).
- Padding: 16px vertical/20px horizontal.
- Label: 12px medium.
- Value: 38px; 42px at `xl`, bold, tabular numbers.
- Delta: 11px semibold.
- Sparkline is intentionally background-only at less than 5% opacity.

Use only for genuine dashboard/executive summary bands.

## Shell

The canonical shell is `COCKPIT_SHELL`: rounded 16px, cyan-tinted low-contrast
border, dark blue glass surface, restrained shadow and backdrop blur. Color is
an accent, never a full-card fill. Critical status uses a restrained border or
badge rather than painting the entire card red.

## Tone Semantics

- blue/cyan: neutral operational or throughput;
- emerald: healthy, completed or positive value;
- amber/orange: warning, pending or approaching threshold;
- red: critical, failed or out of stock;
- purple/indigo/violet: category distinction, not severity.

Do not encode meaning by color alone. Labels/notes must state the condition.

## Interaction

Clickable KPI cards render as buttons, receive an active state and filter the
adjacent dataset. Non-clickable KPI cards render as sections. A hover treatment
must not imply clickability when no action exists.

## States

- Loading: fixed-height pulse skeleton matching the final label/value/delta.
- Empty: em dash, muted styling and unchanged dimensions.
- Normal: value plus optional delta.
- Alert: semantic border/badge; layout remains stable.
- Error belongs to the KPI band state, not a fabricated numeric value.

## Responsive

One column at base. Use five columns at `md` for Inventory-style operational
bands when space permits; otherwise three at `md` and six at `2xl`. Values must
truncate or format compactly, never overflow.

## Known Inventory Variance

`ModuleKpiCard` (118px), old `InventoryKpiGrid`, and custom Overview 108px cards
coexist. Future work must use the two `CockpitKpiCard` variants above. Existing
Inventory is not changed by UI002.

