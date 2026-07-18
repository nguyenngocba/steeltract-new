# 09. Enterprise Design Tokens

## Token Authority

Use `theme/theme.css`, `shared/ui/cockpit/cockpit-tokens.ts`,
`cockpit-shell.ts` and `shared/ui/modules`. Hard-coded values below describe the
current canon and should migrate to semantic tokens in a later approved sprint.

## Spacing

| Token | Value | Use |
| --- | ---: | --- |
| `xs` | 4px | compact grid/list gap |
| `sm` | 8px | icon/text and compact cell gap |
| `md-compact` | 12px | panel padding, form grid |
| `md` | 16px | standard card/header/body padding |
| `lg` | 24px | form sections and wide body spacing |
| `xl` | 32px | exceptional separation only |

Workspace padding is 12px. Avoid the legacy 24px page shell on operational tabs.

## Radius

- 6px: compact control.
- 8px: standard input/button/icon control.
- 12px: toolbar, badge group and secondary panel.
- 16px: canonical cockpit card, modal and major module panel.
- Full: status dot/pill only.

Do not introduce 24px/`rounded-3xl` cards into the enterprise workspace.

## Typography

- Font family: Inter, sans-serif.
- Metadata/tick: 10-11px, regular/medium.
- Compact body/table: 12px.
- Body/form: 14px.
- Panel title: 12px bold uppercase, 0.12em tracking.
- Page title: 24px semibold.
- Drawer title: 20px semibold.
- Operational KPI: 24px semibold.
- Executive KPI: 38px, 42px at `xl`, bold.
- Numeric values: tabular numbers; event timestamps may be monospaced.

Letter spacing is used only for short uppercase labels, never body copy.

## Color

- App/surface: `#080b12`, `#08111f`, slate-950 and translucent slate layers.
- Primary text: slate-100/white.
- Muted text: slate-400/500.
- Border: white 5-15% or cyan 10-20%.
- Accent/info: cyan `#06b6d4` and blue `#1d7cff`/blue-600.
- Success: emerald `#10b981`.
- Warning: amber `#f59e0b`.
- Danger: red `#ef4444`.

Purple is categorical only. Avoid dominant purple/blue gradients; the workspace
must retain neutral dark surfaces with multi-semantic accents.

## Elevation

- Small: `0 1px 2px rgb(0 0 0 / .2)`.
- Panel: `0 12px 30px rgb(0 0 0 / .24)`.
- Major overlay: `0 24px 70-80px rgb(0 0 0 / .3-.35)`.
- One subtle inset highlight is allowed on glass panels.

## Stable Dimensions

- Controls: 32px dense, 36px filter, 40px command, 44px form.
- Icons: 14px inline/action, 16-18px command/section, 32px KPI icon container.
- Badges: 10-12px text, 4-8px vertical and 8px horizontal footprint.
- KPI: 108px operational, 128px executive.
- Charts: 158/170/200/220/230/260/350px.
- Tables: 520/560px standard internal viewport.
- Workspace max width: 1800px.

## Motion

120ms fast, 180ms normal, 260ms slow. Use transitions for focus/hover/opening,
not continuous decoration. Respect reduced-motion settings in future component
implementation.

