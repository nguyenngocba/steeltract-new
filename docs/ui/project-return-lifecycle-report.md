# Project Return Lifecycle Report

Date: 2026-07-01

## Material Return

- Material return continues to use the existing Inventory Return lifecycle:
  - Requested
  - Received
  - Inspected
  - Disposition / stock posting

## Component Return

- Project component return currently clears `projectId`, clears installation mapping, sets component back to `READY`, and writes timeline/activity logs.

## Gap

- The richer component lifecycle requested by operations is not yet first-class:
  - Return Requested
  - In Transit
  - At Yard
  - Inspection
  - Ready
  - Repair
  - Scrap

## Recommendation

- Add persisted component return/disposition records before adding repair/scrap UI.
