# Inventory Material List UI Audit

## List Binding

`InventoryMaterialsPage` uses:

- `useInventoryAudit()` -> `GET /inventory/audit`.
- `useInventoryTransactions({})` -> `GET /inventory/transactions`.
- `useZones()` -> `GET /inventory/zones`.
- category/unit supporting queries.

Search, category/status filters, sorting, and pagination all run in the browser
over the audit payload. The API caps that payload at 1,000 items and does not return
pagination metadata. Page size is 16, while “show all” renders the complete filtered
client payload without virtualization.

| Field | API source | UI handling | Result |
|---|---|---|---|
| Code/name | audit material fields | direct display, truncate/title | PASS |
| Category/type/unit | audit normalized fields | fallback labels | WARNING |
| MAIN stock | `locationBalances` | frontend warehouse matching | WARNING |
| PRODUCTION stock | `locationBalances` | frontend warehouse matching | WARNING |
| Total stock | audit `currentStock`/locations | frontend helper | FAIL: noncanonical capped source |
| Average cost/value | audit calculated fields | numeric formatting | FAIL: runtime reconstruction |
| Status | stock + minimum stock | frontend rule | WARNING |
| Zone | audit location fields | displayed | PASS |
| Slot/level | separate API fields | omitted from primary list summary | WARNING |

## Metric Semantics

- “Kiểm kê tháng này” counts `ADJUSTMENT` transactions, which is not equivalent
  to stocktake sessions.
- Its “Hoàn thành” note is hard-coded.
- “Chênh lệch tồn kho” is calculated from the ratio of low/out-of-stock materials,
  not an inventory variance quantity or value.

These labels present different business concepts as stocktake/variance metrics and
are classified **FAIL**.

## Location Binding

The runtime API was checked with real data:

- `slotId` and `level` are separate fields in audit, zone, and detail responses.
- The UI detail views preserve those fields independently.
- Zone occupancy may expose a display key such as `A01:L2`; it does not replace
  either source field.
- One legacy location for `VT-NEW-00001` has null slot and level with quantity
  `1111`; fallback display must not imply a physical slot that is not present.

`GET /inventory/zones` is snapshot-first with repository fallback, but returns a
large nested payload including inventory items, location stocks, and occupancy.

## Material Detail

`useMaterialDetail(materialId)` calls
`GET /inventory/items/:id/detail`. Backend flow:

`InventoryController` -> `InventoryReadModelService.materialDetail()` ->
`SnapshotReaderService.inventoryMaterial()` -> repository read-model fallback.

The detail endpoint correctly returned current stock, average cost, inventory
value, locations, inbound/outbound history, supplier history, and project
consumption for the inspected material.

### Lazy and Attachment Behavior

- Detail query is enabled only after selecting a material: PASS.
- Material attachment queries are gated to relevant tabs and scoped by material:
  PASS.
- Transaction attachment query is tab-gated but requests every inventory
  transaction attachment, then filters by the material in the browser: WARNING.
- Inbound/outbound/project histories are embedded without server pagination.
- Drawer pagination slices already-downloaded histories in the browser.
- No per-row HTTP N+1 was found, but the monolithic detail and attachment payloads
  create equivalent growth risk.

## Stability

- Table cells generally truncate long strings and provide native title text.
- Numeric columns use formatting suitable for large values.
- Horizontal overflow shells protect the wide table on smaller viewports.
- “Show all” can create a large DOM and has no virtualization.
- Query errors are commonly normalized into empty arrays, making failures resemble
  valid empty states.
- A log-row key falls back to `Math.random()`, causing unstable React identity.

## Result

**FAIL**

Material detail itself follows the frozen snapshot-first architecture, but the main
list does not, and several displayed operational metrics have incorrect semantics.

