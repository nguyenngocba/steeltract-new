# Inventory Snapshot Boundary Validation

## Allowed Snapshot Reads

- Inventory Overview KPI and stock analytics.
- Inventory historical dashboard snapshots.
- Operations Center snapshot health and parity diagnostics.
- Background snapshot writer/validator/rebuilder paths.

## Disallowed Workspace Reads

Static trace confirms the following methods no longer invoke material/location
snapshot readers:

- `InventoryReadModelService.materialList`
- `InventoryReadModelService.materialDetail`
- `InventoryReadModelService.locations`

Material list rows identify their source as `repository-live` and do not expose
a snapshot timestamp as workspace truth.

## Regression Gate

`inventory-read-model.adr011.spec.ts` verifies that Materials calls the live
repository family and that Detail/Locations do not call
`SnapshotReaderService.inventoryMaterial` or `inventoryLocations`.

Dashboard code was not changed by EPIC171.
