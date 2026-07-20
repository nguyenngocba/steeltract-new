# VISUAL001 Workspace Comparison

Date: 2026-07-18

## Production

- Previous weakness: many panels competed for equal attention.
- Applied change: shared table/card heights make Manufacturing Orders,
  Production BOM, warehouse material control and material ledgers more dominant.
- Inventory comparison: Production now follows the Inventory table-first
  operating rhythm without copying Inventory data or JSX.

## Components

- Previous weakness: lifecycle, QC and reports screens had useful data but
  smaller primary surfaces.
- Applied change: shared table/chart scaling gives component tables, QC queue
  and lifecycle reports stronger focal weight.
- Inventory comparison: Components now behaves more like a lifecycle workspace
  with table-first navigation and supporting context.

## QC

- Previous weakness: inspection queues could feel like one card among many.
- Applied change: shared cockpit cards and table shell make queues visually
  primary while preserving right-side context.
- Inventory comparison: QC reads closer to a Quality Command Center.

## Projects, Suppliers, Settings, Notifications

- Previous weakness: secondary platform pages could look less deliberate than
  Inventory.
- Applied change: shared workspace rhythm and card/table primitives create
  consistent density and visual hierarchy where these pages use the enterprise
  shell.
- Inventory comparison: pages now preserve large operational surfaces even when
  data is empty.

## Advanced Enterprise Modules

- Previous weakness: Command Center, Analytics, Copilot, Workflow, Marketplace,
  Digital Twin, Kernel, Federation and Telemetry-like surfaces relied on
  smaller card grids.
- Applied change: shared visual primitives improve density and reduce equal
  card soup where the primitives are used. Copy cleanup was handled by
  PLATFORM002.
- Inventory comparison: these modules still need browser evidence, but their
  shared composition layer now follows the same focal-point rule.

