# Inventory Target Architecture

Date: 2026-06-04

Source:

- `docs/ai-state/audits/inventory-audit.md`

Purpose:

Define the final Inventory architecture for SteelTrack steel structure manufacturing ERP. This document is the target design for the next implementation phases. It does not describe a code change already completed.

## 1. Final Inventory Architecture

Inventory must be split into four separate domains:

1. Material Master
2. Inventory Stock
3. Inventory Transactions
4. Production Material Warehouse

These domains are related, but they must not share the same form, state model, or screen responsibility.

## 2. Domain Separation

### 2.1. Material Master

Material Master is the static technical record of a material.

Responsibilities:

- Own material identity, classification, specification, unit, planning, sourcing, and quality requirements.
- Provide the canonical material list used by Inventory, BOM, Production, QC, Supplier, and Purchasing.
- Support create/edit/archive material records.
- Never directly create stock quantity.
- Never directly create inbound/outbound transactions.

Material Master should answer:

- What is this material?
- How is it specified?
- What unit is it controlled in?
- What supplier or lead time is preferred?
- What minimum stock should be maintained?
- What quality/certificate rules apply?

Material Master should not answer:

- How many units are currently in a warehouse?
- Which heat/batch is currently available?
- Which project consumed this material?
- What is the actual inbound purchase price of a specific shipment?

### 2.2. Inventory Stock

Inventory Stock is the current quantity and value position of a material.

Responsibilities:

- Show stock by material.
- Show stock by warehouse, zone, slot, and future lot/batch.
- Show available, reserved, issued, damaged, returned, and blocked quantities.
- Derive stock from the transaction ledger in early phases.
- Move to a persisted balance ledger in later phases for performance and audit clarity.

Inventory Stock should answer:

- How much is available now?
- Where is it located?
- What is its average cost or current inventory value?
- Which materials are below minimum stock?
- Which locations contain this material?

Inventory Stock should not create or edit Material Master fields.

### 2.3. Inventory Transactions

Inventory Transactions are the audited movement ledger.

Responsibilities:

- Inbound from supplier.
- Outbound to project.
- Outbound to production.
- Transfer between warehouse zones.
- Return from production.
- Return from project.
- Stock take.
- Adjustment.
- Scrap or blocked stock movements.

Inventory Transactions should own:

- Transaction number.
- Transaction date.
- Transaction type.
- Material lines.
- Quantity.
- Unit price and total amount when applicable.
- Supplier, project, production order, or reference module.
- Source/destination zone.
- Remarks.
- Creator/approver in later phases.

Inventory Transactions should not create Material Master implicitly, except via a controlled "quick create material" drawer that uses the single Material Master source of truth.

### 2.4. Production Material Warehouse

Production Material Warehouse is the stock issued from main Inventory to Production.

Responsibilities:

- Track materials already issued to production but not yet fully consumed.
- Support BOM reservation and production material issue.
- Support return to main warehouse when production has surplus.
- Support scrap or rework when material is damaged.
- Keep production material balances separate from main warehouse balances.

Production Material Warehouse should answer:

- Which materials have been issued for production?
- Which production order or BOM reserved/consumed them?
- How much remains unused?
- What can be returned to main warehouse?
- What was scrapped or written off?

Architecture rule:

- Main Inventory Stock and Production Material Warehouse must be separate balance views.
- A material issued to production should reduce main warehouse availability.
- A material returned from production should create a return transaction and increase main warehouse availability only after accepted.

## 3. Screen Responsibilities

### 3.1. `InventoryOverviewPage`

Final role:

- Inventory dashboard cockpit only.

Responsibilities:

- Show KPI strip.
- Show stock health summary.
- Show low stock and critical alerts.
- Show recent inbound/outbound movements.
- Show high-value material exposure.
- Show production material warehouse pressure.
- Link users to operational tabs.

Must not:

- Create or edit Material Master.
- Contain standalone inbound/outbound/transfer forms.
- Contain a separate material detail implementation.
- Duplicate the full materials table.

Expected actions:

- "Go to Materials".
- "Go to Inbound".
- "Go to Outbound".
- "Go to Alerts".
- "Go to Production Material Warehouse".

### 3.2. `InventoryMasterDataPage`

Final role:

- Inventory configuration master data.

Responsibilities:

- Manage material categories.
- Manage material types.
- Manage units.
- Manage warehouses/zones where Inventory owns them.
- Manage transaction type labels in a later phase.
- Manage storage rules in a later phase.

Must not:

- Create actual materials.
- Show current stock.
- Show transactions.
- Own supplier-specific material mappings.

Rename recommendation:

- UI label should be `Danh mục kho` or `Cấu hình kho`, not `Master Data` for end users.

### 3.3. `InventoryMaterialsPage`

Final role:

- Material Master and material stock workspace.

Responsibilities:

- Show Material Master list with stock summary.
- Open material detail workspace.
- Open the single `MaterialDrawer` for create/edit.
- Show current stock, average cost, total value, location summary, and alerts as derived data.
- Allow read-only navigation into transaction history for a selected material.

Must not:

- Create initial inbound transaction inside the material form.
- Maintain a second detail modal separate from the canonical material detail workspace.
- Store duplicate material type/category/unit state outside the drawer contract.

Suggested UI tabs inside material detail:

- Overview.
- Stock.
- Transactions.
- Suppliers.
- BOM Usage.
- QC / Certificates.
- Files.

### 3.4. `InventoryInboundPage`

Final role:

- Receive materials into main Inventory from suppliers or returns accepted as stock.

Responsibilities:

- Create inbound transaction.
- Select existing material.
- Allow controlled quick create material through the single `MaterialDrawer`.
- Capture supplier.
- Capture zone/location.
- Capture quantity.
- Capture unit price and total amount.
- Capture VAT/invoice in Purchasing integration phase.
- Capture certificate/heat/batch in Database enhancement phase.

Must not:

- Use a separate material creation form.
- Persist Material Master price using inbound unit price.
- Bypass stock validation rules.

### 3.5. `InventoryOutboundPage`

Final role:

- Issue materials out of main Inventory.

Responsibilities:

- Export to project.
- Export to production.
- Export for other approved consumption reasons.
- Require source zone/location.
- Validate source location balance.
- Capture project or production reference depending on target.
- Create audited outbound transaction.

Rules:

- If target is Production, project selection should be locked or hidden unless production order/project relation requires it.
- If target is Project, production order selection should not be used.
- Outbound to Production should feed Production Material Warehouse.

### 3.6. `InventoryTransferPage`

Final role:

- Move stock between locations inside the main warehouse.

Responsibilities:

- Select material.
- Select source zone.
- Select destination zone.
- Validate source zone balance.
- Create transfer transaction with paired negative and positive lines or a transfer ledger model.

Must not:

- Change Material Master default zone as a substitute for a transfer.
- Transfer production-issued stock unless the flow explicitly supports Production Material Warehouse transfer.

### 3.7. `InventoryStockTakePage`

Final role:

- Physical count and reconciliation.

Responsibilities:

- Create stock take document.
- Compare system quantity vs counted quantity.
- Show variance by material/location.
- Create adjustment transaction after approval.
- Keep audit trail of counted by, approved by, and count date in later phases.

Must not:

- Directly overwrite Material Master `quantity`.
- Use stock take as a regular inbound/outbound shortcut.

### 3.8. `InventoryTransactionsPage`

Final role:

- Central movement ledger.

Responsibilities:

- Show all inventory transactions.
- Filter by type, date, supplier, project, material, warehouse, production reference.
- Open transaction detail.
- Export audit ledger.
- Link back to source documents.

Must not:

- Create new Material Master records.
- Hide production material issue/return transactions from the ledger.

### 3.9. `InventoryAlertsPage`

Final role:

- Exception and action queue.

Responsibilities:

- Show low stock.
- Show out of stock.
- Show overstock.
- Show stale/no movement materials.
- Show stock mismatch or negative balance risk.
- Show missing certificate/expired material when lot tracking exists.
- Show production warehouse surplus awaiting return.

Must not:

- Duplicate full Material Master editing.
- Replace dashboard KPIs.

## 4. Final Material Master Fields

Required field set for SteelTrack Material Master:

| Field | Type / Relation | Required | Owner | Notes |
| --- | --- | --- | --- | --- |
| `code` | string unique | Yes | Material Master | Internal material code. |
| `name` | string | Yes | Material Master | Display material name. |
| `category` | relation/string | Yes | Material Master | High-level group: steel, plate, bolt, paint, consumable. |
| `materialType` | relation/string | Yes | Material Master | Detailed type under category. |
| `unit` | relation/string | Yes | Material Master | Base stock unit. Should converge to `unitId` relation. |
| `specification` | string | Yes | Material Master | Example: H300x300x10x15, PL12, RHS100x50x4. |
| `grade` | string | Recommended | Material Master | Example: SS400, Q235, Q345, A36, SM490. |
| `standard` | string | Recommended | Material Master | Example: JIS, ASTM, EN, TCVN. |
| `origin` | string | Optional initially | Material Master / Supplier | Country, mill, or source origin. |
| `unitWeight` | number | Recommended | Material Master | kg per meter, kg per piece, or kg per base unit depending on material type. |
| `defaultSupplier` | relation/string | Optional in Phase A, relation in Phase C | Supplier integration | Preferred supplier for planning. |
| `leadTimeDays` | number | Recommended | Planning | Procurement/stock planning lead time. |
| `minimumStock` | number | Yes | Inventory planning | Existing field. |
| `description` | text | Optional | Material Master | Free-form note. |

Extended fields recommended for later phases:

- `status`: active, inactive, blocked, obsolete.
- `isConsumable`.
- `isTraceable`.
- `profileShape`.
- `dimensionText`.
- `lengthMm`.
- `widthMm`.
- `heightMm`.
- `thicknessMm`.
- `diameterMm`.
- `weightPerMeterKg`.
- `weightPerPieceKg`.
- `defaultWarehouseId`.
- `defaultZoneId`.
- `maximumStock`.
- `reorderPoint`.
- `safetyStock`.
- `requiresCOCQ`.
- `requiresHeatNo`.
- `requiresMillCert`.
- `qcRequired`.
- `standardCost`.
- `lastPurchasePrice`.

Important pricing rule:

- Actual inbound unit price belongs to Inventory Transaction or future Purchase Receipt.
- Material Master can keep `standardCost` or `lastPurchasePrice`, but it must not treat transaction `unitPrice` as the master price.

## 5. Screens To Merge, Remove, Or Rename

### 5.1. Merge

Merge material detail behavior:

- Existing material detail in `InventoryOverviewPage`.
- Existing simple material popup in `InventoryMaterialsPage`.

Target:

- One canonical Material Detail Workspace opened from any inventory screen.
- It should show master data, stock, transactions, suppliers, BOM usage, QC/certificates, files.

Merge create/edit material behavior:

- Existing `InventoryOverviewPage` create-material modal.
- Existing `MaterialDrawer`.

Target:

- `MaterialDrawer` becomes the only create/edit Material Master UI.

### 5.2. Remove

Remove from `InventoryOverviewPage`:

- Inline create material modal.
- Inline inbound modal.
- Inline outbound modal.
- Inline transfer modal.
- Full stock table duplication.
- Standalone material detail modal.

These should be replaced by navigation links and shared workspaces.

Remove legacy/unused material API paths after confirming route usage:

- Old query hooks and duplicate service API wrappers that are not used by active inventory tabs.
- Duplicate inventory item types that define different shapes for the same material.

### 5.3. Rename

Recommended user-facing names:

- `InventoryOverviewPage`: `Tổng quan kho`.
- `InventoryMaterialsPage`: `Vật tư & tồn kho` or `Danh mục vật tư`.
- `InventoryMasterDataPage`: `Danh mục cấu hình kho`.
- `InventoryTransactionsPage`: `Lịch sử giao dịch kho`.
- `InventoryAlertsPage`: `Cảnh báo tồn kho`.

Do not rename routes until the UI labels are stable.

## 6. MaterialDrawer As Single Source Of Truth

`MaterialDrawer` should become the single source of truth for creating and editing materials.

Rules:

- Every screen that needs to create or edit Material Master must open `MaterialDrawer`.
- `MaterialDrawer` owns the Material Master form schema.
- No other page should maintain its own `createMaterialForm`.
- No transaction fields should be part of `MaterialDrawer`.
- `MaterialDrawer` should not create inbound transactions.

Final `MaterialDrawer` responsibilities:

- Create material.
- Edit material.
- Validate required Material Master fields.
- Load and display categories, material types, units, and default supplier.
- Map edit payload correctly, including `materialType`, `specification`, `grade`, `standard`, `origin`, `unitWeight`, `defaultSupplier`, `leadTimeDays`, `minimumStock`, `description`.

Interaction with transaction screens:

- `InventoryInboundPage` may provide "Tạo vật tư mới" while receiving goods.
- That button must open `MaterialDrawer`.
- After the drawer saves, the inbound form should select the newly created material.
- The inbound form then captures quantity, unit price, supplier, VAT, zone, certificate, and document information.

API contract:

- Use one endpoint family for Material Master: `/inventory/items`.
- Use one frontend API client and one query key family.
- Avoid simultaneous `materials` and `inventory-items` cache naming unless intentionally aliased.

## 7. Migration Strategy

### Phase A - UI Only

Goal:

- Remove duplication and align UX without database migration.

Actions:

- Convert `InventoryOverviewPage` into dashboard-only cockpit.
- Remove inline create-material, inbound, outbound, transfer, stock-take, and material-detail modal logic from Overview.
- Route quick actions to the correct tabs.
- Use `MaterialDrawer` as the only Material Master create/edit UI.
- Add missing UI fields to `MaterialDrawer` only as optional display/input fields where backend can safely ignore them until Phase B, or gate them behind disabled placeholders.
- Ensure `InventoryMaterialsPage.editMaterial()` passes `materialTypeId`.
- Create one shared Material Detail Workspace component reused from Overview and Materials.
- Normalize query keys to a single naming convention.

No database changes in Phase A.

Acceptance criteria:

- There is only one visible form for creating/editing materials.
- Overview no longer creates stock transactions directly.
- Inbound/outbound/transfer flows live only in their dedicated tabs.
- All active Inventory screens use the same visual system and navigation semantics.

### Phase B - Database Enhancement

Goal:

- Expand Material Master and stock model for steel structure manufacturing.

Actions:

- Add Material Master fields:
  `specification`, `grade`, `standard`, `origin`, `unitWeight`, `leadTimeDays`, `status`, `isConsumable`, `isTraceable`.
- Add `defaultSupplierId` as nullable if Supplier integration can be referenced safely, or defer it to Phase C.
- Add `defaultWarehouseId` / `defaultZoneId` if warehouse schema is stable.
- Add proper DTO validation for `materialTypeId`.
- Decide whether `unit` text remains or `unitId` becomes the canonical unit relation.
- Add stock balance model if needed:
  `InventoryBalance(materialId, warehouseId, zoneId, slotId, lotId, quantity, reservedQuantity, blockedQuantity)`.
- Add lot model if needed:
  `InventoryLot(materialId, heatNo, batchNo, certificateNo, supplierId, receivedDate, expiryDate)`.

Migration principle:

- Existing `InventoryItem.code`, `name`, `categoryId`, `unit`, `minimumStock`, `description` must remain backward compatible.
- New fields should be nullable at first, then gradually required after data cleanup.

Acceptance criteria:

- Material Master can represent steel profiles, plates, bolts, paint, and consumables.
- Backend DTO matches frontend form.
- Actual unit prices remain in transaction lines, not Material Master.

### Phase C - Supplier Integration

Goal:

- Connect Material Master to Supplier Master without starting Purchasing/PO scope.

Actions:

- Add `SupplierMaterial` mapping:
  supplier, material, supplierMaterialCode, preferred flag, lead time, MOQ, last quoted price, currency, active status.
- Support `defaultSupplier` in `MaterialDrawer`.
- Show supplier list and last inbound history in Material Detail.
- Use supplier score/rating as read-only planning context.
- Allow inbound screen to filter materials by supplier or show supplier-compatible materials.

Out of scope:

- Purchase Order.
- Contract.
- Approval workflow.

Acceptance criteria:

- A material can have one default supplier and multiple approved suppliers.
- Supplier pages can show supplied materials.
- Material detail can show supplier sourcing options.

### Phase D - Purchasing Integration

Goal:

- Connect Inventory inbound to Procurement/Purchasing documents.

Actions:

- Add Purchase Request / Purchase Order integration.
- Add Goods Receipt or Purchase Receipt.
- Convert supplier inbound into receipt against PO when available.
- Link unit price, VAT, invoice, delivery note, certificate, and QC receiving inspection.
- Update `lastPurchasePrice` from accepted receipts.
- Support purchase returns and supplier claims.

Inventory rules:

- PO does not increase stock.
- Goods Receipt or approved inbound increases stock.
- Rejected receipt does not increase available stock.
- Returned-to-supplier decreases stock or blocked stock depending on inspection status.

Acceptance criteria:

- Purchasing owns commercial commitment.
- Inventory owns physical receipt and stock.
- Supplier owns sourcing and performance.
- QC owns receiving quality result.

## 8. Final Decision Summary

Final architecture decision:

- `InventoryOverviewPage` is dashboard only.
- `InventoryMaterialsPage` is the Material Master and stock workspace.
- `InventoryMasterDataPage` is configuration-only.
- `MaterialDrawer` is the only create/edit Material Master form.
- `InventoryInboundPage`, `InventoryOutboundPage`, `InventoryTransferPage`, `InventoryStockTakePage`, and `InventoryTransactionsPage` own movement workflows and audit ledger.
- Production Material Warehouse must be treated as a separate issued-material balance, not as main warehouse stock.

Next recommended implementation:

1. Phase A UI-only cleanup.
2. Then Phase B database enhancement for Material Master fields.
3. Then Supplier integration.
4. Then Purchasing integration.
