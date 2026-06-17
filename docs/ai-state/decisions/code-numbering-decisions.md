# Code Numbering Decisions

## Status

Accepted on 2026-06-15.

## Decision

Operational document and object codes should use short, readable, date-scoped sequences:

`PREFIX-YYMMDD-###`

Examples:

- `NK-260615-001` inventory inbound.
- `XK-260615-001` inventory outbound.
- `DC-260615-001` inventory transfer/adjustment.
- `KK-260615-001` stock take.
- `MO-260615-001` manufacturing order.
- `BOM-260615-001` production BOM.
- `RSV-260615-001` production material reservation.
- `ISS-260615-001` production material issue.
- `CPL-260615-001` component.
- `QC-260615-001` QC inspection.
- `NCR-260615-001` non-conformance report.
- `CT-260615-001` project.
- `MOV-260615-001` material movement.
- `RCV-260615-001` purchase receiving.

## Rationale

- Avoid long timestamp/random suffixes in operational lists.
- Keep codes readable for operators and printable documents.
- Keep the date visible for quick sorting and traceability.
- Keep sequence length stable with three digits per prefix/day.

## Implementation Rules

- New frontend-generated suggestions use shared `nextLocalCode(prefix)`.
- Backend fallback generation uses `nextOperationalCode(prisma, model, field, prefix)`.
- Backend remains the safer source for deterministic sequence when the frontend does not provide a code.
- Existing historical records are not silently rewritten.
- File upload names, telemetry ids, cache ids, realtime event ids, and simulation-only ids may still use timestamps/random values because they are not user-facing operational document codes.

## Open Follow-Up

- Move all code generation fully backend-side once document sequence APIs exist.
- Add unique sequence locking if concurrent high-volume creation becomes a real operational requirement.
