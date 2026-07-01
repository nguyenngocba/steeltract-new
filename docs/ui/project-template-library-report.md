# Project Template Library Report

Sprint: 40PROJ.8
Date: 2026-06-30

## Scope

Added a persisted Project Template Library for low-data-entry project creation.

## Backend

- Added `ProjectTemplate` and `ProjectTemplateStatus`.
- Added migration `20260630113000_project_template_library`.
- Seeded default template `TPL-NX-5N - Nhà xưởng 5 nhịp`.
- Added template APIs:
  - `GET /projects/templates`
  - `POST /projects/templates`
  - `PATCH /projects/templates/:templateId`
  - `POST /projects/templates/:templateId/duplicate`
  - `POST /projects/templates/:templateId/publish`
  - `POST /projects/templates/:templateId/deactivate`
  - `POST /projects/templates/:templateId/default`
  - `GET /projects/templates/:templateId/export`
  - `POST /projects/templates/import`

## Template Data

Template structure stores:

- WBS tasks
- parent task keys
- dependency keys and FS/SS/FF type
- duration days
- suggested resources
- suggested materials
- suggested components

## Default Template

The seeded template represents a steel factory workflow:

- Chuẩn bị
- Móng
- Gia công
- Sơn
- Vận chuyển
- Lắp dựng
- Hoàn thiện
- QC
- Bàn giao

## Frontend

- Added Projects `Templates` tab.
- Added template KPI cards, template table, default template preview, resources preview, and smart output panel.
- Added JSON editor dialog for template create/edit.

## Permissions

- Read endpoint uses `projects.read`.
- Mutation endpoints use `projects.write`.
- This maps Admin/PM capability through existing RBAC. A dedicated template-specific permission can be added later if needed.

## Limitations

- Import/export APIs exist; frontend currently focuses on create/edit/duplicate/publish/deactivate/default.
- Template editing uses JSON for speed and precision. A visual WBS-template editor remains future work.
