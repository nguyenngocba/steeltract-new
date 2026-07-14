# Inventory Workspace Boundary Report

| Surface | Classification | Active source after EPIC171 | Result |
| --- | --- | --- | --- |
| Materials | Operator workspace | `InventoryRepository.listMaterialLivePage` | PASS |
| Material Detail | Operator workspace | item + location stock + transaction repositories | PASS |
| Material History | Operator workspace tab | paginated Inventory transactions | PASS |
| Locations | Operator workspace | zones + `inventory_location_stocks` | PASS |
| Transactions | Operator workspace | paginated Inventory transaction repository | PASS |
| Overview | Dashboard/analytics | persisted Inventory snapshots and repository fallback sources | PASS, unchanged |

## Live Material Query

The live material model retains server-side search, category/type/usage,
warehouse and stock-status filters, stable sorting and offset pagination. Stock
comes from location balances. Average cost is calculated from persisted positive
transaction lines, matching the existing material snapshot calculation rule.

Frontend shaping of the returned current page remains presentation-only. It no
longer determines the authoritative inventory result set.
