# Code Numbering Decisions

## Status

Accepted on 2026-06-15.

## Decision

Operational document and object codes should use short, readable, date-scoped sequences:

`PREFIX-YYMMDD-00001`

Examples:

- `NK-260620-00001` inventory inbound.
- `XK-260620-00001` inventory outbound.
- `DC-260620-00001` inventory transfer.
- `KK-260620-00001` stock take/adjustment.
- `INV-260620-00001` inventory fallback/return.
- `MO-260620-00001` manufacturing order.
- `BOM-260620-00001` production BOM.
- `RSV-260620-00001` production material reservation.
- `ISS-260620-00001` production material issue.
- `CPL-260620-00001` component.
- `QC-260620-00001` QC inspection.
- `NCR-260620-00001` non-conformance report.
- `CT-260620-00001` project.
- `RCV-260620-00001` purchase receiving.

## Rationale

- Avoid long timestamp/random suffixes in operational lists.
- Keep codes readable for operators and printable documents.
- Keep the date visible for quick sorting and traceability.
- Keep sequence length stable with five digits per prefix/day.

## Implementation Rules

- Backend fallback generation uses `nextOperationalCode(prisma, model, field, prefix)`.
- `nextOperationalCode` must query existing same-day prefix rows, extract numeric suffixes, and generate `max(sequence) + 1`; it must not use `count() + 1`.
- Inventory transaction creation ignores frontend-supplied `code` / `transactionNo`; backend owns numbering and writes `code = transactionNo`.
- Inventory transaction creation retries generated numbers on Prisma `P2002` duplicate collisions.
- Existing historical records are not silently rewritten.
- File upload names, telemetry ids, cache ids, realtime event ids, and simulation-only ids may still use timestamps/random values because they are not user-facing operational document codes.

## Open Follow-Up

- Move remaining non-inventory code generation fully backend-side once document sequence APIs exist.
- Add unique sequence locking if concurrent high-volume creation becomes a real operational requirement.
