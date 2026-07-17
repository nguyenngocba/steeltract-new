# ADS002 Component State Review

Date: 2026-07-17  
Status: **DECISION APPROVED; IMPLEMENTATION NOT STARTED**

## Final Review

ADS002 selects the identity-and-engineering model anticipated by ADS001:

- Component owns identity activation, deprecation and archive.
- Component Revision owns review, approval, immutable release and supersession.
- Engineering BOM is versioned with the Revision and releases atomically with
  it.
- Release and archive are immutable evidence/policies, not parallel mutable
  aggregates.
- Operational status remains with Production, QC, Inventory, Yard, Logistics
  and Projects.

## Legacy Comparison

| Current persisted value | Actual owner/fact | ADS002 treatment |
| --- | --- | --- |
| `STOCK` | Inventory/Yard location fact | Projection only; no canonical Component transition |
| `CUTTING` | Production stage | Projection only |
| `WELDING` | Production stage | Projection only |
| `PAINTING` | Production stage | Projection only |
| `READY` | Ambiguous Production completion/QC readiness | Must be decomposed by owner contract |
| `SHIPPED` | Logistics shipment | Projection only |
| `DELIVERED` | Logistics delivery | Projection only |
| `INSTALLED` | Projects installation acceptance | Projection only |

No automatic migration, aliasing or reinterpretation is approved. Existing
APIs and data remain unchanged until a dedicated implementation and migration
decision is approved.

## Decisions Reached

| Topic | Decision |
| --- | --- |
| Full operational Component lifecycle | Rejected; it duplicates foreign owners. |
| New revision trigger | Every change to released engineering content. |
| Released revision mutability | Immutable. |
| Release rollback | Forbidden; supersede with a new revision. |
| Current release cardinality | Zero or one per Component. |
| BOM release | Atomic with Component Revision release. |
| Archive | Terminal, non-destructive, obligation-gated. |
| Foreign status updates | Forbidden; consume as read projections. |

## Implementation Gates

ADS002 does not authorize code or schema changes. Before implementation:

1. ADS003 must align Production state and its revision-reference behavior.
2. ADS004 must approve versioned event envelopes and subscriber contracts.
3. A dedicated Components implementation RFC must define additive schema/API
   compatibility and legacy `ComponentStatus` migration/read policy.
4. Cross-module direct Component writes must be replaced with owner contracts
   without rewriting historical data.
5. Tests must cover optimistic concurrency, atomic release swap, immutable
   released content and archive obligation gates.

## Conclusion

```text
ADS002 Component State Machine: APPROVED
Code/schema implementation: NOT AUTHORIZED
Legacy status migration: NOT AUTHORIZED
Next decisions: ADS003, then ADS004
```

