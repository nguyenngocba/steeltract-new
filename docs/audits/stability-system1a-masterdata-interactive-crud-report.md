# STABILITY.SYSTEM.1A - Master Data Interactive CRUD Workspaces

Date: 2026-07-29

Status: IMPLEMENTED - API + UI INTERACTION CERTIFIED

## Defect

Settings Overview capability rows for master data opened only metadata/count
details. Operators could see that `/master-data/*` and `/inventory/items`
existed, but clicking a capability from the Overview table did not put them
directly into an interactive CRUD workspace.

## Fix

The four master-data capabilities now route to the same large operational CRUD
modal workspace used by the Settings Master Data tab:

- `material-categories` -> `Danh mục vật tư`
- `materials` -> `Vật tư chính`
- `material-types` -> `Quy cách / Nhóm kỹ thuật`
- `uom` -> `Đơn vị & Quy đổi`

Non-master-data capability rows still open the read-only metadata modal.

## Source Of Truth

No new model, schema, migration, local-only table or frontend-only CRUD source
was introduced.

| Workspace | Canonical entity | API |
| --- | --- | --- |
| Danh mục vật tư | `InventoryCategory` | `/master-data/material-categories` |
| Vật tư chính | `InventoryItem` | `/inventory/items` |
| Quy cách / Nhóm kỹ thuật | `MaterialType` | `/master-data/material-types` |
| Đơn vị & Quy đổi | `MasterUnit` | `/master-data/uom` |

## Vật Tư Chính / Phụ / Tiêu Hao Audit

This is not a dictionary today. It is represented by the existing
`InventoryItem.materialUsageType` field and the frontend typed payload:

- `PRIMARY` -> `Vật tư chính`
- `SECONDARY` -> `Vật tư phụ`
- `CONSUMABLE` -> `Tiêu hao`

SYSTEM.1A did not create a parallel dictionary for this field.

## UI Behavior

Implemented and verified:

- Overview capability click opens the large CRUD workspace for the four
  master-data capabilities.
- Header, summary rail, toolbar, search/filter and compact sticky table are
  visible in the workspace.
- Add/Edit form uses sectioned fields.
- Pagination renders only when filtered rows exceed the page size.
- Destructive deactivate/hide actions require confirmation.
- Loading, empty and backend error states are rendered inside the workspace.
- Form validation mirrors the backend contract for required fields and the UOM
  code length limit.
- Material Master picker lists use the same refetched Category/MaterialType/UOM
  data after mutations.

## Delete / Deactivate Dependency Rule

- Categories: existing backend contract deactivates records. Linked material
  and material-type counts are shown.
- MaterialTypes: existing backend contract deactivates records. Linked
  InventoryItem count is shown.
- UOM: existing backend contract deactivates records. Linked InventoryItem
  count is shown.
- InventoryItem: existing backend soft-delete contract is used. UI blocks hide
  when current stock or BOM usage is non-zero, and backend remains the final
  safety gate.

## Runtime HTTP Certification

Fixture: `STABILITY-SYSTEM1A`

Authenticated HTTP smoke proved all four sources support real CRUD:

```json
{
  "crudStatuses": {
    "category": [201, 200, 200],
    "materialType": [201, 200, 200],
    "unit": [201, 200, 200],
    "material": [201, 200, 200]
  },
  "pickerEvidence": {
    "materialFormCategoryPicker": true,
    "materialFormTypePicker": true,
    "materialFormUnitPicker": true,
    "materialUsesEditedLookups": true
  },
  "materialSemantics": {
    "materialUsageTypeBefore": "SECONDARY",
    "materialUsageTypeAfter": "CONSUMABLE",
    "currentStock": 0,
    "bomUsageCount": 0
  }
}
```

`/system/settings-catalog` returned all four capabilities as `REAL_EDITABLE`
with canonical sources:

- `/master-data/uom`
- `/master-data/material-categories`
- `/inventory/items`
- `/master-data/material-types`

## UI Interaction Certification

Added `SettingsPage.test.tsx` to cover the defect path:

1. Render Settings Overview.
2. Click `Danh mục vật tư` capability row.
3. Verify the large `Master data` CRUD modal opens.
4. Verify existing backend-shaped row `CAT-1` is rendered in the table.
5. Click `Thêm mới`.
6. Fill form fields.
7. Save and verify `createMasterDataRecord` is called with
   `domain: material-categories`.

This proves the Overview capability no longer opens only metadata.

## Browser Certification

Full browser automation was not available in this environment:

- `chromium`: not installed
- `chromium-browser`: not installed
- `google-chrome`: not installed
- `playwright`: not installed as a CLI

Because of that, the sprint is not claimed as pixel/browser GREEN from a real
Chromium session. It is certified by runtime HTTP CRUD plus jsdom UI interaction
tests.

## Files Changed

- `apps/frontend/src/modules/settings/pages/SettingsPage.tsx`
- `apps/frontend/src/modules/settings/pages/SettingsPage.test.tsx`
- `docs/audits/stability-system1a-masterdata-interactive-crud-report.md`
- `docs/ai-state/CHANGELOG_AI.md`
- `docs/ai-state/CURRENT_STATE.md`
- `docs/ai-state/PROJECT_STATUS.md`
- `docs/ai-state/NEXT_TASKS.md`
- `docs/ai-state/modules/system.md`

## Verification

- Runtime HTTP CRUD smoke: PASS
- `pnpm -C apps/frontend test`: PASS

Full final verification is recorded in the assistant sprint summary.

## Remaining P1

- Run true browser automation once Chromium/Playwright is available.
- Add end-to-end browser coverage for all four workspaces including edit and
  deactivate confirmation.
