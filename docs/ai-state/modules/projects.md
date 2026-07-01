# Projects Module

## Scope

Projects covers project master data, project status visibility, material outbound context, production/QC/Yard grouping, and future contract/milestone/budget management.

## Current Status

In Progress.

## Implemented Features

* Project data is used by Inventory outbound workflows.
* Dashboard cockpit aggregates project totals and active project status.
* QC analytics can group by project when production/component/project links are available.
* Project runtime separates shipped, delivered, and installed component states.
* Project runtime exposes component rows linked by `components.projectId`.
* Project UI includes the `Cấu kiện công trình` tab with project/status filters, summary cards, and component date/cost columns.
* Project Components tab can confirm delivery (`Xác nhận nhận hàng`) for `SHIPPED` components and confirm installation (`Xác nhận lắp đặt`) for `DELIVERED` components.
* Project Components delivery/install actions use the authenticated frontend API client and surface success/error feedback.
* Clicking a Project Component row opens the existing Component detail modal on the Components list through route state.
* Installation confirmation opens a required mapping modal for Khu vực, Trục, Tầng, and Vị trí.
* Project Components table displays installation Zone, Axis, Level, and Position.
* Project component Actual Cost reflects `Component.actualCost`, which is updated by Component Costing recalculation.
* Sprint 20A adds a read-only Project Cost summary API that aggregates project-linked Components and direct project Production Orders.
* `GET /projects/:id/cost` returns project material cost, component count, production order count, component cost summaries, and production order cost summaries.
* Current project UI follows the Inventory visual baseline from the cross-module cockpit refresh.
* Sprint 12B standardizes Projects page header, KPI strip, Project runtime cards, Components runtime cards, filter bar, table shell, and empty state with shared module UI primitives.
* Sprint 12C adds sticky filters, frontend KPI click-to-filter for Projects/Project Components, and standard `ModuleDetailDrawer` usage for project detail.
* Sprint 40PROJ.1 refactors Projects into an Inventory-aligned cockpit using `CockpitKpiCard`, `CockpitChartCard`, `CockpitTableShell`, `DataTablePagination`, `CockpitEmptyState`, `CockpitRecentList`, and `CockpitStatusList`.
* The Projects cockpit now includes real-runtime KPI cards, status/progress/value analytics, soon-to-complete projects, delayed projects, recent activity, and an Inventory-style project table.
* Clicking a project row opens a Project Detail workspace drawer with tabs for Tổng quan, Vật tư, Cấu kiện, and Tiến độ.
* Project material and component workspace tabs use existing `GET /projects/runtime` data. Material return posts to the shared Inventory Return workflow, while Component Return uses the current Project/Yard handoff behavior.
* Sprint 40PROJ.3 adds Projects runtime read models for WBS, financial summaries, project health, and return requests without schema changes.
* Project Detail `Tiến độ` now renders a WBS tree grid with expand/collapse from derived Project/Component/Task/Material runtime data.
* Project Detail `Tổng quan` now shows Project Financial KPI cards and Project Health warnings/actions.
* Project material return creates an Inventory `ReturnRequest` using `flowType = SITE_RETURN`; requested returns remain pending against Project runtime, and received returns create an Inventory `RETURN` transaction.
* Sprint 40PROJ.4 adds no-migration Project WBS CRUD endpoints using existing `Task` rows with SteelTrack WBS metadata in `Task.description`.
* Project Detail now includes Tổng quan, Vật tư, Cấu kiện, Tiến độ, Chi phí, Tài liệu, and Nhật ký tabs.
* Project Detail `Tiến độ` now supports add task, add subtask, edit, delete, move up/down, change parent, expand/collapse, and task detail drawer.
* Project Detail exposes task resource-link tables for materials and components from WBS metadata.
* Projects dashboard now includes progress trend, value trend, work status, and risk/status analytics using runtime read models or empty states.
* Project Detail `Chi phí` adds cost control KPIs and cost/profitability charts from the financial read model.
* Project Detail `Nhật ký` and timeline panels use WBS task and return request runtime rows.
* Sprint 40PROJ.5 fixes WBS hierarchy creation by adding a `Công việc cha` tree select with full path labels and backend circular-parent validation.
* Project Detail now includes an `Điều hành` tab with execution KPIs, trend analytics, dependency warnings, CSS Grid Gantt, upcoming work, and field-photo empty state.
* WBS task metadata now stores predecessors/successors, dependency type, material/component allocation rows, task revenue, labor cost, machine cost, other cost, and task-level cost/profit traceability.
* Task Detail now displays dependencies, financial KPIs, and material/component allocation tables with action entry points.
* Sprint 40PROJ.6 adds scheduling read-model calculations for WBS dependencies, including scheduled start/finish, forecast finish, baseline variance, and cascade delay.
* WBS task metadata now also stores baseline dates, worker loading, machine loading, and inspection/acceptance status.
* Project Detail `Tiến độ` now uses a three-pane layout: WBS tree, task scheduling/detail pane, and task resource/action/risk pane.
* Project Command Center surfaces resource shortages, procurement readiness warnings, dependency chain warnings, and inspection/handover counters.
* Sprint 40PROJ.7 replaces active WBS persistence from `Task.description` JSON metadata to normalized Project execution tables.
* `GET /projects/:id/wbs`, WBS CRUD/move/delete endpoints, and `GET /projects/runtime` now read/write `ProjectTask` and related dependency/allocation/resource/inspection/cost tables while preserving the existing frontend response shape.
* Migration `20260630100000_project_task_domain` backfills legacy SteelTrack WBS metadata into `project_tasks` and related tables without deleting old `tasks` rows.
* Project task changes now create activity-log event foundation rows for task, material, cost, and inspection changes.
* Sprint 40PROJ.8 adds persisted Project Template Library using `ProjectTemplate`.
* The Projects module now exposes a `Templates` workspace with template KPIs, table, default preview, suggested resources, and actions for create/edit/duplicate/publish/deactivate/default.
* Project creation can inherit a template and generate normalized ProjectTask WBS, dependencies, scheduled/baseline dates, resources, resolvable material/component allocations, and initial task cost rows.
* The Project Progress workspace now includes a Quick Update panel for Simple Mode-style field updates: installed components, used materials, QC pass, incident flag, and notes.
* Sprint 40PROJ.9 repairs Projects usability and runtime integration after template/project API recovery.
* `/projects/templates` is now a concrete route synchronized across AppRouter and both sidebar navigation configs.
* Project Detail uses a centered cockpit drawer instead of a full-height side drawer and includes a `Sửa công trình` action.
* `PATCH /projects/:id` updates project setup fields without editing runtime/progress/log data directly.
* Project Component Return is available from Project Detail; returned components clear project assignment, move back to `READY`, and write ComponentTimeline plus ActivityLog rows.
* `GET /projects/runtime` includes `documents` from Attachments and `logs` from ActivityLog so Projects `Tài liệu` and `Nhật ký` tabs use real data or empty states.
* Top-level `Chi phí`, `Tài liệu`, and `Nhật ký` workspaces no longer render placeholders; they use financial read models, project attachments, and activity logs.
* WBS Task modal defaults to Simple Mode with task name, parent tree select, duration, smart date suggestion, and steel erection suggestions; Advanced Mode keeps full scheduling/resource/cost controls.
* Sprint 40PROJ.10 adds template-driven task rules through `ProjectTemplate.structure.rules` or derived template task defaults.
* Task Create `Tự đề xuất` now fills duration, materials, components, workers, machines, checklist/inspection hints, and dates from template rules instead of hardcoded suggestions.
* Project Detail `Tiến độ` now supports Auto WBS generation for root/span/floor/axis task trees and bulk task updates for parent/status/date/owner/checklist/resources.
* Project Detail includes a `Công trường` Site Mode tab for simple field updates: installed quantity, used quantity, QC result, issue flag, note, and project photo timeline visibility.
* Site Mode updates write `PROJECT_SITE_UPDATE` ActivityLog rows and update task progress/status through existing ProjectTask update logic.
* Project Detail documents support category filters for Hợp đồng, Bản vẽ, Biện pháp thi công, Nghiệm thu, Biên bản, Hình ảnh, and Khác.
* Project Command Center includes executive health panels for forecast finish, material shortages, component shortages, and labor/equipment shortages from real runtime data.
* Project material rows expose allocation reconciliation fields: allocated, used, pending return, returned, and available return.
* Project material Pending Return quantities link to the Inventory Return Requests workspace with project/material filters so operators can process requested returns without hunting through Inventory.

## Database Models

Known operational tables:

* `Project`
* `ProjectTask`
* `ProjectTaskDependency`
* `ProjectTaskMaterialAllocation`
* `ProjectTaskComponentAllocation`
* `ProjectTaskResource`
* `ProjectTaskInspection`
* `ProjectTaskCost`
* `ProjectTemplate`

Project also participates through related Inventory, Production, Components, QC, and Yard records.

## API Endpoints

Currently documented through active integrations:

* Project APIs used by the frontend project and Inventory outbound workflows.
* `GET /projects/runtime` includes project-linked components, installation location fields, and ready/shipped/delivered/installed counters.
* `GET /projects/:id/cost`
* `PATCH /projects/:id`
* `POST /projects/:id/components/:componentId/return`
* `GET /projects/:id/wbs`
* `POST /projects/:id/wbs`
* `PATCH /projects/:id/wbs/:taskId`
* `PATCH /projects/:id/wbs/:taskId/move`
* `DELETE /projects/:id/wbs/:taskId`
* `POST /projects/:id/wbs/generate`
* `PATCH /projects/:id/wbs/bulk`
* `POST /projects/:id/site-update`
* `POST /inventory/returns` for Project material return requests (`flowType = SITE_RETURN`)
* `PATCH /inventory/returns/:id/receive` for receiving returned Project material back into Inventory
* `PATCH /inventory/returns/:id/reject` for rejecting a requested Project material return and clearing pending return quantity without stock increase
* `GET /logistics/dispatch-orders` for Project-linked dispatch read model and project dispatch state lookup
* `POST /logistics/dispatch-orders/suggest` for task allocation based dispatch suggestions
* `PATCH /logistics/dispatch-orders/:id/receive` for dispatch receive reconciliation into Project task allocations and Inventory dispatch transactions
* `GET /projects/templates`
* `POST /projects/templates`
* `PATCH /projects/templates/:templateId`
* `POST /projects/templates/:templateId/duplicate`
* `POST /projects/templates/:templateId/publish`
* `POST /projects/templates/:templateId/deactivate`
* `POST /projects/templates/:templateId/default`
* `GET /projects/templates/:templateId/export`
* `POST /projects/templates/import`
* `POST /components/:id/deliver`
* `POST /components/:id/install`
* `GET /dashboard/cockpit`
* `GET /runtime/operational-workflow`

## Routes

* `/projects`

## Remaining Tasks

* Add persisted project contract fields.
* Add milestones.
* Add project material budgets.
* Use Sprint 20A Project Cost summary as the backend foundation for Sprint 20C Project Cost Control.
* Add planned/actual schedule baselines.
* Add upload/manage UI for project document and photo attachments; current Projects workspace reads existing attachment rows.
* Validate the Project Pending Return click-through into `/inventory/returns` and confirm the Inventory operator can receive/reject from the queue.
* Validate Sprint 40PROJ.7 migration on a database containing legacy WBS metadata and compare old WBS row counts with new `project_tasks`.
* Add dedicated link/unlink pickers for task materials, components, dependencies, workers, and machines.
* Add persisted milestone and baseline version history so timeline/status no longer derives milestones from runtime progress.
* Add workflow actions for inspection, acceptance, handover, schedule approval, and resource allocation approval.
* Extend Project Component Return with Yard receiving/rework/disposition statuses beyond the current `READY` return handoff.
* Add a dedicated active component detail route if Project component row drill-down should use `/components/:id` instead of the existing list modal.
* Add visual WBS template builder instead of JSON template editing.
* Wire template import/export actions into the frontend Templates workspace.
* Add full Site Mode and task-level Smart Return posting.
* Add a visual admin editor for template task rules.
* Add direct Site Mode photo upload and bind uploaded photos to the selected task/site update.
* Add guarded bulk delete approval before enabling destructive task batch operations.
* Extend Project Component Return with formal Yard receiving/rework/repair/scrap lifecycle records.
* Add first-class persisted pending return quantity if Project material return reconciliation needs historical snapshots instead of runtime derivation from ReturnRequest rows.
* Promote project customer/start/handover/contract values from serialized description into first-class Project fields.
* Expose Logistics dispatch summaries in Project Detail material/component rows: `Đang vận chuyển`, `Đã nhận`, and `Ngày nhận`.
