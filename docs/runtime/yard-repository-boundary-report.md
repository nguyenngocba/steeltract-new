# EPIC160 - Yard Repository Boundary Audit

## Findings

`YardController -> YardService -> YardRepository` is the registered path and
controllers contain no persistence logic. `YardRepository` owns Yard model
queries and transaction creation.

Boundary violations remain in `YardService.removeItem`:

- transaction-client access to `component.findUnique`;
- transaction-client access to `productionOrder.findUnique`;
- transaction-client access to `component.update`;
- transaction-client access to `componentTimeline.create`.

This is direct persistence from a service and cross-module ownership. It also
couples Yard removal to Component status semantics.

## Transaction Assessment

Placement, move and removal rows plus slot occupancy and activity rows are
transactional. Domain events are emitted only after that transaction returns.
`logActivity` also asks `EventBusService` to persist audit Outbox data without
passing the active transaction client. Therefore the complete business mutation
and Outbox contract is not atomic.

## Additional Findings

- `apps/backend-api/src/modules/yard/controllers/yard.controller.ts` is an
  unregistered duplicate controller with placeholder `getYards/getTrucks`
  service methods returning empty arrays. It is orphan code, not an active API.
- Repository includes are broad: zones include all rows and slots; slots include
  every active placement; placement detail includes the latest 20 movements.
- Repository coverage is approximately 60%, not enterprise-compliant.

## Recommendation

EPIC161 should retain Yard business rules in the service, move all persistence
behind repositories, define a Component/Dispatch command boundary, and insert
canonical Outbox events in the same repository transaction.

