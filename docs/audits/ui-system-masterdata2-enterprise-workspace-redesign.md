# UI.SYSTEM.MASTERDATA.2 - Enterprise Master Data Workspace Redesign

Date: 2026-07-29

Status: IMPLEMENTED - UI TEST/TYPECHECK PASS

## Scope

This sprint refined the Settings master-data administration UI only. No backend
code, Prisma schema, migrations, API contracts or business rules were changed.

Four Settings workspaces remain backed by the existing canonical sources:

| Workspace | Canonical entity | API |
| --- | --- | --- |
| Danh mục vật tư | `InventoryCategory` | `/master-data/material-categories` |
| Material Master | `InventoryItem` | `/inventory/items` |
| Quy cách / Nhóm kỹ thuật | `MaterialType` | `/master-data/material-types` |
| Đơn vị & Quy đổi | `MasterUnit` | `/master-data/uom` |

## UOM Contract Audit

`MasterUnit` already supports the fields required by this UI:

- `code`, `name`, `symbol`
- `category`: `weight`, `length`, `quantity`, `area`, `volume`
- `precision`
- `active`
- `baseUnitId`
- `conversionFactor`

Backend validation allows a base unit without forcing meaningless conversion
data on true base units. If `baseUnitId` is absent, `conversionFactor` is not
required. If `baseUnitId` is present, the base unit must exist, be active and
share the same category.

No backend gap was found for the V1 UOM editor.

## Implemented UI Changes

- Expanded the master-data CRUD modal into a `95vw x 90vh` enterprise workspace.
- Rebalanced the layout to a 70-75% table region and 25-30% stable editor rail.
- Added real summary metrics above the table: total rows, active rows and
  linked/used rows.
- Kept one scroll owner in the table area and one scroll owner in the editor
  body.
- Kept the editor footer stable with `Hủy`, `Tạo` or `Lưu`, and
  `Ngừng sử dụng`/`Ẩn vật tư` in edit mode.
- Converted row actions to compact icon buttons.
- Kept pagination through `DataTablePagination`.
- Renamed `Vật tư chính` workspace presentation to `Material Master`, while
  exposing `materialUsageType` as `Chính`, `Phụ`, `Tiêu hao`.
- Fixed the Material Master table column mismatch by rendering the missing
  status cell before the updated date.
- Added Material Master usage-type column.
- Added UOM updated-date column.
- Localized UOM category labels and added a relationship preview:
  `1 t = 1000 kg` for derived units, or base-unit explanation when no
  `baseUnitId` is selected.
- Disabled conversion-factor input when the row is a base unit, matching the
  backend contract.

## Dependency Safety

- Category, MaterialType and UOM destructive actions use the existing
  deactivate APIs, not physical deletes.
- Material Master uses the existing soft-delete API.
- The UI blocks Material Master hide when stock or BOM usage is present and
  still leaves the backend as the final safety gate.

## Tests

Updated `SettingsPage.test.tsx`:

- Opens master-data CRUD from the Settings Overview capability row.
- Verifies the modal renders real backend-shaped records.
- Creates a Material Category through the canonical API call.
- Opens all four workspaces and verifies canonical rows render:
  Category, Material Master, MaterialType and UOM.

## Not Changed

- Backend contracts.
- Prisma schema.
- Master data models.
- API routes.
- Inventory business logic.
- RBAC/permission rules.

## Verification

- `pnpm -C apps/frontend exec tsc --noEmit`: PASS
- `pnpm -C apps/frontend test -- SettingsPage.test.tsx`: PASS

Full build verification is recorded in the final sprint summary.

## Not Verified

True browser/Chromium visual certification was not run in this environment.
Previous checks showed no Chromium/Playwright CLI available. Do not treat this
as pixel/browser GREEN until a browser harness is available.

