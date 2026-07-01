# Project Edit Report

Date: 2026-07-01

## Backend

- Added `PATCH /projects/:id`.
- Update payload supports operational master fields:
  - name
  - status
  - customerName
  - location
  - projectType
  - startDate
  - handoverDate
  - contractValue
  - templateId
  - description

## Frontend

- Project Detail header now includes `Sửa công trình`.
- Edit dialog allows updating master/project setup information only.

## Non-Editable Runtime Fields

- Runtime progress, WBS logs, cost actuals, task activity, and workflow events are not edited directly.
