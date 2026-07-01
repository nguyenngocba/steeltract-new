# Project Auto WBS Report

Date: 2026-07-01

## API

- Added `POST /projects/:id/wbs/generate`.

## Behavior

- Generates real `ProjectTask` rows:
  - Root
  - Nhịp
  - Tầng if floors > 1
  - Trục

## Inputs

- rootName
- spans
- axes
- floors
- startDate
- taskDurationDays

## Notes

- No fake data is generated.
- The generated rows are persisted ProjectTask domain rows.
