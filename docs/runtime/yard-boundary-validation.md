# EPIC161 - Yard Boundary Validation

## Static Validation

Exact scans over `apps/backend-api/src/modules/yard/services/*` confirm:

- no `PrismaService`;
- no `this.prisma`;
- no direct `tx.component`;
- no direct `tx.productionOrder`;
- no direct `tx.componentTimeline`;
- no direct `tx.activityLog` or `tx.outboxEvent`.

`YardService.removeItem` retains the same orchestration and business outcome,
but delegates Component lookup, ProductionOrder project lookup, Component
`SHIPPED` update and ComponentTimeline creation to repository methods using the
same `YardTx`.

## Cross-module Boundary

No cross-module service is called inside the active transaction because that
would create an independent transaction and break atomicity. The modular
monolith uses explicit integration persistence methods in `YardRepository` for
this already-existing cross-module workflow. Business decisions remain in
`YardService`; repository methods only query or persist.

## Result

Repository Boundary: PASS. Cross-module direct Prisma access from Yard services:
zero.

