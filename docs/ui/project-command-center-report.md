# Project Command Center Report

Date: 2026-06-30

## Scope

Sprint 40PROJ.5 adds the Project Detail `Điều hành` tab as an execution command center using the existing Industrial Cockpit UI foundation.

## Implemented

- KPI row:
  - Tổng tiến độ
  - Khối lượng hoàn thành
  - Đúng tiến độ
  - Chậm tiến độ
  - Nguy cơ chậm
  - Giá trị thực hiện
- Analytics:
  - Tiến độ theo thời gian
  - Cơ cấu tiến độ
  - Top hạng mục chậm
  - Công việc sắp tới
  - Cảnh báo dây chuyền
- CSS Grid Gantt view.
- Field photo/gallery area uses `CockpitEmptyState` until Project attachments are connected.

## Data Sources

- `GET /projects/runtime`
- Project WBS metadata bridge
- Project Financial read model
- Project Health read model

## Limitations

- Project command actions are advisory only.
- No new workflow engine or approval flow was introduced.

