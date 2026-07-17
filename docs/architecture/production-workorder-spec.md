# Production Work Order Specification Assessment

Date: 2026-07-17  
Status: **BLOCKED FOR ALIGNMENT**

## Intended Aggregate

The architecture document intends:

```text
Work Order (batch/project release)
  -> N Production Orders (component or lot execution)
       -> N Production Stages
            -> N Production Tasks
```

This model can represent Cắt, Hàn, Sơn and Đóng gói as routed stages per child
Production Order. Creating separate Work Order rows for each stage would
duplicate `ProductionStage` and is not recommended.

## Current Implementation

The active `WorkOrder` is standalone:

- no `productionOrderId` or reverse relation;
- no `projectId`, routing or work-center relation;
- status is an unconstrained string;
- no update timestamp, result quantities or audit/outbox relation;
- repository supports only create, release and unbounded list;
- service uses `any`, is not registered in `ProductionModule`, and has no
  controller route.

Therefore “one Production Order has many Work Orders” is not supported by the
current Blueprint or schema. The approved architecture states the inverse:
one Work Order groups many Production Orders.

## Required Specification

Before schema/code changes, approve:

1. Parent ownership: `WorkOrder 1 -> N ProductionOrder`.
2. Project and product/component scope.
3. Typed Work Order lifecycle and transition matrix.
4. Quantity unit and rollup rules.
5. Whether routing is inherited from BOM into Production Stages.
6. Release idempotency and atomic Outbox events.
7. Server-side list/detail/progress read models.
8. Snapshot projection and canonical event namespace.

## Additive Implementation Shape

Likely additive work, subject to approval:

- nullable `ProductionOrder.workOrderId` relation;
- typed or validated Work Order status;
- timestamps and optional project relation;
- Work Order command repository transaction and canonical Outbox;
- bounded read model that aggregates child Production Orders;
- compatibility for existing standalone Work Order rows.

No migration or API was created by EPIC186 assessment.

