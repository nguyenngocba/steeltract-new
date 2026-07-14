# EPIC160 - Yard Workflow Audit

## Target Versus Current Flow

| Stage | Current implementation | Result |
| --- | --- | --- |
| QC PASS | Production UI filters completed orders; no Yard-side QC release command/event gate | MISSING |
| Receive Yard | operator manually places a component by supplied ID/code | PARTIAL |
| Allocate position | operator selects an available slot; stack level checked | PASS, manual |
| Move | transactional placement update and movement row | PASS |
| Hold/release | no model or command | MISSING |
| Reserve | slot status exists but no reservation aggregate/lifecycle | MISSING |
| Load truck | no persisted loading plan/task | MISSING |
| Dispatch | removal marks Component `SHIPPED` directly | PARTIAL / boundary violation |
| Project receiving | not owned by Yard workflow | MISSING handoff |

## Integrity Findings

- Placement verifies blocked state and stack-level availability but not QC PASS.
- Multiple placement records for the same item can be active; the schema has no
  unique active-placement invariant.
- Move updates one placement in place, while the draft blueprint describes an
  immutable old/new placement pair. The decision is unresolved.
- Removal changes Component status and timeline directly instead of invoking an
  approved Components/Logistics boundary.
- Crane is optional metadata on movement, not an executable work task.

## Conclusion

The real workflow is `manual place -> move -> remove`. It does not yet implement
`QC PASS -> receive -> reserve/allocate -> hold/release -> load -> dispatch`.

