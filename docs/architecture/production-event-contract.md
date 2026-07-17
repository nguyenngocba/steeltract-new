# Production Event Contract

Date: 2026-07-17  
Status: **DOMAIN FACTS APPROVED - ENVELOPE/VERSIONING DEFERRED TO ADS004**

## Production Order Facts

Existing canonical events remain authoritative:

- `production.order.created`
- `production.order.released`
- `production.order.ready`
- `production.order.started`
- `production.order.paused`
- `production.order.resumed`
- `production.order.completed`
- `production.order.closed`
- `production.order.cancelled`

Every payload minimally identifies `productionOrderId`, `orderKind`, the
released `componentRevisionId`/BOM reference, resulting state and aggregate
version. Legacy `production.started`, `production.completed` and
`production.delayed` are compatibility inputs only.

## Work Order Facts

- `production.work-order.created`
- `production.work-order.ready`
- `production.work-order.started`
- `production.work-order.paused`
- `production.work-order.resumed`
- `production.work-order.blocked`
- `production.work-order.completed`
- `production.work-order.cancelled`

Payloads identify Production Order, Work Order, routing operation, resulting
state and aggregate version.

## Execution Facts

- `production.execution.started`
- `production.execution.paused`
- `production.execution.resumed`
- `production.execution.completed`
- `production.execution.aborted`

Execution facts include run, Work Order, work center/machine references and
timestamps, but no foreign full entities.

## Completion Facts

- `production.completion.recorded`
- `production.completion.reversed`
- `production.completion.finalized`

The payload carries completion record id, Order/Work Order/run ids, quantity,
unit, cumulative Production totals and aggregate version. QC classification is
not included as Production-owned truth.

## Scrap Facts

- `production.scrap.posted`
- `production.scrap.reversed`

`production.scrapped` is not canonical. Scrap facts identify the disposition,
quantity/unit, source Order/Work Order/run, reason and whether an owner command
to Inventory is required. Inventory publishes its own resulting stock fact.

## Rework Facts

- `production.rework.accepted`
- `production.rework.rejected`
- `production.rework.completed`

The accepted fact identifies the QC NCR/request, original Production Order and
new `REWORK` Production Order. Normal `production.order.*` events still describe
the linked rework order lifecycle; rework facts provide cross-context intent
without replacing them.

## Material Facts

The approved `production.material.reserved`, `released`, `issued`, `consumed`
and `returned` events remain unchanged. Consumption excludes Scrap. Inventory
stock facts remain Inventory-owned.

ADS004 must finalize event envelope, schema versions, correlation/causation,
subscriber matrix, replay policy and compatibility guarantees.

