# SYSTEM.MASTERDATA.1 - Canonical Material Master Data Administration

Date: 2026-07-29

## Status

Overall: **GREEN WITH TECHNICAL-SPEC SCHEMA GATE**

| Area | Status | Reason |
| --- | --- | --- |
| Danh mục vật tư | GREEN | Reuses existing `InventoryCategory` through `/master-data/material-categories`; no parallel table. |
| Vật tư chính | GREEN | Reuses existing canonical `InventoryItem` through `/inventory/items`; create/update does not create stock. |
| Quy cách / Nhóm kỹ thuật | YELLOW | Reuses existing `MaterialType` for V1 technical grouping. Detailed profile/specification/grade/dimension still needs an approved additive schema before becoming canonical. |
| Đơn vị & Quy đổi | GREEN | Reuses existing `MasterUnit` through `/master-data/uom`; no second UOM model. |

## Source Of Truth Audit

| Workspace | DB Model | Repository / Service | API | Frontend Consumer |
| --- | --- | --- | --- | --- |
| Danh mục vật tư | `InventoryCategory` | `DictionariesService` -> `masterDataDomains.material-categories` | `GET/POST/PATCH/DELETE /master-data/material-categories` | `SettingsPage` -> `getMasterDataRecords('material-categories')` |
| Vật tư chính | `InventoryItem` | `InventoryRepository` -> `InventoryService` | `GET/POST/PUT /inventory/items` | `SettingsPage` -> `useInventoryItems`, `createInventoryItem`, `updateInventoryItem` |
| Quy cách / Nhóm kỹ thuật | `MaterialType` | `DictionariesService` -> `masterDataDomains.material-types` | `GET/POST/PATCH/DELETE /master-data/material-types` | `SettingsPage` -> `getMasterDataRecords('material-types')` |
| Đơn vị & Quy đổi | `MasterUnit` | `UomService` | `GET/POST/PATCH/DELETE /master-data/uom` | `SettingsPage` -> UOM API helpers |

Legacy Inventory endpoints `/inventory/categories` and `/inventory/material-types` still exist for backward compatibility, but the Settings administration surface now uses `/master-data/*` as the editable source because that path supports inactive rows and audit emission.

## Architecture Implemented

- Settings tab `Danh mục / Đơn vị` now exposes four operational master-data cards:
  - `Danh mục vật tư`
  - `Vật tư chính`
  - `Quy cách / Nhóm kỹ thuật`
  - `Đơn vị & Quy đổi`
- Each card opens a modal workspace with search, status filter, table, summary rail, create/edit form and safe disable where supported.
- No local-only records, mock records or hardcoded business data were introduced.
- `DictionariesController` now enforces SYSTEM.2 RBAC:
  - read: `master-data.read`
  - mutation: `master-data.write`
- `InventoryItem` create/update now binds `unitId` to `unitMaster`, preserving canonical UOM identity while keeping legacy `unit` text compatibility.
- `/inventory/items` now exposes `bomUsageCount` from real `BomItem` relation counts.
- Material Master create/update writes `ActivityLog` rows and continues emitting existing inventory material update events.
- `/system/settings-catalog` now identifies canonical material administration sources:
  - `/master-data/material-categories`
  - `/inventory/items`
  - `/master-data/material-types`
  - `/master-data/uom`

## Business Rules Verified

| Rule | Result |
| --- | --- |
| Creating a Material Master does not create stock | PASS |
| Creating a Material Master does not create ComponentInstance | PASS |
| Creating a Material Master does not create ProductionOrder | PASS |
| UOM created in Settings can be selected by Material Master | PASS |
| Material Master appears in Inventory material query | PASS |
| BOM lineage can reference the same `InventoryItem` identity | PASS, via `/inventory/items` material identity and real `bomUsageCount` relation exposure |
| Referenced master data is disabled, not hard deleted | PASS for Settings dictionary/UOM paths |

## Runtime Smoke Evidence

Backend runtime: `127.0.0.1:3108`

Fixture prefix: `SYSTEM-MD1-1785309482405`

Authenticated HTTP flow:

1. `POST /auth/login`
2. `POST /master-data/material-categories`
3. `POST /master-data/material-types`
4. `POST /master-data/uom`
5. `POST /inventory/items`
6. `GET /inventory/items`
7. `GET /components/instances/finished-goods`
8. `GET /production`

Observed result:

| Evidence | Value |
| --- | --- |
| Category created | `SYSTEM-MD1-1785309482405-CAT` |
| Technical group created | `SYSTEM-MD1-1785309482405-TYPE` |
| UOM created | `SYSTEM-MD1-1785309482405-UOM` |
| Material Master created | `SYSTEM-MD1-1785309482405-MAT` |
| Material query sees material | `true` |
| Material stock after create | `0` |
| Material UOM from query | `SYSTEM-MD1-1785309482405-UOM` |
| `bomUsageCount` field present | `true` |
| Finished goods count delta | `0` |
| Production order count delta | `0` |

## Technical Group Schema Gate

`MaterialType` is sufficient for the current V1 "Quy cách / Nhóm kỹ thuật" administration surface. It is not sufficient to canonicalize all future technical attributes such as profile, specification, grade and dimensions.

Recommendation for a later schema sprint:

- Add an approved additive technical-specification model only after auditing actual BOM, Production and Component query needs.
- Do not expand `InventoryItem.description` JSON or free-text fields as canonical technical storage.

## Files Changed

- `apps/backend-api/src/modules/master-data/dictionaries/dictionaries.controller.ts`
- `apps/backend-api/src/modules/master-data/dictionaries/dictionary.config.ts`
- `apps/backend-api/src/modules/inventory/inventory.repository.ts`
- `apps/backend-api/src/modules/inventory/inventory.service.ts`
- `apps/backend-api/src/modules/rbac/rbac-enforcement.spec.ts`
- `apps/backend-api/src/modules/system/system.controller.ts`
- `apps/frontend/src/modules/inventory/api/inventory.api.ts`
- `apps/frontend/src/modules/settings/pages/SettingsPage.tsx`
- `docs/audits/system-masterdata1-canonical-material-administration-report.md`
- `docs/ai-state/CHANGELOG_AI.md`
- `docs/ai-state/CURRENT_STATE.md`
- `docs/ai-state/PROJECT_STATUS.md`
- `docs/ai-state/NEXT_TASKS.md`

## Verification

| Check | Result |
| --- | --- |
| `pnpm -C apps/backend-api exec prisma validate` | PASS |
| `pnpm -C apps/backend-api exec prisma migrate status` | PASS - 84 migrations up to date |
| `pnpm -C apps/backend-api test -- rbac-enforcement` | PASS |
| `pnpm -C apps/backend-api test -- inventory` | PASS |
| `pnpm -C apps/backend-api test` | PASS - 86 suites, 271 tests |
| `pnpm -C apps/frontend test` | PASS - 1 file, 2 tests |
| `pnpm -C apps/backend-api build` | PASS |
| `pnpm -C apps/frontend build` | PASS |
| Runtime HTTP smoke | PASS |

## Remaining P0

None for the four V1 Settings master-data workspaces.

## Remaining P1

- Define an approved canonical technical specification schema if the business needs profile/specification/grade/dimension as structured queryable master data.
- Add browser smoke coverage for the Settings master-data modal flow.
- Decide whether legacy `/inventory/categories` and `/inventory/material-types` write endpoints should be retired or internally delegated to `/master-data/*` in a later compatibility sprint.

## Remaining P2

- Bulk import/export for master-data dictionaries.
- Change approval workflow for high-impact master-data edits.
- Advanced UOM conversion graph validation and reporting.
