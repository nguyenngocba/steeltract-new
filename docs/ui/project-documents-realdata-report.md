# Project Documents Real Data Report

Date: 2026-07-01

## Data Source

- `attachments`
- `attachment_versions`
- `attachment_links`

## Runtime

- `GET /projects/runtime` now returns project document rows from project-linked attachments.
- Document rows include original filename, category, source, file size, project linkage, public URL, and created date.

## UI

- Replaced the Documents placeholder with:
  - document KPIs
  - document table
  - image gallery for `image/*`
- Project Detail `Tài liệu` tab uses the same real attachment rows filtered by project.

## Empty State

- If no project attachments exist, the UI renders `CockpitEmptyState`.
