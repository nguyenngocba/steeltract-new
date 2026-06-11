# Production Decisions

## PROD-001: Production Warehouse Is Separate From Main Warehouse

Decision:

- Production material stock is managed under `PRODUCTION` / `Kho sản xuất`, separate from `MAIN` / `Kho chính`.

Rationale:

- Materials issued to production must be isolated from general warehouse stock before they are consumed by Manufacturing Orders.

Implications:

- BOM material selection and availability checks use production warehouse stock.
- Main warehouse transfer does not operate on production warehouse locations.

## PROD-002: BOM Validation Uses Production Warehouse Stock

Decision:

- BOM creation validates required quantity plus waste against real available `Kho vật tư SX` stock.

Rationale:

- Production should not create BOM demand that cannot be supplied from staged production material.

Current implementation:

- Backend BOM service scans production-tagged Inventory transactions and only counts lines assigned to the production warehouse.

## PROD-003: Manufacturing Order Start Auto-Issues Missing BOM Materials

Decision:

- Starting an MO auto-creates `ISSUED` ProductionMaterialIssue rows for missing BOM material quantities.

Rationale:

- Material consumption must reduce production warehouse stock when production starts.

Current implementation:

- MO start plans issue quantities before the state transition and creates issue rows only after the start transition succeeds.
- Auto-issued materials also create outbound Inventory movements from the production warehouse location.

## PROD-004: Production Stock Calculation Filters Production Warehouse Lines

Decision:

- Production material balance only counts transaction lines that belong to the production warehouse.

Rationale:

- Historical `[COMPONENT_PRODUCTION]` transfer documents may include both main-warehouse outbound and production-warehouse inbound lines; counting both would distort availability.

Current implementation:

- Production services detect production lines by `warehouse.code === 'PRODUCTION'` or warehouse name containing `sản xuất`.

## PROD-005: QC Gate Required Before Yard Staging

Decision:

- Finished components cannot be staged to Yard unless linked QC inspection is `PASSED` or `APPROVED`.

Rationale:

- Yard staging should represent released finished goods, not unverified production output.

Current implementation:

- `POST /production/:id/stage-to-yard` enforces the linked QC status gate.

## PROD-006: Formal Reservation And Costing Are Future Work

Decision:

- Formal BOM reservation documents and finished-component costing ledgers are not part of the current foundation.

Rationale:

- Current priority is operational material movement and QC-gated flow.

Implications:

- Reservation remains derived.
- Future costing must persist material actuals, labor, machine, overhead, QC rework, and Yard handling cost.
