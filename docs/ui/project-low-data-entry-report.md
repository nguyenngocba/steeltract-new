# Project Low Data Entry Report

Sprint: 40PROJ.8
Date: 2026-06-30

## Objective

Reduce project creation friction for field and operations users.

## Create Project Flow

The create project dialog now captures only the essential operational fields:

- Mã công trình
- Tên công trình
- Khách hàng
- Địa điểm
- Ngày khởi công
- Ngày bàn giao
- Giá trị hợp đồng
- Template
- Loại
- Trạng thái
- Ghi chú

When a template is selected, backend creates:

- Project master row
- ProjectTask WBS rows
- baseline/scheduled dates from template durations
- dependency rows
- suggested resource rows
- resolvable material/component allocation rows
- initial project task cost row

## Scheduling Rules

- Template task start dates are derived from the project start date and predecessor duration.
- Handover date is applied to the final task finish dates when provided.
- Dependency metadata is persisted as `ProjectTaskDependency`.

## Data Rules

- Suggested materials/components are resolved only if a matching existing `InventoryItem` or `Component` exists by id/code.
- Missing suggested materials/components are kept in task descriptions as guidance and do not create fake master data.

## Limitations

- Project contract fields still live in generated `Project.description`; dedicated Project contract columns remain a future hardening task.
- Template application does not create procurement requests, inventory reservations, or yard workflows yet.
