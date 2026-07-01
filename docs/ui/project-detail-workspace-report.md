# Sprint 40PROJ.1 – Project Detail Workspace Report

Date: 2026-06-30

## Scope

The Project detail drawer was refactored into a compact project workspace inside:

* `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`

This is a frontend-only workspace using existing `GET /projects/runtime` data.

## Entry Point

Flow:

```text
Projects List
↓
Click project row
↓
Project Detail Drawer
```

The drawer uses the existing `ModuleDetailDrawer` foundation and cockpit child widgets.

## Tabs

### Tổng quan

Shows:

* Project code
* Customer/owner
* Location
* Planned start/end
* Status
* Progress
* Contract value
* Component count
* Material issue count
* KPI cards
* Recent timeline

### Vật tư

Shows material runtime grouped by material:

* Mã vật tư
* Tên vật tư
* Đơn vị
* Đã xuất
* Đã sử dụng
* Tồn tại công trình
* Giá trị

Analytics:

* Top vật tư sử dụng
* Giá trị vật tư theo nhóm

Actions:

* Xuất vật tư
* Trả vật tư

The return action is intentionally UI-only feedback in this sprint because no formal Project Return API exists yet.

### Cấu kiện

Shows project-linked components:

* Mã cấu kiện
* Tên cấu kiện
* Trạng thái
* Khối lượng
* Ngày cấp
* Hạng mục / vị trí lắp đặt

Analytics:

* Cấu kiện theo trạng thái
* Cấu kiện theo hạng mục

Actions:

* Xuất cấu kiện
* Trả cấu kiện

The existing delivery and installation flows remain available from the Projects Components tab. Return remains a documented future workflow.

### Tiến độ

Shows a derived hierarchy:

```text
Hạng mục
↓
Công việc
↓
Linked resources
```

Because the current schema does not include persisted project tasks/milestones, this workspace derives tasks from real project-linked components and material activity.

## Data Sources

The workspace uses existing runtime data:

* `ProjectRuntimeRow`
* `ProjectMaterialRuntime`
* `ProjectComponentRuntime`

No additional API, schema, or workflow changes were made.

## Known Limitations

* No persisted project task/milestone model yet.
* No formal project material return endpoint yet.
* No formal project component return endpoint yet.
* No project document/photo foundation inside this drawer yet.
* Component detail still routes to the existing Components list/modal workflow rather than a dedicated `/components/:id` route.

## Verification

* `pnpm -C apps/frontend build` passed.
* `pnpm -C apps/backend-api build` passed.
