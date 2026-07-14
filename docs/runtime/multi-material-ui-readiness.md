# Multi-material UI Readiness

Date: 2026-07-14  
Overall: **CONDITIONALLY READY**

## Readiness Decision

Gemini may implement the local Pending Items foundation against these documents.
Production rollout must remain gated by workflow and operator certification.

| Area | Status | Evidence/condition |
|---|---|---|
| Header/Line backend | READY | Canonical API accepts `items[]` |
| Duplicate bucket safety | READY | EPIC181 aggregate validation/mutation complete |
| Atomic rollback | READY | Repository transaction owns document and Outbox |
| Line-aware reads | READY | EPIC181 removed first-line report assumptions |
| Pending semantics | READY | Merge/edit/remove/cancel rules frozen here |
| Inbound UI pilot | READY FOR IMPLEMENTATION | Existing per-line location/price rules apply |
| Outbound UI pilot | CONDITIONAL | Requires concurrency/operator stock tests |
| Transfer UI | CONDITIONAL | One route per material only |
| Adjustment | BLOCKED FOR ROLLOUT | Per-line audit reason/evidence must be preserved |
| Stock Take | BLOCKED FOR GENERIC REUSE | Existing count semantics remain authoritative |
| Return | BLOCKED FOR GENERIC REUSE | Existing request/disposition lifecycle remains authoritative |
| Public request idempotency | NOT READY | No durable key for anonymous operator requests |
| Lot/batch/serial | NOT SUPPORTED | No current persisted identity |

## UI Handoff Contract

Gemini must:

- preserve current Drawer, 2D view, layout, style and workflow entry points;
- implement Pending as local state only;
- use exact duplicate auto-merge;
- group summary quantities by unit;
- submit one canonical `items[]` mutation only on Confirm;
- retain Pending on any failure;
- prohibit automatic mutation retry;
- protect all dirty close paths;
- keep single-material operation as the one-entry case of the same flow.

Gemini must not decide:

- merge prompts or separate exact duplicate lines;
- persistent draft storage;
- partial save;
- transfer pairing by visual order;
- fake lot/batch/serial fields;
- combined quantities across unlike units;
- new API error or idempotency contracts.

## Required Test Handoff

Minimum frontend tests before workflow enablement:

1. Add one entry and reset only the line editor.
2. Merge an exact duplicate and preserve header state.
3. Keep different location/unit/price entries separate.
4. Edit into an existing duplicate and merge safely.
5. Remove without any API request.
6. Block Confirm for a dirty unadded editor.
7. Confirm once with canonical `items[]`.
8. Retain all Pending entries on validation, server and network failure.
9. Warn on ESC/backdrop/navigation when dirty.
10. Render grouped quantities and unknown weight/value honestly.

## Production Gate

UI code completion is not business certification. Each workflow needs real-data
ledger/location/snapshot/read-after-write validation before production enablement.
