# ADS004 Final Review

Date: 2026-07-17  
Status: **APPROVED - ARCHITECTURE GATE COMPLETE**

## Review Result

ADS004 fixes canonical name, version, sole publisher, subscriber permissions,
payload schema, idempotency, ordering, retry and projection impact for
Inventory, Components, Production, QC, Projects, Yard and Logistics.

## Duplicate And Ownership Review

| Check | Result |
| --- | --- |
| Same fact has two canonical names | PASS after alias rejection table |
| Same event has two publishers | PASS; one AD-015 owner per event |
| Subscriber writes publisher aggregate | FORBIDDEN by governance |
| Production material event mutates Inventory | FORBIDDEN by AD-018 |
| Component release ambiguity | RESOLVED as `component.revision.released` |
| Production Issue/Return ambiguity | RESOLVED as `production.material.issued/returned` |
| Scrap naming/ownership | RESOLVED as `production.scrap.posted/reversed` |
| Yard item naming | RESOLVED as `yard.item.*` |
| Logistics owner prefix | RESOLVED as `logistics.shipment.*` |
| Versioning/replay policy | PASS |

## Compatibility Findings

The running code still contains legacy/internal names such as
`inventory.transaction.created`, `component.updated`, `production.started`,
`production.completed`, `production.staged.to-yard`, `yard.item.removed` and
`logistics.dispatch.changed`. ADS004 does not change them. They require focused,
backward-compatible implementation and retirement plans; they are not approved
as alternate canonical facts.

## Architecture Sequence

```text
AD-015 Domain Ownership
  -> AD-016 Component State Machine
  -> AD-017 Production State Machine
  -> AD-018 Production-Inventory Application Contract
  -> AD-019 Cross-module Event Contract
```

## Implementation Readiness

Architecture decision work is complete. Implementation may now be planned in
bounded RFCs, but ADS004 itself authorizes no code, API, schema or data change.
Recommended sequence:

1. Component aggregate/revision implementation.
2. Production Work Order/Execution/Completion/Scrap/Rework implementation.
3. Canonical event adapters and consumer projections.
4. Operator and replay validation.

## Conclusion

```text
ADS004 Cross-module Event Contract: APPROVED
Architecture gate: COMPLETE
Code/API/schema implementation: NOT PART OF ADS004
```

