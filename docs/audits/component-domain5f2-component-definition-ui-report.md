# COMPONENT DOMAIN.5F.2 - Canonical Component Definition UI Report

Status: **IMPLEMENTED - UI / READ-MODEL SLICE COMPLETE**

Date: 2026-07-28

## Previous Page Meaning

`/components/list` previously displayed `Danh sách cấu kiện` with mixed
semantics:

- one `Component` row was visually treated like an operational/physical item
- KPI cards used production/physical wording such as `Đang gia công`,
  `Ready to ship`, `Chờ cấp vật tư`, `Trễ tiến độ`
- filters exposed legacy physical workflow statuses such as `READY`,
  `SHIPPED`, `DELIVERED`, `INSTALLED`
- table showed `Vị trí hiện tại`, `Trạng thái legacy`, `Khối lượng` and legacy
  status labels
- backend read model mapped `Component.status = STOCK` to `Tồn kho`
- legacy `description.quantity` could become the displayed row quantity

That no longer matches the canonical model where `Component` means engineering
definition.

## New Page Meaning

`/components/list` now represents **Hồ sơ cấu kiện**.

Each row means exactly one engineering `Component` definition with planning and
engineering evidence around:

- `ProjectComponentRequirement`
- current revision
- Engineering BOM readiness
- Engineering release lifecycle

The page no longer presents the row as physical inventory, finished goods or
yard stock.

## Canonical Data Sources

Frontend source:

- `GET /components/read-model/list`

Backend read-model sources:

- `Component`
- `Component.lifecycleState`
- `Component.currentRevision`
- `ComponentRevision.state`
- `ComponentBomDefinition.state`
- `ProjectComponentRequirement.requiredQuantity`
- `ProjectComponentRequirement.productionOrders.quantity`

Compatibility sources kept but de-emphasized:

- legacy `Component.status` remains returned as `rawStatus`
- legacy typed fallback from `description.type/profile` remains readable

## KPI Definitions

KPI strip now uses engineering/planning labels:

- `Tổng hồ sơ cấu kiện` = Component definition count
- `Hồ sơ nháp` = `Component.lifecycleState = DRAFT`
- `Đã phát hành sản xuất` = `Component.lifecycleState = ACTIVE`
- `Tổng nhu cầu cấu kiện` = `SUM(ProjectComponentRequirement.requiredQuantity)`
- `Chưa có BOM` = DRAFT definitions missing a validated/current BOM path

Removed from this page:

- `Tồn kho cấu kiện`
- `Ready to ship`
- `Đang gia công`
- `Chờ cấp vật tư`
- physical status-driven KPIs

## Table Design

Main table columns now follow engineering definition semantics:

- Mã hồ sơ
- Tên cấu kiện
- Công trình / Yêu cầu
- Loại
- Profile
- Revision
- BOM
- SL yêu cầu
- Trạng thái kỹ thuật
- Cập nhật
- Thao tác

No table column uses physical stock/yards as the primary meaning.

## Requirement Presentation

`ProjectComponentRequirement` is displayed as demand/planning information:

- row summary displays one Project or `N yêu cầu`
- detail drawer includes a requirement subtable
- requirement subtable shows:
  - requirement number
  - Project
  - required quantity
  - allocated Production Order quantity
  - remaining quantity
  - requirement status

Required quantity comes from `ProjectComponentRequirement.requiredQuantity`, not
from `Component.description.quantity`.

## Engineering Status Mapping

Read-model mapping:

- `DRAFT` without revision -> `Nháp`
- `DRAFT` with incomplete revision/BOM -> `Đang hoàn thiện kỹ thuật`
- `DRAFT` with validated BOM -> `Sẵn sàng phát hành`
- `ACTIVE` -> `Đã phát hành sản xuất`
- `DEPRECATED` -> `Ngừng sử dụng`
- `ARCHIVED` -> `Đã lưu trữ`
- missing lifecycle -> `Legacy - chưa chuẩn hóa`

Legacy physical statuses such as `STOCK`, `READY`, `CUTTING`, `WELDING`,
`PAINTING`, `SHIPPED`, `DELIVERED`, `INSTALLED` no longer define the primary
engineering status on this page.

## Create Flow

The existing canonical create flow remains intact:

`Tạo hồ sơ cấu kiện`

creates:

- one Component definition
- one ProjectComponentRequirement

and does not create:

- ComponentInstance
- ProductionOrder
- Inventory quantity
- Finished Goods

The modal already uses canonical terminology:

- Công trình / Dự án
- Tên cấu kiện
- Loại cấu kiện
- Profile
- Số lượng yêu cầu
- Ghi chú

## BOM Integration

The read model now exposes current revision and BOM state where available.

The existing modal/action still opens the legacy `ProductionBomModal`. This is
kept for compatibility and intentionally documented as a P1 follow-up because
canonical Engineering BOM authoring should be:

`Component -> Revision -> Engineering BOM -> Validate -> Release`

not Production stock / Production BOM authoring.

## Filters

Filters now emphasize engineering-definition semantics:

- Công trình
- Trạng thái kỹ thuật: `DRAFT`, `ACTIVE`, `DEPRECATED`, `ARCHIVED`
- Loại cấu kiện
- Search by code/name/profile/project

Removed from this page's UI filters:

- `CUTTING`
- `WELDING`
- `PAINTING`
- `READY`
- `STOCK`
- `SHIPPED`
- `DELIVERED`
- `INSTALLED`

Legacy API compatibility remains.

## Terminology Changes

Standardized terminology on the main list:

- Component -> `Hồ sơ cấu kiện`
- ProjectComponentRequirement -> `Yêu cầu cấu kiện` / `Nhu cầu`
- ComponentInstance -> not shown here
- Finished Goods -> not duplicated here; remains on `Cấu kiện thành phẩm`

## Legacy Semantics Removed

Removed or replaced from the main definition page:

- `Component.status = STOCK` -> `Tồn kho`
- `Component.status = READY` -> `Ready / Sẵn sàng`
- physical production statuses as engineering KPI drivers
- `description.quantity` as canonical required quantity
- yard/install location as main list quantity/location meaning
- physical inventory wording from the main table

## Files Changed

Backend read model:

- `apps/backend-api/src/modules/components/repositories/components-read-model.repository.ts`
- `apps/backend-api/src/modules/components/repositories/components-read-model.repository.spec.ts`

Frontend:

- `apps/frontend/src/modules/components/api/contracts/components.contract.ts`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`

Documentation:

- `docs/audits/component-domain5f2-component-definition-ui-report.md`
- `docs/ai-state/CHANGELOG_AI.md`
- `docs/ai-state/CURRENT_STATE.md`
- `docs/ai-state/PROJECT_STATUS.md`
- `docs/ai-state/NEXT_TASKS.md`

## Runtime Verification

No authenticated browser runtime smoke was executed in this sprint. Build,
typecheck and test coverage verified the integration path.

## Regression Results

Verified by implementation and tests:

- create flow still targets canonical Component + ProjectComponentRequirement
- create flow still creates no ComponentInstance / ProductionOrder / Inventory
  quantity
- `requiredQuantity` comes from ProjectComponentRequirement
- legacy `description.quantity` is no longer used as canonical row quantity for
  definition semantics
- `Component.status = STOCK` does not make a definition row display `Tồn kho`
- `Component.status = READY` does not make a definition row display `Sẵn sàng`
- Finished Goods page remains DOMAIN.5F.1 canonical and untouched in this
  sprint except shared contract reuse
- existing route `/components/list` remains accessible

## Backend Tests

- `pnpm -C apps/backend-api test -- components-read-model.repository --runInBand`
  passed.
- `pnpm -C apps/backend-api test -- component-domain-foundation --runInBand`
  passed: 2 suites / 12 tests.
- `pnpm -C apps/backend-api test --runInBand` passed: 79 suites / 247 tests.

Full backend tests still emit expected error logs from projection/lease specs,
but all suites pass.

## Frontend Tests

- `pnpm -C apps/frontend test` passed: 1 file / 2 tests.

## Backend Build

- `pnpm -C apps/backend-api build` passed.

## Frontend Build

- `pnpm -C apps/frontend build` passed.

Existing Vite warnings remain:

- unsupported `.env` `NODE_ENV=production`
- existing large chunk warning

## Remaining P0

- Production UI must expose canonical Project requirement / generated
  ComponentInstance / ComponentInstanceExecution flow.
- QC UI must move final inspection queue to ComponentInstance targets.

## Remaining P1

- Split canonical Engineering BOM authoring UI from legacy Production BOM
  compatibility modal.
- Add browser smoke for `/components/list` create/read/detail with real auth.
- Convert Components overview/global dashboard semantics away from physical
  status counts in a later focused sprint.

## Recommendation

Proceed with Production-side UI integration:

Expose requirement-first Production Order creation and generated physical
ComponentInstances before expanding QC or dashboard metrics.
