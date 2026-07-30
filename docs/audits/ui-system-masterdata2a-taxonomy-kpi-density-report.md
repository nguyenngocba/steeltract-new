# UI.SYSTEM.MASTERDATA.2A - Master Data Taxonomy + KPI Strip + Density

Date: 2026-07-29

Status: IMPLEMENTED - MIGRATION DEPLOYED LOCALLY, TEST/BUILD PASS

## 1. Previous Conceptual Defect

UI.SYSTEM.MASTERDATA.2 incorrectly presented `materialUsageType`
(`PRIMARY`, `SECONDARY`, `CONSUMABLE`) as if it were only a fixed UI label
inside the Material Master workspace.

The corrected model separates:

- `InventoryCategory` = material category.
- `MasterMaterialUsageType` = material usage taxonomy / `Loại vật tư`.
- `InventoryItem` = individual Material Master record.
- `MaterialType` = technical group/specification grouping.
- `MasterUnit` = unit of measure and conversion relationship.

`MaterialType` was not repurposed. It remains `Quy cách / Nhóm kỹ thuật`.

## 2. Current Material Taxonomy Architecture

Audit found `InventoryItem.materialUsageType` was a Prisma/PostgreSQL enum:

- `PRIMARY`
- `SECONDARY`
- `CONSUMABLE`

That enum cannot safely support dynamic CRUD. A frontend-only dictionary would
have created fake master data, so a canonical additive dictionary was required.

## 3. Schema / Backend Change

Required and implemented.

Added:

- Prisma model `MasterMaterialUsageType`
- `inventory_items.materialUsageTypeId`
- nullable FK from `InventoryItem` to `MasterMaterialUsageType`
- generic master-data domain `/master-data/material-usage-types`

Preserved:

- existing enum `MaterialUsageType`
- existing `InventoryItem.materialUsageType`
- existing records and legacy API compatibility

Migration:

- creates `master_material_usage_types`
- inserts `PRIMARY`, `SECONDARY`, `CONSUMABLE`
- backfills existing `inventory_items.materialUsageTypeId`
- adds indexes and FK
- no `DROP`, `TRUNCATE` or `DELETE`

## 4. Loại Vật Tư Source Of Truth

Canonical source is now:

| Concept | Source |
| --- | --- |
| Loại vật tư | `MasterMaterialUsageType` |
| CRUD API | `/master-data/material-usage-types` |
| Material relationship | `InventoryItem.materialUsageTypeId` |
| Legacy fallback | `InventoryItem.materialUsageType` enum |

New Material Master UI selects `Loại vật tư` from the canonical API, not a
hardcoded frontend option list.

## 5. Material Master Relationship

Material Master remains individual `InventoryItem` records.

The Settings Material Master table now shows:

- Mã vật tư
- Tên vật tư
- Danh mục
- Nhóm kỹ thuật
- Loại vật tư
- Đơn vị
- Tồn hiện tại
- BOM
- Trạng thái
- Cập nhật
- Thao tác

Creating or editing Material Master remains stock-neutral.

## 6. KPI Source Mapping

All KPI values are derived from canonical API records already loaded by the
workspace.

| Workspace | KPI | Source |
| --- | --- | --- |
| Danh mục vật tư | Tổng danh mục | `/master-data/material-categories` row count |
| Danh mục vật tư | Đang hoạt động | `InventoryCategory.active` |
| Danh mục vật tư | Có vật tư sử dụng | `_count.items > 0` |
| Danh mục vật tư | Material references | sum `_count.items` |
| Loại vật tư | Tổng loại | `/master-data/material-usage-types` row count |
| Loại vật tư | Đang hoạt động | `MasterMaterialUsageType.active` |
| Loại vật tư | Đang sử dụng | `_count.inventoryItems > 0` |
| Loại vật tư | Tổng vật tư phân loại | `/inventory/items` row count |
| Material Master | Tổng vật tư | `/inventory/items` row count |
| Material Master | Đang hoạt động | `deletedAt == null` |
| Material Master | Có tồn kho | `currentStock > 0` |
| Material Master | Đang dùng BOM | `bomUsageCount > 0` |
| Nhóm kỹ thuật | Tổng nhóm | `/master-data/material-types` row count |
| Nhóm kỹ thuật | Đang hoạt động | `MaterialType.active` |
| Nhóm kỹ thuật | Đang sử dụng | `_count.inventoryItems > 0` |
| UOM | Tổng đơn vị | `/master-data/uom` row count |
| UOM | Đang hoạt động | `MasterUnit.active` |
| UOM | Đơn vị cơ sở | `baseUnitId == null` |
| UOM | Được tham chiếu | InventoryItem `unitId`/`unit` reference |

No fake KPI numbers were added.

## 7. Header Density Changes

The modal header was reduced to a compact `Master Data · <workspace>` format.
Long explanatory copy was moved into right-rail relationship/help text.

Target outcome: more vertical space for the KPI strip, filters and table.

## 8. Table Width / Density Changes

- Material Master gained a real `Loại vật tư` filter.
- Material Master uses canonical usage-type names from
  `MasterMaterialUsageType`.
- Usage type falls back to legacy enum only when older data lacks
  `materialUsageTypeId`.
- Row actions remain compact icon buttons.
- Right rail no longer repeats KPI values.
- Empty right rail shows relationship/source-of-truth context only.

## 9. Real Data Evidence

Runtime DB evidence after local migration deploy:

```json
{
  "usage": [
    {
      "code": "PRIMARY",
      "name": "Vật tư chính",
      "active": true,
      "sortOrder": 10,
      "items": 53
    },
    {
      "code": "SECONDARY",
      "name": "Vật tư phụ",
      "active": true,
      "sortOrder": 20,
      "items": 14
    },
    {
      "code": "CONSUMABLE",
      "name": "Vật tư tiêu hao",
      "active": true,
      "sortOrder": 30,
      "items": 7
    }
  ],
  "items": 72,
  "linked": 72
}
```

## 10. Tests / Build Results

- `pnpm -C apps/backend-api exec prisma validate`: PASS
- `pnpm -C apps/backend-api exec prisma generate`: PASS
- `pnpm -C apps/backend-api exec prisma migrate deploy`: PASS
- `pnpm -C apps/backend-api exec prisma migrate status`: PASS
- `pnpm -C apps/backend-api test`: PASS, 86 suites / 271 tests
- `pnpm -C apps/frontend test`: PASS, 2 files / 4 tests
- `pnpm -C apps/frontend exec tsc --noEmit`: PASS
- `pnpm -C apps/backend-api build`: PASS
- `pnpm -C apps/frontend build`: PASS
- `git diff --check`: PASS

## 11. Remaining Gaps

- True browser/Chromium visual certification was not run in this environment.
- Legacy Inventory dashboards/read-models still expose enum-oriented
  `materialUsageType` metrics for compatibility. The Settings Master Data UI
  now uses the canonical relation.
- Dynamic usage types beyond the seeded legacy three will be selectable by
  Settings Material Master, but legacy consumers that only understand the enum
  will still see the fallback enum value.

