# COMPONENT DOMAIN.5F.1 - Canonical Finished Goods UI Report

Status: **IMPLEMENTED - UI SLICE COMPLETE**

Date: 2026-07-28

## Previous UI Meaning

`/components/stock` previously rendered "Tồn kho cấu kiện" by combining
frontend-side sources:

- `GET /components`
- Yard slot placements
- Production Orders
- Production BOM costs
- Inventory audit costs

The page treated legacy `Component` records as physical stock candidates and
used semantics such as:

- `Component.status = READY`
- `Component.status = SHIPPED`
- `Component.status = DELIVERED`
- `Component.status = INSTALLED`
- completed ProductionOrder component IDs
- Yard placements keyed by `Component.id`
- `COUNT(Component)` as physical stock-like quantity

That was not canonical after DOMAIN.2 -> DOMAIN.5E because `Component` now
means engineering definition, not one physical accepted component.

## New Canonical Meaning

The Components stock route now displays **Cấu kiện thành phẩm**.

Canonical meaning:

`ComponentInstance`

plus manufacturing completion evidence

plus authoritative final QC acceptance.

The page no longer treats a Component definition, Project requirement quantity,
legacy Component status, or aggregate ProductionOrder quantity as Finished
Goods.

## Data Source

Authoritative source:

`GET /components/instances/finished-goods`

The frontend displays the backend eligibility response directly. The backend
eligibility query remains the source of truth for:

- `QC_PASSED` instances with final QC inspection acceptance
- `USE_AS_IS` instances with approved NCR disposition
- non-scrapped instances
- produced physical instances only

## Files Changed

Frontend:

- `apps/frontend/src/modules/components/pages/tabs/ComponentsStockPage.tsx`
- `apps/frontend/src/modules/components/api/contracts/components.contract.ts`
- `apps/frontend/src/modules/components/services/api/components.api.ts`
- `apps/frontend/src/modules/components/hooks/queries/useComponents.ts`
- `apps/frontend/src/modules/components/config/components-tabs.ts`

Backend read API:

- `apps/backend-api/src/modules/components/repositories/finished-goods-eligibility.repository.ts`

Documentation:

- `docs/audits/component-domain5f1-finished-goods-ui-report.md`
- `docs/ai-state/CHANGELOG_AI.md`
- `docs/ai-state/CURRENT_STATE.md`
- `docs/ai-state/PROJECT_STATUS.md`
- `docs/ai-state/NEXT_TASKS.md`

## API Changes

No new route was added.

Existing route used:

`GET /components/instances/finished-goods`

Minimal additive response improvement:

- added `summary.total`
- added `summary.qcPassed`
- added `summary.useAsIs`
- added `summary.projectCount`

The summary is computed from the same backend eligibility predicate as the
listed rows. No lifecycle rule changed.

## Table Design

The table now represents physical `ComponentInstance` rows.

Columns:

- Mã cấu kiện vật lý
- Hồ sơ cấu kiện
- Công trình
- Production Order
- Ngày hoàn thành SX
- QC
- Trạng thái vật lý
- Vị trí

Missing location lineage is not fabricated. When the finished-goods API does
not expose Yard placement, the UI displays `Chưa gán bãi`.

## KPI Design

KPI strip is derived only from the canonical Finished Goods response:

- Cấu kiện thành phẩm = `summary.total`
- Đạt QC = `summary.qcPassed`
- Chấp nhận sử dụng = `summary.useAsIs`
- Theo công trình = `summary.projectCount`

No KPI uses `COUNT(Component)`, `Component.status`, `READY`, `STOCK` or
Project requirement quantity.

## Filters

Implemented filters:

- Mã cấu kiện vật lý -> backend `instanceCode`
- Công trình -> backend `projectId`
- Hồ sơ cấu kiện -> backend `componentId`

The route keeps server-side pagination through `page` and `limit`.

## Status Mapping

Canonical physical states are translated in the page:

- `QC_PASSED` -> `Đạt QC`
- `USE_AS_IS` -> `Chấp nhận sử dụng`

Legacy `Component.status` values are not displayed as Finished Goods evidence.

## Traceability

The detail drawer shows available canonical lineage:

`ComponentInstance`

-> `Component` engineering definition

-> `ProjectComponentRequirement`

-> `ProductionOrder`

-> production completion date

-> final QC / approved NCR evidence

This sprint intentionally did not build a large new traceability module.

## Legacy Dependencies Removed From UI

Removed from `ComponentsStockPage`:

- `useComponents()` as physical stock source
- Yard slot scan as Finished Goods source
- ProductionOrder completed status as Finished Goods source
- Production BOM / Inventory audit cost reconstruction
- `Component.status READY/SHIPPED/DELIVERED/INSTALLED` KPI counts
- `COUNT(Component)` as stock quantity

## Runtime Verification

Frontend runtime API smoke was not executed through a browser session because
no authenticated dev server session was started in this sprint. Build and
typed integration verify the frontend contract and endpoint path.

The backend endpoint remains authenticated and unchanged in route:

`GET /components/instances/finished-goods`

## Regression Results

Expected canonical regressions covered by the implementation:

- New DRAFT Component does not appear unless backend returns it as eligible.
- ACTIVE/released Component definition alone does not appear.
- Requirement quantity does not affect Finished Goods count.
- ProductionOrder quantity does not affect Finished Goods count.
- PLANNED / IN_PRODUCTION / PRODUCED_WAITING_QC / QC_FAILED / REWORK /
  SCRAPPED instances are excluded by backend eligibility.
- `QC_PASSED` and approved `USE_AS_IS` instances are displayed.
- Finished Goods count equals backend returned eligible physical instances.
- Existing Components routes remain accessible; `/components/stock` route is
  preserved and only its label changed to `Cấu kiện thành phẩm`.

## Backend Tests

- `pnpm -C apps/backend-api test -- component-domain-foundation --runInBand`
  passed: 2 suites / 12 tests.
- `pnpm -C apps/backend-api test --runInBand` passed: 79 suites / 247 tests.

Note: full backend tests emitted expected error logs from job worker projection
specs, but all suites passed.

## Frontend Tests

- `pnpm -C apps/frontend test` passed: 1 file / 2 tests.

## Backend Build

- `pnpm -C apps/backend-api build` passed.

## Frontend Build

- `pnpm -C apps/frontend build` passed.

Existing Vite warnings remain:

- `.env` contains unsupported `NODE_ENV=production`
- existing large chunk warning for React Three vendor bundle

## Remaining P0

- Dashboard and overview metrics still need later migration away from
  `Component.status` and `COUNT(Component)` for physical inventory semantics.
- Production UI still needs instance execution assignment/start/complete
  integration.
- QC UI still needs instance-level waiting queue and final inspection target.

## Remaining P1

- Add Yard placement lineage to the Finished Goods read API once Yard is
  converted to `ComponentInstance` identity.
- Add export / bulk actions only after the canonical table is stable.
- Add authenticated browser smoke for `/components/stock`.

## Recommendation

Proceed with DOMAIN.6B:

Make `Danh sách cấu kiện` explicitly represent engineering definitions plus
Project requirements, while keeping physical Finished Goods only on
`/components/stock` through `GET /components/instances/finished-goods`.
