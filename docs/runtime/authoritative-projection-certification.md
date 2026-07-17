# Authoritative Projection Certification

## AUTHORITATIVE

- ProductionOrderSummary: new canonical order events.
- WorkOrderSummary: new canonical work-order events.
- ProductionDashboard: per-order facts, not aggregate KPI semantics.
- OperatorWorkQueue: new canonical work-order events.
- ComponentSummary.
- CurrentReleasedRevision.
- RevisionHistory.
- EngineeringBOMView.
- ReleaseTimeline.
- ReservationProjection for reserve/release facts.
- ComponentUsage.
- ReleasedComponentCatalog.

## NON-AUTHORITATIVE

- ProductionTimeline: `production.execution.*` publisher is absent.
- ProductionExecution: publisher absent.
- MaterialAvailability: retained history lacks canonical balance facts.
- LocationBalance: projection identity is not a location bucket.
- StockMovementSummary: retained compatibility history lacks canonical fields.
- ProductionMaterialStatus: cumulative balance is incomplete on some issue paths.
- ProductionVsInventory: Inventory historical side is incomplete.
- OpenReservations: issue fulfillment is not represented as close/release.

## Other Domain Streams

- QC inspection completion: authoritative for newly emitted completion facts.
- QC NCR: non-authoritative because defect/reason codes are absent in the domain model.
- QC disposition: non-authoritative; no publisher.
- Yard placement: authoritative for newly emitted placement facts.
- Yard movement: non-authoritative for full source location.
- Yard loading: non-authoritative; no publisher.
- Projects and Logistics canonical streams: non-authoritative; no publishers.

Certification is event-stream based. It does not use aggregate reads or infer
facts from UI/read-model data.
