# Components Inventory Pixel Comparison

## Measurement Method

Runtime browser computed measurements could not be captured in this shell because no Chromium, Google Chrome, Playwright, or Puppeteer binary is installed. The measurements below are taken from the actual Tailwind classes and shared UI tokens used by the rendered pages.

References:

- `InventoryInboundPage.tsx`
- `InventoryMaterialsPage.tsx`

Targets:

- `ComponentsOverviewPage.tsx`
- `ComponentsListPage.tsx`

## Metric Matrix

| Metric | Inventory | Components before | Components after |
|---|---:|---:|---:|
| KPI card height | `92px` via `!h-[92px]` | `128px` via `KPI_EXEC` on state cards | `92px` via `!h-[92px]` |
| KPI padding | `12px` via `!p-3` | `16px/20px` via `px-5 py-4` | `12px` via `!p-3` |
| KPI grid gap | `4px` via `gap-1` | `4px` via `gap-1` | `4px` via `gap-1` |
| Materials filter panel padding | `12px` InventoryPanel body | `12px + 10px` nested panel/filter | `12px` InventoryPanel body |
| Filter control height | `36px` via `h-9` | `32px` via module input `h-8` | `36px` via `h-9` |
| Filter inner gap | `4px` via `gap-1` | `8px` via ModuleFilterBar `gap-2` | `4px` via `gap-1` |
| Overview table viewport | `430px` | `clamp(400px,58vh,520px)` | `430px` |
| List table viewport | `clamp(400px,60vh,520px)` min `400px` | `640px` via `TABLE_MD`, then `clamp` pass | `clamp(400px,60vh,520px)` min `400px` |
| Table panel width | `xl:col-span-9` | `xl:col-span-9` | `xl:col-span-9` |
| Right rail width | `xl:col-span-3` | `xl:col-span-3` | `xl:col-span-3` |
| Grid gap around hero | `4px` via `gap-1` | `4px` via `gap-1` | `4px` via `gap-1` |
| Table head token | `inventoryTableHead` + slate/cyan border | `componentsTableHead` | `inventoryTableHead` + slate/cyan border |
| Table row token | `inventoryTableRow` | `componentsTableRow` | `inventoryTableRow` |
| Pagination component | `InventoryPagination` | `DataTablePagination` direct | `InventoryPagination` |
| Pagination footer classes | `grid grid-cols-1 ... px-4 py-1 ... md:grid-cols-3 border-t-0` | shared default | same as Inventory |
| Overview right card 1 | `220px` | `220px` | `220px` |
| Overview right card 2 | `178px` | `178px` | `178px` |
| Overview right card 3 | `200px` | `200px` | `200px` |
| List right card 1 | `220px` | `220px` | `220px` |
| List right card 2 | `188px` | `178px` | `188px` |
| List right card 3 | `200px` | `200px` | `200px` |
| Bottom analytics grid | independent full-width section | independent but mixed heights | independent full-width section |
| Empty row stabilizer | `h-9` rows | absent on List | `h-9` rows |

## Changes Applied

- Components KPI cards now use the same `!h-[92px] !p-3` metric as Inventory KPI cards.
- Components filters now use InventoryPanel + direct grid controls instead of nested ModuleFilterBar panels.
- Components filter inputs/selects now use `h-9`, `px-3`, and `text-sm` like Inventory filter controls.
- Components Overview table now uses InventoryPanel and a fixed `h-[430px]` table viewport like Inventory Overview.
- Components List table now uses the Inventory Materials viewport: `h-[clamp(400px,60vh,520px)] min-h-[400px]`.
- Components List now uses `InventoryPagination` with the same footer class as Inventory Materials.
- Components tables now use `inventoryTableHead` and `inventoryTableRow`.
- Components List right rail now uses Inventory Materials heights: `220px`, `188px`, `200px`.

## Remaining Visual QA

Run authenticated browser screenshots once a browser binary is available:

- `/inventory/inbound`
- `/inventory/materials`
- `/components`
- `/components/list`

Compare at 1366px, 1600px, 1920px and ultrawide. The class-level metrics now match the Inventory reference; runtime screenshots should verify text wrapping and real-data density.
