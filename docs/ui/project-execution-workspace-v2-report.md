# Project Execution Workspace V2 Report

Date: 2026-06-30

## Scope

Sprint 40PROJ.4 upgrades the Projects module from a project information dashboard toward an execution workspace while preserving the existing Industrial Cockpit design system.

No Prisma schema change, migration, or new UI package was introduced.

## Implemented

### Projects List Dashboard

- Kept the existing KPI strip.
- Added runtime-backed analytics panels:
  - Tiến độ theo thời gian with Kế hoạch / Thực tế / Dự báo series.
  - Giá trị theo thời gian with contract, delivered/accepted proxy, and executed cost/value series.
  - Trạng thái công việc from WBS/task status or project status fallback.
  - Cảnh báo & Rủi ro from Project Health read model.
- Empty states render when runtime data is not available.

### Project Detail Workspace

The Project Detail drawer now includes:

- Tổng quan
- Vật tư
- Cấu kiện
- Tiến độ
- Chi phí
- Tài liệu
- Nhật ký

The Overview tab now includes:

- Project financial KPI strip.
- Project health warnings/actions.
- Tiến độ theo hạng mục table.
- Công việc sắp tới table.
- Hình ảnh công trường empty state.
- Horizontal project milestone timeline.

## Data Sources

- `GET /projects/runtime`
- `GET /projects/:id/wbs`
- existing Project runtime financial, health, material, component, return request, and WBS read models
- existing Inventory Return Request workflow for project material returns

## Limitations

- Project photos/documents are displayed as empty states until Project attachment linking is implemented.
- Cost charts use current read-model values; labor, machine, and other costs are zero until those data sources exist.
- WBS persistence is implemented as a no-migration bridge using existing `tasks` records with SteelTrack Project WBS metadata in `Task.description`.

