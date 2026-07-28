# COMPONENT DOMAIN.5F - Canonical Components / Production / QC UI Integration Audit

Status: **AUDIT COMPLETE - NO CODE CHANGES**

Date: 2026-07-28

## Executive Summary

Backend canonical workflow DOMAIN.2 -> DOMAIN.5E is implemented, but the
frontend is only partially aligned.

The biggest semantic gap is that UI screens still frequently treat `Component`
as both engineering definition and physical component inventory. The canonical
backend now separates:

- `Component` = engineering definition
- `ProjectComponentRequirement` = project demand / planned quantity
- `ProductionOrder` = manufacturing authorization
- `ComponentInstance` = physical manufactured item
- `ComponentInstanceExecution` = physical instance operation evidence
- `QcInspection` / `NonConformanceReport` = quality decision evidence
- Finished Goods = read eligibility from physical instance state + final QC/NCR
  evidence

The UI should not continue deriving physical stock, QC release, or production
progress from `Component.status`, `COUNT(Component)`, `description` JSON
quantity, or aggregate ProductionOrder quantity.

## Current Components UI

### Routes / Tabs

Configured in `apps/frontend/src/modules/components/config/components-tabs.ts`:

| Tab | Current Meaning | Canonical Assessment |
| --- | --- | --- |
| `Tổng quan` `/components` | Mixed dashboard over Component read models | Partially canonical; still counts Component definitions as inventory-like totals |
| `Danh sách cấu kiện` `/components/list` | Component workspace table | Should become Component Definitions + Project Requirements list |
| `Sản xuất` `/components/production` | Component production summary | Needs explicit ProductionOrder / ComponentInstance lineage |
| `Tồn kho cấu kiện` `/components/stock` | Physical stock-like view | Must migrate to `GET /components/instances/finished-goods` |
| `Vật tư sử dụng` `/components/material-stock` | Production material stock from inventory transactions/issues | Keep separate from Component Inventory; it is raw material under production custody |
| `Chuyển cấu kiện` `/components/transfers` | Component movement workflow | Must use ComponentInstance identity later |
| `QC nội bộ` `/components/qc` | Component QC summary | Must not run final QC against Component definition |
| `Lịch sử gia công` `/components/history` | Component timeline / legacy history | Needs split between definition lifecycle and physical instance execution history |

### Create Component Modal

Frontend:

- `apps/frontend/src/modules/components/context/ComponentsActionContext.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`

API:

- `POST /components/foundation/definition-requirements`
- implemented by `ComponentDomainFoundationController`

Current status: **mostly canonical**.

The modal title is `Tạo hồ sơ cấu kiện`, fields are grouped as technical data
and project requirement, and it sends:

- `name`
- `componentType`
- `profile`
- `projectId`
- `requiredQuantity`
- `requiredBy`
- `note`

This correctly creates:

- one `Component` in `DRAFT`
- one `ProjectComponentRequirement`
- no `ComponentInstance`
- no ProductionOrder
- no inventory quantity

Remaining UI debt:

- Components contract still exposes legacy `CreateComponentPayload` for
  `/components`.
- Component status contract still lists `STOCK`, `CUTTING`, `WELDING`,
  `PAINTING`, `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED` as if it were the
  authoritative lifecycle.

### Components List

Frontend:

- `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`
- `apps/frontend/src/modules/components/api/contracts/components.contract.ts`
- `apps/frontend/src/modules/components/hooks/queries/useComponents.ts`

Backend read model:

- `GET /components/read-model/list`
- `ComponentsReadModelRepository.list()`

Current behavior:

- Table row type `ComponentWorkspaceRow` includes `qty`, `qc`, `progress`,
  `materialReady`, `requiredQty`, `issuedQty`, `remainingQty`.
- Backend derives quantity from `ProjectComponentRequirement.requiredQuantity`
  with legacy fallback to `description.quantity`.
- Status is still mapped from `Component.status` plus `ComponentLifecycleState`.

Canonical target:

`Danh sách cấu kiện` should represent **Component Definitions and Project
Requirements**, not physical stock. Recommended columns:

- Component code
- Component name
- Component type
- Profile
- Project / Requirement
- Required quantity
- Required by
- Engineering lifecycle state
- Revision/BOM state
- Production order coverage
- Actions

Do not show `Tồn kho`, `Đã QC`, or physical progress as primary meaning on this
screen.

### Components Stock / Tồn kho cấu kiện

Frontend:

- `apps/frontend/src/modules/components/pages/tabs/ComponentsStockPage.tsx`

Current behavior:

- Reads all Components via `useComponents()` -> `GET /components`.
- Reads Yard slots, Production Orders, Production BOMs, Inventory audit.
- Builds rows by requiring:
  - Yard placement keyed by `component.id`
  - completed ProductionOrder with same `component.id`
- KPIs count `components.length`, `component.status === READY`, `SHIPPED`,
  `DELIVERED`, `INSTALLED`.

Canonical problem:

This screen treats `Component` ID as physical item ID. That conflicts with the
canonical model where `Component` is engineering definition and physical stock
is `ComponentInstance`.

Canonical source:

- `GET /components/instances/finished-goods`

Recommended meaning:

Rename/position this as **Thành phẩm cấu kiện** or **Finished Component
Instances**. Rows should be physical instances:

- instance code
- Component definition code/name/type/profile
- Project requirement
- Production Order
- state `QC_PASSED` or `USE_AS_IS`
- producedAt
- qcPassedAt
- final QC/NCR evidence
- Yard placement if/when Yard handoff exists

### Components Material Stock / Vật tư cấp sản xuất

Frontend:

- `apps/frontend/src/modules/components/pages/tabs/ComponentsMaterialStockPage.tsx`

Current behavior:

- Builds production material stock from:
  - Inventory items
  - Inventory transactions
  - Production material issues
  - transaction remarks `[COMPONENT_PRODUCTION]` and
    `[COMPONENT_PRODUCTION_RETURN]`
  - warehouse code/name matching production warehouse

Canonical assessment:

Keep this separate. This screen represents **raw material transferred into
production custody**, not Component Inventory and not Finished Goods. It should
not be merged with ComponentInstance/Finsihed Goods screens.

Issue:

The implementation is transaction-derived in frontend and should eventually
come from a backend production material stock read model. That is not a
DOMAIN.5F UI blocker, but it should be marked as a later data-source
hardening item.

### Components Dashboard / KPI

Frontend:

- `useComponentsDashboard()` -> `GET /components/dashboard`
- `useComponentsOverview()` -> `GET /components/read-model/overview`

Backend:

- `ComponentsSnapshotReadService.dashboard()`
- `ComponentsReadModelRepository.overview()`

Current legacy semantics:

- `totalComponents` = Component snapshot count
- `stockCount`, `readyCount`, `shippedCount`, etc. are based on legacy
  Component status counts.
- `overviewAggregatesFromDb()` counts finished goods as
  `Component.status = STOCK` with lifecycle filters.
- `totalQuantity` uses `ProjectComponentRequirement.requiredQuantity` with
  fallback to `description.quantity`.

Canonical issue:

Dashboard values that sound physical (`stockCount`, `readyCount`, `Tồn kho cấu
kiện`) must not use Component records. They must migrate to ComponentInstance
states / Finished Goods eligibility.

## Current Production UI

### Routes / Tabs

Configured in `apps/frontend/src/modules/production/config/production-tabs.ts`:

- Tổng quan
- Lệnh sản xuất
- Kế hoạch
- Production BOM
- Kho vật tư SX
- Theo dõi thực hiện
- Máy móc
- Giữ chỗ vật tư
- Sổ vật tư SX
- Cấp phát vật tư
- Tiêu hao vật tư
- Sự cố
- Nhật ký sản xuất
- Báo cáo

### Production API Used By Frontend

Frontend:

- `apps/frontend/src/modules/production/api/production.api.ts`

Current primary endpoints:

- `GET /production`
- `GET /production/read-model/cockpit`
- `GET /production/:id`
- `GET /production/boms`
- `POST /production/boms`
- `POST /production`
- `POST /production/:id/start`
- `POST /production/stages/:id/complete`
- `POST /production/:id/stage-to-yard`
- material reservations/issues/consumptions/ledger endpoints

Canonical instance execution endpoints exist but are not used by frontend:

- `POST /production/commands/instance-executions/assign`
- `POST /production/commands/instance-executions/:id/start`
- `POST /production/commands/instance-executions/:id/complete`
- `POST /production/commands/instance-executions/:id/cancel`
- `GET /production/commands/component-instances/:componentInstanceId/executions`

### Manufacturing Order Modal

Frontend:

- `apps/frontend/src/modules/production/components/ManufacturingOrderModal.tsx`

Current behavior:

- Selects a Component and Production BOM.
- Sends legacy `POST /production` payload through `productionApi.createOrder`.
- Uses client-generated `MO-*` order number.
- Does not select `ProjectComponentRequirement`.
- Does not show requirement remaining quantity.
- Does not bind to canonical `/production/commands/orders` in frontend.

Canonical target:

The Production Order form should start from ProjectComponentRequirement:

- project requirement
- Component definition
- required quantity
- produced/planned/remaining quantity
- released Revision/BOM basis
- production quantity to authorize

It should clearly explain that physical instances are created on PO release,
not on PO draft creation.

### Production Execution Board

Frontend:

- `apps/frontend/src/modules/production/components/ProductionExecutionBoard.tsx`
- `apps/frontend/src/modules/production/pages/ProductionCockpitPage.tsx`

Current behavior:

- Uses `ProductionOrder` rows.
- Computes execution stage from `order.stages`, `currentStageCode`, or
  fallback mapping.
- Computes progress from completed stages or hardcoded stage percentages.
- Material readiness uses BOM and material issue quantities.
- Table rows represent ProductionOrder/WO-like cards but are keyed by
  `order.id`, not `WorkOrder` or `ComponentInstanceExecution`.

Canonical issue:

Production instance execution is not visible. Operators cannot:

- see generated ComponentInstances for a ProductionOrder
- see instance code / serial sequence
- assign instances to a ProductionExecution run
- start/complete operation evidence per instance
- see ASSIGNED / RUNNING / COMPLETED evidence
- see physical lifecycle state `PLANNED`, `IN_PRODUCTION`,
  `PRODUCED_WAITING_QC`

### Production Order Detail / Workspace

Frontend:

- `OrderWorkspace` inside `ProductionCockpitPage.tsx`

Current behavior:

- Shows MO quantity, status, material readiness, stage progress, reservations.
- Has legacy actions:
  - start production
  - create component from MO
  - complete active stage
  - stage to yard
- Calculates remaining yard quantity from aggregate order quantity and yard
  placements keyed by `latest.component?.id`.

Canonical problems:

- `Tạo cấu kiện từ MO` is legacy and conflicts with canonical DOMAIN.4 where
  ComponentInstances are generated on ProductionOrder release.
- `Hoàn tất bước` completes stage-level evidence, not per-instance execution.
- `Chuyển thành phẩm ra bãi` is still aggregate quantity / component ID based;
  after DOMAIN.5E it should operate only on eligible physical instances after
  final QC.

### Production BOM Screens

Current API:

- `GET /production/boms`
- `POST /production/boms`

Canonical assessment:

Production BOM can remain as a materialized manufacturing BOM view, but
authoring Engineering BOM should happen under Components Revision/BOM. UI must
label legacy `/production/boms` as materialized/production BOM, not source of
engineering truth.

## Current QC UI

### API / DTO

Frontend:

- `apps/frontend/src/modules/qc/api/qc.api.ts`

Backend DTO:

- `createQcInspectionSchema` supports `componentInstanceId`
- `listQcInspectionsSchema` supports `componentInstanceId`
- `createNcrSchema` supports `componentInstanceId`

Current frontend DTO problem:

`QcInspectionRow` and `QcProductionQueueRow` do not expose:

- `componentInstanceId`
- instance code
- physical lifecycle state
- final QC eligibility reason

### QC Cockpit / Queue

Frontend:

- `apps/frontend/src/modules/qc/pages/QcPage.tsx`

Backend:

- `GET /qc/cockpit`
- `GET /qc/read-model/workspace`
- `QcCockpitRepository.findCompletedProductionOrders()`

Current behavior:

- Waiting QC queue is built from completed ProductionOrders.
- Create inspection payload uses:
  - `productionOrderId`
  - `componentId`
  - `projectId`
  - no `componentInstanceId`
- Quick approve finds an existing inspection by ProductionOrder or Component.

Canonical issue:

Final QC must target `ComponentInstance`, not Component definition or whole
ProductionOrder. Current UI can approve a completed PO without selecting a
physical instance. That will not drive DOMAIN.5E final state transitions because
the handoff requires `QcInspection.componentInstanceId` and final checklist.

### Inspection Detail / NCR

Current good foundation:

- Backend supports `componentInstanceId` on inspections and NCRs.
- Backend validates instance lineage when supplied.
- NCR records can carry defect data and instance lineage.

UI gap:

- UI does not show/select instance code.
- UI does not expose Rework / Scrap / Use-As-Is disposition as canonical
  physical decisions against a ComponentInstance.
- Current fast action `Tạo & duyệt đạt` is too broad for final QC because it is
  row-level ProductionOrder/Component based.

## Legacy Semantic Findings

| Finding | Location | Severity | Why |
| --- | --- | --- | --- |
| `Component.status` treated as physical lifecycle | Components contract, read-model repository, stock page | P0 | Confuses engineering definition with physical inventory |
| `STOCK` used as finished goods / inventory | Components overview/dashboard/stock | P0 | Finished Goods must come from ComponentInstance + QC evidence |
| `READY` used as QC passed | Components stock/list/dashboard | P0 | Canonical QC pass is `ComponentInstance.state = QC_PASSED` plus final QC evidence |
| `description.quantity` fallback still used | Components read-model repository | P1 | Acceptable legacy fallback, but should not drive new canonical rows |
| `COUNT(Component)` used as total inventory-like KPI | Components dashboard/read-model | P0 | Count of definitions is not count of physical components |
| Production progress from stages / aggregate quantity | Production execution board/workspace | P0 | Does not prove physical instance operation status |
| `createComponentFromOrder` action remains visible | Production workspace | P0 | Conflicts with DOMAIN.4 physical instance creation at release |
| Yard staging uses order quantity/component ID | Production workspace | P0 | Yard handoff must use finished eligible ComponentInstances |
| QC waiting queue from completed ProductionOrders | QC cockpit/read model | P0 | Final QC must be per ComponentInstance |
| QC quick approve lacks instance target | QC page | P0 | Cannot trigger DOMAIN.5E `QC_PASSED` state safely |
| `/production/boms` treated as authoring surface | Production/Components modal | P1 | Engineering BOM source should be Component Revision/BOM |
| Production material stock derived in frontend | Components Material Stock | P1 | V1 acceptable as audit warning, but should become backend read model |

## Canonical Screen Mapping

| Canonical Concept | Recommended UI Surface | Current Surface |
| --- | --- | --- |
| Component engineering definition | Components / Danh sách cấu kiện | Partially present |
| ProjectComponentRequirement | Components list/detail requirement section | Partially present through create/read model |
| Engineering Revision/BOM | Components BOM / detail | Present but mixed with Production BOM usage |
| ProductionOrder | Production / Lệnh sản xuất | Present, but not requirement-first |
| ComponentInstance | Production order detail instance list + Components Finished Goods | Missing in frontend |
| ComponentInstanceExecution | Production execution board per WorkOrder/run/instance | Missing in frontend |
| QCInspection / NCR | QC inspection workspace | Present, but mostly order/component level |
| Finished Goods eligibility | Components Finished Goods / Stock page | Missing; backend API exists |

## Components Changes Required

### P0

1. Redefine `Danh sách cấu kiện` as Component Definitions + Project
   Requirements.
2. Remove physical inventory language from definition list KPIs.
3. Migrate `Tồn kho cấu kiện` to `GET /components/instances/finished-goods`.
4. Stop using `Component.status` as source for `Tồn kho`, `Đã QC`, `READY`,
   finished/stock counts.
5. Add a physical instance / finished goods table with instance code, PO,
   requirement, project, state and QC evidence.

### P1

1. Keep `description.quantity` only as legacy fallback display, clearly not a
   new-data source.
2. Add Component detail sections:
   - Definition
   - Requirements
   - Revisions/BOM
   - Production Orders
   - Physical Instances
   - Finished Goods Eligibility
3. Label Production Material Stock as raw material custody, not Component
   Inventory.

### P2

1. Add instance lifecycle timeline visualization.
2. Add requirement coverage analytics: required, planned, produced,
   QC-passed, delivered, installed.

## Production Changes Required

### P0

1. Convert Production Order creation UI to use ProjectComponentRequirement as
   the primary source.
2. Display remaining requirement quantity before creating/authorizing a PO.
3. Add Generated Physical Instances section after PO release.
4. Add instance execution UI:
   - list WorkOrders
   - list eligible ComponentInstances
   - assign instances to ProductionExecution
   - start/complete/cancel instance execution rows
   - show ASSIGNED/RUNNING/COMPLETED per operation
5. Remove or hide `Tạo cấu kiện từ MO` for canonical requirement-bound orders.
6. Prevent UI from staging aggregate PO quantity to Yard; Yard staging should
   wait for Finished Goods instance eligibility.

### P1

1. Rename/clarify `/production/boms` as materialized Production BOM.
2. Add instance lifecycle state badges to Production order drawer.
3. Add operation progress based on `ComponentInstanceExecution`, not stage
   fallback percentage, when instance data exists.

### P2

1. Add batch operation UX for assigning serial ranges to WorkOrder runs.
2. Add shopfloor operator-friendly scanner mode for instance execution.

## QC Changes Required

### P0

1. Build Waiting QC queue from `ComponentInstance.state =
   PRODUCED_WAITING_QC`, not completed ProductionOrders.
2. Expose `componentInstanceId` and instance code in QC frontend DTOs.
3. Create final QC inspections with `componentInstanceId` and a FINAL
   checklist.
4. Disable broad ProductionOrder/Component quick approve for final QC.
5. Add QC disposition UI for:
   - Rework
   - Scrap
   - Use As Is
6. Ensure NCR forms show physical instance code, ProductionOrder, Project and
   Component definition.

### P1

1. Split QC views into:
   - process inspection
   - final component inspection
   - NCR/disposition
2. Add instance state badges in inspection detail.
3. Add final QC evidence panel showing why a component is or is not Finished
   Goods eligible.

### P2

1. Add defect analytics by instance operation/workstation/machine once
   execution evidence is consistently available.

## Finished Goods UI

Canonical backend source:

```text
GET /components/instances/finished-goods
```

Required frontend consumers:

- Components `Tồn kho cấu kiện`
- Components dashboard/KPIs that claim component inventory
- any Executive BI card using `Tồn kho cấu kiện` or `Tổng số lượng cấu kiện`
  as physical stock
- future Yard handoff selector

Recommended table columns:

- Instance code
- Component code/name/type/profile
- Project
- Requirement
- Production Order
- State (`QC_PASSED` / `USE_AS_IS`)
- Produced at
- QC passed at
- Final QC inspection / NCR evidence
- Current Yard state (future)

## API Mapping

| UI Need | Current API | Canonical API / Needed Source |
| --- | --- | --- |
| Create Component Definition + Requirement | `POST /components/foundation/definition-requirements` | Keep |
| List Component Definitions | `GET /components/read-model/list` | Refine semantics |
| List Requirements | `GET /components/foundation/requirements` | Use more visibly |
| List physical instances | `GET /components/foundation/instances` | Use in Production detail |
| List finished goods | Missing frontend | `GET /components/instances/finished-goods` |
| Create Production Order | `POST /production` | Prefer `/production/commands/orders` for canonical flow |
| Release PO / generate instances | Backend command exists | Needs frontend command integration |
| Assign instance execution | Not used | `POST /production/commands/instance-executions/assign` |
| Start/complete instance execution | Not used | `POST /production/commands/instance-executions/:id/start|complete` |
| Execution history per instance | Not used | `GET /production/commands/component-instances/:id/executions` |
| Create QC inspection | `POST /qc/inspections` | Keep, but must pass `componentInstanceId` for final QC |
| QC/NCR list filters | Backend supports `componentInstanceId` | Frontend DTO/UI must expose it |

## Deprecated UI Paths

Deprecate or relabel these paths/behaviors before canonical UI rollout:

- Components Stock logic based on `Component.status` and Yard placement by
  `component.id`.
- Production action `Tạo cấu kiện từ MO` for canonical orders.
- Production aggregate `stage-to-yard` UI for completed order quantity.
- QC quick approve from completed ProductionOrder without selected
  ComponentInstance.
- Components dashboard cards that present `COUNT(Component)` as physical stock.
- Frontend reliance on `/production/boms` as an Engineering BOM authoring
  equivalent.

## Keep-As-Is Screens

These can remain with minor labeling until later sprints:

- Components create modal: already canonical for definition + requirement.
- Components Material Stock: keep as raw material production custody, but do
  not call it Component Inventory.
- Production material reservations/issues/consumptions/ledger: remain valid
  material-flow screens.
- QC checklist management: valid as quality standard setup.
- QC inspection/NCR backend forms: schema supports instance lineage; UI needs
  better target selection.

## P0 Backlog

1. Components Stock must migrate to Finished Goods API.
2. Components dashboard/read-model physical counts must stop using
   `Component.status`/`COUNT(Component)`.
3. Production order creation must become requirement-first for canonical
   component manufacturing.
4. Production detail must expose ComponentInstances generated by release.
5. Production execution UI must call instance-execution assign/start/complete.
6. QC Waiting Queue must be ComponentInstance-based.
7. QC final inspection create/approve must include `componentInstanceId`.
8. Hide or replace legacy `createComponentFromOrder` and aggregate yard staging
   flows for canonical orders.

## P1 Backlog

1. Add Component detail canonical sections.
2. Add instance lifecycle badges/timeline in Components and Production.
3. Clarify Production BOM as materialized manufacturing BOM.
4. Add NCR disposition UI for rework/scrap/use-as-is against instances.
5. Move production material stock aggregation into backend read model.

## P2 Backlog

1. Scanner/batch assignment UX for physical operations.
2. Instance-level defect analytics by operation, machine, workstation, shift.
3. Cross-module Finished Goods -> Yard -> Delivery visual lineage.

## Recommended Implementation Order

1. **Components Finished Goods UI**
   - Add frontend API/hook for `GET /components/instances/finished-goods`.
   - Convert `Tồn kho cấu kiện` to physical instance rows.
   - Remove `Component.status` stock interpretation from that page.

2. **Components Definition List Semantics**
   - Retitle/list columns around engineering definitions and project
     requirements.
   - Keep requirement quantity explicit.

3. **Production Requirement-First Order Creation**
   - Add requirement selector and remaining quantity.
   - Prefer canonical command endpoint for new requirement-bound orders.

4. **Production Instance Execution UI**
   - Show generated instances.
   - Add assign/start/complete operations tied to WorkOrder/ProductionExecution.

5. **QC Instance Waiting Queue**
   - Source queue from `PRODUCED_WAITING_QC` instances.
   - Create final inspections with `componentInstanceId`.

6. **QC Disposition UI**
   - Rework / Scrap / Use-As-Is actions tied to instance-level NCR.

7. **Dashboard / Executive BI Migration**
   - Only after Components/Production/QC screens are semantically correct,
     migrate dashboard metrics to Finished Goods and instance lifecycle sources.

## Audit Verification

- Code changes: none
- Schema changes: none
- Migration: none
- Stage/commit: none
- `git diff --check`: required after documentation update
