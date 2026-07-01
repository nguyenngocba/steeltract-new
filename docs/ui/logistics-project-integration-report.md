# Logistics Project Integration Report

## Receive Flow

When a dispatch order moves from `ARRIVED` to `RECEIVED`:

- Material dispatch lines create an inventory `EXPORT` transaction with `referenceModule = logistics-dispatch`.
- Material task allocations are updated:
  - `issuedQty += dispatch quantity`
  - `remainingQty = plannedQty - issuedQty`
- Component task allocations are marked `HANDED_OVER`.
- Component project/status is updated to project delivery state.
- Activity log action `PROJECT_DISPATCH_RECEIVED` is written.

## Project Workspace

The dispatch API exposes project/task/item/timeline data so project-side views can consume in-transit and received dispatch state without mock data.

## Limitation

Project detail table columns for dispatch summaries are prepared by the dispatch read model but still need a narrow UI pass to expose per-material/per-component in-transit totals directly in every project detail table.
