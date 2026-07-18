# 03. Enterprise Charts

## Container

Use `CockpitChartCard`. `InventoryChartCard` is a compatibility wrapper with the
same visual intent. A chart card contains a compact header, optional metric or
pagination action, and one bounded chart body.

Canonical heights from `COCKPIT_HEIGHTS`:

| Use | Card height |
| --- | ---: |
| Micro/supporting | 158-172px |
| Alert | 200px |
| Standard | 220px |
| Ranking | 230px |
| Large comparison | 260px |
| Executive | 350px |

Do not let loading, legends or long labels change card height.

## Header

- Standard title: 12px bold uppercase, 0.12em tracking, white.
- Metric title: 10px slate-400; metric value 24px semibold.
- Optional note: 11px slate-500.
- Actions/page controls stay top-right and do not overlap the title.

## Plot

- Use a responsive container with explicit parent height.
- Reserve margins for axes; avoid labels touching card edges.
- Grid lines use low-contrast cyan/white or slate, never dominant lines.
- Axis/tick text: 10-11px slate-500; reduce tick count before rotating labels.
- Numeric values use the shared locale/quantity/currency formatters.
- Tooltip uses the dark elevated surface, readable label/value contrast and the
  same formatting as the visible KPI.
- Legend belongs below or beside the plot and must not shrink it unpredictably.

## Color

Use blue/cyan for primary series, emerald for positive/healthy, amber for
warning, red for critical and purple only for categorical separation. Limit a
chart to the minimum series required for comparison. Do not use one hue for all
semantic states.

## Interaction

Tooltips and explicit drill-down actions are allowed. Pagination is preferred
over unreadable label density. Hover must not be the only way to obtain an
essential value. Keyboard users need access to any chart action; charts still
require a textual/table equivalent for critical information.

## States

- Loading: fixed-height plot skeleton.
- Empty: `CockpitEmptyState` with “Chưa có dữ liệu lịch sử”; no fake trend.
- Error: explicit retry/action, never a zero line presented as real data.
- Partial: identify incomplete period/source in note text.

## Responsive

Stack chart cards on small screens. Preserve height, reduce ticks/legend density
and allow horizontal category pagination when necessary. Never scale chart font
with viewport width.

## Known Inventory Variance

Inventory mixes custom SVG, CSS conic charts and Recharts; several legacy chart
files are empty or contain static data. Only charts on active routes with real
read-model data are canonical. Shared chart stubs and static telemetry samples
must not be copied.

