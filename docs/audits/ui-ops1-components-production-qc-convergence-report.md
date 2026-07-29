# STEELTRACK UI.OPS.1 – Components / Production / QC Operational UI Convergence

Status: IMPLEMENTED

Date: 2026-07-28

## Scope

This sprint converged selected Components, Production and QC operational UI
surfaces toward the Inventory cockpit/form canon without backend, schema or API
changes.

Touched frontend surfaces:

- Components tab navigation
- Components create workflow modal and global create action
- Components material stock workspace
- Production Order create modal
- QC overview, inbound, production, final, NCR, CAPA, logs and reports surfaces

## Components UI

### Tab Terminology

Renamed the Components material-stock tab:

- Previous: `Vật tư sử dụng`
- Current: `Kho vật tư sản xuất`

The label now reflects production-custody material stock, not physical
Component inventory.

### Component Definition Create

The create flow remains canonical:

- creates one Component engineering definition
- creates one ProjectComponentRequirement
- does not create ComponentInstance
- does not create Finished Goods
- does not create inventory stock
- does not create ProductionOrder

The page modal and global action modal now:

- use `Tạo hồ sơ cấu kiện`
- require project and required quantity semantics
- use typed `componentType` and `profile`
- source type/profile suggestions from existing backend component data
- avoid hardcoded Beam/Column/Plate options

## Production Material Stock

The Components material stock page now uses Inventory material read-model
`locationBalances` filtered to the `PRODUCTION` warehouse as the display source
for current production warehouse stock.

Removed as current-balance sources:

- `[COMPONENT_PRODUCTION]` transaction remarks aggregation
- production issue subtraction
- frontend-derived stock buckets from transaction history

Transaction data remains visible only for recent activity/history context.

Current table semantics:

- material code/name/type/UOM
- production warehouse/location/slot/level
- production on-hand
- held/reserved placeholder stays `0` because no authoritative reservation
  source is exposed in this frontend read path
- available quantity
- average cost/value
- stock status

## Production UI

Production Order creation remains requirement-first and canonical. The modal
copy now uses operator-facing terminology:

- `Công trình / Nhu cầu`
- `Engineering basis & số lượng`
- `Trạng thái kỹ thuật`

No Production command, service, route or DTO behavior was changed.

## QC UI

Removed obvious hardcoded/demo operational data from touched QC surfaces.

Changed:

- QC overview stage chart no longer falls back to arbitrary `4/12/8` counts
- inbound QC no longer shows fake supplier, material quantity or inspector data
- production QC no longer shows fake line/process/shift/rework trend data
- NCR uses `runtime.ncrs` instead of local hardcoded NCR rows
- CAPA, audit logs and QC reports show controlled empty states where no
  authoritative backend read-model exists
- final QC remains physical-instance based through
  `ComponentInstance.state = PRODUCED_WAITING_QC`

## API Mapping

No new backend API was added.

Relevant existing frontend sources:

- Components definitions: `/components/read-model/list`
- Component create: `/components/foundation/definition-requirements`
- Finished goods: `/components/instances/finished-goods`
- Production requirements: `/components/foundation/requirements`
- Production Order create: `/production/commands/orders`
- QC workspace: `/qc/read-model/workspace`
- QC dashboard: `/qc/dashboard`
- QC physical instances: `/components/foundation/instances`

## Keep-As-Is

- Inventory was not modified.
- Historical Dashboard was not modified.
- Snapshot Engine was not modified.
- Backend was not modified.
- Prisma schema was not modified.

## Known Limitations

- Production stock reserved quantity remains `0` on the Components material
  stock page because the page did not receive an authoritative production
  reservation balance source in this UI-only sprint.
- Browser screenshot smoke was not executed in this environment.
- Vite still reports existing large chunk warnings unrelated to this sprint.

## Verification

- `pnpm -C apps/frontend test`: PASS
- `pnpm -C apps/frontend build`: PASS
- backend build: not run, no backend source changed
- `git diff --check`: pending at report creation, run after documentation update

