# Enterprise Workspace Composition Principles

EPIC COMPOSITION001 treats Inventory as the Golden Reference for page
composition, not as JSX to copy. The extracted principle is that an operator
screen needs one dominant working area and only then supporting context.

## Rules

- One page must communicate its module identity immediately.
- The primary workspace should occupy roughly 60-70% of the desktop width.
- The support rail should occupy roughly 30-40% and stay secondary.
- Dashboard cards should show Top N rows, not become the full workspace.
- Full lists, catalogs, queues and feeds should retain visual dominance even
  when the dataset is small.
- Equal 50/50, 33/33/33 and 25/25/25/25 compositions are avoided for operator
  pages because they remove hierarchy.
- Charts support decisions; they do not replace the table, feed, queue,
  catalog or board that an operator acts on.
- Empty states must be useful and controlled. They may explain the capability
  and next step, but must not introduce fake data.

## Boundaries

This pass does not change shared cards, design tokens, theme, typography,
spacing system or component APIs. It only rearranges page composition.

