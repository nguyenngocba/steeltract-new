# Project Site Mode Report

Date: 2026-07-01

## API

- Added `POST /projects/:id/site-update`.

## UI

- Project Detail has a new `Công trường` tab.
- Site Mode shows only:
  - task selector
  - installed quantity stepper
  - used material stepper
  - QC status
  - issue flag
  - note
  - submit button

## Automation

- Backend updates task progress, status, actual dates, inspection status, description note, and ActivityLog.

## Remaining Work

- Add direct field photo upload in Site Mode using the Attachment engine.
