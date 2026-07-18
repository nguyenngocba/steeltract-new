# 08. Enterprise Timeline

## Use

Timeline presents immutable chronological facts: transaction history, status
transition, activity or audit. Do not combine mutable tasks and historical facts
without explicit grouping.

## Layout

- Vertical rule: low-contrast white/cyan border at the left.
- Content inset: 16px.
- Event gap: 12-16px.
- Dot: 8-10px, aligned with the first text line, semantic color.
- Primary actor/event: 12px semibold.
- Description: 11-12px slate-300/400.
- Timestamp: 10px monospaced slate-500, right aligned when space permits.
- Long lists use a bounded viewport and thin scrollbar or server pagination.

## Grouping

Group by date or lifecycle stage only when it improves scanning. Preserve the
true event ordering within a group. Activity, status and audit may be separate
tabs/panels but must share event identity and timestamp formatting.

## Semantic Colors

- cyan/blue: informational/system event;
- emerald: success/completion;
- amber: warning/pending/retry;
- red: failure/rejection;
- purple: controlled category distinction.

Always pair color with text/icon. Never derive status from row index.

## States

Loading preserves the rail and event geometry. Empty state says no activity is
recorded; it does not fabricate milestones. Errors expose retry. Large history
uses server-side pagination/cursor and stable reverse-chronological ordering.

## Accessibility

Use an ordered list with descriptive event text. Decorative rail/dots are hidden
from assistive technology. Every timestamp has an unambiguous date/time value.

## Known Inventory Variance

`ActivityTimeline` has a visual helper named `mockDataOffsetDotHack`, limited
keyboard semantics and fixed 190px viewport. Other Inventory histories use
tables or custom rows. The rail/typography above is canon; helper naming and
inconsistent history containers are not.

