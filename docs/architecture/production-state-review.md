# ADS003 Production State Review

Date: 2026-07-17  
Status: **DECISION APPROVED; IMPLEMENTATION NOT STARTED**

## Decisions Locked

| Question | Decision |
| --- | --- |
| Is `READY` a primary state? | Yes. It is an admission state; current readiness remains a projection and Start revalidates it. |
| When has Production started? | At the atomic `StartProductionOrder` commit that starts the first eligible Work Order/run. |
| When can Reservation begin? | Draft demand after Order `RELEASED`; allocation fact begins only on `ReserveMaterial`. |
| Does Completion close the Order? | No. Final completion moves to `COMPLETED`; close is a separate gated command. |
| Is Scrap a state or command? | A separate disposition aggregate with draft/post/reversal commands; never folded into Consumption. |
| Where does Rework return? | It does not rewind the original Order. It creates a linked `REWORK` Order starting at `DRAFT`. |
| How do Work Orders relate? | One Production Order coordinates `1:N` Work Orders generated from frozen routing. |
| Is Work Order lifecycle independent? | Operationally yes, with its own version/transitions, constrained by parent and routing dependencies. |
| How is partial completion handled? | Append completion records; only a separate final command transitions the Order. |
| Who owns rejected quantity? | QC. Production reads it as a projection and owns only execution/completion/scrap/rework facts. |

## Existing Model Review

- Existing Production Order lifecycle and `production.order.*` names remain
  compatible with ADS003.
- Existing `ProductionStage` approximates routing execution but does not yet
  implement the approved Work Order relationship/run model.
- Current standalone `WorkOrder` is not connected to Production Order and is
  not the ADS003 aggregate implementation.
- Existing `scrapQty` inside Consumption is compatibility data; ADS003 does not
  reinterpret or migrate it.
- `PLANNED`, `DELAYED` and legacy events remain compatibility-only.

## Implementation Gates

ADS003 does not authorize code, API or schema changes. Before implementation:

1. ADS004 must finalize event envelopes, versions, subscriber contracts and
   replay behavior.
2. A Production implementation RFC must define additive Work Order/Execution,
   completion, Scrap and Rework persistence plus legacy compatibility.
3. The RFC must define quantity-unit precision and quantity-change authority.
4. Existing `ProductionStage`, standalone `WorkOrder` and Consumption scrap
   records require explicit migration/read compatibility, never silent mapping.
5. Tests must cover concurrency, partial completion, atomic finalization,
   material reconciliation, Scrap reversal and linked Rework traceability.

## Conclusion

```text
ADS003 Production State Machine: APPROVED
Code/API/schema implementation: NOT AUTHORIZED
Legacy migration: NOT AUTHORIZED
Next decision: ADS004 Cross-module Event Contract
```

